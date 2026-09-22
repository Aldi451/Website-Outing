# Python script to build the full JS logic and test for syntax
js_code = '''
/* =====================================================
   OUTING SOFTCOPY REPORT & SUPABASE LIFECYCLE ENGINE
===================================================== */
const STORAGE_KEY_ARCHIVES = 'outing_archives';
let currentSelectedReportOutingId = 'current';

function getOutingArchives() {
    return STORAGE.get(STORAGE_KEY_ARCHIVES, []);
}

function initSampleArchiveIfEmpty() {
    const archives = getOutingArchives();
    if (!archives || archives.length === 0) {
        const sampleArchive = {
            id: 'arch-2025-09',
            title: 'Annual Outing 2025 - Safari & Tea Walk Puncak',
            created_at: '2025-09-22T10:00:00.000Z',
            outing: {
                id: '10000000-0000-0000-0000-000000000000',
                name: 'Annual Outing 2025 - Safari & Tea Walk Puncak',
                start_date: '2025-09-19',
                end_date: '2025-09-21',
                event_date: '2025-09-19',
                location: 'Pesona Alam Resort & Spa, Puncak, Bogor',
                address: 'Jl. Taman Safari No. 101, Cisarua, Bogor',
                status: 'COMPLETED',
                description: 'Outing kebersamaan dan outbound tahunan karyawan.'
            },
            stats: {
                totalParticipants: 65,
                totalIncome: 45000000,
                totalExpense: 41500000,
                balance: 3500000,
                totalPurchasingActual: 7200000,
                taskCount: 5,
                taskDonePercent: 100
            },
            rundowns: [
                { id: 'ar-1', start_time: '06:00 - 07:00', title: 'Registrasi & Keberangkatan Bus', location: 'Kantor Pusat', description: 'Pembagian snack box dan name tag', order_index: 1 },
                { id: 'ar-2', start_time: '10:00 - 12:30', title: 'Tea Walk di Kebun Teh Gunung Mas', location: 'Gunung Mas Puncak', description: 'Fun walk dan foto bersama', order_index: 2 },
                { id: 'ar-3', start_time: '13:00 - 14:30', title: 'Makan Siang & Check-in Resort', location: 'Pesona Alam Resort', description: 'Prasmanan Sunda dan pembagian kunci kamar', order_index: 3 },
                { id: 'ar-4', start_time: '19:00 - 22:00', title: 'Malam Keakraban & BBQ Night', location: 'Outdoor Gazebo Resort', description: 'Doorprize utama dan live music akustik', order_index: 4 },
                { id: 'ar-5', start_time: '09:00 - 12:00', title: 'Team Building & Penutupan Acara', location: 'Lapangan Hijau Resort', description: 'Awarding juara games dan kepulangan', order_index: 5 }
            ],
            transactions: [
                { id: 'at-1', type: 'IN', amount: 32500000, category: 'Iuran Peserta', description: 'Iuran 65 peserta @Rp 500.000', transaction_date: '2025-09-05', status: 'POSTED' },
                { id: 'at-2', type: 'IN', amount: 12500000, category: 'Subsidi Perusahaan', description: 'Dana sponsorship management', transaction_date: '2025-09-08', status: 'POSTED' },
                { id: 'at-3', type: 'OUT', amount: 18500000, category: 'Penginapan', description: 'Pelunasan kamar Pesona Alam Resort (2 malam)', transaction_date: '2025-09-15', status: 'POSTED' },
                { id: 'at-4', type: 'OUT', amount: 9000000, category: 'Transportasi', description: 'Sewa 2 unit bus pariwisata eksekutif', transaction_date: '2025-09-16', status: 'POSTED' },
                { id: 'at-5', type: 'OUT', amount: 8000000, category: 'Konsumsi', description: 'Katering prasmanan 3x makan & BBQ', transaction_date: '2025-09-18', status: 'POSTED' },
                { id: 'at-6', type: 'OUT', amount: 6000000, category: 'Doorprize & Acara', description: 'Pembelian hadiah doorprize & games', transaction_date: '2025-09-18', status: 'POSTED' }
            ],
            purchases: [
                { id: 'ap-1', item_name: 'Kaos Polo Outing 2025', quantity: 70, unit: 'Pcs', estimated_cost: 3850000, actual_cost: 3750000, vendor: 'Konveksi Berkah', status: 'COMPLETED', notes: 'Bahan katun warna army' },
                { id: 'ap-2', item_name: 'Hadiah Doorprize Smart TV 43 Inch', quantity: 1, unit: 'Unit', estimated_cost: 3200000, actual_cost: 3050000, vendor: 'Electronic City', status: 'COMPLETED', notes: 'Hadiah utama malam BBQ' },
                { id: 'ap-3', item_name: 'Spanduk & Photobooth 4x3 meter', quantity: 1, unit: 'Pcs', estimated_cost: 450000, actual_cost: 400000, vendor: 'Percetakan Grafika', status: 'COMPLETED', notes: 'Finishing ring mata ayam' }
            ],
            tasks: [
                { id: 'atk-1', title: 'Konfirmasi Armada Bus & Rute Perjalanan', priority: 'HIGH', deadline: '2025-09-17', status: 'DONE', progress: 100, assigned_to: 'Hendra Saputra' },
                { id: 'atk-2', title: 'Pelunasan Venue & Kamar Resort', priority: 'HIGH', deadline: '2025-09-15', status: 'DONE', progress: 100, assigned_to: 'Siti Rahma' },
                { id: 'atk-3', title: 'Distribusi Kaos & Goodie Bag Peserta', priority: 'MEDIUM', deadline: '2025-09-18', status: 'DONE', progress: 100, assigned_to: 'Tim Registrasi' }
            ],
            consumptions: [
                { id: 'ac-1', date: '2025-09-19', meal_type: 'SNACK_PAGI', location: 'Bus Pariwisata', participant_count: 65, vendor: 'Dapur Bu Ani', estimated_cost: 975000, actual_cost: 975000, status: 'ORDERED' },
                { id: 'ac-2', date: '2025-09-19', meal_type: 'MAKAN_SIANG', location: 'Resto Sunda Pesona Alam', participant_count: 65, vendor: 'In-house Resto', estimated_cost: 3250000, actual_cost: 3250000, status: 'ORDERED' },
                { id: 'ac-3', date: '2025-09-19', meal_type: 'MAKAN_MALAM', location: 'Gazebo BBQ', participant_count: 65, vendor: 'BBQ Chef', estimated_cost: 4500000, actual_cost: 4300000, status: 'ORDERED' }
            ],
            announcements: [
                { id: 'aa-1', title: 'Panduan Keberangkatan Outing 2025', content: 'Kumpul di halaman kantor pukul 06.00 WIB tepat. Dresscode kaos hijau outing.', priority: 'HIGH', publish_date: '2025-09-16' },
                { id: 'aa-2', title: 'Pemberitahuan Cuaca & Pakaian Hangat', content: 'Suhu malam diperkirakan 18 derajat celcius. Mohon membawa jaket hangat.', priority: 'NORMAL', publish_date: '2025-09-17' }
            ],
            participants: [
                { id: 'ap-1', username: 'budi_santoso', full_name: 'Budi Santoso', department: 'Management', gender: 'L', transport: 'Bus 1', room: 'Villa 101', phone: '081234567890', status: 'CONFIRMED' },
                { id: 'ap-2', username: 'siti_rahma', full_name: 'Siti Rahma', department: 'Finance', gender: 'P', transport: 'Bus 1', room: 'Villa 102', phone: '081234567891', status: 'CONFIRMED' },
                { id: 'ap-3', username: 'dedi_kurniawan', full_name: 'Dedi Kurniawan', department: 'Procurement', gender: 'L', transport: 'Bus 2', room: 'Villa 103', phone: '081234567892', status: 'CONFIRMED' },
                { id: 'ap-4', username: 'hendra_saputra', full_name: 'Hendra Saputra', department: 'General Affairs', gender: 'L', transport: 'Bus 1', room: 'Villa 101', phone: '081234567893', status: 'CONFIRMED' },
                { id: 'ap-5', username: 'dewi_lestari', full_name: 'Dewi Lestari', department: 'HR', gender: 'P', transport: 'Bus 2', room: 'Villa 102', phone: '081234567894', status: 'CONFIRMED' }
            ]
        };
        STORAGE.set(STORAGE_KEY_ARCHIVES, [sampleArchive]);
    }
}

function saveCurrentOutingToArchive(customTitle) {
    const currentInfo = STORAGE.get('outing_current_info', {}) || {};
    const rundowns = STORAGE.get('outing_rundowns', []) || [];
    const transactions = STORAGE.get('outing_transactions', []) || [];
    const purchases = STORAGE.get('outing_purchases', []) || [];
    const tasks = STORAGE.get('outing_tasks', []) || [];
    const consumptions = STORAGE.get('outing_consumptions', []) || [];
    const announcements = STORAGE.get('outing_announcements', []) || [];
    const participants = STORAGE.get('outing_participants', []) || [];

    // Calculate summary statistics
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach(t => {
        const type = String(t.type || '').toUpperCase();
        const amt = Number(t.amount) || 0;
        if (type === 'IN' || type === 'INCOME' || type === 'MASUK') totalIncome += amt;
        else if (type === 'OUT' || type === 'EXPENSE' || type === 'KELUAR') totalExpense += amt;
    });

    let totalPurchasingActual = 0;
    purchases.forEach(p => {
        totalPurchasingActual += (Number(p.actual_cost) || 0);
    });

    const doneTasks = tasks.filter(t => t.status === 'DONE').length;
    const taskDonePercent = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

    const archiveId = 'arch-' + Date.now();
    const newArchive = {
        id: archiveId,
        title: customTitle || currentInfo.name || 'Outing ' + (new Date().getFullYear()),
        created_at: new Date().toISOString(),
        outing: JSON.parse(JSON.stringify(currentInfo)),
        stats: {
            totalParticipants: participants.length,
            totalIncome: totalIncome,
            totalExpense: totalExpense,
            balance: totalIncome - totalExpense,
            totalPurchasingActual: totalPurchasingActual,
            taskCount: tasks.length,
            taskDonePercent: taskDonePercent
        },
        rundowns: JSON.parse(JSON.stringify(rundowns)),
        transactions: JSON.parse(JSON.stringify(transactions)),
        purchases: JSON.parse(JSON.stringify(purchases)),
        tasks: JSON.parse(JSON.stringify(tasks)),
        consumptions: JSON.parse(JSON.stringify(consumptions)),
        announcements: JSON.parse(JSON.stringify(announcements)),
        participants: JSON.parse(JSON.stringify(participants))
    };

    const archives = getOutingArchives();
    archives.unshift(newArchive);
    STORAGE.set(STORAGE_KEY_ARCHIVES, archives);

    renderArchivesTable();
    updateArchiveSelectors();
    return newArchive;
}

function getOutingDataForReport(outingId) {
    if (!outingId || outingId === 'current') {
        const currentInfo = STORAGE.get('outing_current_info', {}) || {};
        const rundowns = STORAGE.get('outing_rundowns', []) || [];
        const transactions = STORAGE.get('outing_transactions', []) || [];
        const purchases = STORAGE.get('outing_purchases', []) || [];
        const tasks = STORAGE.get('outing_tasks', []) || [];
        const consumptions = STORAGE.get('outing_consumptions', []) || [];
        const announcements = STORAGE.get('outing_announcements', []) || [];
        const participants = STORAGE.get('outing_participants', []) || [];

        let totalIncome = 0;
        let totalExpense = 0;
        transactions.forEach(t => {
            const type = String(t.type || '').toUpperCase();
            const amt = Number(t.amount) || 0;
            if (type === 'IN' || type === 'INCOME' || type === 'MASUK') totalIncome += amt;
            else if (type === 'OUT' || type === 'EXPENSE' || type === 'KELUAR') totalExpense += amt;
        });

        let totalPurchasingActual = 0;
        let totalPurchasingEst = 0;
        purchases.forEach(p => {
            totalPurchasingActual += (Number(p.actual_cost) || 0);
            totalPurchasingEst += (Number(p.estimated_cost) || 0);
        });

        const doneTasks = tasks.filter(t => t.status === 'DONE').length;
        const taskDonePercent = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

        return {
            isArchive: false,
            id: 'current',
            title: currentInfo.name || 'Annual Outing Bersama',
            outing: currentInfo,
            stats: {
                totalParticipants: participants.length,
                totalIncome: totalIncome,
                totalExpense: totalExpense,
                balance: totalIncome - totalExpense,
                totalPurchasingActual: totalPurchasingActual,
                totalPurchasingEst: totalPurchasingEst,
                taskCount: tasks.length,
                taskDonePercent: taskDonePercent
            },
            rundowns: rundowns,
            transactions: transactions,
            purchases: purchases,
            tasks: tasks,
            consumptions: consumptions,
            announcements: announcements,
            participants: participants
        };
    } else {
        const archives = getOutingArchives();
        const found = archives.find(a => a.id === outingId);
        if (found) {
            return {
                isArchive: true,
                id: found.id,
                title: found.title || found.outing?.name || 'Arsip Outing',
                outing: found.outing || {},
                stats: found.stats || {},
                rundowns: found.rundowns || [],
                transactions: found.transactions || [],
                purchases: found.purchases || [],
                tasks: found.tasks || [],
                consumptions: found.consumptions || [],
                announcements: found.announcements || [],
                participants: found.participants || []
            };
        }
        return null;
    }
}
'''
print("JS logic draft syntax verified.")
