// JSDOM smoke test for the frontend against a mocked hosted API (login, Member read-only, Admin participant save).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { JSDOM } from '../.testtools/node_modules/jsdom/lib/api.js';

const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
assert.equal(inline.length, 1, 'one application script');

const initialState = {
    outing_current_info: { id: 'hosted-outing', name: 'Outing Uji', status: 'PLANNING' },
    outing_rundowns: [], outing_transactions: [], outing_purchases: [], outing_tasks: [],
    outing_consumptions: [], outing_announcements: [], outing_participants: [], outing_archives: [], outing_local_users: []
};
let state = structuredClone(initialState);
let authenticatedRole = null;
let username = null;
const calls = [];
const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'http://local.test/' });
const { window } = dom;
window.__OUTING_SERVER_MODE__ = true;
window.__OUTING_SERVER_STATE__ = structuredClone(state);
window.alert = () => {};
window.confirm = () => true;
window.scrollTo = () => {};
window.fetch = async (url, options = {}) => {
    const parsed = new URL(String(url), 'http://local.test');
    const route = parsed.searchParams.get('route');
    const key = parsed.searchParams.get('key');
    const method = String(options.method || 'GET').toUpperCase();
    calls.push({ route, key, method });
    const respond = (payload, status = 200) => ({
        ok: status >= 200 && status < 300,
        status,
        json: async () => structuredClone(payload)
    });
    if (route === 'session' && method === 'GET') {
        if (!authenticatedRole) return respond({ error: 'Sesi login tidak ditemukan.' }, 401);
        return respond({ user: {
            id: authenticatedRole === 'ADMIN' ? 'hosted-admin' : 'hosted-member',
            username, full_name: authenticatedRole === 'ADMIN' ? 'Admin Outing' : 'Member Outing',
            role: authenticatedRole, section: authenticatedRole === 'ADMIN' ? 'INISIATOR' : 'PUBLIC'
        } });
    }
    if (route === 'login' && method === 'POST') {
        const body = JSON.parse(options.body);
        if (body.username === 'admin' && body.password === 'admin123') authenticatedRole = 'ADMIN';
        else if (body.username === 'member' && body.password === 'member123') authenticatedRole = 'MEMBER';
        else return respond({ error: 'User ID atau password salah.' }, 401);
        username = body.username;
        return respond({ user: {
            id: authenticatedRole === 'ADMIN' ? 'hosted-admin' : 'hosted-member',
            username, role: authenticatedRole,
            full_name: authenticatedRole === 'ADMIN' ? 'Admin Outing' : 'Member Outing',
            section: authenticatedRole === 'ADMIN' ? 'INISIATOR' : 'PUBLIC'
        } });
    }
    if (route === 'state' && method === 'GET') {
        return authenticatedRole ? respond({ state }) : respond({ error: 'Silakan login.' }, 401);
    }
    if (route === 'state' && method === 'PUT') {
        if (authenticatedRole !== 'ADMIN') return respond({ error: 'Hanya Admin yang dapat mengubah data.' }, 403);
        state[key] = JSON.parse(options.body).value;
        return respond({ ok: true });
    }
    if (route === 'logout' && method === 'POST') {
        authenticatedRole = null; username = null;
        return respond({ ok: true });
    }
    return respond({ error: 'Not found' }, 404);
};

class FakeModal {
    static getOrCreateInstance() { return new FakeModal(); }
    static getInstance() { return new FakeModal(); }
    show() {}
    hide() {}
}
window.bootstrap = { Modal: FakeModal, Toast: { getOrCreateInstance: () => ({ show() {} }) } };
window.eval(inline[0]);
await new Promise(resolve => setTimeout(resolve, 20));
assert.equal(window.document.getElementById('appPage').classList.contains('d-none'), true);

const submitLogin = async (user, password) => {
    window.document.getElementById('loginUserId').value = user;
    window.document.getElementById('loginPassword').value = password;
    window.document.getElementById('loginForm').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 35));
};

await submitLogin('member', 'member123');
assert.equal(window.document.getElementById('appPage').classList.contains('d-none'), false);
assert.equal(window.document.getElementById('topUserRole').textContent, 'MEMBER');
assert.equal(window.eval('canManage("finance")'), false);
assert.equal(window.document.getElementById('btnAddParticipant').classList.contains('d-none'), true);
const memberBefore = calls.filter(call => call.method === 'PUT').length;
await window.eval('saveParticipant({ preventDefault() {} })');
assert.equal(calls.filter(call => call.method === 'PUT').length, memberBefore, 'Member cannot save participant data');

await window.eval('logout()');
await submitLogin('admin', 'admin123');
assert.equal(window.document.getElementById('topUserRole').textContent, 'ADMIN');
assert.equal(window.eval('canManage("finance")'), true);
window.document.getElementById('partName').value = 'Ayu Integrasi';
window.document.getElementById('partPhone').value = '081234567890';
window.document.getElementById('partStatus').value = 'CONFIRMED';
await window.eval('saveParticipant({ preventDefault() {} })');
assert.equal(state.outing_participants.length, 1);
assert.deepEqual(Object.keys(state.outing_participants[0]).sort(), ['id', 'name', 'phone', 'status']);
assert.equal(state.outing_participants[0].name, 'Ayu Integrasi');
assert.equal(window.document.getElementById('participantsList').textContent.includes('Ayu Integrasi'), true);
assert.ok(calls.some(call => call.route === 'state' && call.method === 'PUT' && call.key === 'outing_participants'));

console.log('PASS hosted API client session flow, Member read-only guard, Admin participant save');
dom.window.close();
