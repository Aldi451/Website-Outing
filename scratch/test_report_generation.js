const fs = require('fs');

// Mock browser globals
global.window = {
    supabase: {
        createClient: () => ({
            from: () => ({
                select: () => Promise.resolve({ data: [] }),
                insert: () => Promise.resolve({ data: [] }),
                update: () => Promise.resolve({ data: [] }),
                delete: () => Promise.resolve({ data: [] }),
                upsert: () => Promise.resolve({ data: [] })
            })
        })
    }
};

global.document = {
    getElementById: (id) => ({
        textContent: '',
        innerHTML: '',
        value: '',
        classList: { add: () => {}, remove: () => {} },
        setAttribute: () => {},
        getAttribute: () => '',
        addEventListener: () => {},
        style: {}
    }),
    querySelectorAll: () => [],
    createElement: () => ({ click: () => {}, setAttribute: () => {}, addEventListener: () => {} }),
    body: { appendChild: () => {}, removeChild: () => {} }
};

// Mock localStorage
const store = {};
global.localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; }
};

// Mock XLSX
global.XLSX = {
    utils: {
        book_new: () => ({ Sheets: {}, SheetNames: [] }),
        json_to_sheet: (data) => ({ data }),
        book_append_sheet: (wb, ws, name) => { wb.SheetNames.push(name); wb.Sheets[name] = ws; }
    },
    writeFile: (wb, filename) => { console.log('Mock XLSX write:', filename, 'Sheets:', wb.SheetNames.length); }
};

global.showToast = (msg) => console.log('Toast:', msg);
global.bootstrap = {
    Modal: {
        getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }),
        getInstance: () => ({ show: () => {}, hide: () => {} })
    },
    Toast: {
        getOrCreateInstance: () => ({ show: () => {}, hide: () => {} }),
        getInstance: () => ({ show: () => {}, hide: () => {} })
    }
};

// 1. Evaluate script 0
const script0 = fs.readFileSync('scratch/test_inline_script_0.js', 'utf8');
eval(script0);
console.log('Script 0 evaluated successfully!');

// 2. Test Archive Core
console.log('\n--- Test 1: Archives Core ---');
const archives = getOutingArchives();
console.log('Archives count:', archives.length);
if (archives.length === 0) throw new Error('Archives should not be empty!');
console.log('Archive[0] title:', archives[0].title);

// 3. Test Report Data Generation
console.log('\n--- Test 2: Report Data for Archive ---');
const archiveData = getOutingDataForReport(archives[0].id);
console.log('Archive report title:', archiveData.title);
console.log('Archive rundowns:', archiveData.rundowns.length);
console.log('Archive transactions:', archiveData.transactions.length);
console.log('Archive purchases:', archiveData.purchases.length);
console.log('Archive tasks:', archiveData.tasks.length);
console.log('Archive consumptions:', archiveData.consumptions.length);
console.log('Archive participants:', archiveData.participants.length);

console.log('\n--- Test 3: Generate Softcopy HTML Report ---');
const reportHtml = generateSoftcopyReportHtml(archiveData);
console.log('Generated HTML length:', reportHtml.length);
if (!reportHtml.includes('BAB I. SUSUNAN ACARA') || !reportHtml.includes('BAB II. LAPORAN PERTANGGUNGJAWABAN KEUANGAN')) {
    throw new Error('Report HTML is missing expected chapters!');
}
console.log('Report HTML verified!');

console.log('\n--- Test 4: Excel Export for Archive ---');
exportArchiveMasterExcel(archives[0].id);

console.log('\n--- Test 5: Active Outing Report ---');
const activeData = getOutingDataForReport('current');
console.log('Active outing title:', activeData.title);
const activeHtml = generateSoftcopyReportHtml(activeData);
console.log('Active HTML length:', activeHtml.length);

console.log('\n--- Test 6: Save Current Outing to Archive ---');
const newArch = saveCurrentOutingToArchive('Snap Outing 2026');
console.log('New archive created:', newArch.id, newArch.title);
const updatedArchives = getOutingArchives();
console.log('Updated archives count:', updatedArchives.length);

console.log('\nAll tests executed and PASSED perfectly!');
