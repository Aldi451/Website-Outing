
/* =====================================================
   SUPABASE CLIENT CONFIGURATION
===================================================== */
const SUPABASE_URL = "https://ncylyddceptiukzzanlm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jeWx5ZGRjZXB0aXVrenphbmxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2OTk4MDEsImV4cCI6MjEwNTI3NTgwMX0.qO3JYJ5wM8StlptYr0nforp0GaRoQHDLRuCi6aXPyzw";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* =====================================================
   GLOBAL APPLICATION STATE
===================================================== */
let currentUser = null;
let currentProfile = null;
let currentOuting = null;
let activePurchasingFilter = 'ALL';
let activeTaskFilter = 'ALL';

/* =====================================================
   LOCAL DATA STORAGE & SEEDING (HYBRID ENGINE)
===================================================== */
const STORAGE = {
    get: (key, defaultValue) => {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            return defaultValue;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn('LocalStorage write error:', e);
        }
    }
};

// ARCHIVE CORE STORAGE HELPERS
const STORAGE_KEY_ARCHIVES = 'outing_archives';

function getOutingArchives() {
    return STORAGE.get(STORAGE_KEY_ARCHIVES, []);
}

function initSampleArchiveIfEmpty() {
    const archives = getOutingArchives();
    if (!archives || archives.length === 0) {
        const sampleArchive = {
            id: 'arch-2025-puncak',
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
                description: 'Outing kebersamaan dan outbound tahunan seluruh divisi karyawan.'
            },
            stats: {
                totalParticipants: 65,
                totalIncome: 45000000,
                totalExpense: 41500000,
                balance: 3500000,
                totalPurchasingActual: 7200000,
                totalPurchasingEst: 7500000,
                taskCount: 5,
                taskDonePercent: 100
            },
            rundowns: [
                { id: 'ar-1', start_time: '06:00 - 07:00', title: 'Registrasi & Keberangkatan Bus', location: 'Kantor Pusat', description: 'Briefing, pembagian snack box, kaos dan name tag', order_index: 1 },
                { id: 'ar-2', start_time: '10:00 - 12:30', title: 'Tea Walk di Kebun Teh Gunung Mas', location: 'Gunung Mas Puncak', description: 'Fun walk menyusuri kebun teh dan sesi foto bersama', order_index: 2 },
                { id: 'ar-3', start_time: '13:00 - 14:30', title: 'Makan Siang & Check-in Resort', location: 'Pesona Alam Resort', description: 'Makan siang prasmanan Sunda dan pembagian kunci kamar', order_index: 3 },
                { id: 'ar-4', start_time: '19:00 - 22:00', title: 'Malam Keakraban & BBQ Night', location: 'Outdoor Gazebo Resort', description: 'Pengundian doorprize utama Smart TV dan hiburan akustik', order_index: 4 },
                { id: 'ar-5', start_time: '09:00 - 12:00', title: 'Team Building & Penutupan Acara', location: 'Lapangan Hijau Resort', description: 'Fun games antar divisi, awarding pemenang, dan persiapan pulang', order_index: 5 }
            ],
            transactions: [
                { id: 'at-1', type: 'IN', amount: 32500000, category: 'Iuran Peserta', description: 'Iuran 65 peserta @Rp 500.000', transaction_date: '2025-09-05', status: 'POSTED' },
                { id: 'at-2', type: 'IN', amount: 12500000, category: 'Subsidi Perusahaan', description: 'Sponsorship dan dana operasional manajemen', transaction_date: '2025-09-08', status: 'POSTED' },
                { id: 'at-3', type: 'OUT', amount: 18500000, category: 'Penginapan', description: 'Pelunasan sewa kamar Pesona Alam Resort (2 malam)', transaction_date: '2025-09-15', status: 'POSTED' },
                { id: 'at-4', type: 'OUT', amount: 9000000, category: 'Transportasi', description: 'Sewa 2 unit bus pariwisata eksekutif 50 seaters', transaction_date: '2025-09-16', status: 'POSTED' },
                { id: 'at-5', type: 'OUT', amount: 8000000, category: 'Konsumsi', description: 'Katering prasmanan 3x makan & BBQ paket lengkap', transaction_date: '2025-09-18', status: 'POSTED' },
                { id: 'at-6', type: 'OUT', amount: 6000000, category: 'Doorprize & Acara', description: 'Pembelian hadiah doorprize utama & perlengkapan games', transaction_date: '2025-09-18', status: 'POSTED' }
            ],
            purchases: [
                { id: 'ap-1', item_name: 'Kaos Polo Outing 2025', quantity: 70, unit: 'Pcs', estimated_cost: 3850000, actual_cost: 3750000, vendor: 'Konveksi Berkah', status: 'COMPLETED', notes: 'Bahan katun warna army dengan bordir logo' },
                { id: 'ap-2', item_name: 'Hadiah Doorprize Smart TV 43 Inch', quantity: 1, unit: 'Unit', estimated_cost: 3200000, actual_cost: 3050000, vendor: 'Electronic City', status: 'COMPLETED', notes: 'Hadiah utama grand prize malam BBQ' },
                { id: 'ap-3', item_name: 'Spanduk & Photobooth 4x3 meter', quantity: 1, unit: 'Pcs', estimated_cost: 450000, actual_cost: 400000, vendor: 'Percetakan Grafika', status: 'COMPLETED', notes: 'Bahan flexi korea finishing ring mata ayam' }
            ],
            tasks: [
                { id: 'atk-1', title: 'Konfirmasi Armada Bus & Rute Perjalanan', priority: 'HIGH', deadline: '2025-09-17', status: 'DONE', progress: 100, assigned_to: 'Hendra Saputra' },
                { id: 'atk-2', title: 'Pelunasan Venue & Kamar Resort', priority: 'HIGH', deadline: '2025-09-15', status: 'DONE', progress: 100, assigned_to: 'Siti Rahma' },
                { id: 'atk-3', title: 'Distribusi Kaos & Goodie Bag Peserta', priority: 'MEDIUM', deadline: '2025-09-18', status: 'DONE', progress: 100, assigned_to: 'Tim Registrasi' },
                { id: 'atk-4', title: 'Persiapan Doorprize & Hadiah Fun Games', priority: 'HIGH', deadline: '2025-09-18', status: 'DONE', progress: 100, assigned_to: 'Tim Acara' },
                { id: 'atk-5', title: 'Briefing Koordinator Bus & Rundown Acara', priority: 'MEDIUM', deadline: '2025-09-18', status: 'DONE', progress: 100, assigned_to: 'Budi Santoso' }
            ],
            consumptions: [
                { id: 'ac-1', date: '2025-09-19', meal_type: 'SNACK_PAGI', location: 'Di dalam Bus Pariwisata', participant_count: 65, vendor: 'Dapur Snack Bu Ani', estimated_cost: 975000, actual_cost: 975000, status: 'ORDERED' },
                { id: 'ac-2', date: '2025-09-19', meal_type: 'MAKAN_SIANG', location: 'Resto Sunda Pesona Alam', participant_count: 65, vendor: 'In-house Resto', estimated_cost: 3250000, actual_cost: 3250000, status: 'ORDERED' },
                { id: 'ac-3', date: '2025-09-19', meal_type: 'MAKAN_MALAM', location: 'Gazebo BBQ Area', participant_count: 65, vendor: 'BBQ Chef Puncak', estimated_cost: 4500000, actual_cost: 4300000, status: 'ORDERED' }
            ],
            announcements: [
                { id: 'aa-1', title: 'Panduan Keberangkatan Outing 2025', content: 'Kumpul di halaman kantor pukul 06.00 WIB tepat. Dresscode kaos hijau army outing.', priority: 'HIGH', publish_date: '2025-09-16' },
                { id: 'aa-2', title: 'Pemberitahuan Cuaca & Pakaian Hangat', content: 'Suhu malam diperkirakan 18 derajat celcius. Mohon peserta membawa jaket tebal.', priority: 'NORMAL', publish_date: '2025-09-17' }
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

// INITIAL SEED DATA
function initSeedDataIfEmpty() {
    initSampleArchiveIfEmpty();
    // 1. Initial Outing Information
    if (!STORAGE.get('outing_current_info', null)) {
        STORAGE.set('outing_current_info', {
            id: '10000000-0000-0000-0000-000000000001',
            name: 'Annual Outing 2026 - Puncak Highlands',
            start_date: '2026-10-15',
            end_date: '2026-10-17',
            event_date: '2026-10-15',
            location: 'Villa Grand Coolibah, Puncak, Bogor',
            address: 'Jl. Raya Puncak KM 84, Tugu Selatan, Cisarua, Bogor',
            description: 'Kebersamaan untuk Mempererat Silaturahmi & Kolaborasi Tim',
            status: 'ACTIVE'
        });
    }

    // 2. Demo Users (Pre-seeded so all 7 roles can be tested immediately)
    const existingUsers = STORAGE.get('outing_local_users', []);
    if (!existingUsers || existingUsers.length === 0) {
        const demoUsers = [
            { id: 'u-1', username: 'admin', full_name: 'Budi Santoso (Admin)', name: 'Budi Santoso', phone: '081234567890', password: 'admin123', role: 'ADMIN', section: 'INISIATOR', department: 'Management' },
            { id: 'u-2', username: 'keuangan', full_name: 'Siti Rahma (Finance)', name: 'Siti Rahma', phone: '081234567891', password: 'finance123', role: 'FINANCE', section: 'KEUANGAN', department: 'Finance' },
            { id: 'u-3', username: 'purchasing', full_name: 'Dedi Kurniawan (Purchasing)', name: 'Dedi Kurniawan', phone: '081234567892', password: 'purchase123', role: 'PURCHASING', section: 'PURCHASING', department: 'Procurement' },
            { id: 'u-4', username: 'logistic', full_name: 'Hendra Saputra (Logistik)', name: 'Hendra Saputra', phone: '081234567893', password: 'logistik123', role: 'LOGISTIC', section: 'LOGISTIC', department: 'General Affairs' },
            { id: 'u-5', username: 'konsumsi', full_name: 'Dewi Lestari (Konsumsi)', name: 'Dewi Lestari', phone: '081234567894', password: 'makan123', role: 'KONSUMSI', section: 'KONSUMSI', department: 'HR' },
            { id: 'u-6', username: 'public', full_name: 'Rian Pratama (Public Area)', name: 'Rian Pratama', phone: '081234567895', password: 'public123', role: 'PUBLIC_AREA', section: 'PUBLIC_AREA', department: 'Corporate Secretary' },
            { id: 'u-7', username: 'peserta', full_name: 'Ahmad Fauzi (Peserta)', name: 'Ahmad Fauzi', phone: '081234567896', password: 'peserta123', role: 'PARTICIPANT', section: 'PUBLIC', department: 'Engineering' }
        ];
        STORAGE.set('outing_local_users', demoUsers);
    }

    // 3. Rundowns
    if (!STORAGE.get('outing_rundowns', null)) {
        STORAGE.set('outing_rundowns', [
            { id: 'r-1', start_time: '06:30 - 07:30', title: 'Kumpul di Kantor & Registrasi Peserta', location: 'Lobby Gedung Utama', description: 'Briefing dan pembagian snack pagi serta name tag', order_index: 1 },
            { id: 'r-2', start_time: '07:30 - 10:30', title: 'Perjalanan Bus Menuju Puncak Bogor', location: 'Tol Jagorawi - Puncak', description: 'Perjalanan dipimpin oleh bus coordinator', order_index: 2 },
            { id: 'r-3', start_time: '11:00 - 13:00', title: 'Check-in Villa & Istirahat / Sholat / Makan Siang', location: 'Resto Utama Villa', description: 'Pembagian kunci kamar sesuai daftar rooming', order_index: 3 },
            { id: 'r-4', start_time: '14:00 - 17:30', title: 'Team Building & Fun Games Outdoor', location: 'Lapangan Hijau Villa', description: 'Dresscode kaos outing warna biru', order_index: 4 },
            { id: 'r-5', start_time: '19:00 - 22:00', title: 'Gala Dinner, BBQ & Doorprize Night', location: 'Area Kolam Renang Villa', description: 'Penyerahan hadiah utama dan hiburan musik akustik', order_index: 5 },
            { id: 'r-6', start_time: '08:00 - 11:30', title: 'Senam Pagi, Bebas Santai & Check-out', location: 'Villa Puncak', description: 'Foto bersama seluruh peserta sebelum pulang', order_index: 6 }
        ]);
    }

    // 4. Finance Transactions
    if (!STORAGE.get('outing_transactions', null)) {
        STORAGE.set('outing_transactions', [
            { id: 'f-1', type: 'IN', amount: 35000000, category: 'Iuran Peserta', description: 'Total pembayaran iuran 70 peserta @Rp 500.000', transaction_date: '2026-09-10', status: 'POSTED' },
            { id: 'f-2', type: 'IN', amount: 15000000, category: 'Sponsorship', description: 'Sponsorship operasional dari Koperasi Karyawan', transaction_date: '2026-09-12', status: 'POSTED' },
            { id: 'f-3', type: 'OUT', amount: 12000000, category: 'Penginapan', description: 'DP 50% Sewa Villa Grand Coolibah (2 Malam)', transaction_date: '2026-09-13', status: 'POSTED' },
            { id: 'f-4', type: 'OUT', amount: 8500000, category: 'Transportasi', description: 'Sewa 2 Unit Bus Pariwisata 50 Seater (PP)', transaction_date: '2026-09-15', status: 'POSTED' },
            { id: 'f-5', type: 'OUT', amount: 4500000, category: 'Perlengkapan', description: 'Pembuatan Kaos Outing & Name Tag 80 Pcs', transaction_date: '2026-09-16', status: 'POSTED' },
            { id: 'f-6', type: 'OUT', amount: 3000000, category: 'Konsumsi', description: 'DP Katering Makanan Prasmanan & Snack', transaction_date: '2026-09-17', status: 'POSTED' }
        ]);
    }

    // 5. Purchasing Requests
    if (!STORAGE.get('outing_purchases', null)) {
        STORAGE.set('outing_purchases', [
            { id: 'p-1', item_name: 'Kaos Polo Sablon Outing', quantity: 85, unit: 'Pcs', estimated_cost: 4500000, actual_cost: 4250000, vendor: 'Konveksi Berkah', needed_date: '2026-10-05', section: 'LOGISTIC', status: 'COMPLETED', notes: 'Bahan lacoste katun, warna navy' },
            { id: 'p-2', item_name: 'Name Tag & Lanyard Peserta', quantity: 85, unit: 'Pcs', estimated_cost: 850000, actual_cost: 750000, vendor: 'Percetakan Grafika', needed_date: '2026-10-08', section: 'PUBLIC_AREA', status: 'COMPLETED', notes: 'Dilengkapi barcode nomor kamar' },
            { id: 'p-3', item_name: 'Air Mineral 600ml', quantity: 25, unit: 'Dus', estimated_cost: 1250000, actual_cost: 1100000, vendor: 'Agen Grosir Berkah', needed_date: '2026-10-14', section: 'KONSUMSI', status: 'APPROVED', notes: 'Untuk di bus dan area villa' },
            { id: 'p-4', item_name: 'Banner Panggung (3x5 meter)', quantity: 1, unit: 'Pcs', estimated_cost: 350000, actual_cost: 300000, vendor: 'Digital Print Jaya', needed_date: '2026-10-10', section: 'LOGISTIC', status: 'APPROVED', notes: 'Finishing mata ayam tiap sudut' },
            { id: 'p-5', item_name: 'Obat-obatan & Kotak P3K Lengkap', quantity: 2, unit: 'Paket', estimated_cost: 500000, actual_cost: 0, vendor: 'Apotek K-24', needed_date: '2026-10-13', section: 'LOGISTIC', status: 'PENDING', notes: 'Antimo, tolak angin, perban, minyak kayu putih' }
        ]);
    }

    // 6. Logistic Tasks
    if (!STORAGE.get('outing_tasks', null)) {
        STORAGE.set('outing_tasks', [
            { id: 't-1', title: 'Booking & Pelunasan Sewa Bus Pariwisata', priority: 'HIGH', deadline: '2026-10-10', status: 'DONE', progress: 100, assigned_to: 'Hendra Saputra', notes: '2 unit bus White Horse siap' },
            { id: 't-2', title: 'Survey Akhir Layout Panggung & Sound System Villa', priority: 'HIGH', deadline: '2026-10-08', status: 'DONE', progress: 100, assigned_to: 'Tim Logistik', notes: 'Kelistrikan dan genset aman' },
            { id: 't-3', title: 'Pengadaan Perlengkapan Games & Tali Tambang', priority: 'MEDIUM', deadline: '2026-10-12', status: 'IN_PROGRESS', progress: 75, assigned_to: 'Hendra Saputra', notes: 'Tinggal beli peluit dan bendera' },
            { id: 't-4', title: 'Packing Doorprize & Hadiah Utama', priority: 'MEDIUM', deadline: '2026-10-13', status: 'IN_PROGRESS', progress: 50, assigned_to: 'Siti & Hendra', notes: 'Sepeda lipat dan microwave sudah sampai' },
            { id: 't-5', title: 'Finalisasi Daftar Rooming & Kunci Kamar', priority: 'HIGH', deadline: '2026-10-14', status: 'TODO', progress: 20, assigned_to: 'Tim Registrasi', notes: 'Menunggu konfirmasi 2 peserta terakhir' }
        ]);
    }

    // 7. Meal Plans / Konsumsi
    if (!STORAGE.get('outing_consumptions', null)) {
        STORAGE.set('outing_consumptions', [
            { id: 'c-1', date: '2026-10-15', meal_type: 'SNACK_PAGI', location: 'Di dalam Bus Pariwisata', participant_count: 85, vendor: 'Dapur Snack Bu Ani', estimated_cost: 1275000, actual_cost: 1275000, status: 'ORDERED', notes: 'Lemper, risoles, pastel, air mineral cup' },
            { id: 'c-2', date: '2026-10-15', meal_type: 'MAKAN_SIANG', location: 'Resto Utama Villa', participant_count: 85, vendor: 'Katering Sunda Raos', estimated_cost: 3825000, actual_cost: 3825000, status: 'ORDERED', notes: 'Nasi Liwet Komplit, Ayam Bakar, Gurame Goreng, Sayur Asem, Sambal Lalap' },
            { id: 'c-3', date: '2026-10-15', meal_type: 'MAKAN_MALAM', location: 'Taman Kolam Renang Villa', participant_count: 85, vendor: 'BBQ Chef Puncak', estimated_cost: 5100000, actual_cost: 4900000, status: 'PLANNED', notes: 'BBQ Jagung, Sate Sapi, Sosis Panggang, Es Kelapa Muda' },
            { id: 'c-4', date: '2026-10-16', meal_type: 'SARAPAN', location: 'Balkon Dining Hall Villa', participant_count: 85, vendor: 'In-House Villa Chef', estimated_cost: 2550000, actual_cost: 2550000, status: 'PLANNED', notes: 'Nasi Goreng Spesial, Telur Mata Sapi, Bubur Ayam, Kopi & Teh Manis' },
            { id: 'c-5', date: '2026-10-16', meal_type: 'MAKAN_SIANG', location: 'Resto Rindu Alam Puncak', participant_count: 85, vendor: 'Resto Rindu Alam', estimated_cost: 4250000, actual_cost: 0, status: 'PLANNED', notes: 'Prasmanan sebelum perjalanan kembali ke Jakarta' }
        ]);
    }

    // 8. Announcements
    if (!STORAGE.get('outing_announcements', null)) {
        STORAGE.set('outing_announcements', [
            { id: 'a-1', title: 'Dresscode Resmi Hari Ke-1 Outing', content: 'Seluruh peserta dimohon mengenakan kaos outing warna biru yang dibagikan saat registrasi pagi di kantor.', priority: 'HIGH', publish_date: '2026-09-18', created_at: new Date().toISOString() },
            { id: 'a-2', title: 'Titik Kumpul & Jam Keberangkatan Bus', content: 'Titik kumpul di Lobby Gedung A pukul 06.30 WIB. Bus akan berangkat tepat pukul 07.30 WIB. Mohon tidak terlambat.', priority: 'HIGH', publish_date: '2026-09-19', created_at: new Date().toISOString() },
            { id: 'a-3', title: 'Checklist Perlengkapan Pribadi', content: 'Membawa pakaian ganti minimal 2 set, jaket tebal (suhu malam 17°C), obat-obatan pribadi, dan sandal outdoor.', priority: 'NORMAL', publish_date: '2026-09-20', created_at: new Date().toISOString() }
        ]);
    }

    // 9. Participants
    if (!STORAGE.get('outing_participants', null)) {
        STORAGE.set('outing_participants', [
            { id: 'pt-1', username: 'admin', full_name: 'Budi Santoso', phone: '081234567890', department: 'Management', gender: 'L', transport: 'Mobil Pribadi', room: 'Villa Utama No. 1', status: 'CONFIRMED' },
            { id: 'pt-2', username: 'keuangan', full_name: 'Siti Rahma', phone: '081234567891', department: 'Finance', gender: 'P', transport: 'Bus 1', room: 'Kamar Melati 1', status: 'CONFIRMED' },
            { id: 'pt-3', username: 'purchasing', full_name: 'Dedi Kurniawan', phone: '081234567892', department: 'Procurement', gender: 'L', transport: 'Bus 1', room: 'Kamar Pinus 2', status: 'CONFIRMED' },
            { id: 'pt-4', username: 'logistic', full_name: 'Hendra Saputra', phone: '081234567893', department: 'General Affairs', gender: 'L', transport: 'Bus 2', room: 'Kamar Pinus 3', status: 'CONFIRMED' },
            { id: 'pt-5', username: 'konsumsi', full_name: 'Dewi Lestari', phone: '081234567894', department: 'HR', gender: 'P', transport: 'Bus 2', room: 'Kamar Melati 2', status: 'CONFIRMED' },
            { id: 'pt-6', username: 'public', full_name: 'Rian Pratama', phone: '081234567895', department: 'Corporate Secretary', gender: 'L', transport: 'Bus 2', room: 'Kamar Pinus 4', status: 'CONFIRMED' },
            { id: 'pt-7', username: 'peserta', full_name: 'Ahmad Fauzi', phone: '081234567896', department: 'Engineering', gender: 'L', transport: 'Bus 1', room: 'Kamar Pinus 4', status: 'CONFIRMED' }
        ]);
    }

    // Sinkronisasi otomatis data peserta dari daftar user terdaftar
    syncUsersToParticipants();
}

// Run initial seed
initSeedDataIfEmpty();

/* =====================================================
   HELPER UTILITIES
===================================================== */
function formatRupiah(value) {
    const number = Number(value || 0);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(number);
}

function formatPhone(phone) {
    phone = (phone || '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '+62' + phone.substring(1);
    } else if (phone.startsWith('62')) {
        phone = '+' + phone;
    }
    return phone;
}

function generateUUID() {
    return (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'u-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const icon = button.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('bi-eye', 'bi-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('bi-eye-slash', 'bi-eye');
    }
}

// SINKRONISASI OTOMATIS USER TERDAFTAR KE DATA PESERTA
function syncUsersToParticipants() {
    try {
        const localUsers = STORAGE.get('outing_local_users', []);
        let participants = STORAGE.get('outing_participants', []);
        if (!Array.isArray(participants)) participants = [];
        let changed = false;

        localUsers.forEach(u => {
            const cleanU = (u.username || '').replace(/^@+/, '').trim().toLowerCase();
            if (!cleanU) return;
            const existingIdx = participants.findIndex(p => {
                const pClean = (p.username || '').replace(/^@+/, '').trim().toLowerCase();
                return pClean === cleanU || (p.id && String(p.id) === String(u.id));
            });

            const fullName = u.full_name || u.name || cleanU;
            const phone = u.phone || '-';

            if (existingIdx === -1) {
                participants.push({
                    id: u.id || generateUUID(),
                    username: cleanU,
                    full_name: fullName,
                    name: fullName,
                    phone: phone,
                    department: u.department || 'Peserta',
                    gender: u.gender || 'L',
                    transport: u.transport || 'Bus 1',
                    room: u.room || 'Villa',
                    status: u.status || 'CONFIRMED',
                    created_at: u.created_at || new Date().toISOString()
                });
                changed = true;
            } else {
                if (!participants[existingIdx].full_name && fullName) {
                    participants[existingIdx].full_name = fullName;
                    participants[existingIdx].name = fullName;
                    changed = true;
                }
                if ((!participants[existingIdx].phone || participants[existingIdx].phone === '-') && phone !== '-') {
                    participants[existingIdx].phone = phone;
                    changed = true;
                }
            }
        });

        if (changed) {
            STORAGE.set('outing_participants', participants);
        }
        return participants;
    } catch (e) {
        console.warn('syncUsersToParticipants error:', e);
        return STORAGE.get('outing_participants', []);
    }
}

/* =====================================================
   ROLE & PERMISSION MANAGEMENT
===================================================== */
function getUserRole() {
    return String(currentProfile?.roles?.name || currentProfile?.role || 'PARTICIPANT').toUpperCase();
}

function getUserSection() {
    return String(currentProfile?.sections?.name || currentProfile?.section || '').toUpperCase();
}

function canManage(module) {
    const role = getUserRole();
    const section = getUserSection();

    // Admin & Initiator have all rights
    if (role === 'ADMIN' || role === 'INITIATOR' || section === 'INISIATOR') return true;

    switch (module) {
        case 'finance':
            return role === 'FINANCE' || section.includes('KEUANGAN') || section.includes('FINANCE');
        case 'purchasing':
            return role === 'PURCHASING' || section.includes('PURCHASING');
        case 'logistic':
            return role === 'LOGISTIC' || section.includes('LOGISTIC');
        case 'konsumsi':
            return role === 'KONSUMSI' || section.includes('KONSUMSI');
        case 'public_area':
            return role === 'PUBLIC_AREA' || section.includes('PUBLIC');
        case 'rundown':
            return role === 'ADMIN' || role === 'INITIATOR' || section.includes('ACARA');
        case 'participants':
            return role === 'ADMIN' || role === 'INITIATOR';
        case 'settings':
            return role === 'ADMIN' || role === 'INITIATOR';
        default:
            return false;
    }
}

/* =====================================================
   AUTH PAGES TOGGLING & SESSIONS
===================================================== */
function showLogin() {
    document.getElementById('loginPage').classList.remove('d-none');
    document.getElementById('registerPage').classList.add('d-none');
    document.getElementById('appPage').classList.add('d-none');
}

function showRegister() {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('registerPage').classList.remove('d-none');
    document.getElementById('appPage').classList.add('d-none');
}

function showApp() {
    document.getElementById('loginPage').classList.add('d-none');
    document.getElementById('registerPage').classList.add('d-none');
    document.getElementById('appPage').classList.remove('d-none');
}

// 1-Click Demo Login
function quickLoginDemo(userId, password) {
    document.getElementById('loginUserId').value = userId;
    document.getElementById('loginPassword').value = password;
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
}

/* =====================================================
   LOGIN HANDLER
===================================================== */
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const rawUserId = document.getElementById('loginUserId').value.trim();
    const cleanUserId = rawUserId.replace(/^@+/, '').toLowerCase();
    const phoneClean = formatPhone(rawUserId);
    const rawDigits = rawUserId.replace(/\D/g, '');
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const message = document.getElementById('loginMessage');

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Login...`;
    message.innerHTML = '';

    try {
        if (!rawUserId) throw new Error('Silakan masukkan User ID atau Nomor WhatsApp.');
        if (!password) throw new Error('Silakan masukkan password.');

        let foundUser = null;

        // 1. Cek Local Storage Users (fleksibel: username dg/tanpa @, ID, atau No HP)
        const localUsers = STORAGE.get('outing_local_users', []);
        const matchedLocal = localUsers.find(u => {
            const uName = (u.username || '').replace(/^@+/, '').toLowerCase();
            const uPhone = (u.phone || '').replace(/\D/g, '');
            const uId = String(u.id || '').toLowerCase();

            // Cocokkan username (dengan / tanpa @, case-insensitive)
            if (uName && uName === cleanUserId) return true;
            // Cocokkan ID
            if (uId && uId === cleanUserId) return true;
            // Cocokkan Nomor Telepon (format 08xxx, +62xxx, atau raw digits)
            if (u.phone && (u.phone === rawUserId || u.phone === phoneClean)) return true;
            if (rawDigits.length >= 8 && uPhone && (uPhone === rawDigits || uPhone.endsWith(rawDigits) || rawDigits.endsWith(uPhone))) return true;
            return false;
        });

        if (matchedLocal) {
            if (matchedLocal.password && matchedLocal.password !== password) {
                throw new Error('Password yang Anda masukkan salah.');
            }
            foundUser = matchedLocal;
        }

        // 2. Cek Database Supabase (tabel users) jika belum ketemu di lokal
        if (!foundUser && typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                const dbPromise = supabaseClient
                    .from('users')
                    .select('*')
                    .or(`username.eq.${cleanUserId},username.eq.@${cleanUserId}`)
                    .maybeSingle();

                const timeoutPromise = new Promise(resolve => setTimeout(() => resolve({ data: null }), 2000));
                const { data: dbUser } = await Promise.race([dbPromise, timeoutPromise]);

                if (dbUser) {
                    if (dbUser.password && dbUser.password !== password) {
                        throw new Error('Password yang Anda masukkan salah.');
                    }
                    foundUser = dbUser;
                    // Simpan juga ke local users agar selanjutnya offline-ready
                    if (!localUsers.some(u => (u.username || '').toLowerCase() === cleanUserId)) {
                        localUsers.push(dbUser);
                        STORAGE.set('outing_local_users', localUsers);
                    }
                }
            } catch (dbErr) {
                console.warn('Supabase DB search note:', dbErr);
            }
        }

        if (!foundUser) {
            throw new Error('User ID atau Password yang Anda masukkan tidak ditemukan.');
        }

        // Pastikan user otomatis tersinkronisasi ke data peserta
        syncUsersToParticipants();

        currentUser = foundUser;
        currentProfile = foundUser;
        STORAGE.set('outing_session', foundUser);

        await loadDashboard();

    } catch (error) {
        console.error('Login error:', error);
        message.innerHTML = `
            <div class="alert alert-danger py-2 small">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                ${error.message || 'Gagal login, periksa kembali User ID dan Password Anda.'}
            </div>
        `;
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-box-arrow-in-right me-1"></i> Login`;
    }
});

/* =====================================================
   REGISTER HANDLER
===================================================== */
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const rawUsername = document.getElementById('registerUsername').value.trim();
    const username = rawUsername.replace(/^@+/, '').toLowerCase();
    const phoneInput = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const btn = document.getElementById('registerBtn');
    const message = document.getElementById('registerMessage');

    if (password !== passwordConfirm) {
        message.innerHTML = `<div class="alert alert-danger py-2 small"><i class="bi bi-exclamation-triangle-fill me-1"></i> Password dan konfirmasi password tidak sama.</div>`;
        return;
    }
    if (password.length < 6) {
        message.innerHTML = `<div class="alert alert-danger py-2 small"><i class="bi bi-exclamation-triangle-fill me-1"></i> Password minimal 6 karakter.</div>`;
        return;
    }
    if (username.length < 3) {
        message.innerHTML = `<div class="alert alert-danger py-2 small"><i class="bi bi-exclamation-triangle-fill me-1"></i> User ID minimal 3 karakter.</div>`;
        return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        message.innerHTML = `<div class="alert alert-danger py-2 small"><i class="bi bi-exclamation-triangle-fill me-1"></i> User ID hanya boleh huruf, angka, titik, strip, atau underscore.</div>`;
        return;
    }

    const phone = formatPhone(phoneInput);
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan data...`;
    message.innerHTML = '';

    try {
        // 1. Cek apakah username sudah dipakai di local storage
        const localUsers = STORAGE.get('outing_local_users', []);
        const alreadyExists = localUsers.some(u => {
            const uClean = (u.username || '').replace(/^@+/, '').toLowerCase();
            return uClean === username;
        });

        if (alreadyExists) {
            throw new Error(`User ID / Username "${username}" sudah terdaftar. Silakan gunakan User ID lain.`);
        }

        // 2. Buat objek akun baru
        const userId = generateUUID();
        const newUser = {
            id: userId,
            username: username,
            full_name: name,
            name: name,
            phone: phone,
            password: password,
            role: 'PARTICIPANT',
            section: 'PUBLIC',
            department: 'Peserta',
            created_at: new Date().toISOString()
        };

        // Simpan ke daftar local users
        localUsers.push(newUser);
        STORAGE.set('outing_local_users', localUsers);

        // 3. Simpan OTOMATIS ke Data Peserta Outing (outing_participants)
        let participants = STORAGE.get('outing_participants', []);
        if (!Array.isArray(participants)) participants = [];

        const partIdx = participants.findIndex(p => {
            const pClean = (p.username || '').replace(/^@+/, '').toLowerCase();
            return pClean === username || (p.phone && p.phone === phone);
        });

        const newParticipant = {
            id: generateUUID(),
            user_id: userId,
            username: username,
            full_name: name,
            name: name,
            phone: phone,
            department: 'Peserta',
            gender: 'L',
            transport: 'Bus 1',
            room: 'Villa',
            status: 'CONFIRMED',
            created_at: new Date().toISOString()
        };

        if (partIdx !== -1) {
            participants[partIdx] = { ...participants[partIdx], ...newParticipant };
        } else {
            participants.push(newParticipant);
        }
        STORAGE.set('outing_participants', participants);

        // Sinkronisasi menyeluruh agar pasti muncul di data peserta
        syncUsersToParticipants();

        // Perbarui badge jumlah peserta terdaftar jika elemen ada
        const statEl = document.getElementById('statParticipants');
        if (statEl) {
            statEl.textContent = STORAGE.get('outing_participants', []).length;
        }

        // 4. Background non-blocking sync ke Supabase (jika Supabase aktif)
        try {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                supabaseClient.from('users').insert({
                    username: username,
                    full_name: name,
                    phone: phone,
                    role: 'PARTICIPANT',
                    section: 'PUBLIC'
                }).then(() => {}).catch(() => {});

                supabaseClient.from('participants').insert({
                    username: username,
                    full_name: name,
                    phone: phone,
                    department: 'Peserta',
                    gender: 'L',
                    transport: 'Bus 1',
                    room: 'Villa',
                    status: 'CONFIRMED'
                }).then(() => {}).catch(() => {});
            }
        } catch (dbErr) {
            console.warn('Supabase sync note:', dbErr);
        }

        // Pesan Sukses
        message.innerHTML = `
            <div class="alert alert-success py-2 small">
                <i class="bi bi-check-circle-fill me-1"></i>
                <strong>Registrasi Berhasil!</strong> Akun dengan User ID <strong>@${username}</strong> telah tersimpan dan otomatis terdaftar dalam <strong>Data Peserta Outing</strong>.
            </div>
        `;
        document.getElementById('registerForm').reset();

        // Alihkan ke Login dalam 1 detik dengan User ID otomatis terisi
        setTimeout(() => {
            showLogin();
            const loginInput = document.getElementById('loginUserId');
            if (loginInput) {
                loginInput.value = username;
            }
            const loginMsg = document.getElementById('loginMessage');
            if (loginMsg) {
                loginMsg.innerHTML = `
                    <div class="alert alert-success py-2 small">
                        <i class="bi bi-check-circle-fill me-1"></i>
                        Registrasi berhasil untuk <strong>@${username}</strong>! Silakan masukkan password Anda untuk login.
                    </div>
                `;
            }
            const passInput = document.getElementById('loginPassword');
            if (passInput) {
                passInput.focus();
            }
        }, 1000);

    } catch (error) {
        console.error('Register error:', error);
        message.innerHTML = `
            <div class="alert alert-danger py-2 small">
                <i class="bi bi-exclamation-triangle-fill me-1"></i>
                ${error.message || 'Gagal mendaftar. Silakan coba lagi.'}
            </div>
        `;
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-person-plus me-1"></i> Daftar`;
    }
});

/* =====================================================
   DASHBOARD INITIALIZER
===================================================== */
async function loadDashboard() {
    try {
        showApp();

        if (!currentUser) {
            const savedSession = STORAGE.get('outing_session', null);
            if (savedSession) currentUser = savedSession;
        }

        if (!currentUser) {
            showLogin();
            return;
        }

        await loadProfile();
        await loadOuting();

        // Load all module data
        await Promise.all([
            loadRundown(),
            loadFinance(),
            loadAnnouncements(),
            loadParticipants(),
            loadTasks()
        ]);

        setupManagementMenu();
        if (typeof updateArchiveSelectors === 'function') updateArchiveSelectors();
        if (typeof renderArchivesTable === 'function') renderArchivesTable();
        if (typeof updateSupabaseStatsSummary === 'function') updateSupabaseStatsSummary();
        showPage('home');

    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

/* =====================================================
   LOAD PROFILE
===================================================== */
async function loadProfile() {
    try {
        let data = null;
        if (currentUser && currentUser.id) {
            try {
                const { data: dbData } = await supabaseClient
                    .from('users')
                    .select('*, roles(id, name), sections(id, name)')
                    .eq('id', currentUser.id)
                    .maybeSingle();
                if (dbData) data = dbData;
            } catch (err) {}
        }

        if (!data) data = currentProfile || currentUser;
        currentProfile = data;
        if (!data) return;

        const username = data.username || currentUser?.username || '';
        const fullName = data.full_name || data.name || currentUser?.full_name || 'User';
        const initial = (username || fullName || 'U').charAt(0).toUpperCase();
        const phone = data.phone || currentUser?.phone || '-';
        const role = getUserRole();
        const section = getUserSection() || '-';
        const department = data.department || '-';

        document.getElementById('topUserName').textContent = fullName;
        document.getElementById('topUserRole').textContent = role;
        document.getElementById('topAvatar').textContent = initial;

        document.getElementById('profileAvatar').textContent = initial;
        document.getElementById('profileName').textContent = fullName;
        document.getElementById('profileUsername').textContent = '@' + username;
        document.getElementById('profilePhone').textContent = phone;
        document.getElementById('profileDepartment').textContent = department;
        document.getElementById('profileRoleBadge').textContent = role;
        document.getElementById('profileSection').textContent = section;

        // Set simulator dropdown value
        const simSelect = document.getElementById('roleSimulatorSelect');
        if (simSelect) {
            const combined = `${role}|${section}`;
            for (let opt of simSelect.options) {
                if (opt.value === combined || opt.value.startsWith(role + '|')) {
                    simSelect.value = opt.value;
                    break;
                }
            }
        }

    } catch (error) {
        console.error('loadProfile error:', error);
    }
}

/* =====================================================
   ROLE SIMULATOR (DEMO PERSPECTIVE SWITCHER)
===================================================== */
function applyRoleSimulation() {
    const simSelect = document.getElementById('roleSimulatorSelect');
    if (!simSelect) return;
    const [newRole, newSection] = simSelect.value.split('|');

    if (currentProfile) {
        currentProfile.role = newRole;
        currentProfile.section = newSection;
    }
    if (currentUser) {
        currentUser.role = newRole;
        currentUser.section = newSection;
    }
    STORAGE.set('outing_session', currentProfile);

    loadProfile();
    setupManagementMenu();
    updateViewOnlyNotices();

    alert(`Simulasi hak akses berhasil diubah ke: ${newRole} (Section: ${newSection}). Menu & wewenang tombol telah disesuaikan!`);
}

function updateViewOnlyNotices() {
    // 1. Rundown
    const rundownAlert = document.getElementById('rundownViewOnlyAlert');
    const btnAddRundown = document.getElementById('btnAddRundown');
    const btnImportRundown = document.getElementById('btnImportRundown');
    if (canManage('rundown')) {
        rundownAlert?.classList.add('d-none');
        btnAddRundown?.classList.remove('d-none');
        btnImportRundown?.classList.remove('d-none');
    } else {
        rundownAlert?.classList.remove('d-none');
        btnAddRundown?.classList.add('d-none');
        btnImportRundown?.classList.add('d-none');
    }

    // 2. Keuangan
    const financeAlert = document.getElementById('financeViewOnlyAlert');
    const btnAddTrans = document.getElementById('btnAddTransaction');
    const btnImportFinance = document.getElementById('btnImportFinance');
    if (canManage('finance')) {
        financeAlert?.classList.add('d-none');
        btnAddTrans?.classList.remove('d-none');
        btnImportFinance?.classList.remove('d-none');
    } else {
        financeAlert?.classList.remove('d-none');
        btnAddTrans?.classList.add('d-none');
        btnImportFinance?.classList.add('d-none');
    }

    // 3. Purchasing
    const purchAlert = document.getElementById('purchasingViewOnlyAlert');
    const btnAddPurch = document.getElementById('btnAddPurchase');
    const btnImportPurch = document.getElementById('btnImportPurchasing');
    if (canManage('purchasing')) {
        purchAlert?.classList.add('d-none');
        btnAddPurch?.classList.remove('d-none');
        btnImportPurch?.classList.remove('d-none');
    } else {
        purchAlert?.classList.remove('d-none');
        btnAddPurch?.classList.add('d-none');
        btnImportPurch?.classList.add('d-none');
    }

    // 4. Logistic
    const logAlert = document.getElementById('logisticViewOnlyAlert');
    const btnAddLog = document.getElementById('btnAddLogistic');
    const btnImportLog = document.getElementById('btnImportLogistic');
    if (canManage('logistic')) {
        logAlert?.classList.add('d-none');
        btnAddLog?.classList.remove('d-none');
        btnImportLog?.classList.remove('d-none');
    } else {
        logAlert?.classList.remove('d-none');
        btnAddLog?.classList.add('d-none');
        btnImportLog?.classList.add('d-none');
    }

    // 5. Konsumsi
    const konsAlert = document.getElementById('konsumsiViewOnlyAlert');
    const btnAddKons = document.getElementById('btnAddKonsumsi');
    const btnImportKons = document.getElementById('btnImportKonsumsi');
    if (canManage('konsumsi')) {
        konsAlert?.classList.add('d-none');
        btnAddKons?.classList.remove('d-none');
        btnImportKons?.classList.remove('d-none');
    } else {
        konsAlert?.classList.remove('d-none');
        btnAddKons?.classList.add('d-none');
        btnImportKons?.classList.add('d-none');
    }

    // 6. Public Area
    const pubAlert = document.getElementById('publicAreaViewOnlyAlert');
    const btnAddPub = document.getElementById('btnAddAnnouncement');
    const btnImportPub = document.getElementById('btnImportPublicArea');
    if (canManage('public_area')) {
        pubAlert?.classList.add('d-none');
        btnAddPub?.classList.remove('d-none');
        btnImportPub?.classList.remove('d-none');
    } else {
        pubAlert?.classList.remove('d-none');
        btnAddPub?.classList.add('d-none');
        btnImportPub?.classList.add('d-none');
    }

    // 7. Peserta
    const btnAddPart = document.getElementById('btnAddParticipant');
    const btnImportPart = document.getElementById('btnImportParticipants');
    if (canManage('participants')) {
        btnAddPart?.classList.remove('d-none');
        btnImportPart?.classList.remove('d-none');
    } else {
        btnAddPart?.classList.add('d-none');
        btnImportPart?.classList.add('d-none');
    }
}

/* =====================================================
   LOAD OUTING & SETTINGS
===================================================== */
async function loadOuting() {
    try {
        let data = null;
        try {
            const { data: dbData } = await supabaseClient
                .from('outings')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (dbData) data = dbData;
        } catch (e) {}

        if (!data) {
            data = STORAGE.get('outing_current_info', null);
        }

        currentOuting = data;

        if (data) {
            document.getElementById('eventName').textContent = data.name || data.title || 'Outing Bersama';
            let info = '';
            if (data.start_date || data.event_date) {
                const dt = new Date(data.start_date || data.event_date);
                info += dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
            }
            if (data.location) {
                info += ' • ' + data.location;
            }
            document.getElementById('eventInfo').textContent = info || 'Informasi Acara Outing';

            // Populate form settings
            const fName = document.getElementById('settingOutingName');
            if (fName) {
                fName.value = data.name || '';
                document.getElementById('settingStartDate').value = data.start_date || data.event_date || '';
                document.getElementById('settingEndDate').value = data.end_date || '';
                document.getElementById('settingLocation').value = data.location || '';
                document.getElementById('settingAddress').value = data.address || '';
                document.getElementById('settingStatus').value = data.status || 'ACTIVE';
                document.getElementById('settingDescription').value = data.description || '';
            }
        }
    } catch (error) {
        console.error('loadOuting error:', error);
    }
}

function saveOutingSettings(e) {
    e.preventDefault();
    if (!canManage('settings')) {
        alert('Hanya Admin atau Inisiator yang berwenang mengubah Pengaturan Outing.');
        return;
    }

    const updated = {
        id: currentOuting?.id || '10000000-0000-0000-0000-000000000001',
        name: document.getElementById('settingOutingName').value.trim(),
        start_date: document.getElementById('settingStartDate').value,
        end_date: document.getElementById('settingEndDate').value,
        location: document.getElementById('settingLocation').value.trim(),
        address: document.getElementById('settingAddress').value.trim(),
        status: document.getElementById('settingStatus').value,
        description: document.getElementById('settingDescription').value.trim(),
        updated_at: new Date().toISOString()
    };

    STORAGE.set('outing_current_info', updated);
    currentOuting = updated;

    // Try Supabase update
    try {
        supabaseClient.from('outings').upsert(updated).then(() => {});
    } catch (err) {}

    loadOuting();
    const msg = document.getElementById('settingsMessage');
    msg.innerHTML = `<div class="alert alert-success py-2 small"><i class="bi bi-check-circle me-1"></i>Pengaturan outing berhasil disimpan!</div>`;
    setTimeout(() => { msg.innerHTML = ''; }, 3000);
}

/* =====================================================
   RUNDOWN MODULE
===================================================== */
async function loadRundown() {
    try {
        let items = [];
        try {
            const { data } = await supabaseClient.from('rundowns').select('*').order('start_time', { ascending: true });
            if (data && data.length > 0) items = data;
        } catch (e) {}

        if (items.length === 0) {
            items = STORAGE.get('outing_rundowns', []);
        }

        renderRundown(items);
    } catch (error) {
        console.error('loadRundown error:', error);
    }
}

function renderRundown(data) {
    const home = document.getElementById('homeRundown');
    const list = document.getElementById('rundownList');
    const isManager = canManage('rundown');

    if (!data.length) {
        const empty = `<div class="empty-state"><i class="bi bi-calendar-x"></i><div>Belum ada kegiatan rundown.</div></div>`;
        if (home) home.innerHTML = empty;
        if (list) list.innerHTML = empty;
        return;
    }

    const fullItems = data.map((item, idx) => {
        const time = item.start_time || item.time || '-';
        const title = item.title || item.activity || 'Kegiatan';
        const loc = item.location ? `<span class="badge bg-light text-dark border me-1"><i class="bi bi-geo-alt"></i> ${item.location}</span>` : '';
        const desc = item.description || item.note || '';

        return `
            <div class="rundown-item">
                <div class="rundown-time">${time}</div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="rundown-title">${title}</div>
                        ${isManager ? `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-light p-1 border-0" data-bs-toggle="dropdown">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                    <li><a class="dropdown-item small" href="javascript:void(0)" onclick="openRundownModal('${item.id}')"><i class="bi bi-pencil me-1"></i> Edit</a></li>
                                    <li><a class="dropdown-item small text-danger" href="javascript:void(0)" onclick="deleteRundown('${item.id}')"><i class="bi bi-trash me-1"></i> Hapus</a></li>
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                    <div class="mt-1">${loc}</div>
                    ${desc ? `<small class="text-muted d-block mt-1">${desc}</small>` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (home) home.innerHTML = data.slice(0, 4).map(item => `
        <div class="rundown-item py-2">
            <div class="rundown-time" style="min-width: 80px; font-size: 11px;">${item.start_time || '-'}</div>
            <div>
                <div class="fw-semibold small">${item.title || item.activity}</div>
                <small class="text-muted">${item.location || ''}</small>
            </div>
        </div>
    `).join('');

    if (list) list.innerHTML = fullItems;
}

function openRundownModal(id = null) {
    if (!canManage('rundown')) {
        alert('Hanya panitia acara/admin yang dapat menambah atau mengubah rundown.');
        return;
    }
    const modalEl = document.getElementById('modalRundown');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('formRundown');
    form.reset();

    if (id) {
        document.getElementById('modalRundownTitle').textContent = 'Edit Kegiatan Rundown';
        const items = STORAGE.get('outing_rundowns', []);
        const item = items.find(r => String(r.id) === String(id));
        if (item) {
            document.getElementById('rundownId').value = item.id;
            document.getElementById('rundownTime').value = item.start_time || '';
            document.getElementById('rundownActivity').value = item.title || item.activity || '';
            document.getElementById('rundownLocation').value = item.location || '';
            document.getElementById('rundownDesc').value = item.description || item.note || '';
            document.getElementById('rundownOrder').value = item.order_index || 1;
        }
    } else {
        document.getElementById('modalRundownTitle').textContent = 'Tambah Kegiatan Rundown';
        document.getElementById('rundownId').value = '';
    }
    modal.show();
}

function saveRundown(e) {
    e.preventDefault();
    const id = document.getElementById('rundownId').value;
    const items = STORAGE.get('outing_rundowns', []);
    const newItem = {
        id: id || generateUUID(),
        start_time: document.getElementById('rundownTime').value.trim(),
        title: document.getElementById('rundownActivity').value.trim(),
        activity: document.getElementById('rundownActivity').value.trim(),
        location: document.getElementById('rundownLocation').value.trim(),
        description: document.getElementById('rundownDesc').value.trim(),
        order_index: Number(document.getElementById('rundownOrder').value) || 1
    };

    if (id) {
        const idx = items.findIndex(r => String(r.id) === String(id));
        if (idx !== -1) items[idx] = newItem;
    } else {
        items.push(newItem);
    }

    STORAGE.set('outing_rundowns', items);
    bootstrap.Modal.getInstance(document.getElementById('modalRundown')).hide();
    renderRundown(items);

    // Sync Supabase
    try {
        supabaseClient.from('rundowns').upsert(newItem).then(() => {});
    } catch (e) {}
}

function deleteRundown(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return;
    let items = STORAGE.get('outing_rundowns', []);
    items = items.filter(r => String(r.id) !== String(id));
    STORAGE.set('outing_rundowns', items);
    renderRundown(items);

    try {
        supabaseClient.from('rundowns').delete().eq('id', id).then(() => {});
    } catch (e) {}
}


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
            { key: 'notes', label: 'Catatan', type: 'text', placeholder: 'Spesifikasi atau link pembelian', width: 30, synonyms: ['notes', 'catatan', 'keterangan'] },
            { key: 'image_url', label: 'Foto / Lampiran', type: 'text', placeholder: 'URL foto atau bukti', width: 25, synonyms: ['image_url', 'image', 'foto', 'gambar', 'lampiran', 'photo', 'struk', 'nota'] }
        ],
        templateRows: [
            { "Nama Barang / Jasa": "Kaos Polo Sablon Outing", "Qty": 85, "Satuan": "Pcs", "Estimasi Biaya": 4500000, "Biaya Aktual": 4250000, "Vendor / Toko": "Konveksi Berkah", "Tgl Kebutuhan": "2026-10-05", "Seksi Pemohon": "LOGISTIC", "Status": "COMPLETED", "Catatan": "Bahan lacoste katun, warna navy", "Foto / Lampiran": "" },
            { "Nama Barang / Jasa": "Name Tag & Lanyard", "Qty": 85, "Satuan": "Pcs", "Estimasi Biaya": 850000, "Biaya Aktual": 750000, "Vendor / Toko": "Percetakan Grafika", "Tgl Kebutuhan": "2026-10-08", "Seksi Pemohon": "PUBLIC_AREA", "Status": "COMPLETED", "Catatan": "Barcode nomor kamar", "Foto / Lampiran": "" },
            { "Nama Barang / Jasa": "Air Mineral 600ml", "Qty": 25, "Satuan": "Dus", "Estimasi Biaya": 1250000, "Biaya Aktual": 1100000, "Vendor / Toko": "Agen Grosir Berkah", "Tgl Kebutuhan": "2026-10-14", "Seksi Pemohon": "KONSUMSI", "Status": "APPROVED", "Catatan": "Untuk di bus dan area villa", "Foto / Lampiran": "" }
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
                    "Catatan": item.notes || '-',
                    "Foto / Lampiran": item.image_url ? (item.image_url.startsWith('data:') ? '[Foto Disimpan di Aplikasi]' : item.image_url) : '-'
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
                "Catatan": "",
                "Foto / Lampiran": ""
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
            notes: row.notes || '',
            image_url: row.image_url || ''
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
    const modalEl = document.getElementById('modalUniversalImportExcel');
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
    const modalEl = document.getElementById('modalUniversalImportExcel');
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


/* =====================================================
   FINANCE MODULE
===================================================== */
async function loadFinance() {
    try {
        let transactions = [];
        try {
            const { data } = await supabaseClient.from('cash_transactions').select('*').order('transaction_date', { ascending: false });
            if (data && data.length > 0) transactions = data;
        } catch (e) {}

        if (transactions.length === 0) {
            transactions = STORAGE.get('outing_transactions', []);
        }

        renderFinance(transactions);
    } catch (error) {
        console.error('loadFinance error:', error);
    }
}

function renderFinance(data) {
    let income = 0;
    let expense = 0;

    data.forEach(item => {
        const type = String(item.type || item.transaction_type || '').toUpperCase();
        const amt = Number(item.amount || item.jumlah || 0);
        if (type === 'IN' || type === 'INCOME' || type === 'MASUK') {
            income += amt;
        } else {
            expense += amt;
        }
    });

    const balance = income - expense;
    document.getElementById('totalIncome').textContent = formatRupiah(income);
    document.getElementById('totalExpense').textContent = formatRupiah(expense);
    document.getElementById('statBalance').textContent = formatRupiah(balance);
    const curBalEl = document.getElementById('financeCurrentBalance');
    if (curBalEl) curBalEl.textContent = formatRupiah(balance);

    const filter = document.getElementById('financeFilter')?.value || 'ALL';
    let filteredData = data;
    if (filter === 'IN') {
        filteredData = data.filter(d => ['IN', 'INCOME', 'MASUK'].includes(String(d.type || d.transaction_type).toUpperCase()));
    } else if (filter === 'OUT') {
        filteredData = data.filter(d => !['IN', 'INCOME', 'MASUK'].includes(String(d.type || d.transaction_type).toUpperCase()));
    }

    const home = document.getElementById('homeFinance');
    const list = document.getElementById('financeList');
    const isManager = canManage('finance');

    if (!data.length) {
        const empty = `<div class="empty-state"><i class="bi bi-wallet2"></i><div>Belum ada transaksi.</div></div>`;
        if (home) home.innerHTML = empty;
        if (list) list.innerHTML = empty;
        return;
    }

    const rows = filteredData.map(item => {
        const type = String(item.type || item.transaction_type || '').toUpperCase();
        const isIncome = type === 'IN' || type === 'INCOME' || type === 'MASUK';
        const amount = Number(item.amount || item.jumlah || 0);
        const title = item.description || item.keterangan || item.category || 'Transaksi';
        const date = item.transaction_date || item.date || '-';
        const cat = item.category ? `<span class="badge bg-light text-dark border me-1">${item.category}</span>` : '';

        return `
            <div class="d-flex justify-content-between align-items-center py-3 border-bottom">
                <div>
                    <div class="fw-semibold">${title}</div>
                    <div class="d-flex align-items-center gap-2 mt-1">
                        ${cat}
                        <small class="text-muted"><i class="bi bi-clock me-1"></i>${date}</small>
                        <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25" style="font-size: 10px;">POSTED</span>
                    </div>
                </div>
                <div class="text-end">
                    <div class="${isIncome ? 'money-in' : 'money-out'}">
                        ${isIncome ? '+ ' : '- '} ${formatRupiah(amount)}
                    </div>
                    ${isManager ? `
                        <button class="btn btn-sm btn-link text-danger p-0 mt-1" style="font-size: 11px; text-decoration: none;" onclick="deleteTransaction('${item.id}')">
                            <i class="bi bi-trash"></i> Hapus
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    if (home) home.innerHTML = data.slice(0, 4).map(item => {
        const isIncome = ['IN', 'INCOME', 'MASUK'].includes(String(item.type || item.transaction_type).toUpperCase());
        return `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div class="text-truncate me-2" style="max-width: 65%;">
                    <div class="fw-semibold small text-truncate">${item.description || item.category}</div>
                    <small class="text-muted" style="font-size: 11px;">${item.transaction_date || ''}</small>
                </div>
                <div class="${isIncome ? 'money-in' : 'money-out'} small">
                    ${isIncome ? '+' : '-'} ${formatRupiah(item.amount)}
                </div>
            </div>
        `;
    }).join('');

    if (list) list.innerHTML = rows || `<div class="empty-state py-4">Tidak ada transaksi untuk filter ini.</div>`;
}

function openTransactionModal(id = null) {
    if (!canManage('finance')) {
        alert('Hanya Section Keuangan atau Admin yang dapat mencatat transaksi kas.');
        return;
    }
    const modalEl = document.getElementById('modalTransaction');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const form = document.getElementById('formTransaction');
    form.reset();
    document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
    modal.show();
}

function saveTransaction(e) {
    e.preventDefault();
    const items = STORAGE.get('outing_transactions', []);
    const newTrans = {
        id: generateUUID(),
        type: document.getElementById('transType').value,
        amount: Number(document.getElementById('transAmount').value),
        category: document.getElementById('transCategory').value,
        description: document.getElementById('transDesc').value.trim(),
        transaction_date: document.getElementById('transDate').value,
        account: document.getElementById('transAccount').value,
        status: 'POSTED',
        created_at: new Date().toISOString()
    };

    items.unshift(newTrans);
    STORAGE.set('outing_transactions', items);
    bootstrap.Modal.getInstance(document.getElementById('modalTransaction')).hide();
    renderFinance(items);

    // Sync Supabase
    try {
        supabaseClient.from('cash_transactions').insert(newTrans).then(() => {});
    } catch (e) {}
}

function deleteTransaction(id) {
    if (!canManage('finance')) return;
    if (!confirm('Hapus transaksi ini? Saldo akan dihitung ulang.')) return;
    let items = STORAGE.get('outing_transactions', []);
    items = items.filter(t => String(t.id) !== String(id));
    STORAGE.set('outing_transactions', items);
    renderFinance(items);

    try {
        supabaseClient.from('cash_transactions').delete().eq('id', id).then(() => {});
    } catch (e) {}
}

/* =====================================================
   PURCHASING MODULE & COMPRESSED IMAGE ENGINE
===================================================== */
let currentPurchaseImageBlob = null;

function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function compressImageFile(file, options = {}) {
    const maxWidth = options.maxWidth || 1200;
    const maxHeight = options.maxHeight || 1200;
    const quality = options.quality !== undefined ? options.quality : 0.72;

    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            return reject(new Error('Berkas harus berupa gambar (JPG, PNG, WebP, dll).'));
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Format gambar tidak dapat diproses.'));
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width / height > maxWidth / maxHeight) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');

                // Canvas white background for transparent PNG / WebP conversion
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);

                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                const dataUrl = canvas.toDataURL('image/jpeg', quality);

                canvas.toBlob((blob) => {
                    if (!blob) {
                        return reject(new Error('Gagal mengompres gambar ke Blob.'));
                    }
                    resolve({
                        dataUrl,
                        blob,
                        originalSize: file.size,
                        compressedSize: blob.size,
                        width,
                        height,
                        reductionPct: Math.max(0, Math.round((1 - (blob.size / file.size)) * 100))
                    });
                }, 'image/jpeg', quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

async function handlePurchaseImageChange(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const emptyState = document.getElementById('purchaseImageEmptyState');
    const compressingState = document.getElementById('purchaseImageCompressingState');
    const previewState = document.getElementById('purchaseImagePreviewState');
    const previewImg = document.getElementById('purchaseImagePreviewImg');
    const sizeInfo = document.getElementById('purchaseImageSizeInfo');
    const hiddenUrlInput = document.getElementById('purchaseImageUrl');

    try {
        if (emptyState) emptyState.classList.add('d-none');
        if (previewState) previewState.classList.add('d-none');
        if (compressingState) compressingState.classList.remove('d-none');

        const compressed = await compressImageFile(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.72 });

        currentPurchaseImageBlob = compressed.blob;
        if (hiddenUrlInput) hiddenUrlInput.value = compressed.dataUrl;
        if (previewImg) previewImg.src = compressed.dataUrl;

        if (sizeInfo) {
            sizeInfo.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Asli: <strong>${formatFileSize(compressed.originalSize)}</strong> &rarr; Terkompres: <strong>${formatFileSize(compressed.compressedSize)}</strong> <span class="badge bg-success ms-1">Hemat ${compressed.reductionPct}%</span>`;
        }

        if (compressingState) compressingState.classList.add('d-none');
        if (previewState) previewState.classList.remove('d-none');
    } catch (err) {
        console.error('Kompresi gambar gagal:', err);
        if (compressingState) compressingState.classList.add('d-none');
        if (emptyState) emptyState.classList.remove('d-none');
        alert('Gagal mengompres gambar: ' + (err.message || 'Format tidak didukung'));
    }
}

function removePurchaseImage() {
    currentPurchaseImageBlob = null;
    const fileInput = document.getElementById('purchaseImageInput');
    if (fileInput) fileInput.value = '';
    const hiddenUrlInput = document.getElementById('purchaseImageUrl');
    if (hiddenUrlInput) hiddenUrlInput.value = '';

    const emptyState = document.getElementById('purchaseImageEmptyState');
    const compressingState = document.getElementById('purchaseImageCompressingState');
    const previewState = document.getElementById('purchaseImagePreviewState');
    const previewImg = document.getElementById('purchaseImagePreviewImg');
    const sizeInfo = document.getElementById('purchaseImageSizeInfo');

    if (previewImg) previewImg.src = '';
    if (sizeInfo) sizeInfo.innerHTML = '';
    if (compressingState) compressingState.classList.add('d-none');
    if (previewState) previewState.classList.add('d-none');
    if (emptyState) emptyState.classList.remove('d-none');
}

function initPurchaseDropZone() {
    const dropZone = document.getElementById('purchaseImageDropZone');
    if (!dropZone || dropZone.dataset.initialized) return;
    dropZone.dataset.initialized = 'true';

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('border-primary', 'bg-primary-subtle');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('border-primary', 'bg-primary-subtle');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0 && files[0].type.startsWith('image/')) {
            handlePurchaseImageChange({ target: { files: [files[0]] } });
        }
    }, false);
}

async function loadPurchasing() {
    try {
        let list = [];
        try {
            const { data } = await supabaseClient.from('purchase_requests').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) list = data;
        } catch (e) {}

        if (list.length === 0) {
            list = STORAGE.get('outing_purchases', []);
        }

        renderPurchasing(list);
    } catch (error) {
        console.error('loadPurchasing error:', error);
    }
}

function renderPurchasing(data) {
    const container = document.getElementById('purchasingList');
    if (!container) return;

    // Stat counts
    let totalEst = 0;
    let totalAct = 0;
    data.forEach(p => {
        totalEst += Number(p.estimated_cost || 0);
        totalAct += Number(p.actual_cost || 0);
    });

    document.getElementById('statPurchasingCount').textContent = data.length;
    document.getElementById('statPurchasingEstimated').textContent = formatRupiah(totalEst);
    document.getElementById('statPurchasingActual').textContent = formatRupiah(totalAct);

    let filtered = data;
    if (activePurchasingFilter !== 'ALL') {
        filtered = data.filter(p => String(p.status).toUpperCase() === activePurchasingFilter);
    }

    if (!filtered.length) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-cart-x"></i><div>Belum ada permintaan pembelian untuk kategori ini.</div></div>`;
        return;
    }

    const isManager = canManage('purchasing');

    container.innerHTML = filtered.map(item => {
        let statusBadge = 'bg-warning text-dark';
        if (item.status === 'APPROVED') statusBadge = 'bg-info text-white';
        if (item.status === 'COMPLETED') statusBadge = 'bg-success text-white';
        if (item.status === 'REJECTED') statusBadge = 'bg-danger text-white';

        const hasImage = Boolean(item.image_url && item.image_url.trim());

        return `
            <div class="card border border-light-subtle rounded-3 p-3 mb-3 shadow-sm bg-white">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div class="d-flex align-items-start gap-2">
                        ${hasImage ? `
                            <div class="position-relative flex-shrink-0" style="width: 58px; height: 58px; cursor: pointer;" onclick="previewPurchaseImage('${item.id}')" title="Klik untuk memperbesar foto">
                                <img src="${item.image_url}" alt="Foto ${escapeHtml(item.item_name || item.item || '')}" class="w-100 h-100 rounded border object-fit-cover shadow-sm">
                                <span class="position-absolute bottom-0 end-0 bg-dark bg-opacity-75 text-white px-1 rounded-bottom-end" style="font-size: 0.6rem;">
                                    <i class="bi bi-zoom-in"></i>
                                </span>
                            </div>
                        ` : `
                            <div class="rounded border bg-light text-muted d-flex align-items-center justify-content-center flex-shrink-0" style="width: 58px; height: 58px;" title="Tidak ada foto">
                                <i class="bi bi-image fs-4 opacity-50"></i>
                            </div>
                        `}
                        <div>
                            <div>
                                <span class="badge ${statusBadge} mb-1">${item.status}</span>
                                <span class="badge bg-light text-dark border ms-1">Section: ${item.section || 'LOGISTIC'}</span>
                                ${hasImage ? '<span class="badge bg-info-subtle text-info-emphasis border border-info-subtle ms-1"><i class="bi bi-camera me-1"></i>Ada Foto</span>' : ''}
                            </div>
                            <h6 class="fw-bold mb-0 mt-1">${escapeHtml(item.item_name || item.item || '')}</h6>
                        </div>
                    </div>
                    ${isManager ? `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light p-1" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><a class="dropdown-item small" href="javascript:void(0)" onclick="openPurchaseModal('${item.id}')"><i class="bi bi-pencil me-1"></i> Edit</a></li>
                                <li><a class="dropdown-item small text-danger" href="javascript:void(0)" onclick="deletePurchase('${item.id}')"><i class="bi bi-trash me-1"></i> Hapus</a></li>
                            </ul>
                        </div>
                    ` : ''}
                </div>

                <div class="row g-2 small text-muted my-1">
                    <div class="col-6 col-md-3"><strong>Kuantitas:</strong> ${item.quantity || 1} ${item.unit || 'Pcs'}</div>
                    <div class="col-6 col-md-3"><strong>Vendor:</strong> ${escapeHtml(item.vendor || '-')}</div>
                    <div class="col-6 col-md-3"><strong>Estimasi:</strong> ${formatRupiah(item.estimated_cost)}</div>
                    <div class="col-6 col-md-3"><strong>Biaya Aktual:</strong> <span class="text-primary fw-semibold">${formatRupiah(item.actual_cost)}</span></div>
                </div>

                ${item.notes ? `<div class="bg-light p-2 rounded small mt-2 text-secondary"><i class="bi bi-info-circle me-1"></i>${escapeHtml(item.notes)}</div>` : ''}

                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top small text-muted">
                    <div class="d-flex align-items-center gap-2">
                        <span><i class="bi bi-calendar me-1"></i>Dibutuhkan: ${item.needed_date || '-'}</span>
                        ${hasImage ? `
                            <button class="btn btn-sm btn-light border py-0 px-2 text-primary" style="font-size: 0.75rem;" onclick="previewPurchaseImage('${item.id}')">
                                <i class="bi bi-eye me-1"></i>Lihat Foto
                            </button>
                        ` : ''}
                    </div>
                    ${isManager && item.status === 'PENDING' ? `
                        <button class="btn btn-sm btn-outline-success py-0 px-2" onclick="quickApprovePurchase('${item.id}')">
                            <i class="bi bi-check"></i> Setujui
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterPurchasing(status, btn) {
    activePurchasingFilter = status;
    document.querySelectorAll('#pagePurchasing .filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderPurchasing(STORAGE.get('outing_purchases', []));
}

function openPurchaseModal(id = null) {
    if (!canManage('purchasing')) {
        alert('Hanya Section Purchasing atau Admin yang dapat mengelola permintaan pembelian.');
        return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPurchase'));
    document.getElementById('formPurchase').reset();
    document.getElementById('purchaseNeededDate').value = new Date().toISOString().split('T')[0];
    removePurchaseImage();
    initPurchaseDropZone();

    if (id) {
        document.getElementById('modalPurchaseTitle').textContent = 'Edit Permintaan Pembelian';
        const list = STORAGE.get('outing_purchases', []);
        const item = list.find(p => String(p.id) === String(id));
        if (item) {
            document.getElementById('purchaseId').value = item.id;
            document.getElementById('purchaseItem').value = item.item_name || item.item || '';
            document.getElementById('purchaseQty').value = item.quantity || 1;
            document.getElementById('purchaseUnit').value = item.unit || 'Pcs';
            document.getElementById('purchaseEstCost').value = item.estimated_cost || 0;
            document.getElementById('purchaseActCost').value = item.actual_cost || 0;
            document.getElementById('purchaseVendor').value = item.vendor || '';
            document.getElementById('purchaseNeededDate').value = item.needed_date || '';
            document.getElementById('purchaseSection').value = item.section || 'LOGISTIC';
            document.getElementById('purchaseStatus').value = item.status || 'PENDING';
            document.getElementById('purchaseNotes').value = item.notes || '';

            if (item.image_url && item.image_url.trim()) {
                document.getElementById('purchaseImageUrl').value = item.image_url;
                const previewImg = document.getElementById('purchaseImagePreviewImg');
                if (previewImg) previewImg.src = item.image_url;
                const sizeInfo = document.getElementById('purchaseImageSizeInfo');
                if (sizeInfo) sizeInfo.innerHTML = `<span class="text-success"><i class="bi bi-image me-1"></i>Foto telah terpasang</span>`;
                const emptyState = document.getElementById('purchaseImageEmptyState');
                const previewState = document.getElementById('purchaseImagePreviewState');
                if (emptyState) emptyState.classList.add('d-none');
                if (previewState) previewState.classList.remove('d-none');
            }
        }
    } else {
        document.getElementById('modalPurchaseTitle').textContent = 'Request Pembelian Baru';
        document.getElementById('purchaseId').value = '';
    }
    modal.show();
}

async function savePurchase(e) {
    e.preventDefault();
    const id = document.getElementById('purchaseId').value;
    const list = STORAGE.get('outing_purchases', []);
    const saveBtn = document.getElementById('btnSavePurchase');
    const originalBtnHtml = saveBtn ? saveBtn.innerHTML : 'Simpan';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan...';
    }

    let finalImageUrl = document.getElementById('purchaseImageUrl').value || '';

    // If a new compressed blob is pending upload, attempt to upload to Supabase Storage bucket 'purchases'
    if (currentPurchaseImageBlob) {
        try {
            const fileName = `purchasing/${Date.now()}_${generateUUID().substring(0, 8)}.jpg`;
            const { data: uploadData, error: uploadErr } = await supabaseClient.storage
                .from('purchases')
                .upload(fileName, currentPurchaseImageBlob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: true
                });

            if (!uploadErr && uploadData) {
                const { data: publicData } = supabaseClient.storage
                    .from('purchases')
                    .getPublicUrl(fileName);
                if (publicData && publicData.publicUrl) {
                    finalImageUrl = publicData.publicUrl;
                }
            } else if (uploadErr) {
                console.warn('Supabase storage upload error, using compressed base64 data URL:', uploadErr.message);
            }
        } catch (storageEx) {
            console.warn('Supabase storage unavailable, using compressed base64 fallback:', storageEx);
        }
    }

    const newReq = {
        id: id || generateUUID(),
        item_name: document.getElementById('purchaseItem').value.trim(),
        item: document.getElementById('purchaseItem').value.trim(),
        quantity: Number(document.getElementById('purchaseQty').value),
        unit: document.getElementById('purchaseUnit').value.trim(),
        estimated_cost: Number(document.getElementById('purchaseEstCost').value),
        actual_cost: Number(document.getElementById('purchaseActCost').value) || 0,
        vendor: document.getElementById('purchaseVendor').value.trim(),
        needed_date: document.getElementById('purchaseNeededDate').value,
        section: document.getElementById('purchaseSection').value,
        status: document.getElementById('purchaseStatus').value,
        notes: document.getElementById('purchaseNotes').value.trim(),
        image_url: finalImageUrl,
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = list.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) list[idx] = newReq;
    } else {
        list.unshift(newReq);
    }

    STORAGE.set('outing_purchases', list);
    currentPurchaseImageBlob = null;

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalBtnHtml;
    }

    bootstrap.Modal.getInstance(document.getElementById('modalPurchase')).hide();
    renderPurchasing(list);
    showToast(`<i class="bi bi-check2-circle me-1"></i> Permintaan pembelian <strong>${escapeHtml(newReq.item_name)}</strong> berhasil disimpan.`);

    // Remote sync with Supabase table
    try {
        const { error } = await supabaseClient.from('purchase_requests').upsert(newReq);
        if (error) {
            if (error.code === 'PGRST204' || (error.message && error.message.includes('image_url'))) {
                console.warn('Kolom image_url belum ada di remote Supabase. Menyimpan data pokok ke remote DB...');
                const dbReq = { ...newReq };
                delete dbReq.image_url;
                await supabaseClient.from('purchase_requests').upsert(dbReq);
            } else {
                console.error('Supabase upsert error:', error);
            }
        }
    } catch (e) {
        console.error('Supabase sync error:', e);
    }
}

function previewPurchaseImage(id) {
    const list = STORAGE.get('outing_purchases', []);
    const item = list.find(p => String(p.id) === String(id));
    if (!item || !item.image_url) {
        alert('Foto tidak tersedia.');
        return;
    }

    const titleEl = document.getElementById('previewPurchaseTitle');
    const subtitleEl = document.getElementById('previewPurchaseSubtitle');
    const imgEl = document.getElementById('previewPurchaseImg');
    const metaEl = document.getElementById('previewPurchaseMeta');
    const downloadBtn = document.getElementById('previewPurchaseDownload');

    const itemName = item.item_name || item.item || 'Item';
    if (titleEl) titleEl.textContent = itemName;
    if (subtitleEl) subtitleEl.textContent = `Seksi: ${item.section || 'LOGISTIC'} | Status: ${item.status || 'PENDING'}`;
    if (imgEl) {
        imgEl.src = item.image_url;
        imgEl.alt = itemName;
    }

    if (metaEl) {
        metaEl.innerHTML = `
            <div class="row g-2">
                <div class="col-6 col-md-3"><strong>Jumlah:</strong> ${item.quantity || 1} ${item.unit || 'Pcs'}</div>
                <div class="col-6 col-md-3"><strong>Vendor:</strong> ${escapeHtml(item.vendor || '-')}</div>
                <div class="col-6 col-md-3"><strong>Estimasi:</strong> ${formatRupiah(item.estimated_cost)}</div>
                <div class="col-6 col-md-3"><strong>Biaya Aktual:</strong> <span class="text-primary fw-bold">${formatRupiah(item.actual_cost)}</span></div>
                <div class="col-12 col-md-6"><strong>Tgl Kebutuhan:</strong> ${item.needed_date || '-'}</div>
                <div class="col-12 col-md-6"><strong>Status:</strong> <span class="badge bg-secondary">${item.status}</span></div>
                ${item.notes ? `<div class="col-12 mt-1"><strong>Catatan:</strong> ${escapeHtml(item.notes)}</div>` : ''}
            </div>
        `;
    }

    if (downloadBtn) {
        downloadBtn.href = item.image_url;
        downloadBtn.download = `Foto_Purchasing_${itemName.replace(/[^a-zA-Z0-9_-]/g, '_')}.jpg`;
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPurchaseImagePreview')).show();
}

function quickApprovePurchase(id) {
    const list = STORAGE.get('outing_purchases', []);
    const item = list.find(p => String(p.id) === String(id));
    if (item) {
        item.status = 'APPROVED';
        STORAGE.set('outing_purchases', list);
        renderPurchasing(list);
    }
}

function deletePurchase(id) {
    if (!confirm('Hapus permintaan pembelian ini?')) return;
    let list = STORAGE.get('outing_purchases', []);
    list = list.filter(p => String(p.id) !== String(id));
    STORAGE.set('outing_purchases', list);
    renderPurchasing(list);
}

/* =====================================================
   LOGISTIC & TASKS MODULE
===================================================== */
async function loadTasks() {
    try {
        let tasks = [];
        try {
            const { data } = await supabaseClient.from('tasks').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) tasks = data;
        } catch (e) {}

        if (tasks.length === 0) {
            tasks = STORAGE.get('outing_tasks', []);
        }

        renderTasks(tasks);
    } catch (error) {
        console.error('loadTasks error:', error);
    }
}

function renderTasks(data) {
    // Progress calculation for dashboard
    if (data && data.length > 0) {
        const totalProgress = data.reduce((acc, cur) => acc + Number(cur.progress || (cur.status === 'DONE' ? 100 : 0)), 0);
        const overallPct = Math.round(totalProgress / data.length);
        document.getElementById('statProgress').textContent = overallPct + '%';
        const bar = document.getElementById('statProgressBar');
        if (bar) bar.style.width = overallPct + '%';
    }

    const container = document.getElementById('logisticList');
    if (!container) return;

    let filtered = data;
    if (activeTaskFilter !== 'ALL') {
        filtered = data.filter(t => String(t.status).toUpperCase() === activeTaskFilter);
    }

    if (!filtered.length) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-card-checklist"></i><div>Tidak ada task pada kategori ini.</div></div>`;
        return;
    }

    const isManager = canManage('logistic');

    container.innerHTML = filtered.map(task => {
        let priBadge = 'bg-secondary';
        if (task.priority === 'HIGH') priBadge = 'bg-danger';
        if (task.priority === 'MEDIUM') priBadge = 'bg-warning text-dark';
        if (task.priority === 'LOW') priBadge = 'bg-info text-white';

        let statBadge = 'bg-secondary';
        if (task.status === 'IN_PROGRESS') statBadge = 'bg-primary';
        if (task.status === 'DONE') statBadge = 'bg-success';

        const pct = task.progress || (task.status === 'DONE' ? 100 : 0);

        return `
            <div class="card border border-light-subtle rounded-3 p-3 mb-3 shadow-sm bg-white">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="badge ${priBadge} me-1">${task.priority || 'NORMAL'}</span>
                        <span class="badge ${statBadge}">${task.status}</span>
                        <h6 class="fw-bold mb-0 mt-2">${task.title || task.description}</h6>
                    </div>
                    ${isManager ? `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light p-1" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><a class="dropdown-item small" href="javascript:void(0)" onclick="openTaskModal('${task.id}')"><i class="bi bi-pencil me-1"></i> Edit</a></li>
                                <li><a class="dropdown-item small text-danger" href="javascript:void(0)" onclick="deleteTask('${task.id}')"><i class="bi bi-trash me-1"></i> Hapus</a></li>
                            </ul>
                        </div>
                    ` : ''}
                </div>

                <div class="my-2">
                    <div class="d-flex justify-content-between small text-muted mb-1">
                        <span>Progress Penyelesaian</span>
                        <span class="fw-semibold">${pct}%</span>
                    </div>
                    <div class="progress" style="height: 7px;">
                        <div class="progress-bar ${pct === 100 ? 'bg-success' : 'bg-primary'}" style="width: ${pct}%"></div>
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top small text-muted">
                    <span><i class="bi bi-person me-1"></i>PIC: <strong>${task.assigned_to || '-'}</strong> • Deadline: ${task.deadline || '-'}</span>
                    ${isManager ? `
                        <button class="btn btn-sm btn-light border py-0 px-2 small" onclick="cycleTaskStatus('${task.id}')">
                            Ubah Status <i class="bi bi-arrow-repeat"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterTasks(status, btn) {
    activeTaskFilter = status;
    document.querySelectorAll('#pageLogistic .filter-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    renderTasks(STORAGE.get('outing_tasks', []));
}

function cycleTaskStatus(id) {
    const tasks = STORAGE.get('outing_tasks', []);
    const task = tasks.find(t => String(t.id) === String(id));
    if (task) {
        if (task.status === 'TODO') {
            task.status = 'IN_PROGRESS';
            task.progress = 50;
        } else if (task.status === 'IN_PROGRESS') {
            task.status = 'DONE';
            task.progress = 100;
        } else {
            task.status = 'TODO';
            task.progress = 0;
        }
        STORAGE.set('outing_tasks', tasks);
        renderTasks(tasks);
    }
}

function openTaskModal(id = null) {
    if (!canManage('logistic')) {
        alert('Hanya Section Logistic atau Admin yang dapat menambah task logistik.');
        return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTask'));
    document.getElementById('formTask').reset();
    document.getElementById('taskDeadline').value = new Date().toISOString().split('T')[0];

    if (id) {
        document.getElementById('modalTaskTitle').textContent = 'Edit Task Logistik';
        const tasks = STORAGE.get('outing_tasks', []);
        const task = tasks.find(t => String(t.id) === String(id));
        if (task) {
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title || task.description || '';
            document.getElementById('taskPriority').value = task.priority || 'MEDIUM';
            document.getElementById('taskDeadline').value = task.deadline || '';
            document.getElementById('taskStatus').value = task.status || 'TODO';
            document.getElementById('taskProgress').value = task.progress || 0;
            document.getElementById('taskAssignedTo').value = task.assigned_to || '';
        }
    } else {
        document.getElementById('modalTaskTitle').textContent = 'Tambah Task Logistik Baru';
        document.getElementById('taskId').value = '';
    }
    modal.show();
}

function saveTask(e) {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const tasks = STORAGE.get('outing_tasks', []);
    const newTask = {
        id: id || generateUUID(),
        title: document.getElementById('taskTitle').value.trim(),
        description: document.getElementById('taskTitle').value.trim(),
        priority: document.getElementById('taskPriority').value,
        deadline: document.getElementById('taskDeadline').value,
        status: document.getElementById('taskStatus').value,
        progress: Number(document.getElementById('taskProgress').value) || 0,
        assigned_to: document.getElementById('taskAssignedTo').value.trim(),
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = tasks.findIndex(t => String(t.id) === String(id));
        if (idx !== -1) tasks[idx] = newTask;
    } else {
        tasks.push(newTask);
    }

    STORAGE.set('outing_tasks', tasks);
    bootstrap.Modal.getInstance(document.getElementById('modalTask')).hide();
    renderTasks(tasks);

    try {
        supabaseClient.from('tasks').upsert(newTask).then(() => {});
    } catch (e) {}
}

function deleteTask(id) {
    if (!confirm('Hapus task logistik ini?')) return;
    let tasks = STORAGE.get('outing_tasks', []);
    tasks = tasks.filter(t => String(t.id) !== String(id));
    STORAGE.set('outing_tasks', tasks);
    renderTasks(tasks);
}

/* =====================================================
   KONSUMSI / MEAL PLAN MODULE
===================================================== */
async function loadKonsumsi() {
    try {
        let list = [];
        try {
            const { data } = await supabaseClient.from('consumption_plans').select('*').order('date', { ascending: true });
            if (data && data.length > 0) list = data;
        } catch (e) {}

        if (list.length === 0) {
            list = STORAGE.get('outing_consumptions', []);
        }

        renderKonsumsi(list);
    } catch (error) {
        console.error('loadKonsumsi error:', error);
    }
}

function renderKonsumsi(data) {
    const container = document.getElementById('konsumsiList');
    if (!container) return;

    let totalPortions = 0;
    let totalEst = 0;
    data.forEach(c => {
        totalPortions += Number(c.participant_count || 0);
        totalEst += Number(c.estimated_cost || 0);
    });

    document.getElementById('statKonsumsiCount').textContent = data.length;
    document.getElementById('statKonsumsiPortions').textContent = totalPortions + ' Porsi';
    document.getElementById('statKonsumsiCost').textContent = formatRupiah(totalEst);

    if (!data.length) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-cup"></i><div>Belum ada jadwal konsumsi.</div></div>`;
        return;
    }

    const isManager = canManage('konsumsi');

    container.innerHTML = data.map(item => {
        let statusBadge = 'bg-secondary';
        if (item.status === 'ORDERED') statusBadge = 'bg-primary';
        if (item.status === 'SERVED') statusBadge = 'bg-success';
        if (item.status === 'CANCELLED') statusBadge = 'bg-danger';

        return `
            <div class="card border border-light-subtle rounded-3 p-3 mb-3 shadow-sm bg-white">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="badge bg-warning text-dark me-1">${item.meal_type}</span>
                        <span class="badge ${statusBadge}">${item.status}</span>
                        <h6 class="fw-bold mb-0 mt-2"><i class="bi bi-geo-alt text-danger me-1"></i>${item.location || 'Area Outing'}</h6>
                    </div>
                    ${isManager ? `
                        <div class="dropdown">
                            <button class="btn btn-sm btn-light p-1" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                            <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                <li><a class="dropdown-item small" href="javascript:void(0)" onclick="openConsumptionModal('${item.id}')"><i class="bi bi-pencil me-1"></i> Edit</a></li>
                                <li><a class="dropdown-item small text-danger" href="javascript:void(0)" onclick="deleteConsumption('${item.id}')"><i class="bi bi-trash me-1"></i> Hapus</a></li>
                            </ul>
                        </div>
                    ` : ''}
                </div>

                <div class="row g-2 small text-muted my-2">
                    <div class="col-6 col-md-3"><strong>Tanggal:</strong> ${item.date || '-'}</div>
                    <div class="col-6 col-md-3"><strong>Porsi:</strong> ${item.participant_count || 0} Orang</div>
                    <div class="col-6 col-md-3"><strong>Vendor:</strong> ${item.vendor || '-'}</div>
                    <div class="col-6 col-md-3"><strong>Estimasi:</strong> <span class="text-primary fw-semibold">${formatRupiah(item.estimated_cost)}</span></div>
                </div>

                ${item.notes ? `<div class="bg-light p-2 rounded small text-secondary"><i class="bi bi-egg-fried me-1"></i><strong>Menu:</strong> ${item.notes}</div>` : ''}
            </div>
        `;
    }).join('');
}

function openConsumptionModal(id = null) {
    if (!canManage('konsumsi')) {
        alert('Hanya Section Konsumsi atau Admin yang dapat mengatur rencana konsumsi.');
        return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalConsumption'));
    document.getElementById('formConsumption').reset();
    document.getElementById('consDate').value = new Date().toISOString().split('T')[0];

    if (id) {
        document.getElementById('modalConsumptionTitle').textContent = 'Edit Jadwal Konsumsi';
        const list = STORAGE.get('outing_consumptions', []);
        const item = list.find(c => String(c.id) === String(id));
        if (item) {
            document.getElementById('consumptionId').value = item.id;
            document.getElementById('consDate').value = item.date || '';
            document.getElementById('consMealType').value = item.meal_type || 'SARAPAN';
            document.getElementById('consLocation').value = item.location || '';
            document.getElementById('consParticipantCount').value = item.participant_count || 80;
            document.getElementById('consVendor').value = item.vendor || '';
            document.getElementById('consEstCost').value = item.estimated_cost || 0;
            document.getElementById('consActCost').value = item.actual_cost || 0;
            document.getElementById('consStatus').value = item.status || 'PLANNED';
            document.getElementById('consNotes').value = item.notes || '';
        }
    } else {
        document.getElementById('modalConsumptionTitle').textContent = 'Tambah Jadwal Konsumsi Baru';
        document.getElementById('consumptionId').value = '';
    }
    modal.show();
}

function saveConsumption(e) {
    e.preventDefault();
    const id = document.getElementById('consumptionId').value;
    const list = STORAGE.get('outing_consumptions', []);
    const newCons = {
        id: id || generateUUID(),
        date: document.getElementById('consDate').value,
        meal_type: document.getElementById('consMealType').value,
        location: document.getElementById('consLocation').value.trim(),
        participant_count: Number(document.getElementById('consParticipantCount').value),
        vendor: document.getElementById('consVendor').value.trim(),
        estimated_cost: Number(document.getElementById('consEstCost').value) || 0,
        actual_cost: Number(document.getElementById('consActCost').value) || 0,
        status: document.getElementById('consStatus').value,
        notes: document.getElementById('consNotes').value.trim(),
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = list.findIndex(c => String(c.id) === String(id));
        if (idx !== -1) list[idx] = newCons;
    } else {
        list.push(newCons);
    }

    STORAGE.set('outing_consumptions', list);
    bootstrap.Modal.getInstance(document.getElementById('modalConsumption')).hide();
    renderKonsumsi(list);

    try {
        supabaseClient.from('consumption_plans').upsert(newCons).then(() => {});
    } catch (e) {}
}

function deleteConsumption(id) {
    if (!confirm('Hapus jadwal makan ini?')) return;
    let list = STORAGE.get('outing_consumptions', []);
    list = list.filter(c => String(c.id) !== String(id));
    STORAGE.set('outing_consumptions', list);
    renderKonsumsi(list);
}

/* =====================================================
   PUBLIC AREA & ANNOUNCEMENTS MODULE
===================================================== */
async function loadAnnouncements() {
    try {
        let list = [];
        try {
            const { data } = await supabaseClient.from('announcements').select('*').order('created_at', { ascending: false });
            if (data && data.length > 0) list = data;
        } catch (e) {}

        if (list.length === 0) {
            list = STORAGE.get('outing_announcements', []);
        }

        renderAnnouncements(list);
    } catch (error) {
        console.error('loadAnnouncements error:', error);
    }
}

function renderAnnouncements(data) {
    const home = document.getElementById('homeAnnouncements');
    const pubList = document.getElementById('publicAreaList');
    const isManager = canManage('public_area');

    if (!data.length) {
        const empty = `<div class="empty-state"><i class="bi bi-megaphone"></i><div>Belum ada pengumuman.</div></div>`;
        if (home) home.innerHTML = empty;
        if (pubList) pubList.innerHTML = empty;
        return;
    }

    if (home) {
        home.innerHTML = data.slice(0, 3).map(item => `
            <div class="border-bottom py-2">
                <div class="d-flex justify-content-between">
                    <span class="fw-semibold small">${item.title}</span>
                    <span class="badge ${item.priority === 'HIGH' ? 'bg-danger' : 'bg-light text-dark border'}" style="font-size: 10px;">${item.priority || 'INFO'}</span>
                </div>
                <div class="text-muted small mt-1 text-truncate">${item.content || item.message || ''}</div>
            </div>
        `).join('');
    }

    if (pubList) {
        pubList.innerHTML = data.map(item => {
            const isHigh = item.priority === 'HIGH';
            return `
                <div class="card border border-light-subtle rounded-3 p-3 mb-3 shadow-sm bg-white">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <span class="badge ${isHigh ? 'bg-danger' : 'bg-primary'} mb-1">${item.priority || 'NORMAL'}</span>
                            <h6 class="fw-bold mb-0 mt-1">${item.title}</h6>
                        </div>
                        ${isManager ? `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-light p-1" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button>
                                <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                                    <li><a class="dropdown-item small" href="javascript:void(0)" onclick="openAnnouncementModal('${item.id}')"><i class="bi bi-pencil me-1"></i> Edit</a></li>
                                    <li><a class="dropdown-item small text-danger" href="javascript:void(0)" onclick="deleteAnnouncement('${item.id}')"><i class="bi bi-trash me-1"></i> Hapus</a></li>
                                </ul>
                            </div>
                        ` : ''}
                    </div>

                    <p class="text-secondary small mb-2">${item.content || item.message || ''}</p>

                    <div class="d-flex justify-content-between align-items-center pt-2 border-top small text-muted">
                        <span><i class="bi bi-calendar-check me-1"></i>Dipublish: ${item.publish_date || 'Hari ini'}</span>
                        ${item.expired_date ? `<span><i class="bi bi-hourglass-split me-1"></i>Berlaku s/d: ${item.expired_date}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

function openAnnouncementModal(id = null) {
    if (!canManage('public_area')) {
        alert('Hanya Section Public Area atau Admin yang dapat membuat pengumuman.');
        return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAnnouncement'));
    document.getElementById('formAnnouncement').reset();

    if (id) {
        document.getElementById('modalAnnouncementTitle').textContent = 'Edit Pengumuman';
        const list = STORAGE.get('outing_announcements', []);
        const item = list.find(a => String(a.id) === String(id));
        if (item) {
            document.getElementById('announcementId').value = item.id;
            document.getElementById('annTitle').value = item.title || '';
            document.getElementById('annContent').value = item.content || item.message || '';
            document.getElementById('annPriority').value = item.priority || 'NORMAL';
            document.getElementById('annExpiredDate').value = item.expired_date || '';
        }
    } else {
        document.getElementById('modalAnnouncementTitle').textContent = 'Buat Pengumuman Baru';
        document.getElementById('announcementId').value = '';
    }
    modal.show();
}

function saveAnnouncement(e) {
    e.preventDefault();
    const id = document.getElementById('announcementId').value;
    const list = STORAGE.get('outing_announcements', []);
    const newAnn = {
        id: id || generateUUID(),
        title: document.getElementById('annTitle').value.trim(),
        content: document.getElementById('annContent').value.trim(),
        message: document.getElementById('annContent').value.trim(),
        priority: document.getElementById('annPriority').value,
        publish_date: new Date().toISOString().split('T')[0],
        expired_date: document.getElementById('annExpiredDate').value || null,
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = list.findIndex(a => String(a.id) === String(id));
        if (idx !== -1) list[idx] = newAnn;
    } else {
        list.unshift(newAnn);
    }

    STORAGE.set('outing_announcements', list);
    bootstrap.Modal.getInstance(document.getElementById('modalAnnouncement')).hide();
    renderAnnouncements(list);

    try {
        supabaseClient.from('announcements').upsert(newAnn).then(() => {});
    } catch (e) {}
}

function deleteAnnouncement(id) {
    if (!confirm('Hapus pengumuman ini?')) return;
    let list = STORAGE.get('outing_announcements', []);
    list = list.filter(a => String(a.id) !== String(id));
    STORAGE.set('outing_announcements', list);
    renderAnnouncements(list);
}

/* =====================================================
   PARTICIPANTS MODULE
===================================================== */
async function loadParticipants() {
    try {
        // 1. Pastikan seluruh user yang telah mendaftar otomatis masuk ke data peserta
        syncUsersToParticipants();

        let participants = [];
        try {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                const { data } = await supabaseClient.from('participants').select('*');
                if (data && data.length > 0) {
                    participants = data;
                }
            }
        } catch (e) {}

        const localParts = STORAGE.get('outing_participants', []);
        localParts.forEach(lp => {
            const cleanLp = (lp.username || '').replace(/^@+/, '').toLowerCase();
            if (!participants.some(p => ((p.username || '').replace(/^@+/, '').toLowerCase() === cleanLp) || String(p.id) === String(lp.id))) {
                participants.push(lp);
            }
        });

        // Perbarui angka statistik peserta di dashboard
        const statEl = document.getElementById('statParticipants');
        if (statEl) {
            statEl.textContent = participants.length;
        }

        renderParticipants(participants);
    } catch (error) {
        console.error('loadParticipants error:', error);
    }
}

function renderParticipants(list) {
    const container = document.getElementById('participantsList');
    if (!container) return;

    if (!list || list.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="bi bi-person-x"></i><div>Belum ada peserta terdaftar.</div></div>`;
        return;
    }

    const currentUsername = (currentProfile?.username || currentUser?.username || '').toLowerCase().replace(/^@+/, '');
    const isManager = canManage('participants');

    container.innerHTML = list.map(item => {
        const username = (item.username || '-').replace(/^@+/, '');
        const name = item.full_name || item.name || username;
        const initial = (name.charAt(0) || 'U').toUpperCase();
        const isMe = currentUsername && username.toLowerCase() === currentUsername;

        return `
            <div class="d-flex align-items-center justify-content-between py-3 border-bottom">
                <div class="d-flex align-items-center gap-3">
                    <div class="avatar" style="width: 44px; height: 44px; font-size: 18px;">${initial}</div>
                    <div>
                        <div class="fw-semibold">
                            ${name}
                            ${isMe ? '<span class="badge bg-primary ms-1">Anda</span>' : ''}
                        </div>
                        <div class="text-muted small">
                            User ID: <strong class="text-dark">@${username}</strong> • ${item.phone || '-'}
                        </div>
                        <div class="small mt-1">
                            ${item.department ? `<span class="badge bg-light text-dark border me-1"><i class="bi bi-building"></i> ${item.department}</span>` : ''}
                            ${item.transport ? `<span class="badge bg-light text-dark border me-1"><i class="bi bi-bus-front"></i> ${item.transport}</span>` : ''}
                            ${item.room ? `<span class="badge bg-light text-dark border"><i class="bi bi-door-closed"></i> ${item.room}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="text-end">
                    <span class="badge bg-light text-dark border mb-1">${item.status || item.role || 'CONFIRMED'}</span>
                    ${isManager ? `
                        <div>
                            <button class="btn btn-sm btn-link p-0 text-decoration-none" onclick="openParticipantModal('${item.id}')">Edit</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function searchParticipants(query) {
    syncUsersToParticipants();
    const all = STORAGE.get('outing_participants', []);
    if (!query || !query.trim()) {
        renderParticipants(all);
        return;
    }
    const q = query.toLowerCase().trim();
    const qCleanUser = q.replace(/^@+/, '');
    const filtered = all.filter(p => {
        const pName = (p.full_name || p.name || '').toLowerCase();
        const pUser = (p.username || '').toLowerCase().replace(/^@+/, '');
        const pDept = (p.department || '').toLowerCase();
        const pPhone = (p.phone || '').replace(/\D/g, '');
        const qDigits = q.replace(/\D/g, '');

        return pName.includes(q) ||
               pUser.includes(qCleanUser) ||
               pDept.includes(q) ||
               (qDigits && pPhone.includes(qDigits));
    });
    renderParticipants(filtered);
}

function openParticipantModal(id = null) {
    if (!canManage('participants')) {
        alert('Hanya Admin atau Inisiator yang dapat menambah/mengedit data peserta.');
        return;
    }
    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalParticipant'));
    document.getElementById('formParticipant').reset();

    if (id) {
        document.getElementById('modalParticipantTitle').textContent = 'Edit Data Peserta';
        const list = STORAGE.get('outing_participants', []);
        const item = list.find(p => String(p.id) === String(id));
        if (item) {
            document.getElementById('participantId').value = item.id;
            document.getElementById('partName').value = item.full_name || item.name || '';
            document.getElementById('partUsername').value = (item.username || '').replace(/^@+/, '');
            document.getElementById('partPhone').value = item.phone || '';
            document.getElementById('partDept').value = item.department || '';
            document.getElementById('partGender').value = item.gender || 'L';
            document.getElementById('partTransport').value = item.transport || '';
            document.getElementById('partRoom').value = item.room || '';
            document.getElementById('partStatus').value = item.status || 'CONFIRMED';
        }
    } else {
        document.getElementById('modalParticipantTitle').textContent = 'Tambah Peserta Baru';
        document.getElementById('participantId').value = '';
    }
    modal.show();
}

function saveParticipant(e) {
    e.preventDefault();
    const id = document.getElementById('participantId').value;
    const list = STORAGE.get('outing_participants', []);
    const rawUser = document.getElementById('partUsername').value.trim();
    const cleanUser = rawUser.replace(/^@+/, '').toLowerCase();
    const fullName = document.getElementById('partName').value.trim();
    const phone = document.getElementById('partPhone').value.trim();

    const newPart = {
        id: id || generateUUID(),
        full_name: fullName,
        name: fullName,
        username: cleanUser || `user_${Date.now().toString().slice(-4)}`,
        phone: phone,
        department: document.getElementById('partDept').value.trim() || 'Peserta',
        gender: document.getElementById('partGender').value || 'L',
        transport: document.getElementById('partTransport').value.trim() || 'Bus 1',
        room: document.getElementById('partRoom').value.trim() || 'Villa',
        status: document.getElementById('partStatus').value || 'CONFIRMED',
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = list.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) list[idx] = { ...list[idx], ...newPart };
    } else {
        list.push(newPart);
    }

    STORAGE.set('outing_participants', list);
    bootstrap.Modal.getInstance(document.getElementById('modalParticipant')).hide();
    renderParticipants(list);

    const statEl = document.getElementById('statParticipants');
    if (statEl) {
        statEl.textContent = list.length;
    }
}

/* =====================================================
   MANAGEMENT MENU TILES SETUP
===================================================== */
function setupManagementMenu() {
    const container = document.getElementById('managementMenu');
    if (!container) return;
    container.innerHTML = '';

    const role = getUserRole();
    const section = getUserSection();
    const isAll = role === 'ADMIN' || role === 'INITIATOR';

    const menus = [];

    // PARTICIPANTS (All users can view, admin manages)
    menus.push({
        icon: 'bi-people',
        title: 'Data Peserta',
        desc: 'Lihat daftar peserta, departemen, kamar & bus',
        action: "showPage('participants')"
    });

    // KEUANGAN
    menus.push({
        icon: 'bi-wallet2',
        title: 'Keuangan & Kas',
        desc: 'Laporan pemasukan, pengeluaran & saldo outing',
        action: "showPage('finance')"
    });

    // RUNDOWN
    menus.push({
        icon: 'bi-calendar-event',
        title: 'Rundown Acara',
        desc: 'Susunan jadwal kegiatan & lokasi outing',
        action: "showPage('rundown')"
    });

    // PURCHASING
    if (isAll || section.includes('PURCHASING') || role === 'PURCHASING') {
        menus.push({
            icon: 'bi-cart-check',
            title: 'Purchasing',
            desc: 'Pengadaan barang, estimasi & status approval',
            action: "showPage('purchasing')"
        });
    }

    // LOGISTIC
    if (isAll || section.includes('LOGISTIC') || role === 'LOGISTIC') {
        menus.push({
            icon: 'bi-box-seam',
            title: 'Logistic',
            desc: 'Task perlengkapan, armada & kesiapan teknis',
            action: "showPage('logistic')"
        });
    }

    // KONSUMSI
    if (isAll || section.includes('KONSUMSI') || role === 'KONSUMSI') {
        menus.push({
            icon: 'bi-cup-hot',
            title: 'Konsumsi',
            desc: 'Jadwal meal plan, porsi & pesanan katering',
            action: "showPage('konsumsi')"
        });
    }

    // PUBLIC AREA
    if (isAll || section.includes('PUBLIC') || role === 'PUBLIC_AREA') {
        menus.push({
            icon: 'bi-megaphone',
            title: 'Public Area',
            desc: 'Kelola siaran pengumuman & info peserta',
            action: "showPage('public_area')"
        });
    }

    // SOFTCOPY REPORT & ARSIP (Accessible to All Users, Great for viewing reports)
    menus.push({
        icon: 'bi-file-earmark-pdf',
        title: 'Softcopy Report & Arsip',
        desc: 'Unduh laporan LPJ resmi, arsip kegiatan & cetak dokumen',
        action: "openSoftcopyReportModal()"
    });

    // INITIATOR / SETTINGS
    if (isAll) {
        menus.push({
            icon: 'bi-sliders',
            title: 'Pengaturan Outing',
            desc: 'Konfigurasi acara, arsip outing & pembersihan Supabase',
            action: "showPage('settings')"
        });
    }

    container.innerHTML = menus.map(menu => `
        <div class="col-6 col-md-4">
            <div class="menu-card" onclick="${menu.action}">
                <div class="menu-icon"><i class="bi ${menu.icon}"></i></div>
                <div class="menu-title">${menu.title}</div>
                <div class="menu-desc">${menu.desc}</div>
            </div>
        </div>
    `).join('');
}

/* =====================================================
   PAGE NAVIGATION SWITCHER
===================================================== */
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const pageMap = {
        home: 'pageHome',
        rundown: 'pageRundown',
        finance: 'pageFinance',
        management: 'pageManagement',
        profile: 'pageProfile',
        participants: 'pageParticipants',
        purchasing: 'pagePurchasing',
        logistic: 'pageLogistic',
        konsumsi: 'pageKonsumsi',
        public_area: 'pagePublicArea',
        settings: 'pageSettings'
    };

    const target = document.getElementById(pageMap[page]);
    if (target) {
        target.classList.add('active');
    }

    // Bottom Navigation sync
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    const navBtn = document.getElementById('nav' + page.charAt(0).toUpperCase() + page.slice(1));
    if (navBtn) navBtn.classList.add('active');

    // Desktop Nav sync
    document.querySelectorAll('.desktop-nav .nav-link').forEach(l => l.classList.remove('active'));
    const dnavBtn = document.getElementById('dnav' + page.charAt(0).toUpperCase() + page.slice(1));
    if (dnavBtn) dnavBtn.classList.add('active');

    // Reload module data when opening page
    if (page === 'purchasing') loadPurchasing();
    if (page === 'logistic') loadTasks();
    if (page === 'konsumsi') loadKonsumsi();
    if (page === 'public_area') loadAnnouncements();
    if (page === 'participants') loadParticipants();
    if (page === 'rundown') loadRundown();
    if (page === 'finance') loadFinance();

    updateViewOnlyNotices();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showModule(moduleName) {
    const map = {
        'Purchasing': 'purchasing',
        'Logistic': 'logistic',
        'Konsumsi': 'konsumsi',
        'Public Area': 'public_area',
        'Pengaturan': 'settings',
        'Keuangan': 'finance',
        'Data Peserta': 'participants'
    };
    showPage(map[moduleName] || 'management');
}

/* =====================================================
   LOGOUT & SESSION CHECK
===================================================== */
async function logout() {
    if (!confirm('Apakah Anda yakin ingin logout?')) return;
    localStorage.removeItem('outing_session');
    try { await supabaseClient.auth.signOut(); } catch (e) {}
    currentUser = null;
    currentProfile = null;
    currentOuting = null;
    showLogin();
    document.getElementById('loginForm')?.reset();
}

async function checkSession() {
    const saved = STORAGE.get('outing_session', null);
    if (saved && saved.username) {
        currentUser = saved;
        currentProfile = saved;
        await loadDashboard();
    } else {
        showLogin();
    }
}

/* ====================================================================
   OUTING SOFTCOPY REPORT & SUPABASE LIFECYCLE MANAGEMENT ENGINE
   - Softcopy LPJ Generator (PDF/Print/HTML/Excel/JSON)
   - Previous Outing Archives (Selector & Manager)
   - Supabase Data Purge & New Outing Cycle
==================================================================== */
let currentSelectedReportOutingId = 'current';

function saveCurrentOutingToArchivePrompt() {
    const info = STORAGE.get('outing_current_info', {}) || {};
    const defaultTitle = `${info.name || 'Annual Outing'} (${new Date().toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })})`;
    const title = prompt('Masukkan nama label arsip outing ini:', defaultTitle);
    if (!title) return;

    const saved = saveCurrentOutingToArchive(title);
    alert(`Outing "${saved.title}" berhasil diarsipkan ke Riwayat Outing Sebelumnya! Anda dapat mengunduh softcopy report-nya kapan saja.`);
    updateArchiveSelectors();
    renderArchivesTable();
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
            totalPurchasingEst: totalPurchasingEst,
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

function generateSoftcopyReportHtml(data) {
    if (!data) return '<div class="alert alert-warning p-4 text-center">Data outing tidak ditemukan.</div>';

    const out = data.outing || {};
    const stats = data.stats || {};
    const rundowns = data.rundowns || [];
    const transactions = data.transactions || [];
    const purchases = data.purchases || [];
    const tasks = data.tasks || [];
    const consumptions = data.consumptions || [];
    const announcements = data.announcements || [];
    const participants = data.participants || [];

    const formatCurrency = (num) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');
    const statusText = out.status || 'ACTIVE';
    const badgeClass = statusText === 'COMPLETED' ? 'bg-success text-white' : (statusText === 'ACTIVE' ? 'bg-primary text-white' : 'bg-warning text-dark');

    const printDate = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    let html = `
        <div class="report-header-box">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                    <div class="report-title">${escapeHtml(out.name || 'LAPORAN KEGIATAN OUTING')}</div>
                    <div class="report-subtitle">
                        LAPORAN PERTANGGUNGJAWABAN (LPJ) &amp; REKAPITULASI RESMI ACARA
                    </div>
                </div>
                <div class="text-end">
                    <span class="report-badge-status ${badgeClass}">STATUS: ${statusText}</span>
                    <div class="text-muted mt-1" style="font-size: 11px;">Tanggal Cetak: ${printDate}</div>
                </div>
            </div>
        </div>

        <!-- INFORMASI ACARA -->
        <div class="report-meta-grid">
            <div class="report-meta-item">
                <strong>Tanggal Pelaksanaan:</strong>
                <span>${escapeHtml(out.start_date || '-')} s/d ${escapeHtml(out.end_date || '-')}</span>
            </div>
            <div class="report-meta-item">
                <strong>Lokasi / Venue:</strong>
                <span>${escapeHtml(out.location || '-')}</span>
            </div>
            <div class="report-meta-item">
                <strong>Alamat Lengkap:</strong>
                <span>${escapeHtml(out.address || '-')}</span>
            </div>
            <div class="report-meta-item">
                <strong>Tema &amp; Deskripsi:</strong>
                <span>${escapeHtml(out.description || 'Kebersamaan seluruh anggota panitia dan peserta.')}</span>
            </div>
        </div>

        <!-- KPI SUMMARY ROW -->
        <div class="report-kpi-row">
            <div class="report-kpi-card">
                <div class="report-kpi-label">Total Peserta</div>
                <div class="report-kpi-val text-primary">${stats.totalParticipants || 0} Orang</div>
            </div>
            <div class="report-kpi-card kpi-success">
                <div class="report-kpi-label">Sisa Saldo Kas</div>
                <div class="report-kpi-val text-success">${formatCurrency(stats.balance || 0)}</div>
            </div>
            <div class="report-kpi-card kpi-danger">
                <div class="report-kpi-label">Total Pengeluaran</div>
                <div class="report-kpi-val text-danger">${formatCurrency(stats.totalExpense || 0)}</div>
            </div>
            <div class="report-kpi-card kpi-warning">
                <div class="report-kpi-label">Realisasi Belanja</div>
                <div class="report-kpi-val text-warning">${formatCurrency(stats.totalPurchasingActual || 0)}</div>
            </div>
            <div class="report-kpi-card kpi-info">
                <div class="report-kpi-label">Progress Logistik</div>
                <div class="report-kpi-val text-info">${stats.taskDonePercent || 0}% Selesai</div>
            </div>
        </div>

        <!-- BAB I: RUNDOWN -->
        <div class="report-section-heading">
            <span><i class="bi bi-calendar-event me-1"></i> BAB I. SUSUNAN ACARA &amp; RUNDOWN KEGIATAN</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${rundowns.length} Agenda Kegiatan</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 140px;">Waktu Pelaksanaan</th>
                    <th>Nama Kegiatan / Agenda</th>
                    <th>Lokasi</th>
                    <th>Keterangan / PIC</th>
                </tr>
            </thead>
            <tbody>
                ${rundowns.length === 0 ? '<tr><td colspan="5" class="text-center text-muted py-2">Tidak ada data rundown</td></tr>' : 
                    rundowns.map((r, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-semibold text-nowrap">${escapeHtml(r.start_time || '')} ${r.end_time ? '- ' + escapeHtml(r.end_time) : ''}</td>
                            <td class="fw-bold">${escapeHtml(r.title || r.activity || '-')}</td>
                            <td>${escapeHtml(r.location || '-')}</td>
                            <td>${escapeHtml(r.description || '-')}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB II: KEUANGAN -->
        <div class="report-section-heading">
            <span><i class="bi bi-wallet2 me-1"></i> BAB II. LAPORAN PERTANGGUNGJAWABAN KEUANGAN (BUKU KAS)</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">Pemasukan: ${formatCurrency(stats.totalIncome)} | Pengeluaran: ${formatCurrency(stats.totalExpense)}</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 90px;">Tanggal</th>
                    <th style="width: 70px;" class="text-center">Jenis</th>
                    <th>Kategori</th>
                    <th>Deskripsi / Uraian Transaksi</th>
                    <th class="text-end" style="width: 120px;">Nominal (Rp)</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.length === 0 ? '<tr><td colspan="6" class="text-center text-muted py-2">Tidak ada data transaksi keuangan</td></tr>' :
                    transactions.map((t, i) => {
                        const isInc = ['IN', 'INCOME', 'MASUK'].includes(String(t.type || '').toUpperCase());
                        return `
                            <tr>
                                <td class="text-center">${i + 1}</td>
                                <td>${escapeHtml(t.transaction_date || '-')}</td>
                                <td class="text-center"><span class="badge ${isInc ? 'bg-success' : 'bg-danger'}" style="font-size: 9.5px;">${isInc ? 'MASUK' : 'KELUAR'}</span></td>
                                <td class="fw-semibold">${escapeHtml(t.category || '-')}</td>
                                <td>${escapeHtml(t.description || '-')}</td>
                                <td class="text-end fw-bold ${isInc ? 'text-success' : 'text-danger'}">${formatCurrency(t.amount)}</td>
                            </tr>
                        `;
                    }).join('')
                }
                <tr style="background: #edf2f7; font-weight: 700;">
                    <td colspan="5" class="text-end">SISA SALDO KAS AKHIR:</td>
                    <td class="text-end text-primary fs-6">${formatCurrency(stats.balance || 0)}</td>
                </tr>
            </tbody>
        </table>

        <!-- BAB III: PURCHASING -->
        <div class="report-section-heading">
            <span><i class="bi bi-cart-check me-1"></i> BAB III. REKAPITULASI PENGADAAN BARANG &amp; JASA (PURCHASING)</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${purchases.length} Permintaan Pengadaan</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th>Nama Barang / Kebutuhan</th>
                    <th style="width: 70px;" class="text-center">Qty / Satuan</th>
                    <th class="text-end" style="width: 100px;">Estimasi</th>
                    <th class="text-end" style="width: 100px;">Biaya Aktual</th>
                    <th>Vendor / Toko</th>
                    <th style="width: 90px;" class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                ${purchases.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data purchasing</td></tr>' :
                    purchases.map((p, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-bold">${escapeHtml(p.item_name || p.item || '-')}</td>
                            <td class="text-center">${p.quantity || 1} ${escapeHtml(p.unit || 'Pcs')}</td>
                            <td class="text-end text-muted">${formatCurrency(p.estimated_cost)}</td>
                            <td class="text-end fw-bold text-dark">${formatCurrency(p.actual_cost)}</td>
                            <td>${escapeHtml(p.vendor || '-')}</td>
                            <td class="text-center"><span class="badge bg-secondary" style="font-size: 9.5px;">${escapeHtml(p.status || 'PENDING')}</span></td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB IV: LOGISTIK & TUGAS -->
        <div class="report-section-heading">
            <span><i class="bi bi-box-seam me-1"></i> BAB IV. LOGISTIK, PERLENGKAPAN &amp; OPERASIONAL</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${tasks.length} Tugas Operasional</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th>Nama Tugas / Perlengkapan</th>
                    <th style="width: 80px;" class="text-center">Prioritas</th>
                    <th style="width: 90px;">Deadline</th>
                    <th>Penanggung Jawab</th>
                    <th style="width: 70px;" class="text-center">Progress</th>
                    <th style="width: 80px;" class="text-center">Status</th>
                </tr>
            </thead>
            <tbody>
                ${tasks.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data tugas logistik</td></tr>' :
                    tasks.map((t, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-bold">${escapeHtml(t.title || t.description || '-')}</td>
                            <td class="text-center">${escapeHtml(t.priority || 'MEDIUM')}</td>
                            <td>${escapeHtml(t.deadline || '-')}</td>
                            <td>${escapeHtml(t.assigned_to || '-')}</td>
                            <td class="text-center fw-bold text-primary">${t.progress || (t.status === 'DONE' ? 100 : 0)}%</td>
                            <td class="text-center"><span class="badge ${t.status === 'DONE' ? 'bg-success' : 'bg-warning text-dark'}" style="font-size: 9.5px;">${escapeHtml(t.status || 'TODO')}</span></td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB V: KONSUMSI -->
        <div class="report-section-heading">
            <span><i class="bi bi-cup-hot me-1"></i> BAB V. RENCANA &amp; REALISASI KONSUMSI (MEAL PLAN)</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${consumptions.length} Sesi Makan</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 90px;">Tanggal</th>
                    <th style="width: 110px;">Sesi Makan</th>
                    <th>Lokasi Makan</th>
                    <th style="width: 80px;" class="text-center">Porsi</th>
                    <th>Vendor Katering</th>
                    <th class="text-end" style="width: 100px;">Biaya Aktual</th>
                </tr>
            </thead>
            <tbody>
                ${consumptions.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data meal plan konsumsi</td></tr>' :
                    consumptions.map((c, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td>${escapeHtml(c.date || '-')}</td>
                            <td class="fw-bold">${escapeHtml(c.meal_type || '-')}</td>
                            <td>${escapeHtml(c.location || '-')}</td>
                            <td class="text-center">${c.participant_count || 0} porsi</td>
                            <td>${escapeHtml(c.vendor || '-')}</td>
                            <td class="text-end fw-bold">${formatCurrency(c.actual_cost || c.estimated_cost)}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB VI: PENGUMUMAN -->
        <div class="report-section-heading">
            <span><i class="bi bi-megaphone me-1"></i> BAB VI. RIWAYAT SIARAN INFORMASI &amp; PENGUMUMAN</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${announcements.length} Siaran Informasi</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 40px;" class="text-center">No</th>
                    <th style="width: 90px;">Tanggal</th>
                    <th style="width: 180px;">Judul Pengumuman</th>
                    <th style="width: 80px;" class="text-center">Prioritas</th>
                    <th>Isi Pesan Siaran</th>
                </tr>
            </thead>
            <tbody>
                ${announcements.length === 0 ? '<tr><td colspan="5" class="text-center text-muted py-2">Tidak ada siaran pengumuman</td></tr>' :
                    announcements.map((a, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td>${escapeHtml(a.publish_date || '-')}</td>
                            <td class="fw-bold">${escapeHtml(a.title || '-')}</td>
                            <td class="text-center"><span class="badge ${a.priority === 'HIGH' ? 'bg-danger' : 'bg-primary'}" style="font-size: 9.5px;">${escapeHtml(a.priority || 'NORMAL')}</span></td>
                            <td>${escapeHtml(a.content || a.message || '-')}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- BAB VII: PESERTA -->
        <div class="report-section-heading">
            <span><i class="bi bi-people me-1"></i> BAB VII. DIREKTORI PESERTA OUTING &amp; FASILITAS</span>
            <small class="text-muted fw-normal" style="font-size: 11px;">${participants.length} Peserta Terdaftar</small>
        </div>
        <table class="report-table">
            <thead>
                <tr>
                    <th style="width: 35px;" class="text-center">No</th>
                    <th>Nama Lengkap Peserta</th>
                    <th>Departemen</th>
                    <th style="width: 45px;" class="text-center">L/P</th>
                    <th>Armada Bus</th>
                    <th>Kamar / Rooming</th>
                    <th>No. WhatsApp</th>
                </tr>
            </thead>
            <tbody>
                ${participants.length === 0 ? '<tr><td colspan="7" class="text-center text-muted py-2">Tidak ada data peserta</td></tr>' :
                    participants.map((p, i) => `
                        <tr>
                            <td class="text-center">${i + 1}</td>
                            <td class="fw-bold">${escapeHtml(p.full_name || p.name || '-')}</td>
                            <td>${escapeHtml(p.department || '-')}</td>
                            <td class="text-center">${escapeHtml(p.gender || 'L')}</td>
                            <td>${escapeHtml(p.transport || 'Bus 1')}</td>
                            <td>${escapeHtml(p.room || 'Villa')}</td>
                            <td>${escapeHtml(p.phone || '-')}</td>
                        </tr>
                    `).join('')
                }
            </tbody>
        </table>

        <!-- LEMBAR PENGESAHAN / TANDA TANGAN -->
        <div class="report-signatures">
            <div class="report-sign-box">
                <div>Mengetahui,</div>
                <div class="fw-bold">Ketua Panitia / Inisiator Acara</div>
                <div class="report-sign-line">Budi Santoso</div>
                <div class="text-muted" style="font-size: 10.5px;">Ketua Pelaksana Outing</div>
            </div>
            <div class="report-sign-box">
                <div>Dibuat &amp; Dilaporkan Oleh,</div>
                <div class="fw-bold">Seksi Keuangan / Bendahara</div>
                <div class="report-sign-line">Siti Rahma</div>
                <div class="text-muted" style="font-size: 10.5px;">Bendahara Panitia Outing</div>
            </div>
        </div>
    `;

    return html;
}

function updateArchiveSelectors() {
    const archives = getOutingArchives();
    const currentInfo = STORAGE.get('outing_current_info', {}) || {};
    const currentLabel = `🟢 Outing Aktif: ${currentInfo.name || 'Annual Outing'}`;

    const settingSel = document.getElementById('settingOutingArchiveSelector');
    const modalSel = document.getElementById('modalReportOutingSelector');

    let optionsHtml = `<option value="current">${escapeHtml(currentLabel)}</option>`;
    if (archives && archives.length > 0) {
        archives.forEach(arch => {
            const dt = arch.created_at ? new Date(arch.created_at).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '';
            optionsHtml += `<option value="${arch.id}">📦 ${escapeHtml(arch.title || arch.outing?.name || 'Arsip')} (${dt})</option>`;
        });
    }

    if (settingSel) settingSel.innerHTML = optionsHtml;
    if (modalSel) modalSel.innerHTML = optionsHtml;

    onSelectArchiveOuting(currentSelectedReportOutingId || 'current');
}

function onSelectArchiveOuting(selectedId) {
    currentSelectedReportOutingId = selectedId || 'current';
    const settingSel = document.getElementById('settingOutingArchiveSelector');
    if (settingSel && settingSel.value !== currentSelectedReportOutingId) {
        settingSel.value = currentSelectedReportOutingId;
    }
    const modalSel = document.getElementById('modalReportOutingSelector');
    if (modalSel && modalSel.value !== currentSelectedReportOutingId) {
        modalSel.value = currentSelectedReportOutingId;
    }

    const previewCard = document.getElementById('selectedOutingPreviewCard');
    if (!previewCard) return;

    const data = getOutingDataForReport(currentSelectedReportOutingId);
    if (!data) {
        previewCard.innerHTML = '<div class="text-muted small">Data outing tidak ditemukan.</div>';
        return;
    }

    const out = data.outing || {};
    const stats = data.stats || {};
    const isAct = !data.isArchive;

    previewCard.innerHTML = `
        <div class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
            <div>
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="badge ${isAct ? 'bg-primary' : 'bg-secondary'}">${isAct ? 'Outing Aktif Saat Ini' : 'Outing Sebelumnya (Arsip)'}</span>
                    <strong class="text-dark">${escapeHtml(out.name || data.title)}</strong>
                </div>
                <div class="small text-muted">
                    <i class="bi bi-geo-alt me-1"></i>${escapeHtml(out.location || 'Puncak, Bogor')} &bull; 
                    <i class="bi bi-calendar me-1"></i>${escapeHtml(out.start_date || '-')} s/d ${escapeHtml(out.end_date || '-')}
                </div>
            </div>
            <div class="d-flex flex-wrap gap-2 text-center text-sm-end" style="font-size: 11.5px;">
                <div class="px-2 py-1 bg-white border rounded">
                    <div class="text-muted small">Peserta</div>
                    <strong class="text-primary">${stats.totalParticipants || 0}</strong>
                </div>
                <div class="px-2 py-1 bg-white border rounded">
                    <div class="text-muted small">Saldo Kas</div>
                    <strong class="text-success">Rp ${Number(stats.balance || 0).toLocaleString('id-ID')}</strong>
                </div>
                <div class="px-2 py-1 bg-white border rounded">
                    <div class="text-muted small">Purchasing</div>
                    <strong class="text-warning">Rp ${Number(stats.totalPurchasingActual || 0).toLocaleString('id-ID')}</strong>
                </div>
            </div>
        </div>
    `;
}

function renderArchivesTable() {
    const tbody = document.getElementById('archivesTableBody');
    const badge = document.getElementById('archiveCountBadge');
    if (!tbody) return;

    const archives = getOutingArchives();
    if (badge) badge.textContent = `${archives.length} arsip tersimpan`;

    if (!archives || archives.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-3 text-muted">
                    Belum ada riwayat arsip outing sebelumnya. Klik <strong>"Arsipkan Outing Aktif"</strong> untuk menyimpan snapshot outing saat ini.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = archives.map((arch, idx) => {
        const out = arch.outing || {};
        const stats = arch.stats || {};
        const archDate = arch.created_at ? new Date(arch.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
        return `
            <tr>
                <td>
                    <div class="fw-bold text-dark">${escapeHtml(arch.title || out.name || 'Outing')}</div>
                    <small class="text-muted">${escapeHtml(out.description || 'Arsip kegiatan outing sebelumnya')}</small>
                </td>
                <td>
                    <div>${escapeHtml(out.location || '-')}</div>
                    <small class="text-muted">${escapeHtml(out.start_date || '-')} s/d ${escapeHtml(out.end_date || '-')}</small>
                </td>
                <td class="text-center fw-semibold text-primary">${stats.totalParticipants || (arch.participants?.length || 0)} org</td>
                <td>
                    <div class="text-success fw-semibold">Saldo: Rp ${Number(stats.balance || 0).toLocaleString('id-ID')}</div>
                    <small class="text-muted">Biaya: Rp ${Number(stats.totalExpense || 0).toLocaleString('id-ID')}</small>
                </td>
                <td class="text-nowrap text-muted">${archDate}</td>
                <td class="text-end">
                    <div class="btn-group btn-group-sm">
                        <button type="button" class="btn btn-primary" onclick="openSoftcopyReportModal('${arch.id}')" title="Buka / Cetak Softcopy Report">
                            <i class="bi bi-file-earmark-pdf"></i> Report
                        </button>
                        <button type="button" class="btn btn-outline-success" onclick="exportArchiveMasterExcel('${arch.id}')" title="Unduh Master Rekap Excel 8-Sheet">
                            <i class="bi bi-file-earmark-excel"></i>
                        </button>
                        <button type="button" class="btn btn-outline-dark" onclick="downloadArchiveJson('${arch.id}')" title="Unduh file JSON">
                            <i class="bi bi-download"></i>
                        </button>
                        <button type="button" class="btn btn-outline-info" onclick="restoreArchiveToActive('${arch.id}')" title="Pulihkan data arsip ini ke sistem aktif">
                            <i class="bi bi-arrow-counterclockwise"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger" onclick="deleteArchive('${arch.id}')" title="Hapus arsip ini">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openSoftcopyReportModal(outingId) {
    currentSelectedReportOutingId = outingId || currentSelectedReportOutingId || 'current';
    updateArchiveSelectors();

    const data = getOutingDataForReport(currentSelectedReportOutingId);
    const printArea = document.getElementById('reportPrintArea');
    if (printArea) {
        printArea.innerHTML = generateSoftcopyReportHtml(data);
    }

    const modalEl = document.getElementById('modalSoftcopyReport');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
}

function onModalReportOutingChanged(newOutingId) {
    currentSelectedReportOutingId = newOutingId;
    const data = getOutingDataForReport(currentSelectedReportOutingId);
    const printArea = document.getElementById('reportPrintArea');
    if (printArea) {
        printArea.innerHTML = generateSoftcopyReportHtml(data);
    }
    const settingSel = document.getElementById('settingOutingArchiveSelector');
    if (settingSel) settingSel.value = newOutingId;
    onSelectArchiveOuting(newOutingId);
}

function printSoftcopyReport() {
    window.print();
}

function downloadCurrentModalHtmlReport() {
    downloadStandaloneHtmlReport(currentSelectedReportOutingId);
}

function downloadCurrentModalExcel() {
    exportArchiveMasterExcel(currentSelectedReportOutingId);
}

function downloadCurrentModalJson() {
    downloadArchiveJson(currentSelectedReportOutingId);
}

function downloadStandaloneHtmlReport(outingId) {
    const data = getOutingDataForReport(outingId);
    if (!data) {
        alert('Data outing tidak ditemukan.');
        return;
    }

    const reportBodyHtml = generateSoftcopyReportHtml(data);
    const safeTitle = (data.title || 'Laporan_Outing').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Report_Softcopy_${safeTitle}_${dateStr}.html`;

    const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report Softcopy - ${escapeHtml(data.title)}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
    <style>
        body {
            background: #e2e8f0;
            padding: 30px 15px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #1e293b;
        }
        .report-paper {
            background: #ffffff;
            width: 100%;
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 48px;
            box-shadow: 0 10px 35px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
        }
        .report-header-box { border-bottom: 3px double #0d6efd; padding-bottom: 18px; margin-bottom: 22px; }
        .report-title { font-size: 21px; font-weight: 800; color: #0b5ed7; text-transform: uppercase; margin-bottom: 3px; }
        .report-subtitle { font-size: 13.5px; color: #64748b; font-weight: 500; }
        .report-badge-status { display: inline-block; padding: 3px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .report-meta-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-bottom: 22px; font-size: 12.5px; }
        .report-meta-item strong { display: block; color: #64748b; font-size: 10.5px; text-transform: uppercase; margin-bottom: 2px; }
        .report-kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .report-kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #fff; border-top: 3.5px solid #0d6efd; }
        .report-kpi-card.kpi-success { border-top-color: #198754; }
        .report-kpi-card.kpi-warning { border-top-color: #f59e0b; }
        .report-kpi-card.kpi-danger  { border-top-color: #dc3545; }
        .report-kpi-card.kpi-info    { border-top-color: #0dcaf0; }
        .report-kpi-label { font-size: 10px; text-transform: uppercase; font-weight: 700; color: #64748b; }
        .report-kpi-val { font-size: 15.5px; font-weight: 800; color: #0f172a; margin-top: 2px; }
        .report-section-heading { font-size: 13.5px; font-weight: 700; color: #0f172a; text-transform: uppercase; padding-bottom: 5px; margin-top: 22px; margin-bottom: 10px; border-bottom: 1.5px solid #cbd5e1; display: flex; align-items: center; justify-content: space-between; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-bottom: 16px; }
        .report-table th { background: #f1f5f9; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 7px 9px; border: 1px solid #cbd5e1; text-align: left; }
        .report-table td { padding: 6.5px 9px; border: 1px solid #e2e8f0; vertical-align: top; }
        .report-table tr:nth-child(even) td { background: #f8fafc; }
        .report-signatures { margin-top: 32px; padding-top: 14px; display: flex; justify-content: space-around; text-align: center; font-size: 11.5px; }
        .report-sign-box { width: 220px; }
        .report-sign-line { margin-top: 55px; border-bottom: 1.5px solid #334155; font-weight: 700; padding-bottom: 4px; }
        .floating-bar { position: fixed; top: 15px; right: 15px; z-index: 999; background: white; padding: 8px 14px; border-radius: 30px; box-shadow: 0 4px 15px rgba(0,0,0,.15); display: flex; gap: 8px; }
        @media print {
            body { background: white !important; padding: 0 !important; }
            .report-paper { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
            .floating-bar { display: none !important; }
            @page { size: A4 portrait; margin: 12mm 14mm; }
        }
    </style>
</head>
<body>
    <div class="floating-bar">
        <button class="btn btn-sm btn-primary" onclick="window.print()"><i class="bi bi-printer me-1"></i> Cetak / Simpan PDF</button>
        <button class="btn btn-sm btn-outline-secondary" onclick="window.close()"><i class="bi bi-x-lg"></i></button>
    </div>
    <div class="report-paper">
        ${reportBodyHtml}
    </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Dokumen Softcopy Report <strong>${escapeHtml(data.title)}</strong> (.html) berhasil diunduh.`);
}

function downloadArchiveJson(outingId) {
    const data = getOutingDataForReport(outingId);
    if (!data) {
        alert('Data outing tidak ditemukan.');
        return;
    }

    const safeTitle = (data.title || 'Outing').replace(/[^a-zA-Z0-9_-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Backup_Outing_${safeTitle}_${dateStr}.json`;

    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Berkas Backup JSON <strong>${escapeHtml(filename)}</strong> berhasil diunduh.`);
}

function exportArchiveMasterExcel(outingId) {
    const data = getOutingDataForReport(outingId);
    if (!data) {
        alert('Data outing tidak ditemukan.');
        return;
    }

    const wb = XLSX.utils.book_new();
    const todayStr = new Date().toISOString().split('T')[0];
    const outing = data.outing || {};

    // Sheet 1: Overview
    const overviewData = [
        { "Parameter": "Nama Kegiatan Outing", "Nilai": outing.name || data.title },
        { "Parameter": "Tanggal Pelaksanaan", "Nilai": `${outing.start_date || '-'} s/d ${outing.end_date || '-'}` },
        { "Parameter": "Lokasi Utama / Venue", "Nilai": outing.location || '-' },
        { "Parameter": "Alamat Lengkap", "Nilai": outing.address || '-' },
        { "Parameter": "Tema / Deskripsi", "Nilai": outing.description || '-' },
        { "Parameter": "Status Acara", "Nilai": outing.status || 'ACTIVE' },
        { "Parameter": "Tipe Data", "Nilai": data.isArchive ? 'Arsip Outing Sebelumnya' : 'Outing Aktif' },
        { "Parameter": "Waktu Ekspor Master", "Nilai": new Date().toLocaleString('id-ID') }
    ];
    const wsOverview = XLSX.utils.json_to_sheet(overviewData);
    wsOverview['!cols'] = [{ wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsOverview, "Info Acara");

    // All Modules
    const moduleMap = [
        { key: 'rundown', name: 'Rundown Acara', data: data.rundowns || [] },
        { key: 'finance', name: 'Laporan Keuangan', data: data.transactions || [] },
        { key: 'purchasing', name: 'Purchasing', data: data.purchases || [] },
        { key: 'logistic', name: 'Logistik & Tugas', data: data.tasks || [] },
        { key: 'konsumsi', name: 'Konsumsi & Meal', data: data.consumptions || [] },
        { key: 'public_area', name: 'Public Area', data: data.announcements || [] },
        { key: 'participants', name: 'Data Peserta', data: data.participants || [] }
    ];

    moduleMap.forEach(m => {
        const conf = EXCEL_MODULE_CONFIG[m.key];
        const rows = conf ? conf.transformExport(m.data) : m.data;
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
        const sName = m.name.replace(/[\/\\?*:\[\]]/g, '').slice(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sName);
    });

    const safeTitle = (data.title || 'Master_Rekap').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Master_Rekap_${safeTitle}_${todayStr}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Master Rekap Excel <strong>${escapeHtml(filename)}</strong> (8 sheets) berhasil diunduh.`);
}

function restoreArchiveToActive(archiveId) {
    if (!canManage('settings')) {
        alert('Hanya Admin atau Inisiator yang berwenang memulihkan data outing.');
        return;
    }

    const archives = getOutingArchives();
    const found = archives.find(a => a.id === archiveId);
    if (!found) {
        alert('Arsip tidak ditemukan.');
        return;
    }

    const ok = confirm(`Apakah Anda yakin ingin memulihkan outing "${found.title}" menjadi outing aktif di sistem?\n\nData aktif saat ini akan digantikan dengan data dari arsip ini.`);
    if (!ok) return;

    // First, snapshot current active outing into archive
    saveCurrentOutingToArchive(`Cadangan Sebelum Restore (${new Date().toLocaleTimeString('id-ID')})`);

    // Restore data
    if (found.outing) STORAGE.set('outing_current_info', found.outing);
    if (found.rundowns) STORAGE.set('outing_rundowns', found.rundowns);
    if (found.transactions) STORAGE.set('outing_transactions', found.transactions);
    if (found.purchases) STORAGE.set('outing_purchases', found.purchases);
    if (found.tasks) STORAGE.set('outing_tasks', found.tasks);
    if (found.consumptions) STORAGE.set('outing_consumptions', found.consumptions);
    if (found.announcements) STORAGE.set('outing_announcements', found.announcements);
    if (found.participants) STORAGE.set('outing_participants', found.participants);

    // Sync Supabase Outing Info
    try {
        if (found.outing) supabaseClient.from('outings').upsert(found.outing).then(() => {});
    } catch (e) {}

    loadDashboard();
    alert(`Outing "${found.title}" berhasil dipulihkan menjadi outing aktif!`);
}

function deleteArchive(archiveId) {
    if (!canManage('settings')) {
        alert('Hanya Admin atau Inisiator yang dapat menghapus arsip.');
        return;
    }

    const archives = getOutingArchives();
    const found = archives.find(a => a.id === archiveId);
    if (!found) return;

    const ok = confirm(`Apakah Anda yakin ingin menghapus arsip "${found.title}" dari riwayat?`);
    if (!ok) return;

    const updated = archives.filter(a => a.id !== archiveId);
    STORAGE.set(STORAGE_KEY_ARCHIVES, updated);
    renderArchivesTable();
    updateArchiveSelectors();
    showToast('Arsip outing berhasil dihapus.');
}

function triggerImportArchiveJson() {
    const input = document.getElementById('inputImportArchiveJson');
    if (input) input.click();
}

function handleImportArchiveJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.outing && !data.title) {
                alert('Format berkas JSON arsip tidak valid.');
                return;
            }

            const newArchive = {
                id: 'arch-' + Date.now(),
                title: data.title || data.outing?.name || file.name.replace('.json', ''),
                created_at: new Date().toISOString(),
                outing: data.outing || {},
                stats: data.stats || {},
                rundowns: data.rundowns || [],
                transactions: data.transactions || [],
                purchases: data.purchases || [],
                tasks: data.tasks || [],
                consumptions: data.consumptions || [],
                announcements: data.announcements || [],
                participants: data.participants || []
            };

            const archives = getOutingArchives();
            archives.unshift(newArchive);
            STORAGE.set(STORAGE_KEY_ARCHIVES, archives);

            renderArchivesTable();
            updateArchiveSelectors();
            alert(`Arsip "${newArchive.title}" berhasil diimpor dari file JSON!`);
        } catch (err) {
            alert('Gagal membaca file JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function updateSupabaseStatsSummary() {
    const trans = STORAGE.get('outing_transactions', []) || [];
    const runds = STORAGE.get('outing_rundowns', []) || [];
    const purchs = STORAGE.get('outing_purchases', []) || [];
    const tasks = STORAGE.get('outing_tasks', []) || [];
    const conss = STORAGE.get('outing_consumptions', []) || [];
    const anns = STORAGE.get('outing_announcements', []) || [];
    const parts = STORAGE.get('outing_participants', []) || [];

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setVal('dbStatFinance', trans.length);
    setVal('dbStatRundown', runds.length);
    setVal('dbStatPurchasing', purchs.length);
    setVal('dbStatLogistic', tasks.length);
    setVal('dbStatKonsumsi', conss.length);
    setVal('dbStatParticipants', parts.length);

    setVal('purgeCntFinance', trans.length);
    setVal('purgeCntRundown', runds.length);
    setVal('purgeCntPurchasing', purchs.length);
    setVal('purgeCntTasks', tasks.length);
    setVal('purgeCntConsumptions', conss.length);
    setVal('purgeCntAnnouncements', anns.length);
}

function openPurgeSupabaseModal() {
    if (!canManage('settings')) {
        alert('Hanya Admin atau Inisiator yang berwenang membersihkan database Supabase dan memulai outing baru.');
        return;
    }

    updateSupabaseStatsSummary();

    const cur = STORAGE.get('outing_current_info', {}) || {};
    const nextYear = new Date().getFullYear() + 1;
    const nameInput = document.getElementById('newOutingName');
    if (nameInput) nameInput.value = `Annual Outing ${nextYear}`;
    const startInput = document.getElementById('newOutingStartDate');
    if (startInput) startInput.value = `${nextYear}-10-15`;
    const endInput = document.getElementById('newOutingEndDate');
    if (endInput) endInput.value = `${nextYear}-10-17`;
    const locInput = document.getElementById('newOutingLocation');
    if (locInput) locInput.value = 'Hotel & Resort Destinasi Pilihan';
    const addrInput = document.getElementById('newOutingAddress');
    if (addrInput) addrInput.value = '';
    const descInput = document.getElementById('newOutingDescription');
    if (descInput) descInput.value = 'Kegiatan Outing & Silaturahmi Tim';

    const msg = document.getElementById('purgeModalMessage');
    if (msg) msg.innerHTML = '';

    const modalEl = document.getElementById('modalPurgeSupabase');
    if (modalEl) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
    }
}

async function executePurgeSupabaseAndNewOuting() {
    const btn = document.getElementById('btnConfirmPurgeSupabase');
    const msg = document.getElementById('purgeModalMessage');
    const newName = document.getElementById('newOutingName').value.trim();
    const newStart = document.getElementById('newOutingStartDate').value;
    const newEnd = document.getElementById('newOutingEndDate').value;
    const newLoc = document.getElementById('newOutingLocation').value.trim();
    const newAddr = document.getElementById('newOutingAddress').value.trim();
    const newDesc = document.getElementById('newOutingDescription').value.trim();

    if (!newName || !newStart || !newEnd || !newLoc) {
        if (msg) msg.innerHTML = `<div class="alert alert-danger py-2 small">Mohon lengkapi Nama Acara, Tanggal, dan Lokasi Outing Baru.</div>`;
        return;
    }

    const ok = confirm(`PERINGATAN PEMBERSIHAN DATABASE SUPABASE:\n\n` +
        `Data kegiatan lama yang dicentang akan DIHAPUS dari tabel Supabase dan LocalStorage agar kuota database tetap hemat.\n` +
        `Data outing saat ini akan otomatis dicadangkan ke Riwayat Arsip terlebih dahulu.\n\n` +
        `Lanjutkan pembersihan dan terapkan Outing Baru "${newName}"?`);
    if (!ok) return;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Membersihkan Supabase...`;
    }

    try {
        // 1. Automatic Archive of Current Outing before purge
        const currentOutingInfo = STORAGE.get('outing_current_info', {}) || {};
        saveCurrentOutingToArchive(`Arsip Sebelum Reset (${currentOutingInfo.name || 'Outing Sebelumnya'})`);

        // 2. Check checkboxes
        const purgeFinance = document.getElementById('purgeChkFinance')?.checked ?? true;
        const purgeRundown = document.getElementById('purgeChkRundown')?.checked ?? true;
        const purgePurchasing = document.getElementById('purgeChkPurchasing')?.checked ?? true;
        const purgeTasks = document.getElementById('purgeChkTasks')?.checked ?? true;
        const purgeConsumptions = document.getElementById('purgeChkConsumptions')?.checked ?? true;
        const purgeAnnouncements = document.getElementById('purgeChkAnnouncements')?.checked ?? true;

        const partOption = document.querySelector('input[name="purgeParticipantOption"]:checked')?.value || 'reset_assignment';

        // 3. Supabase Deletions with safety where clause (.neq('id', '00000000-0000-0000-0000-000000000000'))
        if (typeof supabaseClient !== 'undefined' && supabaseClient) {
            try {
                if (purgeFinance) {
                    await supabaseClient.from('cash_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeRundown) {
                    await supabaseClient.from('rundowns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgePurchasing) {
                    await supabaseClient.from('purchase_requests').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeTasks) {
                    await supabaseClient.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeConsumptions) {
                    await supabaseClient.from('consumption_plans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }
                if (purgeAnnouncements) {
                    await supabaseClient.from('announcements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                }

                if (partOption === 'delete_all') {
                    await supabaseClient.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                } else if (partOption === 'reset_assignment') {
                    await supabaseClient.from('participants').update({ transport: 'Bus 1', room: 'Villa' }).neq('id', '00000000-0000-0000-0000-000000000000');
                }
            } catch (dbErr) {
                console.warn('Supabase bulk delete notice:', dbErr);
            }
        }

        // 4. Clear LocalStorage Arrays for purged modules
        if (purgeFinance) STORAGE.set('outing_transactions', []);
        if (purgeRundown) STORAGE.set('outing_rundowns', []);
        if (purgePurchasing) STORAGE.set('outing_purchases', []);
        if (purgeTasks) STORAGE.set('outing_tasks', []);
        if (purgeConsumptions) STORAGE.set('outing_consumptions', []);
        if (purgeAnnouncements) STORAGE.set('outing_announcements', []);

        if (partOption === 'delete_all') {
            STORAGE.set('outing_participants', []);
        } else if (partOption === 'reset_assignment') {
            const parts = STORAGE.get('outing_participants', []) || [];
            const resetParts = parts.map(p => ({ ...p, transport: 'Bus 1', room: 'Villa' }));
            STORAGE.set('outing_participants', resetParts);
        }

        // 5. Update Outing Master Info in Supabase & LocalStorage
        const newOutingRecord = {
            id: generateUUID(),
            name: newName,
            start_date: newStart,
            end_date: newEnd,
            event_date: newStart,
            location: newLoc,
            address: newAddr,
            status: 'PLANNING',
            description: newDesc,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        STORAGE.set('outing_current_info', newOutingRecord);
        currentOuting = newOutingRecord;

        try {
            if (typeof supabaseClient !== 'undefined' && supabaseClient) {
                await supabaseClient.from('outings').insert(newOutingRecord);
            }
        } catch (e) {}

        // 6. Close Modal & Reload
        bootstrap.Modal.getInstance(document.getElementById('modalPurgeSupabase')).hide();

        await loadDashboard();
        updateArchiveSelectors();
        renderArchivesTable();
        updateSupabaseStatsSummary();

        alert(`SUKSES! Data kegiatan lama berhasil dibersihkan dari database Supabase dan LocalStorage.\n\n` +
            `Sistem kini telah diperbarui untuk Outing Baru: "${newName}".\n` +
            `Data outing sebelumnya tetap tersimpan aman di Riwayat Arsip & dapat diunduh softcopy-nya kapan saja!`);

    } catch (err) {
        console.error('Error executing purge:', err);
        if (msg) msg.innerHTML = `<div class="alert alert-danger py-2 small">Terjadi kesalahan: ${err.message}</div>`;
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i class="bi bi-stars me-1"></i> Bersihkan Supabase & Terapkan Outing Baru`;
        }
    }
}

// Start application
checkSession();
