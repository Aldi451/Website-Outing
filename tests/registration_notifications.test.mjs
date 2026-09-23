// npm install --prefix .testtools jsdom --no-audit --no-fund
// node tests/registration_notifications.test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM } from '../.testtools/node_modules/jsdom/lib/api.js';
const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true });
let scripts = 0;
for (const script of dom.window.document.querySelectorAll('script:not([src])')) {
    new vm.Script(script.textContent); scripts++;
}
console.log(`PASS syntax of ${scripts} inline script(s)`);
const start = html.indexOf('let registrationNotificationSession = null;');
const end = html.indexOf('async function loadUserApprovals()', start);
const badgeStart = html.indexOf('function updateUserApprovalBadge(');
const badgeEnd = html.indexOf('function renderUserApprovals(', badgeStart);
let trusted = true, response = { data: { pending_count: 2, pending_ids: ['a', 'b'] } };
let requests = 0, refreshes = 0;
const toasts = [], timers = new Map();
let nextTimer = 1;
const context = vm.createContext({
    window: dom.window, document: dom.window.document, console: { warn() {} },
    isTrustedAdmin: () => trusted,
    supabaseClient: { rpc: async name => {
        assert.equal(name, 'admin_pending_registration_notifications'); requests++;
        return await response;
    } },
    showToast: message => toasts.push(message),
    loadUserApprovals: async () => { refreshes++; },
    setInterval: (fn, ms) => { assert.equal(ms, 30000); const id = nextTimer++; timers.set(id, fn); return id; },
    clearInterval: id => timers.delete(id)
});
vm.runInContext(html.slice(start, end) + html.slice(badgeStart, badgeEnd), context);
const call = code => vm.runInContext(code, context);
const tick = () => new Promise(resolve => setImmediate(resolve));
const banner = dom.window.document.getElementById('registrationNotificationBanner');
const badge = dom.window.document.getElementById('userApprovalPendingBadge');
call('startRegistrationNotifications()'); await tick();
assert.equal(banner.classList.contains('d-none'), false);
assert.equal(badge.textContent, '2 Menunggu');
assert.equal(toasts.length, 1);
await call('refreshRegistrationNotifications()');
assert.equal(toasts.length, 1); // same pending IDs => no repeated toast
response = { data: { pending_count: 2, pending_ids: ['b', 'c'] } };
await call('refreshRegistrationNotifications()');
assert.equal(toasts.length, 2); // same COUNT but new registration
assert.match(toasts[1], /1 registrasi baru/);
dom.window.document.getElementById('pageUserApprovals').classList.add('active');
response = { data: { pending_count: 0, pending_ids: [] } };
await call('refreshRegistrationNotifications()');
assert.equal(banner.classList.contains('d-none'), true);
assert.equal(badge.textContent, '0 Menunggu');
assert.equal(refreshes, 1);
console.log('PASS initial/offline backlog, deduplication, same-count new ID, approval queue refresh');

response = { error: { code: 'PGRST202', message: 'Missing RPC' } };
await call('refreshRegistrationNotifications()');
assert.equal(banner.classList.contains('d-none'), false);
assert.equal(badge.textContent, 'Belum terhubung');
assert.match(banner.textContent, /update_website.sql/);
response = { data: { pending_count: 0, pending_ids: [] } };
await call('refreshRegistrationNotifications()');
assert.equal(banner.classList.contains('d-none'), true);
console.log('PASS missing RPC/network error visible + retry recovery');

let resolvePending;
response = new Promise(resolve => { resolvePending = resolve; });
const inFlight = call('refreshRegistrationNotifications()');
const beforeBusy = requests;
await call('refreshRegistrationNotifications()');
assert.equal(requests, beforeBusy); // no overlapping poll
call('stopRegistrationNotifications()');
assert.equal(timers.size, 0);
resolvePending({ data: { pending_count: 1, pending_ids: ['late'] } });
await inFlight;
assert.equal(banner.classList.contains('d-none'), true); // late response after logout ignored
trusted = false;
call('startRegistrationNotifications()'); await tick();
assert.equal(timers.size, 0);
assert.equal(requests, beforeBusy);
console.log('PASS overlap guard, logout cleanup, stale response discarded, non-admin/simulator denied');
dom.window.close();
