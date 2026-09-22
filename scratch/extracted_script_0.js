
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

// INITIAL SEED DATA
function initSeedDataIfEmpty() {
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
            { id: 'pt-6', username: 'peserta', full_name: 'Ahmad Fauzi', phone: '081234567896', department: 'Engineering', gender: 'L', transport: 'Bus 1', room: 'Kamar Pinus 4', status: 'CONFIRMED' }
        ]);
    }
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
    const userIdInput = document.getElementById('loginUserId').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const message = document.getElementById('loginMessage');

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Login...`;
    message.innerHTML = '';

    try {
        if (!userIdInput) throw new Error('Silakan masukkan User ID.');
        if (!password) throw new Error('Silakan masukkan password.');

        let foundUser = null;

        // 1. Cek Local Storage Users
        const localUsers = STORAGE.get('outing_local_users', []);
        const matchedLocal = localUsers.find(u =>
            (u.username && u.username.toLowerCase() === userIdInput.toLowerCase()) ||
            (u.id && String(u.id).toLowerCase() === userIdInput.toLowerCase()) ||
            (u.phone && u.phone === userIdInput)
        );

        if (matchedLocal) {
            if (matchedLocal.password && matchedLocal.password !== password) {
                throw new Error('Password yang Anda masukkan salah.');
            }
            foundUser = matchedLocal;
        }

        // 2. Cek Database Supabase (tabel users) jika belum ketemu di lokal
        if (!foundUser) {
            try {
                const { data: dbUser } = await supabaseClient
                    .from('users')
                    .select('*')
                    .eq('username', userIdInput.toLowerCase())
                    .maybeSingle();

                if (dbUser) {
                    if (dbUser.password && dbUser.password !== password) {
                        throw new Error('Password yang Anda masukkan salah.');
                    }
                    foundUser = dbUser;
                }
            } catch (dbErr) {
                console.warn('Supabase DB search note:', dbErr);
            }
        }

        if (!foundUser) {
            throw new Error('User ID atau Password yang Anda masukkan tidak ditemukan.');
        }

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
    const username = document.getElementById('registerUsername').value.trim().toLowerCase();
    const phoneInput = document.getElementById('registerPhone').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const btn = document.getElementById('registerBtn');
    const message = document.getElementById('registerMessage');

    if (password !== passwordConfirm) {
        message.innerHTML = `<div class="alert alert-danger py-2 small">Password dan konfirmasi password tidak sama.</div>`;
        return;
    }
    if (password.length < 6) {
        message.innerHTML = `<div class="alert alert-danger py-2 small">Password minimal 6 karakter.</div>`;
        return;
    }
    if (username.length < 3) {
        message.innerHTML = `<div class="alert alert-danger py-2 small">Username minimal 3 karakter.</div>`;
        return;
    }

    const phone = formatPhone(phoneInput);
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Menyimpan data...`;
    message.innerHTML = '';

    try {
        // Cek apakah username sudah dipakai di local storage
        const localUsers = STORAGE.get('outing_local_users', []);
        if (localUsers.some(u => u.username === username)) {
            throw new Error('User ID / Username ini sudah terdaftar.');
        }

        // Cek di Supabase
        try {
            const { data: existingDb } = await supabaseClient
                .from('users')
                .select('id')
                .eq('username', username)
                .maybeSingle();

            if (existingDb) {
                throw new Error('User ID / Username ini sudah terdaftar di sistem.');
            }
        } catch (e) {
            if (e.message && e.message.includes('terdaftar')) throw e;
        }

        // Buat objek akun baru
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

        // Simpan ke local storage
        localUsers.push(newUser);
        STORAGE.set('outing_local_users', localUsers);

        // Tambahkan juga ke daftar peserta
        const participants = STORAGE.get('outing_participants', []);
        participants.push({
            id: generateUUID(),
            username: username,
            full_name: name,
            phone: phone,
            department: 'Umum',
            gender: 'L',
            transport: 'Bus 1',
            room: 'Villa',
            status: 'CONFIRMED'
        });
        STORAGE.set('outing_participants', participants);

        // Sync ke Supabase (jika diizinkan RLS)
        try {
            await supabaseClient.from('users').insert({
                id: userId,
                username: username,
                full_name: name,
                phone: phone
            });
        } catch (dbErr) {
            console.warn('Supabase DB Insert notice:', dbErr);
        }

        message.innerHTML = `
            <div class="alert alert-success py-2 small">
                <i class="bi bi-check-circle-fill me-1"></i>
                <strong>Registrasi Berhasil!</strong> Akun dengan User ID <strong>@${username}</strong> siap digunakan.
            </div>
        `;
        document.getElementById('registerForm').reset();

        setTimeout(() => {
            showLogin();
            document.getElementById('loginUserId').value = username;
        }, 1500);

    } catch (error) {
        console.error('Register error:', error);
        message.innerHTML = `<div class="alert alert-danger py-2 small"><i class="bi bi-exclamation-circle me-1"></i>${error.message || 'Gagal mendaftar.'}</div>`;
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
   PURCHASING MODULE
===================================================== */
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

        return `
            <div class="card border border-light-subtle rounded-3 p-3 mb-3 shadow-sm bg-white">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <div>
                        <span class="badge ${statusBadge} mb-1">${item.status}</span>
                        <span class="badge bg-light text-dark border ms-1">Section: ${item.section || 'LOGISTIC'}</span>
                        <h6 class="fw-bold mb-0 mt-1">${item.item_name || item.item}</h6>
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
                    <div class="col-6 col-md-3"><strong>Vendor:</strong> ${item.vendor || '-'}</div>
                    <div class="col-6 col-md-3"><strong>Estimasi:</strong> ${formatRupiah(item.estimated_cost)}</div>
                    <div class="col-6 col-md-3"><strong>Biaya Aktual:</strong> <span class="text-primary fw-semibold">${formatRupiah(item.actual_cost)}</span></div>
                </div>

                ${item.notes ? `<div class="bg-light p-2 rounded small mt-2 text-secondary"><i class="bi bi-info-circle me-1"></i>${item.notes}</div>` : ''}

                <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top small text-muted">
                    <span><i class="bi bi-calendar me-1"></i>Dibutuhkan: ${item.needed_date || '-'}</span>
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
        }
    } else {
        document.getElementById('modalPurchaseTitle').textContent = 'Request Pembelian Baru';
        document.getElementById('purchaseId').value = '';
    }
    modal.show();
}

function savePurchase(e) {
    e.preventDefault();
    const id = document.getElementById('purchaseId').value;
    const list = STORAGE.get('outing_purchases', []);
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
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = list.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) list[idx] = newReq;
    } else {
        list.unshift(newReq);
    }

    STORAGE.set('outing_purchases', list);
    bootstrap.Modal.getInstance(document.getElementById('modalPurchase')).hide();
    renderPurchasing(list);

    try {
        supabaseClient.from('purchase_requests').upsert(newReq).then(() => {});
    } catch (e) {}
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
        let participants = [];
        try {
            const { data } = await supabaseClient.from('users').select('*');
            if (data && data.length > 0) {
                participants = data.map(u => ({
                    id: u.id,
                    username: u.username || '',
                    full_name: u.full_name || u.name || u.username,
                    phone: u.phone || '-',
                    role: u.role || 'PARTICIPANT'
                }));
            }
        } catch (e) {}

        const localParts = STORAGE.get('outing_participants', []);
        localParts.forEach(lp => {
            if (!participants.some(p => p.username === lp.username || p.id === lp.id)) {
                participants.push(lp);
            }
        });

        document.getElementById('statParticipants').textContent = participants.length;
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

    const currentUsername = (currentProfile?.username || currentUser?.username || '').toLowerCase();
    const isManager = canManage('participants');

    container.innerHTML = list.map(item => {
        const username = item.username || '-';
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
    const all = STORAGE.get('outing_participants', []);
    if (!query || !query.trim()) {
        renderParticipants(all);
        return;
    }
    const q = query.toLowerCase();
    const filtered = all.filter(p =>
        (p.full_name && p.full_name.toLowerCase().includes(q)) ||
        (p.username && p.username.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q))
    );
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
            document.getElementById('partUsername').value = item.username || '';
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
    const newPart = {
        id: id || generateUUID(),
        full_name: document.getElementById('partName').value.trim(),
        name: document.getElementById('partName').value.trim(),
        username: document.getElementById('partUsername').value.trim().toLowerCase(),
        phone: document.getElementById('partPhone').value.trim(),
        department: document.getElementById('partDept').value.trim(),
        gender: document.getElementById('partGender').value,
        transport: document.getElementById('partTransport').value.trim(),
        room: document.getElementById('partRoom').value.trim(),
        status: document.getElementById('partStatus').value,
        created_at: new Date().toISOString()
    };

    if (id) {
        const idx = list.findIndex(p => String(p.id) === String(id));
        if (idx !== -1) list[idx] = newPart;
    } else {
        list.push(newPart);
    }

    STORAGE.set('outing_participants', list);
    bootstrap.Modal.getInstance(document.getElementById('modalParticipant')).hide();
    renderParticipants(list);
    document.getElementById('statParticipants').textContent = list.length;
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

    // INITIATOR / SETTINGS
    if (isAll) {
        menus.push({
            icon: 'bi-sliders',
            title: 'Pengaturan Outing',
            desc: 'Konfigurasi nama acara, tanggal & venue',
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

// Start application
checkSession();
