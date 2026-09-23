import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/)[1];

function grab(name) {
  let start = script.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`missing ${name}`);
  // sertakan kata kunci async bila ada agar await tetap valid
  if (script.slice(Math.max(0, start - 6), start) === 'async ') start -= 6;
  let depth = 0, i = script.indexOf('{', start);
  for (let j = i; j < script.length; j++) {
    if (script[j] === '{') depth++;
    else if (script[j] === '}') { depth--; if (depth === 0) return script.slice(start, j + 1); }
  }
  throw new Error('unbalanced ' + name);
}

const names = ['getApprovalStatus','approvalStatusLabel','escapeHtml','isUuid','normalizeUsername','jsAttr',
  'approvalBadgeFor','buildParticipantRow','callSupabaseRpc','purgeLocalParticipantCaches','deleteParticipant','excelSourceItems'];
const src = names.map(grab).join('\n\n');

const store = new Map();
const STORAGE = {
  get: (k, d) => (store.has(k) ? JSON.parse(JSON.stringify(store.get(k))) : d),
  set: (k, v) => store.set(k, JSON.parse(JSON.stringify(v)))
};

function makeCtx({ rpcResult = { data: { action: 'deleted' }, error: null }, manage = true } = {}) {
  const alerts = [];
  const calls = { rpc: [], reload: 0 };
  const ctx = {
    STORAGE,
    supabaseClient: { rpc: async (fn, args) => { calls.rpc.push({ fn, args }); return rpcResult; } },
    canManage: () => manage,
    currentProfile: { username: 'admin' },
    currentUser: { username: 'admin' },
    alert: (m) => alerts.push(String(m)),
    confirm: () => true,
    showToast: () => {},
    bootstrap: { Modal: { getInstance: () => ({ hide: () => {} }) } },
    EXCEL_MODULE_CONFIG: { participants: { storageKey: 'outing_participants' }, rundown: { storageKey: 'outing_rundowns' } },
    loadParticipants: async () => { calls.reload++; },
    console
  };
  return { ctx, alerts, calls };
}

function build(ctx, cache) {
  const fn = new Function('ctx', `
    const { STORAGE, supabaseClient, canManage, currentProfile, currentUser, alert, confirm, showToast,
            bootstrap, EXCEL_MODULE_CONFIG, loadParticipants, console } = ctx;
    let participantsCache = ${JSON.stringify(cache)};
    ${src}
    return { buildParticipantRow, callSupabaseRpc, purgeLocalParticipantCaches, deleteParticipant,
             excelSourceItems, normalizeUsername, jsAttr, approvalBadgeFor };
  `);
  return fn(ctx);
}

let fail = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' -> ' + extra : ''}`);
  if (!cond) fail++;
};

// ---- A. buildParticipantRow ----
console.log('=== A. buildParticipantRow (user + data pelengkap) ===');
{
  const { ctx } = makeCtx();
  const api = build(ctx, []);
  const enrichment = new Map([
    ['id:11111111-2222-4333-8444-555555555555', { id: 'p1', room: 'Kamar 101', transport: 'Bus 2', status: 'PENDING', gender: 'P' }]
  ]);
  const row = api.buildParticipantRow({ id: '11111111-2222-4333-8444-555555555555', auth_user_id: 'a1', username: 'Budi', full_name: 'Budi Santoso', phone: '+62811', role: 'participant', section: 'public', approval_status: 'APPROVED' }, enrichment);
  check('username dinormalisasi', row.username === 'budi');
  check('data pelengkap terpakai (kamar/bus)', row.room === 'Kamar 101' && row.transport === 'Bus 2');
  check('role uppercase', row.role === 'PARTICIPANT');
  check('status kehadiran dari enrichment', row.status === 'PENDING');
  check('bukan local_only (uuid)', row.local_only === false);

  const byName = api.buildParticipantRow({ id: 'ap-9', username: '@siti', full_name: 'Siti' }, new Map([['username:siti', { room: 'Villa 2' }]]));
  check('fallback cocok lewat username', byName.room === 'Villa 2');
  check('baris demo tanpa uuid ditandai local_only', byName.local_only === true);
}

// ---- B. deleteParticipant ----
console.log('\n=== B. deleteParticipant ===');
{
  const row = { id: 'uuid-1', username: 'budi', full_name: 'Budi Santoso', role: 'PARTICIPANT', local_only: false };
  const { ctx, alerts, calls } = makeCtx();
  const api = build(ctx, [row]);
  store.set('outing_participants', [{ username: 'budi' }, { username: 'siti' }]);
  store.set('outing_local_users', [{ username: 'budi' }, { username: 'siti' }]);
  await api.deleteParticipant('not-uuid');
  check('id tidak dikenal -> peringatan, tanpa RPC', alerts.some(a => /tidak ditemukan/i.test(a)) && calls.rpc.length === 0);
}
{
  const row = { id: 'uuid-1', username: 'budi', full_name: 'Budi', role: 'PARTICIPANT', local_only: false };
  const { ctx, calls } = makeCtx();
  const api = build(ctx, [row]);
  await api.deleteParticipant('uuid-1');
  check('RPC dipanggil dengan user id + akun auth', calls.rpc[0]?.fn === 'admin_delete_participant' && calls.rpc[0].args.p_user_id === 'uuid-1' && calls.rpc[0].args.p_delete_auth_account === true);
  check('data lokal dibersihkan', store.get('outing_participants').length === 1 && store.get('outing_participants')[0].username === 'siti');
  check('cache user lokal dibersihkan', store.get('outing_local_users').length === 1);
  check('daftar peserta dimuat ulang', calls.reload === 1);
}
{
  const row = { id: 'uuid-2', username: 'admin_lain', full_name: 'Administrator Lain', role: 'ADMIN', local_only: false };
  const { ctx, alerts, calls } = makeCtx();
  const api = build(ctx, [row]);
  await api.deleteParticipant('uuid-2');
  check('akun ADMIN ditolak', alerts.some(a => /Akun Admin/i.test(a)) && calls.rpc.length === 0);
}
{
  const row = { id: 'uuid-3', username: 'admin', full_name: 'Saya', role: 'INITIATOR', local_only: false };
  const { ctx, alerts, calls } = makeCtx();
  const api = build(ctx, [row]);
  await api.deleteParticipant('uuid-3');
  check('hapus akun sendiri ditolak', alerts.some(a => /Anda sendiri/i.test(a)) && calls.rpc.length === 0);
}
{
  const row = { id: 'uuid-4', username: 'budi', full_name: 'Budi', role: 'PARTICIPANT', local_only: false };
  const { ctx, alerts, calls } = makeCtx({ manage: false });
  const api = build(ctx, [row]);
  await api.deleteParticipant('uuid-4');
  check('non-manager ditolak', alerts.some(a => /Hanya Admin/i.test(a)) && calls.rpc.length === 0);
}
{
  const row = { id: 'uuid-5', username: 'budi', full_name: 'Budi', role: 'PARTICIPANT', local_only: false };
  const { ctx, alerts, calls } = makeCtx({ rpcResult: { data: { action: 'not_found', message: 'Peserta tidak ditemukan di tabel users.' }, error: null } });
  const api = build(ctx, [row]);
  await api.deleteParticipant('uuid-5');
  check('not_found pada baris database -> tidak menghapus cache', alerts.some(a => /tidak ditemukan/i.test(a)) && calls.reload === 0);
}
{
  const row = { id: 'ap-1', username: 'peserta_demo', full_name: 'Demo', role: 'PARTICIPANT', local_only: true };
  const { ctx, calls } = makeCtx({ rpcResult: { data: { action: 'not_found', message: 'Peserta tidak ditemukan di tabel users.' }, error: null } });
  const api = build(ctx, [row]);
  store.set('outing_participants', [{ id: 'ap-1', username: 'peserta_demo' }, { id: 'ap-2', username: 'lain' }]);
  await api.deleteParticipant('ap-1');
  check('baris demo lokal tetap bisa dihapus dari cache', store.get('outing_participants').length === 1 && calls.reload === 1);
}

// ---- C. callSupabaseRpc ----
console.log('\n=== C. callSupabaseRpc (pesan bantuan) ===');
{
  const { ctx } = makeCtx({ rpcResult: { data: null, error: { code: 'PGRST202', message: 'Could not find the function public.admin_save_participant in the schema cache' } } });
  const api = build(ctx, []);
  const res = await api.callSupabaseRpc('admin_save_participant', {}, 'menyimpan peserta');
  check('fungsi belum ada -> petunjuk participant_management.sql', res.ok === false && /participant_management\.sql/.test(res.message), res.message);
}
{
  const { ctx } = makeCtx({ rpcResult: { data: null, error: { message: 'Hanya Admin atau Inisiator yang dapat menghapus data peserta.' } } });
  const api = build(ctx, []);
  const res = await api.callSupabaseRpc('admin_delete_participant', {}, 'menghapus peserta');
  check('error otorisasi diteruskan apa adanya', res.ok === false && /Hanya Admin/.test(res.message));
}

// ---- D. excelSourceItems ----
console.log('\n=== D. excelSourceItems ===');
{
  const { ctx } = makeCtx();
  const rows = [{ id: 'uuid-1', username: 'budi', full_name: 'Budi' }];
  const api = build(ctx, rows);
  store.set('outing_participants', [{ username: 'lama' }]);
  const items = api.excelSourceItems('participants');
  check('peserta diexport dari data user (bukan cache lama)', items.length === 1 && items[0].username === 'budi');
  store.set('outing_rundowns', [{ id: 'r1' }]);
  check('modul lain tetap dari cache lokal', api.excelSourceItems('rundown')[0].id === 'r1');
}

// ---- E. utilitas ----
console.log('\n=== E. utilitas ===');
{
  const { ctx } = makeCtx();
  const api = build(ctx, []);
  check('normalizeUsername', api.normalizeUsername('@@Budi.Santoso ') === 'budi.santoso');
  const attr = api.jsAttr(`a'b"c`);
  check('jsAttr tidak memuat kutip mentah', !/["']/.test(attr) && attr.includes('&quot;'), attr);
  check('badge approval berisi label', /Disetujui/.test(api.approvalBadgeFor({ approval_status: 'APPROVED' })));
}

console.log(fail === 0 ? '\nSEMUA TEST LULUS' : `\n${fail} TEST GAGAL`);
process.exit(fail ? 1 : 0);
