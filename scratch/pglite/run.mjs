import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

const REPO = '/home/user/Website-Outing';
const db = new PGlite();

let fail = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' -> ' + extra : ''}`);
  if (!cond) fail++;
};
const exec = (sql) => db.exec(sql);
const q = async (sql, params) => {
  try { return (await db.query(sql, params)).rows; }
  catch (e) { console.log('   (query gagal: ' + e.message.slice(0, 60) + ')'); return []; }
};
const setUid = (uuid) => db.exec(`select set_config('test.uid', '${uuid}', false);`);

// ---------- 1. Jalankan tiruan Supabase ----------
console.log('=== 1. Setup tiruan Supabase (skema lama) ===');
await exec(fs.readFileSync('setup.sql', 'utf8'));
check('schema tiruan siap', true);

// PGlite tidak menyertakan pgcrypto -> fungsi crypt/gen_salt di-stub agar
// logika aplikasi tetap dapat diuji end-to-end.
await exec(`
  create schema if not exists extensions;
  create or replace function extensions.gen_salt(text) returns text language sql as $$ select 'salt' $$;
  create or replace function extensions.crypt(text, text) returns text language sql as $$ select 'hash:' || $1 $$;
`);
const cryptOk = (await q(`select extensions.crypt('rahasia','salt') as v`))[0].v;
check('stub crypt siap dipakai', cryptOk === 'hash:rahasia', cryptOk);

// ---------- 2. fix_admin_login.sql ----------
console.log('\n=== 2. supabase/fix_admin_login.sql ===');
const fixSql = fs.readFileSync(`${REPO}/supabase/fix_admin_login.sql`, 'utf8');
try {
  const res = await db.exec(fixSql);
  check('script berjalan tanpa error', true);
} catch (e) {
  check('script berjalan tanpa error', false, e.message);
}
const cols = (await q(`select column_name from information_schema.columns where table_schema='public' and table_name='users' and column_name in ('role_id','section_id') order by 1`)).map(r => r.column_name);
check('kolom role_id & section_id ditambahkan', cols.length === 2, cols.join(','));
const fks = (await q(`select conname from pg_constraint where conrelid='public.users'::regclass and contype='f' order by 1`)).map(r => r.conname);
check('foreign key ke roles & sections dibuat', fks.includes('users_role_id_fkey') && fks.includes('users_section_id_fkey'), fks.join(','));
const admin = (await q(`select u.username, u.role, u.approval_status, u.role_id is not null as role_linked,
                               au.email_confirmed_at is not null as confirmed,
                               au.encrypted_password as pwd,
                               (select count(*) from auth.identities i where i.user_id = au.id and i.provider='email') as identities,
                               (select count(*) from public.roles) as jumlah_role
                        from public.users u join auth.users au on au.id = u.auth_user_id
                        where u.username='admin'`))[0];
check('profil admin APPROVED & tertaut master role', admin.approval_status === 'APPROVED' && admin.role_linked);
check('email Auth ditandai terkonfirmasi', admin.confirmed);
check('password direset oleh script', String(admin.pwd).startsWith('hash:'), admin.pwd);
check('baris auth.identities dibuat', Number(admin.identities) === 1);
check('seed roles berjalan pada tabel tanpa kolom description', Number(admin.jumlah_role) === 8, 'roles=' + admin.jumlah_role);

// ---------- 3. participant_management.sql ----------
console.log('\n=== 3. supabase/participant_management.sql ===');
const partSql = fs.readFileSync(`${REPO}/supabase/participant_management.sql`, 'utf8');
try { await exec(partSql); check('script berjalan tanpa error', true); }
catch (e) { check('script berjalan tanpa error', false, e.message); }

const pcols = (await q(`select column_name from information_schema.columns where table_schema='public' and table_name='participants' and column_name in ('username','room','user_id') order by 1`)).map(r => r.column_name);
check('kolom participants.username & room diselaraskan', pcols.length === 3, pcols.join(','));
const fns = (await q(`select proname, prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'admin_%participant%' or p.proname='admin_save_participant' order by 1`));
check('tiga fungsi manajemen peserta dibuat SECURITY DEFINER', fns.length === 3 && fns.every(f => f.prosecdef), fns.map(f => f.proname).join(','));

const adminId = '9b333b52-03e7-42ff-b30c-4ca6dd155572';
const budiId = (await q(`select id from public.users where username='budi'`))[0].id;

// --- 3a. simpan sebagai admin: buat akun peserta baru + kamar/armada
console.log('\n--- 3a. Simpan peserta baru (Admin) ---');
await setUid(adminId);
const saveRes = (await db.query(`select public.admin_save_participant(
    p_username => 'siti', p_full_name => 'Siti Rahma', p_phone => '+628111',
    p_department => 'Finance', p_gender => 'P', p_transport => 'Bus 1',
    p_room => 'Kamar Melati 1', p_status => 'CONFIRMED',
    p_password => 'rahasia123', p_create_if_missing => true) as hasil`)).rows[0].hasil;
check('akun baru dibuat', saveRes.action === 'created' && saveRes.created_login === true, JSON.stringify(saveRes));
check('password pilihan dipakai (bukan default)', saveRes.default_password_used === false);
const siti = (await q(`select u.id, u.role, u.approval_status, au.email, au.email_confirmed_at is not null as confirmed,
                              (select count(*) from auth.identities i where i.user_id=u.auth_user_id and i.provider='email') as identities
                       from public.users u join auth.users au on au.id=u.auth_user_id where u.username='siti'`))[0];
check('profil siti APPROVED', siti.approval_status === 'APPROVED' && siti.role === 'PARTICIPANT');
check('email internal + terkonfirmasi', siti.email === 'siti@outing.local' && siti.confirmed);
check('identity email dibuat', Number(siti.identities) === 1);
const enr = (await q(`select username, room, transport, status, user_id from public.participants where username='siti'`))[0];
check('data pelengkap tersimpan di participants', enr && enr.room === 'Kamar Melati 1' && enr.transport === 'Bus 1' && enr.user_id === siti.id);

// --- 3b. edit peserta lama (budi) yang belum punya akun login
console.log('\n--- 3b. Edit peserta lama tanpa akun login ---');
const editRes = (await db.query(`select public.admin_save_participant(p_user_id => '${budiId}', p_full_name => 'Budi Santoso Jr', p_room => 'Kamar Pinus 2', p_transport => 'Bus 2') as hasil`)).rows[0].hasil;
check('mode edit tidak membuat akun baru', editRes.action === 'updated' && editRes.created_login === false, JSON.stringify(editRes));
const budi = (await q(`select full_name from public.users where id='${budiId}'`))[0];
check('nama peserta diperbarui', budi.full_name === 'Budi Santoso Jr');
const budiEnr = (await q(`select room, transport, user_id from public.participants where user_id='${budiId}'`))[0];
check('kamar/armada budi tersimpan', budiEnr && budiEnr.room === 'Kamar Pinus 2' && budiEnr.transport === 'Bus 2');

// --- 3c. non-admin ditolak
console.log('\n--- 3c. Validasi wewenang ---');
await setUid(budiId);
let denied = '';
try { await db.query(`select public.admin_save_participant(p_username => 'nakal', p_create_if_missing => true)`); }
catch (e) { denied = e.message; }
check('peserta biasa tidak bisa menyimpan peserta', /Hanya Admin atau Inisiator/.test(denied), denied.slice(0, 70));

await setUid(adminId);
let selfDelete = '';
try { await db.query(`select public.admin_delete_participant(p_user_id => '${adminId}')`); }
catch (e) { selfDelete = e.message; }
check('admin tidak dapat menghapus akunnya sendiri', /sendiri/.test(selfDelete), selfDelete.slice(0, 70));

const delRes = (await db.query(`select public.admin_delete_participant(p_username => 'siti') as hasil`)).rows[0].hasil;
check('hapus peserta berhasil', delRes.action === 'deleted' && delRes.auth_deleted === true, JSON.stringify(delRes));
const sitiLeft = Number((await q(`select count(*) as n from auth.users where email='siti@outing.local'`))[0].n);
const sitiProfile = Number((await q(`select count(*) as n from public.users where username='siti'`))[0].n);
const sitiEnr = Number((await q(`select count(*) as n from public.participants where username='siti'`))[0].n);
check('akun Auth, profil, dan data pelengkap terhapus', sitiLeft === 0 && sitiProfile === 0 && sitiEnr === 0, `auth=${sitiLeft} profil=${sitiProfile} pelengkap=${sitiEnr}`);

const notFound = (await db.query(`select public.admin_delete_participant(p_username => 'tidak_ada') as hasil`)).rows[0].hasil;
check('hapus user tak dikenal -> not_found', notFound.action === 'not_found');

// --- 3d. impor massal
console.log('\n--- 3d. Impor Excel massal ---');
const bulk = (await db.query(`select public.admin_bulk_import_participants(
    p_rows => '[{"username":"dewi","full_name":"Dewi Lestari","room":"Villa 3","transport":"Bus 3","status":"CONFIRMED"},
                {"username":"hendra","full_name":"Hendra Saputra","department":"GA"},
                {"username":"","full_name":"Tanpa User ID"}]'::jsonb,
    p_mode => 'replace', p_default_password => 'outing123') as hasil`)).rows[0].hasil;
check('2 akun dibuat, 1 dilewati', bulk.created === 2 && bulk.skipped === 1, JSON.stringify({c:bulk.created,u:bulk.updated,s:bulk.skipped}));
check('daftar akun baru + password default dilaporkan', Array.isArray(bulk.new_logins) && bulk.new_logins.length === 2 && bulk.new_logins[0].password === 'outing123');
check('akun & login peserta baru ada di database',
  Number((await q(`select count(*) as n from auth.users where email in ('dewi@outing.local','hendra@outing.local')`))[0].n) === 2 &&
  Number((await q(`select count(*) as n from public.users where username in ('dewi','hendra')`))[0].n) === 2);
check('data pelengkap peserta di luar daftar dibersihkan pada mode replace',
  Number((await q(`select count(*) as n from public.participants where username='budi'`))[0].n) === 0);
check('akun user TIDAK dihapus oleh impor', Number((await q(`select count(*) as n from public.users where username='budi'`))[0].n) === 1);

const bulkNoName = (await db.query(`select public.admin_bulk_import_participants(p_rows => '[{"username":"tanpa_nama"}]'::jsonb, p_mode => 'upsert') as hasil`)).rows[0].hasil;
check('baris tanpa nama tetap diproses (nama diisi User ID)', bulkNoName.created === 1, JSON.stringify({c:bulkNoName.created, e:bulkNoName.errors}));

// --- 3e. admin terakhir
console.log('\n--- 3e. Pengaman Admin terakhir ---');
// Skenario: hanya tersisa satu akun ADMIN, dan penghapusan dilakukan oleh
// Inisiator (bukan Admin) supaya pengaman "Admin terakhir" yang diuji.
await exec(`update public.users set role='PARTICIPANT' where username='dewi'`);
const ketuaId = 'cccccccc-dddd-4eee-8fff-000000000001';
await exec(`
  insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values ('${ketuaId}', 'authenticated', 'authenticated', 'ketua@outing.local', 'x', now(), '{}'::jsonb, '{}'::jsonb, now(), now());
  insert into public.users (id, auth_user_id, username, full_name, role, section, approval_status)
  values ('${ketuaId}', '${ketuaId}', 'ketua', 'Ketua Panitia', 'INITIATOR', 'INISIATOR', 'APPROVED');
`);
await setUid(ketuaId);
let lastAdmin = '';
try { await db.query(`select public.admin_delete_participant(p_username => 'admin')`); } catch (e) { lastAdmin = e.message; }
check('admin terakhir tidak dapat dihapus', /terakhir/.test(lastAdmin), lastAdmin.slice(0, 80));

// Inisiator tetap boleh menghapus peserta biasa
await setUid(ketuaId);
const delKetua = (await db.query(`select public.admin_delete_participant(p_username => 'dewi') as hasil`)).rows[0].hasil;
check('Inisiator dapat menghapus peserta biasa', delKetua.action === 'deleted', JSON.stringify(delKetua));

console.log(fail === 0 ? '\nSEMUA UJI DATABASE LULUS' : `\n${fail} UJI DATABASE GAGAL`);
process.exit(fail ? 1 : 0);
