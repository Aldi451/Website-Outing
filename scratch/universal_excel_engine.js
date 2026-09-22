/* =====================================================
   UNIVERSAL EXCEL IMPORT & EXPORT ENGINE (ALL MODULES)
===================================================== */
let currentImportModule = 'rundown';

function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatExcelDate(val) {
    if (!val) return '';
    if (typeof val === 'number') {
        const jsDate = new Date(Math.round((val - 25569) * 86400 * 1000));
        if (!isNaN(jsDate.getTime())) {
            return jsDate.toISOString().split('T')[0];
        }
    }
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
        return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
    }
    return str;
}

function formatExcelNumber(val, defaultVal = 0) {
    if (typeof val === 'number') return isNaN(val) ? defaultVal : val;
    if (!val) return defaultVal;
    const clean = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? defaultVal : num;
}

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('appToast');
    const msgEl = document.getElementById('toastMessage');
    if (toastEl && msgEl) {
        msgEl.innerHTML = message;
        toastEl.className = `toast align-items-center text-white bg-${type} border-0 shadow`;
        const toast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 4000 });
        toast.show();
    } else {
        alert(message.replace(/<[^>]*>?/gm, ''));
    }
}

const EXCEL_MODULE_CONFIG = {
    rundown: {
        name: 'Rundown Acara',
        icon: 'bi-calendar-event',
        storageKey: 'outing_rundowns',
        supabaseTable: 'rundowns',
        idField: 'id',
        defaultSortField: 'order_index',
        exportFilename: 'Rundown_Outing',
        templateFilename: 'Template_Rundown_Outing.xlsx',
        columns: [
            { key: 'start_time', label: 'Waktu', type: 'text', placeholder: '08:00 - 09:30', width: 18, synonyms: ['waktu', 'jam', 'time', 'pukul', 'jadwal'] },
            { key: 'title', label: 'Nama Kegiatan', type: 'text', placeholder: 'Nama Kegiatan', required: true, width: 35, synonyms: ['kegiatan', 'nama kegiatan', 'acara', 'agenda', 'title', 'aktivitas'] },
            { key: 'location', label: 'Lokasi', type: 'text', placeholder: 'Lokasi', width: 25, synonyms: ['lokasi', 'tempat', 'venue', 'location'] },
            { key: 'description', label: 'Keterangan / Catatan', type: 'text', placeholder: 'Keterangan', width: 45, synonyms: ['keterangan', 'catatan', 'deskripsi', 'note', 'notes', 'desc'] }
        ],
        templateRows: [
            { "Waktu": "06:30 - 07:30", "Nama Kegiatan": "Kumpul di Kantor & Registrasi", "Lokasi": "Lobby Gedung Utama", "Keterangan": "Briefing & pembagian snack" },
            { "Waktu": "07:30 - 10:30", "Nama Kegiatan": "Perjalanan Bus Menuju Venue", "Lokasi": "Tol Jagorawi - Puncak", "Keterangan": "Dipandu bus coordinator" },
            { "Waktu": "11:00 - 13:00", "Nama Kegiatan": "Check-in Villa & Makan Siang", "Lokasi": "Resto Utama Villa", "Keterangan": "Pembagian kunci kamar" },
            { "Waktu": "14:00 - 17:30", "Nama Kegiatan": "Team Building & Fun Games", "Lokasi": "Lapangan Rumput Villa", "Keterangan": "Dresscode kaos biru" },
            { "Waktu": "19:00 - 22:00", "Nama Kegiatan": "Gala Dinner & BBQ Night", "Lokasi": "Kolam Renang Villa", "Keterangan": "Doorprize & musik akustik" },
            { "Waktu": "08:00 - 11:30", "Nama Kegiatan": "Senam Pagi, Bebas & Check-out", "Lokasi": "Villa Puncak", "Keterangan": "Foto bersama seluruh peserta" }
        ],
        transformExport: (items) => {
            return items.map((item, idx) => ({
                "No.": idx + 1,
                "Waktu Kegiatan": item.start_time || '-',
                "Nama Kegiatan": item.title || item.activity || '-',
                "Lokasi": item.location || '-',
                "Deskripsi / Catatan": item.description || '-'
            }));
        },
        createItemFromRow: (row, idx) => ({
            id: generateUUID(),
            start_time: row.start_time || '-',
            title: row.title || 'Kegiatan',
            activity: row.title || 'Kegiatan',
            location: row.location || '',
            description: row.description || '',
            order_index: idx + 1
        }),
        onAfterSave: () => {
            renderRundown(STORAGE.get('outing_rundowns', []));
            loadDashboard();
        }
    },

    finance: {
        name: 'Laporan Keuangan & Kas',
        icon: 'bi-wallet2',
        storageKey: 'outing_transactions',
        supabaseTable: 'cash_transactions',
        idField: 'id',
        defaultSortField: 'transaction_date',
        exportFilename: 'Laporan_Keuangan_Outing',
        templateFilename: 'Template_Keuangan_Outing.xlsx',
        columns: [
            { key: 'transaction_date', label: 'Tanggal', type: 'date', placeholder: 'YYYY-MM-DD', width: 14, synonyms: ['tanggal', 'tgl', 'date', 'transaction_date'] },
            { key: 'type', label: 'Jenis', type: 'select', options: [{val: 'IN', label: 'IN (Pemasukan)'}, {val: 'OUT', label: 'OUT (Pengeluaran)'}], width: 12, synonyms: ['jenis', 'tipe', 'type', 'in/out', 'kategori kas'] },
            { key: 'category', label: 'Kategori', type: 'text', placeholder: 'Iuran / Transportasi', width: 22, synonyms: ['kategori', 'category', 'pos'] },
            { key: 'description', label: 'Deskripsi Transaksi', type: 'text', placeholder: 'Uraian transaksi', required: true, width: 35, synonyms: ['deskripsi', 'keterangan', 'uraian', 'description', 'detail'] },
            { key: 'amount', label: 'Nominal (Rp)', type: 'number', placeholder: '500000', required: true, width: 18, synonyms: ['nominal', 'jumlah', 'amount', 'total', 'biaya', 'nilai', 'rp'] },
            { key: 'status', label: 'Status', type: 'select', options: [{val: 'POSTED', label: 'POSTED'}, {val: 'PENDING', label: 'PENDING'}], width: 12, synonyms: ['status', 'state'] }
        ],
        templateRows: [
            { "Tanggal": "2026-09-10", "Jenis": "IN", "Kategori": "Iuran Peserta", "Deskripsi Transaksi": "Pembayaran iuran 70 peserta @500rb", "Nominal (Rp)": 35000000, "Status": "POSTED" },
            { "Tanggal": "2026-09-12", "Jenis": "IN", "Kategori": "Sponsorship", "Deskripsi Transaksi": "Sponsorship Koperasi Karyawan", "Nominal (Rp)": 15000000, "Status": "POSTED" },
            { "Tanggal": "2026-09-13", "Jenis": "OUT", "Kategori": "Penginapan", "Deskripsi Transaksi": "DP 50% Sewa Villa Grand Coolibah", "Nominal (Rp)": 12000000, "Status": "POSTED" },
            { "Tanggal": "2026-09-15", "Jenis": "OUT", "Kategori": "Transportasi", "Deskripsi Transaksi": "Sewa 2 Unit Bus Pariwisata (PP)", "Nominal (Rp)": 8500000, "Status": "POSTED" }
        ],
        transformExport: (items) => {
            let totalIn = 0;
            let totalOut = 0;
            const rows = items.map((item, idx) => {
                const isIncome = String(item.type || '').toUpperCase() === 'IN';
                const amt = Number(item.amount || 0);
                if (isIncome) totalIn += amt; else totalOut += amt;
                return {
                    "No.": idx + 1,
                    "Tanggal": item.transaction_date || '-',
                    "Jenis": isIncome ? 'PEMASUKAN' : 'PENGELUARAN',
                    "Kategori": item.category || '-',
                    "Deskripsi": item.description || '-',
                    "Masuk (Rp)": isIncome ? amt : 0,
                    "Keluar (Rp)": !isIncome ? amt : 0,
                    "Status": item.status || 'POSTED'
                };
            });
            rows.push({
                "No.": "",
                "Tanggal": "",
                "Jenis": "",
                "Kategori": "TOTAL KESELURUHAN",
                "Deskripsi": `Saldo Akhir: Rp ${(totalIn - totalOut).toLocaleString('id-ID')}`,
                "Masuk (Rp)": totalIn,
                "Keluar (Rp)": totalOut,
                "Status": "SUMMARY"
            });
            return rows;
        },
        createItemFromRow: (row) => ({
            id: generateUUID(),
            transaction_date: formatExcelDate(row.transaction_date) || new Date().toISOString().split('T')[0],
            type: String(row.type || 'OUT').toUpperCase().includes('IN') ? 'IN' : 'OUT',
            category: row.category || 'Operasional',
            description: row.description || 'Transaksi',
            amount: Math.abs(formatExcelNumber(row.amount)) || 0,
            status: String(row.status || 'POSTED').toUpperCase().includes('PEND') ? 'PENDING' : 'POSTED',
            created_at: new Date().toISOString()
        }),
        onAfterSave: () => {
            renderFinance(STORAGE.get('outing_transactions', []));
            loadDashboard();
        }
    },

    purchasing: {
        name: 'Purchasing & Belanja',
        icon: 'bi-cart-check',
        storageKey: 'outing_purchases',
        supabaseTable: 'purchase_requests',
        idField: 'id',
        defaultSortField: 'needed_date',
        exportFilename: 'Purchasing_Requests_Outing',
        templateFilename: 'Template_Purchasing_Outing.xlsx',
        columns: [
            { key: 'item_name', label: 'Nama Barang / Jasa', type: 'text', placeholder: 'Kaos Polo / Banner', required: true, width: 30, synonyms: ['item_name', 'item', 'nama barang', 'barang', 'nama', 'deskripsi'] },
            { key: 'quantity', label: 'Qty', type: 'number', placeholder: '10', required: true, width: 10, synonyms: ['quantity', 'qty', 'jumlah', 'banyak'] },
            { key: 'unit', label: 'Satuan', type: 'text', placeholder: 'Pcs / Dus', width: 12, synonyms: ['unit', 'satuan', 'uom'] },
            { key: 'estimated_cost', label: 'Estimasi Biaya', type: 'number', placeholder: '500000', width: 16, synonyms: ['estimated_cost', 'estimasi', 'biaya estimasi', 'budget'] },
            { key: 'actual_cost', label: 'Biaya Aktual', type: 'number', placeholder: '480000', width: 16, synonyms: ['actual_cost', 'aktual', 'biaya aktual', 'realisasi'] },
            { key: 'vendor', label: 'Vendor / Toko', type: 'text', placeholder: 'Nama Vendor', width: 22, synonyms: ['vendor', 'toko', 'suplier', 'supplier'] },
            { key: 'needed_date', label: 'Tgl Kebutuhan', type: 'date', placeholder: 'YYYY-MM-DD', width: 14, synonyms: ['needed_date', 'deadline', 'tanggal kebutuhan', 'tgl butuh'] },
            { key: 'section', label: 'Seksi Pemohon', type: 'select', options: [{val:'LOGISTIC', label:'LOGISTIC'}, {val:'KONSUMSI', label:'KONSUMSI'}, {val:'PUBLIC_AREA', label:'PUBLIC_AREA'}, {val:'ACARA', label:'ACARA'}, {val:'INISIATOR', label:'INISIATOR'}], width: 16, synonyms: ['section', 'seksi', 'divisi', 'bagian'] },
            { key: 'status', label: 'Status', type: 'select', options: [{val:'PENDING', label:'PENDING'}, {val:'APPROVED', label:'APPROVED'}, {val:'COMPLETED', label:'COMPLETED'}, {val:'REJECTED', label:'REJECTED'}], width: 14, synonyms: ['status', 'state'] },
            { key: 'notes', label: 'Catatan', type: 'text', placeholder: 'Spesifikasi atau link pembelian', width: 30, synonyms: ['notes', 'catatan', 'keterangan'] }
        ],
        templateRows: [
            { "Nama Barang / Jasa": "Kaos Polo Sablon Outing", "Qty": 85, "Satuan": "Pcs", "Estimasi Biaya": 4500000, "Biaya Aktual": 4250000, "Vendor / Toko": "Konveksi Berkah", "Tgl Kebutuhan": "2026-10-05", "Seksi Pemohon": "LOGISTIC", "Status": "COMPLETED", "Catatan": "Bahan lacoste katun, warna navy" },
            { "Nama Barang / Jasa": "Name Tag & Lanyard", "Qty": 85, "Satuan": "Pcs", "Estimasi Biaya": 850000, "Biaya Aktual": 750000, "Vendor / Toko": "Percetakan Grafika", "Tgl Kebutuhan": "2026-10-08", "Seksi Pemohon": "PUBLIC_AREA", "Status": "COMPLETED", "Catatan": "Barcode nomor kamar" },
            { "Nama Barang / Jasa": "Air Mineral 600ml", "Qty": 25, "Satuan": "Dus", "Estimasi Biaya": 1250000, "Biaya Aktual": 1100000, "Vendor / Toko": "Agen Grosir Berkah", "Tgl Kebutuhan": "2026-10-14", "Seksi Pemohon": "KONSUMSI", "Status": "APPROVED", "Catatan": "Untuk di bus dan area villa" }
        ],
        transformExport: (items) => {
            let totalEst = 0;
            let totalAct = 0;
            const rows = items.map((item, idx) => {
                const est = Number(item.estimated_cost || 0);
                const act = Number(item.actual_cost || 0);
                totalEst += est;
                totalAct += act;
                return {
                    "No.": idx + 1,
                    "Nama Barang / Jasa": item.item_name || item.item || '-',
                    "Qty": item.quantity || 0,
                    "Satuan": item.unit || 'Pcs',
                    "Estimasi Biaya (Rp)": est,
                    "Biaya Aktual (Rp)": act,
                    "Selisih (Rp)": est - act,
                    "Vendor / Toko": item.vendor || '-',
                    "Tanggal Kebutuhan": item.needed_date || '-',
                    "Seksi Pemohon": item.section || 'LOGISTIC',
                    "Status": item.status || 'PENDING',
                    "Catatan": item.notes || '-'
                };
            });
            rows.push({
                "No.": "",
                "Nama Barang / Jasa": "TOTAL REKAP",
                "Qty": "",
                "Satuan": "",
                "Estimasi Biaya (Rp)": totalEst,
                "Biaya Aktual (Rp)": totalAct,
                "Selisih (Rp)": totalEst - totalAct,
                "Vendor / Toko": "",
                "Tanggal Kebutuhan": "",
                "Seksi Pemohon": "",
                "Status": "SUMMARY",
                "Catatan": ""
            });
            return rows;
        },
        createItemFromRow: (row) => ({
            id: generateUUID(),
            item_name: row.item_name || 'Barang',
            item: row.item_name || 'Barang',
            quantity: Math.max(1, formatExcelNumber(row.quantity, 1)),
            unit: row.unit || 'Pcs',
            estimated_cost: formatExcelNumber(row.estimated_cost, 0),
            actual_cost: formatExcelNumber(row.actual_cost, 0),
            vendor: row.vendor || '',
            needed_date: formatExcelDate(row.needed_date) || new Date().toISOString().split('T')[0],
            section: (row.section || 'LOGISTIC').toUpperCase(),
            status: (row.status || 'PENDING').toUpperCase(),
            notes: row.notes || ''
        }),
        onAfterSave: () => {
            renderPurchasing(STORAGE.get('outing_purchases', []));
        }
    },

    logistic: {
        name: 'Logistik & Tugas Operasional',
        icon: 'bi-box-seam',
        storageKey: 'outing_tasks',
        supabaseTable: 'tasks',
        idField: 'id',
        defaultSortField: 'deadline',
        exportFilename: 'Logistik_Tasks_Outing',
        templateFilename: 'Template_Logistik_Outing.xlsx',
        columns: [
            { key: 'title', label: 'Nama Tugas / Perlengkapan', type: 'text', placeholder: 'Sewa Bus / Genset', required: true, width: 35, synonyms: ['title', 'tugas', 'nama tugas', 'perlengkapan', 'task', 'deskripsi'] },
            { key: 'priority', label: 'Prioritas', type: 'select', options: [{val:'HIGH', label:'HIGH (Tinggi)'}, {val:'MEDIUM', label:'MEDIUM (Sedang)'}, {val:'LOW', label:'LOW (Rendah)'}], width: 14, synonyms: ['priority', 'prioritas', 'urgensi'] },
            { key: 'deadline', label: 'Deadline', type: 'date', placeholder: 'YYYY-MM-DD', width: 14, synonyms: ['deadline', 'batas waktu', 'tgl selesai'] },
            { key: 'assigned_to', label: 'PIC / Petugas', type: 'text', placeholder: 'Nama PIC', width: 20, synonyms: ['assigned_to', 'pic', 'petugas', 'pj', 'armada'] },
            { key: 'progress', label: 'Progress (%)', type: 'number', placeholder: '0 - 100', width: 14, synonyms: ['progress', 'persen', 'capaian', '%'] },
            { key: 'status', label: 'Status', type: 'select', options: [{val:'TODO', label:'TODO'}, {val:'IN_PROGRESS', label:'IN_PROGRESS'}, {val:'DONE', label:'DONE'}], width: 14, synonyms: ['status', 'state'] },
            { key: 'notes', label: 'Catatan Teknis', type: 'text', placeholder: 'Catatan koordinasi', width: 30, synonyms: ['notes', 'catatan', 'keterangan'] }
        ],
        templateRows: [
            { "Nama Tugas / Perlengkapan": "Booking & Pelunasan Sewa Bus Pariwisata", "Prioritas": "HIGH", "Deadline": "2026-10-10", "PIC / Petugas": "Hendra Saputra", "Progress (%)": 100, "Status": "DONE", "Catatan Teknis": "2 unit bus White Horse siap" },
            { "Nama Tugas / Perlengkapan": "Survey Layout Panggung & Sound System Villa", "Prioritas": "HIGH", "Deadline": "2026-10-08", "PIC / Petugas": "Tim Logistik", "Progress (%)": 100, "Status": "DONE", "Catatan Teknis": "Kelistrikan & genset aman" },
            { "Nama Tugas / Perlengkapan": "Pengadaan Perlengkapan Games & Tali Tambang", "Prioritas": "MEDIUM", "Deadline": "2026-10-12", "PIC / Petugas": "Hendra Saputra", "Progress (%)": 75, "Status": "IN_PROGRESS", "Catatan Teknis": "Tinggal peluit dan bendera" }
        ],
        transformExport: (items) => {
            return items.map((item, idx) => ({
                "No.": idx + 1,
                "Nama Tugas / Perlengkapan": item.title || item.description || '-',
                "Prioritas": item.priority || 'MEDIUM',
                "Deadline": item.deadline || '-',
                "PIC / Petugas": item.assigned_to || '-',
                "Progress (%)": item.progress !== undefined ? `${item.progress}%` : '0%',
                "Status": item.status || 'TODO',
                "Catatan Teknis": item.notes || '-'
            }));
        },
        createItemFromRow: (row) => {
            let prog = formatExcelNumber(row.progress, 0);
            if (String(row.status || '').toUpperCase() === 'DONE') prog = 100;
            return {
                id: generateUUID(),
                title: row.title || 'Task Logistik',
                description: row.title || 'Task Logistik',
                priority: (row.priority || 'MEDIUM').toUpperCase(),
                deadline: formatExcelDate(row.deadline) || new Date().toISOString().split('T')[0],
                assigned_to: row.assigned_to || 'Tim Logistik',
                progress: Math.min(100, Math.max(0, prog)),
                status: (row.status || 'TODO').toUpperCase(),
                notes: row.notes || ''
            };
        },
        onAfterSave: () => {
            renderTasks(STORAGE.get('outing_tasks', []));
            loadDashboard();
        }
    },

    konsumsi: {
        name: 'Konsumsi & Meal Plan',
        icon: 'bi-cup-hot',
        storageKey: 'outing_consumptions',
        supabaseTable: 'consumption_plans',
        idField: 'id',
        defaultSortField: 'date',
        exportFilename: 'Rencana_Konsumsi_Outing',
        templateFilename: 'Template_Konsumsi_Outing.xlsx',
        columns: [
            { key: 'date', label: 'Tanggal', type: 'date', placeholder: 'YYYY-MM-DD', width: 14, synonyms: ['date', 'tanggal', 'tgl'] },
            { key: 'meal_type', label: 'Jenis Makan', type: 'select', options: [{val:'SARAPAN', label:'SARAPAN'}, {val:'MAKAN_SIANG', label:'MAKAN_SIANG'}, {val:'MAKAN_MALAM', label:'MAKAN_MALAM'}, {val:'SNACK_PAGI', label:'SNACK_PAGI'}, {val:'SNACK_SORE', label:'SNACK_SORE'}], width: 16, synonyms: ['meal_type', 'jenis makan', 'sesi', 'waktu makan', 'makan'] },
            { key: 'location', label: 'Lokasi Makan', type: 'text', placeholder: 'Resto / Villa', width: 22, synonyms: ['location', 'lokasi', 'tempat'] },
            { key: 'participant_count', label: 'Porsi / Peserta', type: 'number', placeholder: '85', width: 14, synonyms: ['participant_count', 'porsi', 'jumlah porsi', 'peserta', 'qty'] },
            { key: 'vendor', label: 'Vendor Katering', type: 'text', placeholder: 'Nama Katering', width: 22, synonyms: ['vendor', 'katering', 'catering', 'dapur'] },
            { key: 'estimated_cost', label: 'Estimasi Biaya', type: 'number', placeholder: '2500000', width: 16, synonyms: ['estimated_cost', 'estimasi', 'biaya estimasi'] },
            { key: 'actual_cost', label: 'Biaya Aktual', type: 'number', placeholder: '2500000', width: 16, synonyms: ['actual_cost', 'aktual', 'biaya aktual'] },
            { key: 'status', label: 'Status', type: 'select', options: [{val:'PLANNED', label:'PLANNED'}, {val:'ORDERED', label:'ORDERED'}, {val:'DELIVERED', label:'DELIVERED'}, {val:'CANCELLED', label:'CANCELLED'}], width: 14, synonyms: ['status', 'state'] },
            { key: 'notes', label: 'Menu / Catatan', type: 'text', placeholder: 'Menu makanan & minuman', width: 35, synonyms: ['notes', 'menu', 'catatan', 'detail'] }
        ],
        templateRows: [
            { "Tanggal": "2026-10-15", "Jenis Makan": "SNACK_PAGI", "Lokasi Makan": "Di dalam Bus", "Porsi / Peserta": 85, "Vendor Katering": "Dapur Snack Bu Ani", "Estimasi Biaya": 1275000, "Biaya Aktual": 1275000, "Status": "ORDERED", "Menu / Catatan": "Lemper, risoles, air mineral cup" },
            { "Tanggal": "2026-10-15", "Jenis Makan": "MAKAN_SIANG", "Lokasi Makan": "Resto Utama Villa", "Porsi / Peserta": 85, "Vendor Katering": "Katering Sunda Raos", "Estimasi Biaya": 3825000, "Biaya Aktual": 3825000, "Status": "ORDERED", "Menu / Catatan": "Nasi Liwet, Ayam Bakar, Gurame Goreng" },
            { "Tanggal": "2026-10-15", "Jenis Makan": "MAKAN_MALAM", "Lokasi Makan": "Taman Kolam Renang", "Porsi / Peserta": 85, "Vendor Katering": "BBQ Chef Puncak", "Estimasi Biaya": 5100000, "Biaya Aktual": 4900000, "Status": "PLANNED", "Menu / Catatan": "BBQ Jagung, Sate Sapi, Sosis Panggang" }
        ],
        transformExport: (items) => {
            let totalEst = 0;
            let totalAct = 0;
            const rows = items.map((item, idx) => {
                const est = Number(item.estimated_cost || 0);
                const act = Number(item.actual_cost || 0);
                totalEst += est;
                totalAct += act;
                return {
                    "No.": idx + 1,
                    "Tanggal": item.date || '-',
                    "Jenis Makan": item.meal_type || '-',
                    "Lokasi Makan": item.location || '-',
                    "Jumlah Porsi": item.participant_count || 0,
                    "Vendor Katering": item.vendor || '-',
                    "Estimasi Biaya (Rp)": est,
                    "Biaya Aktual (Rp)": act,
                    "Status": item.status || 'PLANNED',
                    "Menu & Catatan": item.notes || '-'
                };
            });
            rows.push({
                "No.": "",
                "Tanggal": "",
                "Jenis Makan": "TOTAL",
                "Lokasi Makan": "",
                "Jumlah Porsi": "",
                "Vendor Katering": "",
                "Estimasi Biaya (Rp)": totalEst,
                "Biaya Aktual (Rp)": totalAct,
                "Status": "SUMMARY",
                "Menu & Catatan": ""
            });
            return rows;
        },
        createItemFromRow: (row) => ({
            id: generateUUID(),
            date: formatExcelDate(row.date) || new Date().toISOString().split('T')[0],
            meal_type: (row.meal_type || 'MAKAN_SIANG').toUpperCase(),
            location: row.location || 'Villa Outing',
            participant_count: Math.max(1, formatExcelNumber(row.participant_count, 85)),
            vendor: row.vendor || '',
            estimated_cost: formatExcelNumber(row.estimated_cost, 0),
            actual_cost: formatExcelNumber(row.actual_cost, 0),
            status: (row.status || 'PLANNED').toUpperCase(),
            notes: row.notes || ''
        }),
        onAfterSave: () => {
            renderKonsumsi(STORAGE.get('outing_consumptions', []));
        }
    },

    public_area: {
        name: 'Public Area & Pengumuman',
        icon: 'bi-megaphone',
        storageKey: 'outing_announcements',
        supabaseTable: 'announcements',
        idField: 'id',
        defaultSortField: 'publish_date',
        exportFilename: 'Pengumuman_Outing',
        templateFilename: 'Template_Pengumuman_Outing.xlsx',
        columns: [
            { key: 'publish_date', label: 'Tanggal Terbit', type: 'date', placeholder: 'YYYY-MM-DD', width: 14, synonyms: ['publish_date', 'tanggal', 'tgl terbit', 'date'] },
            { key: 'title', label: 'Judul Pengumuman', type: 'text', placeholder: 'Judul penting', required: true, width: 35, synonyms: ['title', 'judul', 'pengumuman', 'subject'] },
            { key: 'content', label: 'Isi Pesan / Instruksi', type: 'text', placeholder: 'Detail pengumuman...', required: true, width: 50, synonyms: ['content', 'isi', 'pesan', 'keterangan', 'message', 'body'] },
            { key: 'priority', label: 'Prioritas', type: 'select', options: [{val:'HIGH', label:'HIGH (Penting)'}, {val:'NORMAL', label:'NORMAL'}, {val:'INFO', label:'INFO'}], width: 14, synonyms: ['priority', 'prioritas', 'urgensi'] }
        ],
        templateRows: [
            { "Tanggal Terbit": "2026-09-18", "Judul Pengumuman": "Dresscode Resmi Hari Ke-1 Outing", "Isi Pesan / Instruksi": "Kenakan kaos outing warna biru saat registrasi di kantor.", "Prioritas": "HIGH" },
            { "Tanggal Terbit": "2026-09-19", "Judul Pengumuman": "Titik Kumpul & Jam Keberangkatan Bus", "Isi Pesan / Instruksi": "Kumpul di Lobby Gedung A pukul 06.30 WIB. Bus berangkat tepat 07.30 WIB.", "Prioritas": "HIGH" },
            { "Tanggal Terbit": "2026-09-20", "Judul Pengumuman": "Checklist Perlengkapan Pribadi", "Isi Pesan / Instruksi": "Bawa baju ganti 2 set, jaket tebal, obat pribadi, dan sandal outdoor.", "Prioritas": "NORMAL" }
        ],
        transformExport: (items) => {
            return items.map((item, idx) => ({
                "No.": idx + 1,
                "Tanggal Terbit": item.publish_date || '-',
                "Judul Pengumuman": item.title || '-',
                "Isi Pesan / Instruksi": item.content || item.message || '-',
                "Prioritas": item.priority || 'NORMAL'
            }));
        },
        createItemFromRow: (row) => ({
            id: generateUUID(),
            title: row.title || 'Pengumuman Baru',
            content: row.content || 'Isi Pengumuman',
            message: row.content || 'Isi Pengumuman',
            priority: (row.priority || 'NORMAL').toUpperCase(),
            publish_date: formatExcelDate(row.publish_date) || new Date().toISOString().split('T')[0],
            created_at: new Date().toISOString()
        }),
        onAfterSave: () => {
            renderAnnouncements(STORAGE.get('outing_announcements', []));
            loadDashboard();
        }
    },

    participants: {
        name: 'Data Peserta Outing',
        icon: 'bi-person-check',
        storageKey: 'outing_participants',
        supabaseTable: 'participants',
        idField: 'id',
        defaultSortField: 'full_name',
        exportFilename: 'Data_Peserta_Outing',
        templateFilename: 'Template_Data_Peserta_Outing.xlsx',
        columns: [
            { key: 'username', label: 'ID / NIK', type: 'text', placeholder: 'NIK / User ID', width: 14, synonyms: ['username', 'id', 'nik', 'user_id', 'no pegawai'] },
            { key: 'full_name', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama Karyawan', required: true, width: 28, synonyms: ['full_name', 'name', 'nama', 'nama lengkap', 'peserta'] },
            { key: 'department', label: 'Departemen / Divisi', type: 'text', placeholder: 'Finance / IT / HR', width: 20, synonyms: ['department', 'departemen', 'divisi', 'dept', 'bagian'] },
            { key: 'phone', label: 'No. WhatsApp', type: 'text', placeholder: '081234567890', width: 18, synonyms: ['phone', 'telepon', 'no telepon', 'wa', 'whatsapp', 'no hp'] },
            { key: 'gender', label: 'Gender', type: 'select', options: [{val:'L', label:'L (Laki-laki)'}, {val:'P', label:'P (Perempuan)'}], width: 10, synonyms: ['gender', 'jenis kelamin', 'jk', 'sex'] },
            { key: 'transport', label: 'Transportasi / Bus', type: 'text', placeholder: 'Bus 1 / Mobil Pribadi', width: 20, synonyms: ['transport', 'transportasi', 'armada', 'bus', 'kendaraan'] },
            { key: 'room', label: 'Kamar / Villa', type: 'text', placeholder: 'Kamar Melati 1', width: 20, synonyms: ['room', 'kamar', 'villa', 'ruangan', 'rooming'] },
            { key: 'status', label: 'Status', type: 'select', options: [{val:'CONFIRMED', label:'CONFIRMED'}, {val:'PENDING', label:'PENDING'}, {val:'CANCELLED', label:'CANCELLED'}], width: 14, synonyms: ['status', 'kehadiran', 'state'] }
        ],
        templateRows: [
            { "ID / NIK": "nik-001", "Nama Lengkap": "Budi Santoso", "Departemen / Divisi": "Management", "No. WhatsApp": "081234567890", "Gender": "L", "Transportasi / Bus": "Mobil Pribadi", "Kamar / Villa": "Villa Utama No. 1", "Status": "CONFIRMED" },
            { "ID / NIK": "nik-002", "Nama Lengkap": "Siti Rahma", "Departemen / Divisi": "Finance", "No. WhatsApp": "081234567891", "Gender": "P", "Transportasi / Bus": "Bus 1", "Kamar / Villa": "Kamar Melati 1", "Status": "CONFIRMED" },
            { "ID / NIK": "nik-003", "Nama Lengkap": "Dedi Kurniawan", "Departemen / Divisi": "Procurement", "No. WhatsApp": "081234567892", "Gender": "L", "Transportasi / Bus": "Bus 1", "Kamar / Villa": "Kamar Pinus 2", "Status": "CONFIRMED" },
            { "ID / NIK": "nik-004", "Nama Lengkap": "Hendra Saputra", "Departemen / Divisi": "General Affairs", "No. WhatsApp": "081234567893", "Gender": "L", "Transportasi / Bus": "Bus 2", "Kamar / Villa": "Kamar Pinus 3", "Status": "CONFIRMED" }
        ],
        transformExport: (items) => {
            return items.map((item, idx) => ({
                "No.": idx + 1,
                "ID / NIK": item.username || item.id || '-',
                "Nama Lengkap": item.full_name || item.name || '-',
                "Departemen": item.department || '-',
                "No. WhatsApp": item.phone || '-',
                "Gender": item.gender || 'L',
                "Transportasi / Bus": item.transport || '-',
                "Kamar / Villa": item.room || '-',
                "Status Kehadiran": item.status || 'CONFIRMED'
            }));
        },
        createItemFromRow: (row) => ({
            id: generateUUID(),
            username: row.username || `nik-${Date.now().toString().slice(-4)}`,
            full_name: row.full_name || 'Peserta Baru',
            name: row.full_name || 'Peserta Baru',
            department: row.department || 'Umum',
            phone: row.phone || '',
            gender: (row.gender || 'L').toUpperCase().startsWith('P') ? 'P' : 'L',
            transport: row.transport || 'Bus 1',
            room: row.room || 'Belum Diatur',
            status: (row.status || 'CONFIRMED').toUpperCase()
        }),
        onAfterSave: () => {
            renderParticipants(STORAGE.get('outing_participants', []));
            loadDashboard();
        }
    }
};

/* =====================================================
   EXPORT MODULE EXCEL (REAL-TIME LOCAL DATA)
===================================================== */
function exportModuleExcel(module) {
    if (module === 'master') {
        exportMasterExcel();
        return;
    }

    const config = EXCEL_MODULE_CONFIG[module];
    if (!config) {
        alert('Modul tidak valid untuk export Excel.');
        return;
    }

    // Always fetch latest data from local storage
    const items = STORAGE.get(config.storageKey, []);
    if (!items || items.length === 0) {
        if (!confirm(`Data ${config.name} saat ini kosong di sistem lokal. Tetap unduh berkas template kosong?`)) {
            return;
        }
    }

    const exportRows = config.transformExport(items);
    const ws = XLSX.utils.json_to_sheet(exportRows);

    // Auto calculate column widths
    if (exportRows.length > 0) {
        const colWidths = [];
        Object.keys(exportRows[0]).forEach((key) => {
            let maxLen = key.length;
            exportRows.forEach(row => {
                const valStr = String(row[key] || '');
                if (valStr.length > maxLen) maxLen = valStr.length;
            });
            colWidths.push({ wch: Math.min(65, Math.max(maxLen + 3, 10)) });
        });
        ws['!cols'] = colWidths;
    }

    const wb = XLSX.utils.book_new();
    const sheetTitle = config.name.replace(/[\/\\?*:[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);

    const todayStr = new Date().toISOString().split('T')[0];
    const filename = `${config.exportFilename}_${todayStr}.xlsx`;
    XLSX.writeFile(wb, filename);

    showToast(`<i class="bi bi-check-circle me-1"></i> Data <strong>${escapeHtml(config.name)}</strong> (${exportRows.length} baris) berhasil diexport ke Excel.`);
}

/* =====================================================
   MASTER COMPREHENSIVE EXCEL EXPORT (ALL MODULES)
===================================================== */
function exportMasterExcel() {
    const wb = XLSX.utils.book_new();
    const todayStr = new Date().toISOString().split('T')[0];

    // Sheet 1: Outing Overview
    const outing = STORAGE.get('outing_current_info', {});
    const overviewData = [
        { "Parameter": "Nama Kegiatan Outing", "Nilai": outing.name || 'Annual Outing' },
        { "Parameter": "Tanggal Pelaksanaan", "Nilai": `${outing.start_date || '-'} s/d ${outing.end_date || '-'}` },
        { "Parameter": "Lokasi Utama / Venue", "Nilai": outing.location || '-' },
        { "Parameter": "Alamat Lengkap", "Nilai": outing.address || '-' },
        { "Parameter": "Tema / Deskripsi", "Nilai": outing.description || '-' },
        { "Parameter": "Status Acara", "Nilai": outing.status || 'ACTIVE' },
        { "Parameter": "Waktu Ekspor Master", "Nilai": new Date().toLocaleString('id-ID') }
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    wsOverview['!cols'] = [{ wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsOverview, "Info Acara");

    // All Module Sheets
    const modules = ['rundown', 'finance', 'purchasing', 'logistic', 'konsumsi', 'public_area', 'participants'];
    modules.forEach(modKey => {
        const conf = EXCEL_MODULE_CONFIG[modKey];
        const data = STORAGE.get(conf.storageKey, []);
        const rows = conf.transformExport(data);
        const ws = XLSX.utils.json_to_sheet(rows);

        if (rows.length > 0) {
            const colWidths = [];
            Object.keys(rows[0]).forEach(k => {
                let maxLen = k.length;
                rows.forEach(r => {
                    const val = String(r[k] || '');
                    if (val.length > maxLen) maxLen = val.length;
                });
                colWidths.push({ wch: Math.min(65, Math.max(maxLen + 3, 10)) });
            });
            ws['!cols'] = colWidths;
        }
        const sName = conf.name.replace(/[\/\\?*:[\]]/g, '').slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sName);
    });

    const filename = `Master_Rekap_Outing_${todayStr}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast('<i class="bi bi-file-earmark-spreadsheet-fill me-1"></i> <strong>Master Rekap Excel</strong> (seluruh modul acara) berhasil diunduh.');
}

/* =====================================================
   DOWNLOAD MODULE TEMPLATE
===================================================== */
function downloadModuleTemplate(module) {
    const config = EXCEL_MODULE_CONFIG[module];
    if (!config) return;

    const ws = XLSX.utils.json_to_sheet(config.templateRows);
    ws['!cols'] = config.columns.map(c => ({ wch: c.width || 20 }));
    const wb = XLSX.utils.book_new();
    const sheetTitle = config.name.replace(/[\/\\?*:[\]]/g, '').slice(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    XLSX.writeFile(wb, config.templateFilename);
}

function downloadCurrentModuleTemplate() {
    downloadModuleTemplate(currentImportModule);
}

/* =====================================================
   OPEN UNIVERSAL EXCEL IMPORT MODAL
===================================================== */
function openExcelImport(module) {
    if (!canManage(module)) {
        alert('Akses Ditolak: Anda login sebagai peserta biasa (View Only). Hanya panitia / seksi terkait yang dapat mengimpor data.');
        return;
    }

    const config = EXCEL_MODULE_CONFIG[module];
    if (!config) {
        alert('Modul import tidak dikenali.');
        return;
    }

    currentImportModule = module;

    // Update modal title & texts
    const titleEl = document.getElementById('universalImportTitle');
    const subtitleEl = document.getElementById('universalImportSubtitle');
    const guideColumnsEl = document.getElementById('universalImportGuideColumns');
    const replaceLabelEl = document.getElementById('universalModeReplaceLabel');

    if (titleEl) {
        titleEl.innerHTML = `<i class="bi ${config.icon} text-success me-2"></i>Import ${escapeHtml(config.name)} dari Excel`;
    }
    if (subtitleEl) {
        subtitleEl.textContent = `Unggah berkas .xlsx, .xls, atau .csv untuk memperbarui data ${config.name.toLowerCase()}`;
    }
    if (guideColumnsEl) {
        const badges = config.columns.map(c => {
            const req = c.required ? '<span class="text-danger">*</span>' : '';
            return `<span class="badge bg-light text-dark border me-1 mb-1"><code>${escapeHtml(c.label)}</code>${req}</span>`;
        }).join('');
        guideColumnsEl.innerHTML = badges;
    }
    if (replaceLabelEl) {
        replaceLabelEl.innerHTML = `<strong>Gantikan Seluruh Data ${escapeHtml(config.name)}</strong> (Data lama diganti dengan data baru dari file Excel ini)`;
    }

    // Build Table Header
    const theadEl = document.getElementById('universalImportTableHead');
    if (theadEl) {
        let thHtml = '<tr><th style="width: 40px;" class="text-center">#</th>';
        config.columns.forEach(col => {
            const req = col.required ? ' <span class="text-danger">*</span>' : '';
            thHtml += `<th style="min-width: ${Math.max(col.width * 7, 110)}px;">${escapeHtml(col.label)}${req}</th>`;
        });
        thHtml += '<th style="width: 50px;" class="text-center">Aksi</th></tr>';
        theadEl.innerHTML = thHtml;
    }

    // Reset modal state
    const fileInput = document.getElementById('universalExcelInput');
    if (fileInput) fileInput.value = '';
    const tbodyEl = document.getElementById('universalImportTableBody');
    if (tbodyEl) tbodyEl.innerHTML = '';
    const previewSection = document.getElementById('universalImportPreviewSection');
    if (previewSection) previewSection.classList.add('d-none');
    const saveBtn = document.getElementById('btnSaveUniversalImport');
    if (saveBtn) saveBtn.disabled = true;
    const alertMsg = document.getElementById('universalImportAlertMsg');
    if (alertMsg) alertMsg.innerHTML = '';
    const modeReplace = document.getElementById('universalModeReplace');
    if (modeReplace) modeReplace.checked = true;

    // Show modal
    const modalEl = document.getElementById('modalUniversalImportExcel') || document.getElementById('modalImportRundown');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}

/* =====================================================
   HANDLE EXCEL FILE UPLOAD & PARSE
===================================================== */
function handleUniversalExcelUpload(event) {
    if (!canManage(currentImportModule)) {
        alert('Hanya panitia/admin yang berhak mengimpor data.');
        return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const alertMsg = document.getElementById('universalImportAlertMsg');
    alertMsg.innerHTML = '<div class="alert alert-info py-2 small"><span class="spinner-border spinner-border-sm me-1"></span> Membaca dan memproses berkas Excel...</div>';

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                throw new Error('Tidak ada sheet yang ditemukan pada berkas Excel.');
            }

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            if (!jsonData || jsonData.length === 0) {
                throw new Error('Berkas Excel kosong atau tidak memiliki baris data.');
            }

            const config = EXCEL_MODULE_CONFIG[currentImportModule];
            const parsedRows = [];

            jsonData.forEach(row => {
                const parsedRow = {};
                config.columns.forEach(col => {
                    let matchedVal = '';
                    const colKeys = Object.keys(row);

                    // 1. Direct match
                    if (row[col.key] !== undefined && row[col.key] !== '') {
                        matchedVal = row[col.key];
                    } else if (row[col.label] !== undefined && row[col.label] !== '') {
                        matchedVal = row[col.label];
                    } else {
                        // 2. Synonyms match
                        for (let k of colKeys) {
                            const cleanK = k.trim().toLowerCase();
                            const isMatch = col.synonyms && col.synonyms.some(syn => cleanK.includes(syn));
                            if (isMatch) {
                                matchedVal = row[k];
                                break;
                            }
                        }
                    }

                    // Format values appropriately
                    if (col.type === 'date') {
                        parsedRow[col.key] = formatExcelDate(matchedVal);
                    } else if (col.type === 'number') {
                        parsedRow[col.key] = formatExcelNumber(matchedVal, 0);
                    } else {
                        parsedRow[col.key] = matchedVal !== undefined && matchedVal !== null ? String(matchedVal).trim() : '';
                    }
                });

                // Validate if row has at least one required or non-empty key
                const hasData = config.columns.some(c => parsedRow[c.key] !== '' && parsedRow[c.key] !== 0);
                if (hasData) {
                    parsedRows.push(parsedRow);
                }
            });

            if (parsedRows.length === 0) {
                throw new Error(`Tidak dapat menemukan data ${config.name} pada berkas Excel. Pastikan nama kolom sesuai format template.`);
            }

            alertMsg.innerHTML = '';
            renderUniversalImportPreview(parsedRows);

        } catch (err) {
            console.error('handleUniversalExcelUpload error:', err);
            alertMsg.innerHTML = `<div class="alert alert-danger py-2 small"><i class="bi bi-exclamation-triangle me-1"></i> Gagal membaca file: ${escapeHtml(err.message)}</div>`;
            document.getElementById('btnSaveUniversalImport').disabled = true;
        }
    };

    reader.readAsArrayBuffer(file);
}

/* =====================================================
   RENDER IMPORT PREVIEW TABLE
===================================================== */
function renderUniversalImportPreview(rows) {
    const config = EXCEL_MODULE_CONFIG[currentImportModule];
    const tbody = document.getElementById('universalImportTableBody');
    tbody.innerHTML = '';

    rows.forEach((row, idx) => {
        const tr = document.createElement('tr');
        let html = `<td class="text-center text-muted fw-semibold">${idx + 1}</td>`;

        config.columns.forEach(col => {
            const val = row[col.key] !== undefined ? row[col.key] : '';
            if (col.type === 'select') {
                const opts = col.options.map(opt => {
                    const selected = String(val).toUpperCase().includes(opt.val) ? 'selected' : '';
                    return `<option value="${escapeHtml(opt.val)}" ${selected}>${escapeHtml(opt.label)}</option>`;
                }).join('');
                html += `<td><select class="form-select form-select-sm import-field" data-key="${col.key}">${opts}</select></td>`;
            } else if (col.type === 'number') {
                html += `<td><input type="number" class="form-control form-control-sm import-field" data-key="${col.key}" value="${escapeHtml(val)}" placeholder="${escapeHtml(col.placeholder || '0')}"></td>`;
            } else if (col.type === 'date') {
                html += `<td><input type="date" class="form-control form-control-sm import-field" data-key="${col.key}" value="${escapeHtml(val)}"></td>`;
            } else {
                html += `<td><input type="text" class="form-control form-control-sm import-field" data-key="${col.key}" value="${escapeHtml(val)}" placeholder="${escapeHtml(col.placeholder || '')}"></td>`;
            }
        });

        html += `
            <td class="text-center">
                <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" title="Hapus baris" onclick="this.closest('tr').remove(); updateUniversalImportRowCount();">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });

    document.getElementById('universalImportPreviewSection').classList.remove('d-none');
    document.getElementById('btnSaveUniversalImport').disabled = false;
    updateUniversalImportRowCount();
}

/* =====================================================
   ADD MANUAL ROW & UPDATE COUNT
===================================================== */
function addManualUniversalImportRow() {
    const config = EXCEL_MODULE_CONFIG[currentImportModule];
    const tbody = document.getElementById('universalImportTableBody');
    const tr = document.createElement('tr');
    const nextIdx = tbody.children.length + 1;

    let html = `<td class="text-center text-muted fw-semibold">${nextIdx}</td>`;
    config.columns.forEach(col => {
        if (col.type === 'select') {
            const opts = col.options.map(opt => `<option value="${escapeHtml(opt.val)}">${escapeHtml(opt.label)}</option>`).join('');
            html += `<td><select class="form-select form-select-sm import-field" data-key="${col.key}">${opts}</select></td>`;
        } else if (col.type === 'number') {
            html += `<td><input type="number" class="form-control form-control-sm import-field" data-key="${col.key}" placeholder="${escapeHtml(col.placeholder || '0')}"></td>`;
        } else if (col.type === 'date') {
            const today = new Date().toISOString().split('T')[0];
            html += `<td><input type="date" class="form-control form-control-sm import-field" data-key="${col.key}" value="${today}"></td>`;
        } else {
            html += `<td><input type="text" class="form-control form-control-sm import-field" data-key="${col.key}" placeholder="${escapeHtml(col.placeholder || '')}"></td>`;
        }
    });

    html += `
        <td class="text-center">
            <button type="button" class="btn btn-sm btn-outline-danger py-0 px-2" onclick="this.closest('tr').remove(); updateUniversalImportRowCount();">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    tr.innerHTML = html;
    tbody.appendChild(tr);
    updateUniversalImportRowCount();
}

function updateUniversalImportRowCount() {
    const rows = document.querySelectorAll('#universalImportTableBody tr');
    const label = document.getElementById('universalImportRowCountLabel');
    if (label) {
        label.textContent = `${rows.length} baris data siap disimpan`;
    }
    const saveBtn = document.getElementById('btnSaveUniversalImport');
    if (saveBtn) {
        saveBtn.disabled = (rows.length === 0);
    }
    // Update numbering
    rows.forEach((r, i) => {
        const firstTd = r.querySelector('td');
        if (firstTd) firstTd.textContent = i + 1;
    });
}

/* =====================================================
   SAVE UNIVERSAL IMPORT TO LOCAL STORAGE & SUPABASE
===================================================== */
function saveUniversalImport() {
    if (!canManage(currentImportModule)) {
        alert('Hanya panitia/admin yang dapat menyimpan perubahan data.');
        return;
    }

    const config = EXCEL_MODULE_CONFIG[currentImportModule];
    const trList = document.querySelectorAll('#universalImportTableBody tr');
    if (trList.length === 0) {
        alert('Tidak ada baris data untuk disimpan.');
        return;
    }

    const newItems = [];
    trList.forEach((tr, idx) => {
        const rowObj = {};
        const inputs = tr.querySelectorAll('.import-field');
        inputs.forEach(inp => {
            const key = inp.getAttribute('data-key');
            rowObj[key] = inp.value.trim();
        });

        const createdItem = config.createItemFromRow(rowObj, idx);
        newItems.push(createdItem);
    });

    const isReplace = document.getElementById('universalModeReplace')?.checked;
    let currentItems = STORAGE.get(config.storageKey, []);

    let finalItems = [];
    if (isReplace) {
        finalItems = newItems;
    } else {
        finalItems = currentItems.concat(newItems);
        if (config.defaultSortField === 'order_index') {
            finalItems.forEach((item, i) => item.order_index = i + 1);
        }
    }

    // 1. Save to Local Storage immediately
    STORAGE.set(config.storageKey, finalItems);

    // 2. Sync to Supabase in background
    try {
        if (isReplace) {
            supabaseClient.from(config.supabaseTable).delete().neq('id', '00000000-0000-0000-0000-000000000000').then(() => {
                supabaseClient.from(config.supabaseTable).insert(finalItems).then(() => {});
            });
        } else {
            supabaseClient.from(config.supabaseTable).insert(newItems).then(() => {});
        }
    } catch (dbErr) {
        console.warn('Supabase sync note:', dbErr);
    }

    // 3. Trigger module onAfterSave callback
    if (config.onAfterSave) {
        config.onAfterSave();
    }

    // 4. Close modal
    const modalEl = document.getElementById('modalUniversalImportExcel') || document.getElementById('modalImportRundown');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    // 5. User feedback
    showToast(`<i class="bi bi-check2-circle me-1"></i> Sukses! <strong>${newItems.length} baris</strong> data ${escapeHtml(config.name)} berhasil disimpan ke sistem lokal & disinkronkan.`);
}

/* =====================================================
   BACKWARD-COMPATIBLE WRAPPERS (FOR RUNDOWN & LEGACY CALLS)
===================================================== */
function openImportRundownModal() {
    openExcelImport('rundown');
}

function downloadRundownTemplate() {
    downloadModuleTemplate('rundown');
}

function handleExcelRundownUpload(event) {
    currentImportModule = 'rundown';
    handleUniversalExcelUpload(event);
}

function renderImportPreview(rows) {
    renderUniversalImportPreview(rows);
}

function addManualImportRow() {
    addManualUniversalImportRow();
}

function updateImportRowCount() {
    updateUniversalImportRowCount();
}

function saveImportedRundown() {
    currentImportModule = 'rundown';
    saveUniversalImport();
}
