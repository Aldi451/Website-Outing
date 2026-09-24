// Checks the three-field participant model and manual Admin save path.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { JSDOM } from '../.testtools/node_modules/jsdom/lib/api.js';

const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const start = html.indexOf('let participantsCache = [];');
const end = html.indexOf('// Pemanggil RPC dengan pesan bantuan bila fungsi database belum dibuat.', start);
assert.ok(start >= 0 && end > start, 'participant module exists');

const dom = new JSDOM(`<!doctype html><body>
    <form id="formParticipant">
        <input id="participantId"><input id="partName"><input id="partPhone">
        <select id="partStatus"><option value="CONFIRMED">Hadir</option><option value="PENDING">Pending</option><option value="CANCELLED">Batal</option></select>
        <button type="submit">Simpan Peserta</button>
    </form>
    <div id="modalParticipant"></div><div id="participantsList"></div>
    <div id="participantsSourceNote"></div><div id="statParticipants"></div>
</body>`);
const stored = new Map([['outing_participants', []]]);
const context = vm.createContext({
    document: dom.window.document,
    console,
    SERVER_BACKEND_MODE: true,
    STORAGE: {
        get: key => structuredClone(stored.get(key) ?? []),
        set: (key, value) => stored.set(key, structuredClone(value))
    },
    serverPersistenceQueue: Promise.resolve(),
    serverPersistenceError: null,
    canManage: () => true,
    isAuthenticatedAdmin: () => true,
    currentUser: { role: 'ADMIN' },
    currentProfile: { role: 'ADMIN' },
    generateUUID: () => 'participant-test-id',
    formatPhone: value => value.startsWith('0') ? `+62${value.slice(1)}` : value,
    escapeHtml: value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;'),
    bootstrap: { Modal: { getOrCreateInstance: () => ({ show() {} }), getInstance: () => ({ hide() {} }) } },
    showToast() {},
    alert() {},
    confirm: () => true
});
vm.runInContext(html.slice(start, end), context);
const call = code => vm.runInContext(code, context);

const normalized = call(`JSON.stringify(normalizeParticipantRecord({
    id: 'legacy-id', name: '  Sari  ', full_name: 'ignored', phone: '081234567890', status: 'CONFIRMED',
    department: 'Finance', transport: 'Bus 1', room: 'Villa 2', username: 'sari', gender: 'P'
}))`);
assert.deepEqual(JSON.parse(normalized), {
    id: 'legacy-id', name: 'Sari', phone: '081234567890', status: 'CONFIRMED'
});
assert.equal(call('participantStatusLabel("CANCELLED")'), 'Batal');

const doc = dom.window.document;
doc.getElementById('partName').value = 'Ayu Lestari';
doc.getElementById('partPhone').value = '081234567890';
doc.getElementById('partStatus').value = 'PENDING';
await call('saveParticipant({ preventDefault() {} })');
assert.deepEqual(stored.get('outing_participants'), [{
    id: 'participant-test-id', name: 'Ayu Lestari', phone: '+6281234567890', status: 'PENDING'
}]);
assert.match(doc.getElementById('participantsList').textContent, /Ayu Lestari/);
assert.match(doc.getElementById('participantsList').textContent, /Menunggu Konfirmasi/);
assert.doesNotMatch(doc.getElementById('participantsList').textContent, /Finance|Bus 1|Villa 2|sari/);
assert.deepEqual(Object.keys(stored.get('outing_participants')[0]).sort(), ['id', 'name', 'phone', 'status']);

console.log('PASS manual participant add, phone/status display, and strict three-field persistence');
dom.window.close();
