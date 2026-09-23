// Local PostgreSQL regression test; NEVER connects to the project's Supabase.
// npm install --prefix .testtools embedded-postgres pg --no-audit --no-fund
// node tests/sql_update.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from '../.testtools/node_modules/embedded-postgres/dist/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = await fs.mkdtemp(path.join(root, '.testtools/pg-'));
const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'local-test-only',
    port: 55432, persistent: false, postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: () => {} });
let db;
const q = async (sql, args) => (await db.query(sql, args)).rows;
const scalar = async (sql, args) => Object.values((await q(sql, args))[0])[0];
const asUser = async (id, work) => {
    await db.query('BEGIN');
    try {
        await q("SELECT set_config('request.jwt.claim.sub', $1, true)", [id]);
        await db.query('SET LOCAL ROLE authenticated');
        const result = await work();
        await db.query('COMMIT');
        return result;
    } catch (e) { await db.query('ROLLBACK'); throw e; }
};
const signup = async (username, meta = {}) => scalar(`INSERT INTO auth.users(id,email,raw_user_meta_data,created_at)
    VALUES(gen_random_uuid(),$1,$2,now()) RETURNING id`, [`${username}@outing.local`, JSON.stringify({ username, full_name: username, ...meta })]);
try {
    await pg.initialise(); await pg.start();
    db = pg.getPgClient(); await db.connect();
    // Minimal Supabase-managed schemas. GoTrue HTTP and PostgREST are not mocked/tested here.
    await db.query(`
        CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;
        CREATE SCHEMA auth; CREATE SCHEMA storage; CREATE SCHEMA extensions;
        CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
            SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
        $$;
        GRANT USAGE ON SCHEMA auth TO authenticated, anon;
        CREATE TABLE auth.users (
            instance_id uuid, id uuid PRIMARY KEY, aud text, role text, email text UNIQUE, encrypted_password text,
            email_confirmed_at timestamptz, confirmation_token text, email_change text, email_change_token_new text,
            email_change_token_current text, reauthentication_token text, recovery_token text,
            raw_app_meta_data jsonb, raw_user_meta_data jsonb, created_at timestamptz, updated_at timestamptz
        );
        CREATE TABLE auth.identities (
            id uuid PRIMARY KEY, user_id uuid REFERENCES auth.users ON DELETE CASCADE,
            provider_id text NOT NULL, identity_data jsonb, provider text, last_sign_in_at timestamptz,
            created_at timestamptz, updated_at timestamptz, UNIQUE(provider_id,provider)
        );
        CREATE TABLE storage.buckets(id text PRIMARY KEY, name text, public boolean);
        CREATE TABLE storage.objects(id uuid PRIMARY KEY, bucket_id text);
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
    `);
    const bundle = await fs.readFile(path.join(root, 'supabase/update_website.sql'), 'utf8');
    await db.query(bundle);
    await db.query(bundle);
    console.log('PASS fresh install + idempotent rerun (pgcrypto in extensions schema)');

    const admin = await signup('test_admin');
    await q("UPDATE public.users SET role='ADMIN', approval_status='APPROVED' WHERE auth_user_id=$1", [admin]);
    const pending = await signup('test_signup', { role: 'ADMIN', approval_status: 'APPROVED',
        outing_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' });
    assert.deepEqual((await q('SELECT role, approval_status FROM public.users WHERE id=$1', [pending]))[0],
        { role: 'PARTICIPANT', approval_status: 'PENDING' });
    assert.equal(await scalar('SELECT outing_id FROM public.participants WHERE user_id=$1', [pending]), null);
    const feed = await asUser(admin, () => scalar('SELECT public.admin_pending_registration_notifications()'));
    assert.equal(feed.pending_count, 1); assert.deepEqual(feed.pending_ids, [pending]);
    assert.equal(await asUser(pending, () => scalar('SELECT count(*)::int FROM public.users')), 1);
    await assert.rejects(asUser(pending, () => q('SELECT public.admin_pending_registration_notifications()')), /Hanya Admin/);
    await assert.rejects(asUser(pending, () => q("SELECT public.admin_save_participant(p_username=>'forbidden', p_create_if_missing=>true)")), /Hanya Admin/);
    await assert.rejects(asUser(pending, () => q("UPDATE public.users SET role='ADMIN' WHERE id=$1", [pending])), /permission denied/);
    await assert.rejects(asUser(pending, () => q("SELECT public.admin_set_user_approval($1, 'APPROVED')", [pending])), /Hanya Admin/);
    await assert.rejects(q('SELECT public.admin_pending_registration_notifications()'), /Hanya Admin/);
    console.log('PASS signup pending + stale outing + permissions/RLS');

    await asUser(admin, () => q("SELECT public.admin_set_user_approval($1, 'REJECTED', 'Data belum cocok')", [pending]));
    assert.equal((await asUser(admin, () => scalar('SELECT public.admin_pending_registration_notifications()'))).pending_count, 0);
    await asUser(admin, () => q("SELECT public.admin_set_user_approval($1, 'APPROVED')", [pending]));
    assert.equal(await scalar('SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id=$1', [pending]), true);
    assert.equal(await scalar('SELECT approved_by FROM public.users WHERE id=$1', [pending]), admin);
    console.log('PASS reject/approve + internal email confirmation + notification removed');

    const save = async (name, room = 'Villa 2') => asUser(admin, () => scalar(`SELECT public.admin_save_participant(
        p_username=>$1, p_full_name=>'Peserta Uji', p_password=>'test123456', p_room=>$2,
        p_gender=>'P', p_create_if_missing=>true)`, [name, room]));
    const saved = await save('test_created');
    assert.equal(saved.action, 'created'); assert.equal(saved.created_login, true);
    assert.equal(await scalar('SELECT approval_status FROM public.users WHERE id=$1', [saved.user_id]), 'APPROVED');
    assert.equal(await scalar('SELECT count(*)::int FROM public.participants WHERE user_id=$1', [saved.user_id]), 1);
    assert.equal(await scalar('SELECT room FROM public.participants WHERE user_id=$1', [saved.user_id]), 'Villa 2');
    assert.equal(await scalar('SELECT count(*)::int FROM auth.identities WHERE user_id=$1', [saved.user_id]), 1);
    assert.equal(await scalar("SELECT encrypted_password=extensions.crypt('test123456', encrypted_password) FROM auth.users WHERE id=$1", [saved.user_id]), true);
    assert.equal(await scalar("SELECT email_change_token_current='' AND reauthentication_token='' FROM auth.users WHERE id=$1", [saved.user_id]), true);
    await asUser(admin, () => q("SELECT public.admin_save_participant(p_user_id=>$1,p_full_name=>'Edited',p_room=>'Villa 3')", [saved.user_id]));
    assert.equal(await scalar('SELECT room FROM public.participants WHERE user_id=$1', [saved.user_id]), 'Villa 3');
    await assert.rejects(save('bad_password_dummy', 'x'.repeat(101)), /too long/);
    assert.equal(await scalar("SELECT count(*)::int FROM auth.users WHERE email='bad_password_dummy@outing.local'"), 0);
    await assert.rejects(asUser(admin, () => q("SELECT public.admin_save_participant(p_username=>'bad_pass', p_password=>'123', p_create_if_missing=>true)")), /minimal 6/);
    await db.query(`ALTER TABLE auth.identities ADD CONSTRAINT test_identity_failure
        CHECK (identity_data->>'email' <> 'identity_failure@outing.local')`);
    await assert.rejects(save('identity_failure'), /test_identity_failure/);
    assert.equal(await scalar("SELECT count(*)::int FROM auth.users WHERE email='identity_failure@outing.local'"), 0);
    await db.query('ALTER TABLE auth.identities DROP CONSTRAINT test_identity_failure');
    const random = await asUser(admin, () => scalar("SELECT public.admin_save_participant(p_username=>'random_pass',p_create_if_missing=>true)"));
    assert.equal(random.default_password_used, true); assert.equal(random.default_password.length, 24);
    assert.notEqual(random.default_password, 'outing123');
    console.log('PASS add/edit participant + identity + password hash + rollback on enrichment failure');

    const initiator = await signup('test_initiator');
    await q("UPDATE public.users SET role='INITIATOR', approval_status='APPROVED' WHERE id=$1", [initiator]);
    assert.ok(await asUser(initiator, () => scalar('SELECT count(*)::int FROM public.users')) > 1);
    await assert.rejects(asUser(initiator, () => q('SELECT public.admin_pending_registration_notifications()')), /Hanya Admin/);
    await asUser(initiator, () => q("SELECT public.admin_save_participant(p_username=>'from_initiator',p_create_if_missing=>true)"));
    console.log('PASS initiator participant access, no approval access');

    const bulk = await asUser(admin, () => scalar(`SELECT public.admin_bulk_import_participants($1, 'replace', 'batch123')`,
        [JSON.stringify([{ username: 'bulk_one', full_name: 'Bulk One' }, { username: 'bad space' }])]));
    assert.equal(bulk.created, 1); assert.equal(bulk.skipped, 1); assert.equal(bulk.replace_cleanup_skipped, true);
    assert.equal(bulk.new_logins[0].password, 'batch123');
    assert.equal(await scalar('SELECT count(*)::int FROM public.participants WHERE user_id=$1', [saved.user_id]), 1);
    await assert.rejects(asUser(admin, () => q("SELECT public.admin_bulk_import_participants('{}')")), /array JSON/);
    await asUser(admin, () => q('SELECT public.admin_delete_participant($1)', [saved.user_id]));
    assert.equal(await scalar('SELECT count(*)::int FROM auth.users WHERE id=$1', [saved.user_id]), 0);
    await assert.rejects(asUser(admin, () => q('SELECT public.admin_delete_participant($1)', [admin])), /sendiri/);
    console.log('PASS bulk partial errors + safe replace + delete/self-delete guard');

    // Simulate a missed old trigger and an older schema lacking profile columns.
    await db.query('ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created');
    const orphan = await signup('old_orphan');
    await db.query('ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created');
    await db.query('ALTER TABLE public.users DROP COLUMN department; ALTER TABLE public.participants DROP COLUMN department');
    await db.query(bundle); await db.query(bundle);
    assert.equal(await scalar('SELECT approval_status FROM public.users WHERE auth_user_id=$1', [orphan]), 'PENDING');
    assert.equal(await scalar('SELECT count(*)::int FROM public.participants WHERE user_id=$1', [orphan]), 1);
    assert.equal(await scalar('SELECT role FROM public.users WHERE id=$1', [admin]), 'ADMIN');
    assert.equal(await scalar('SELECT count(*)::int FROM auth.identities WHERE user_id=$1', [orphan]), 1);
    assert.equal(await scalar("SELECT reauthentication_token='' FROM auth.users WHERE id=$1", [orphan]), true);
    console.log('PASS legacy columns + orphan profile/identity/token backfill + rerun preserves existing admin');

    await db.query(await fs.readFile(path.join(root, 'supabase/check_website_update.sql'), 'utf8'));
    const html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
    const rpcs = new Set([...html.matchAll(/(?:\.rpc|callSupabaseRpc)\(\s*'([^']+)'/g)].map(m => m[1]));
    for (const rpc of rpcs) {
        const rows = await q(`SELECT p.oid, p.proargnames, has_function_privilege('authenticated',p.oid,'EXECUTE') AS login,
            has_function_privilege('anon',p.oid,'EXECUTE') AS anon FROM pg_proc p
            JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname=$1`, [rpc]);
        assert.equal(rows.length, 1, `${rpc} missing or overloaded`);
        const signature = new Set(rows[0].proargnames || []);
        // Match each literal named-argument object in the website, like PostgREST.
        for (const call of html.matchAll(/(?:\.rpc|callSupabaseRpc)\(\s*'([^']+)'\s*,\s*\{([\s\S]*?)\n\s*\}/g)) {
            if (call[1] !== rpc) continue;
            for (const arg of call[2].matchAll(/\b(p_\w+)\s*:/g)) {
                assert.ok(signature.has(arg[1]), `${rpc}: unknown named argument ${arg[1]}`);
            }
        }
        assert.equal(rows[0].login, true, `${rpc} missing authenticated grant`);
        assert.equal(rows[0].anon, rpc === 'resolve_login_username', `${rpc} anon access`);
    }
    console.log(`PASS diagnostic SQL + all ${rpcs.size} frontend RPCs/signatures/grants present`);
} finally {
    if (db) await db.end();
    await pg.stop();
    await fs.rm(dir, { recursive: true, force: true });
}
