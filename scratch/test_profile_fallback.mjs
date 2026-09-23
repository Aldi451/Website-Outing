import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');
const grab = (name) => {
  const start = html.indexOf(`async function ${name}(`);
  if (start === -1) throw new Error(`missing ${name}`);
  let depth = 0, i = html.indexOf('{', start);
  for (let j = i; j < html.length; j++) {
    if (html[j] === '{') depth++;
    else if (html[j] === '}') { depth--; if (depth === 0) return html.slice(start, j + 1); }
  }
  throw new Error('unbalanced');
};

const src = ['enrichProfileRoleNames', 'fetchProfileByAuthUserId', 'getAuthenticatedProfile'].map(grab).join('\n\n');
const hintSrc = (() => { const s = html.indexOf('function backendErrorHint'); let d=0,i=html.indexOf('{',s); for(let j=i;j<html.length;j++){if(html[j]==='{')d++;else if(html[j]==='}'){d--;if(d===0)return html.slice(s,j+1);}} })();

const scenarios = {
  'DB baru (embed sukses)': ({ embedOk = true }) => {},
};

function makeClient({ embedWorks, embedErrorCode, row, roleRow, sectionRow }) {
  const calls = [];
  return {
    calls,
    from(table) {
      const q = {
        _table: table, _select: null,
        select(cols) { this._select = cols; return this; },
        eq() { return this; },
        async maybeSingle() {
          calls.push(`${table}:${this._select}`);
          if (table === 'users') {
            if (this._select.includes('roles(')) {
              if (embedWorks) return { data: row, error: null };
              return { data: null, error: { code: embedErrorCode, message: "Could not find a relationship between 'users' and 'roles' in the schema cache" } };
            }
            return { data: row ? { ...row } : null, error: null };
          }
          if (table === 'roles') return { data: roleRow ?? null, error: null };
          if (table === 'sections') return { data: sectionRow ?? null, error: null };
          return { data: null, error: null };
        }
      };
      return q;
    }
  };
}

let failures = 0;
const check = (label, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' -> ' + extra : ''}`);
  if (!cond) failures++;
};

async function run(name, opts, assertions) {
  console.log(`\n=== ${name} ===`);
  const supabaseClient = makeClient(opts);
  const ctx = { supabaseClient, console };
  const fn = new Function('supabaseClient', `${src}; return { enrichProfileRoleNames, fetchProfileByAuthUserId, getAuthenticatedProfile };`)(supabaseClient);
  await assertions(fn, supabaseClient);
}

const adminRow = { id: 'u1', auth_user_id: 'a1', username: 'admin', role: 'ADMIN', section: 'INISIATOR', approval_status: 'APPROVED' };

await run('DB lama: embed gagal PGRST200 + kolom role_id/section_id TIDAK ada', {
  embedWorks: false, embedErrorCode: 'PGRST200',
  row: adminRow // tidak ada role_id/section_id
}, async (fn, client) => {
  const profile = await fn.fetchProfileByAuthUserId('a1');
  check('profil tetap berhasil dibaca', profile?.username === 'admin', JSON.stringify(profile));
  check('role dari kolom teks dipakai', profile.role === 'ADMIN');
  check('tidak ada query roles/sections tambahan', !client.calls.some(c => c.startsWith('roles:') || c.startsWith('sections:')));
});

await run('DB lama + kolom role_id ada tapi FK tidak ada (nama role diambil manual)', {
  embedWorks: false, embedErrorCode: 'PGRST200',
  row: { ...adminRow, role_id: 'r1', section_id: 's1' },
  roleRow: { id: 'r1', name: 'ADMIN' }, sectionRow: { id: 's1', name: 'INISIATOR' }
}, async (fn) => {
  const profile = await fn.fetchProfileByAuthUserId('a1');
  check('roles.name terisi via fallback', profile?.roles?.name === 'ADMIN');
  check('sections.name terisi via fallback', profile?.sections?.name === 'INISIATOR');
  check('guard getAuthenticatedProfile', (await fn.getAuthenticatedProfile('a1'))?.username === 'admin');
});

await run('DB baru: embed sukses (satu kali query)', {
  embedWorks: true, row: { ...adminRow, roles: { id: 'r1', name: 'ADMIN' }, sections: { id: 's1', name: 'INISIATOR' } }
}, async (fn, client) => {
  const profile = await fn.fetchProfileByAuthUserId('a1');
  check('embed dipakai dan tidak fallback', profile?.roles?.name === 'ADMIN' && client.calls.length === 1, client.calls.join(' | '));
});

await run('Profil tidak ada (auth_user_id tidak terdaftar)', {
  embedWorks: false, embedErrorCode: 'PGRST200', row: null
}, async (fn) => {
  let msg = '';
  try { await fn.getAuthenticatedProfile('zz'); } catch (e) { msg = e.message; }
  check('error jelas "belum tersedia"', /belum tersedia/.test(msg), msg);
});

await run('Fallback juga gagal -> error asli diteruskan', {
  embedWorks: false, embedErrorCode: 'PGRST200', row: null
}, async (fn, client) => {
  // paksa fallback error
  const original = client.from;
  client.from = (t) => { const q = original(t); const origMaybe = q.maybeSingle.bind(q); q.maybeSingle = async function(){ if(t==='users' && !this._select.includes('roles(')) return { data:null, error:{ code:'42501', message:'permission denied for table users' } }; return origMaybe(); }; return q; };
  let msg = '';
  try { await fn.getAuthenticatedProfile('a1'); } catch (e) { msg = e.message; }
  check('error permission diteruskan', /permission denied/.test(msg), msg);
});

console.log('\n=== backendErrorHint ===');
const fnHint = new Function(`${hintSrc}; return backendErrorHint;`)();
check('PGRST200 -> petunjuk fix', /fix_admin_login\.sql/.test(fnHint({ code: 'PGRST200' })));
check('PGRST205 -> petunjuk schema', /database_schema\.sql/.test(fnHint({ code: 'PGRST205' })));
check('email not confirmed -> tanpa hint skema', fnHint(new Error('Invalid login credentials')) === '');
check('network error -> tanpa hint', fnHint(new Error('Failed to fetch')) === '');

console.log(failures === 0 ? '\nSEMUA TEST LULUS' : `\n${failures} TEST GAGAL`);
process.exit(failures === 0 ? 0 : 1);
