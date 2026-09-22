# 🌴 Outing Management System
> **Single-Page Application (SPA)** berbasis HTML5, CSS3, JavaScript Vanilla, Bootstrap 5.3, SheetJS, dan Supabase Backend.

Aplikasi ini dikembangkan untuk mengelola seluruh rangkaian kegiatan outing secara terpusat, transparan, dan terstruktur. Setiap seksi kepanitiaan (Keuangan, Purchasing, Logistik, Konsumsi, Public Area, dan Inisiator) memiliki wewenang untuk mengelola kebutuhan masing-masing, sementara seluruh peserta dapat melihat informasi umum kegiatan secara real-time.

---

## 📌 Ringkasan Status & Perkembangan Project

Progress pengembangan website ini telah menyelesaikan seluruh modul utama yang tercantum dalam dokumen acuan `Rangkuman_Project_Outing_Management.docx`, termasuk standarisasi **Universal Excel Engine (Export & Import di Seluruh Modul)**:

| No | Modul / Fitur | Status | Deskripsi & Hak Akses |
|---|---|:---:|---|
| 1 | **Autentikasi & Registrasi** | ✅ **Selesai** | Tampilan login minimalis & clean dengan **User ID / No. HP + Password**. Registrasi otomatis terintegrasi langsung ke dalam **Data Peserta Outing**. |
| 2 | **Dashboard Utama & Master Excel** | ✅ **Selesai** | Banner dinamis acara outing, counter peserta, saldo kas aktif, progress bar persiapan, quick preview, dan **tombol Unduh Master Rekap Excel (8 sheets)**. |
| 3 | **Modul Rundown** | ✅ **Selesai** | Susunan acara, jam, lokasi, catatan. Dilengkapi tombol **Export Excel** (data lokal terkini) dan **Import Excel** interaktif dengan preview table. |
| 4 | **Modul Keuangan (Cash)** | ✅ **Selesai** | Laporan kas masuk/keluar, saldo otomatis. Dilengkapi tombol **Export Excel** (beserta summary saldo) dan **Import Excel** transaksi kas. |
| 5 | **Modul Purchasing** | ✅ **Selesai** | Permintaan belanja kebutuhan outing, Qty, Satuan, Estimasi vs Aktual, Vendor, approval cepat. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 6 | **Modul Logistic** | ✅ **Selesai** | Manajemen perlengkapan & armada, prioritas, deadline, progress bar, siklus status. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 7 | **Modul Konsumsi** | ✅ **Selesai** | Meal plan terperinci (Sarapan, Makan Siang, BBQ, Snack), porsi peserta, vendor, estimasi biaya. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 8 | **Modul Public Area** | ✅ **Selesai** | Siaran broadcast pengumuman outing, indikator prioritas, tanggal terbit. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 9 | **Modul Data Peserta** | ✅ **Selesai** | Direktori seluruh peserta, live search, pembagian kamar (rooming) dan armada bus. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 10 | **Pengaturan Outing** | ✅ **Selesai** | Konfigurasi nama acara outing, tanggal, venue, alamat, status, dan **Master Backup Excel Multi-Sheet**. Akses Inisiator/Admin. |
| 11 | **Simulasi Role Pengguna** | ✅ **Selesai** | Fitur pengganti role instan pada halaman Profil untuk mempermudah pengujian hak akses tanpa perlu logout. |
| 12 | **Hybrid Storage Engine** | ✅ **Selesai** | Data tersimpan otomatis di LocalStorage (offline-first) dan tersinkronisasi secara asinkron dengan Supabase REST API. |
| 13 | **Universal Excel Engine** | ✅ **Selesai** | Fitur **Export Excel Real-Time** (membaca data lokal terkini) dan **Import Excel Interaktif** (seperti rundown) di SELURUH modul. |
| 14 | **Upload & Kompresi Foto Purchasing** | ✅ **Selesai** | Unggah foto barang/nota belanja dengan **kompresi otomatis client-side** (hemat storage > 95%), lightbox preview, dan sinkronisasi Supabase. |

---

## 👥 Matriks Role & Hak Akses

Aplikasi menerapkan kontrol hak akses berbasis peran (*Role-Based Access Control*) dan seksi (*Section*):

```text
                       ┌─────────────────────────┐
                       │    ADMIN / INISIATOR    │ (Akses Penuh Seluruh Modul,
                       └────────────┬────────────┘  Export & Import Excel Semua Fitur)
                                    │
       ┌──────────────┬─────────────┼──────────────┬──────────────┐
       ▼              ▼             ▼              ▼              ▼
┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐┌─────────────┐
│   KEUANGAN  ││ PURCHASING  ││   LOGISTIC  ││  KONSUMSI   ││ PUBLIC AREA │
│ Kelola Kas, ││  Kelola PR, ││ Kelola Task ││ Kelola Meal ││   Kelola    │
│ Pemasukan & ││   Vendor &  ││ Perlengkapan││    Plan,    ││ Pengumuman &│
│ Pengeluaran ││   Estimasi  ││   & Armada  ││    Porsi    ││  Broadcast  │
│ (Exp/Imp)   ││ (Exp/Imp)   ││ (Exp/Imp)   ││ (Exp/Imp)   ││ (Exp/Imp)   │
└─────────────┘└─────────────┘└─────────────┘└─────────────┘└─────────────┘
                                    │
                                    ▼
                       ┌─────────────────────────┐
                       │     PESERTA BIASA       │ (View-Only Rundown, Keuangan,
                       │      (PARTICIPANT)      │  Pengumuman, dan Info Outing.
                       │                         │  Dapat Export Excel, Tombol
                       │                         │  Import/Tambah Disembunyikan)
                       └─────────────────────────┘
```

---

## 🔑 Akun Demo untuk Pengujian Cepat

Untuk mempermudah pengujian di perangkat lain atau oleh pengguna lain, aplikasi telah dilengkapi dengan akun bawaan (*pre-seeded accounts*):

| Role / Seksi | User ID | Password | Hak Akses Utama |
|---|---|---|---|
| **Admin / Inisiator** | `admin` | `admin123` | Akses penuh ke seluruh menu, Pengaturan Outing, Export & Import semua modul |
| **Section Keuangan** | `keuangan` | `finance123` | Kelola transaksi kas masuk/keluar, saldo kas, Export & Import Excel Keuangan |
| **Section Purchasing** | `purchasing` | `purchase123` | Buat & approve request pengadaan, vendor, Export & Import Excel Purchasing |
| **Section Logistic** | `logistic` | `logistik123` | Kelola task persiapan, armada bus, perlengkapan, Export & Import Excel Logistik |
| **Section Konsumsi** | `konsumsi` | `makan123` | Kelola jadwal makan, katering, porsi, menu, Export & Import Excel Konsumsi |
| **Section Public Area** | `public` | `public123` | Publikasi pengumuman penting, prioritas, Export & Import Excel Pengumuman |
| **Peserta Biasa** | `peserta` | `peserta123` | View-only rundown, laporan kas, pengumuman, Export Excel dokumen jadwal/kas |

> 💡 **Tips Pengujian:** Anda dapat login langsung menggunakan kredensial akun bawaan di atas (atau menggunakan Nomor WhatsApp / User ID yang telah didaftarkan pada form Registrasi). Untuk beralih perspektif antar role secara cepat, gunakan dropdown **"Simulasi Hak Akses"** pada menu Profil.

---

## 📊 Fitur Unggulan: Universal Excel Engine (Export & Import di Semua Fitur)

Aplikasi kini telah dilengkapi dengan **Universal Excel Engine** menggunakan pustaka SheetJS yang berjalan secara *client-side* murni di browser tanpa ketergantungan server tambahan.

### 1. Fitur Export Excel Real-Time (Data Lokal Mutakhir)
- **Tombol Export Excel** tersedia pada setiap modul kegiatan:
  - 📅 **Rundown**: `Rundown_Outing_[Tanggal].xlsx`
  - 💰 **Keuangan**: `Laporan_Keuangan_Outing_[Tanggal].xlsx` (dilengkapi summary baris Total Pemasukan, Total Pengeluaran, dan Saldo Akhir)
  - 🛒 **Purchasing**: `Purchasing_Requests_Outing_[Tanggal].xlsx` (dilengkapi summary Total Estimasi dan Total Biaya Aktual)
  - 📦 **Logistik**: `Logistik_Tasks_Outing_[Tanggal].xlsx` (status, deadline, progress persen, dan PIC)
  - 🍽️ **Konsumsi**: `Rencana_Konsumsi_Outing_[Tanggal].xlsx` (sesi makan, porsi, katering, estimasi vs aktual)
  - 📢 **Public Area**: `Pengumuman_Outing_[Tanggal].xlsx` (pengumuman, instruksi, dan prioritas)
  - 👥 **Data Peserta**: `Data_Peserta_Outing_[Tanggal].xlsx` (NIK, nama, departemen, WA, kamar, dan armada bus)
- **Sinkronisasi Data Lokal**: Ketika pengguna mengedit transaksi, menambah kegiatan, mengubah progres logistik, atau mengunggah data baru via Excel di komputer lokal, tombol **Export Excel** akan langsung mengekspor snapshot data terkini dari penyimpanan lokal.
- **Auto-Fit Column Widths**: Lebar kolom pada dokumen Excel otomatis disesuaikan dengan panjang teks terpanjang agar isi spreadsheet rapi dan tidak terpotong saat dibuka di Microsoft Excel atau Google Sheets.

### 2. Fitur Import & Update Excel di Seluruh Fitur (Seperti Rundown)
Kini seluruh modul memiliki kemampuan import Excel yang sama lengkapnya dengan modul Rundown:
1. **Akses Khusus Panitia / Seksi Terkait**: Tombol **"Import Excel"** hanya ditampilkan bagi user yang memiliki kewenangan terhadap modul tersebut (atau Admin/Inisiator). Member biasa berstatus View-Only.
2. **Unduh Template Excel Khusus Tiap Modul**: Di dalam modal import, terdapat tombol **"Unduh Template Excel"** yang menghasilkan berkas `.xlsx` siap pakai berisi contoh baris data realistis dan format kolom yang benar.
3. **Deteksi Header Kolom Cerdas (Synonyms Recognition)**: Engine secara otomatis mengenali variasi nama kolom (contoh pada Keuangan: mengenali header `Tanggal`, `Tgl`, `Date`; `Nominal`, `Jumlah`, `Amount`, `Biaya`; `Jenis`, `Tipe`, `IN/OUT`).
4. **Pratinjau & Edit Interaktif (Interactive Preview Table)**:
   - Data yang terbaca dari Excel ditampilkan dalam tabel pratinjau interaktif.
   - Pengguna dapat **mengedit langsung nilai tanggal, teks, angka, dropdown pilihan (IN/OUT, Prioritas, Status)** di dalam modal sebelum menekan tombol simpan.
   - Tersedia tombol **"+ Tambah Baris"** untuk menyisipkan data manual dan tombol **Hapus Baris (🗑️)**.
5. **Metode Penyimpanan Fleksibel**:
   - **Gantikan Seluruh Data (Replace)**: Menghapus data lama pada modul tersebut dan menggantinya dengan data baru dari file Excel.
   - **Tambahkan (Append)**: Menggabungkan data baru ke data yang sudah ada di sistem.
6. **Penyimpanan Hybrid**: Data yang disimpan langsung tercatat di `LocalStorage` dan disinkronkan ke tabel PostgreSQL Supabase secara otomatis.

### 3. Master Rekapitulasi Excel Multi-Sheet
- Pada halaman **Dashboard (Home)** dan halaman **Pengaturan Outing**, tersedia tombol **"Unduh Master Rekap Excel"**.
- Fitur ini menghasilkan satu berkas workbook Excel `Master_Rekap_Outing_[Tanggal].xlsx` yang berisi **8 Lembar Kerja (Sheets)** sekaligus:
  1. `Info Acara`: Informasi utama, tanggal pelaksanaan, venue, dan tema outing.
  2. `Rundown Acara`: Seluruh jadwal susunan kegiatan.
  3. `Laporan Keuangan`: Rincian seluruh transaksi kas masuk/keluar dan saldo.
  4. `Purchasing`: Rekap permintaan pengadaan barang/jasa dan vendor.
  5. `Logistik & Tugas`: Daftar tugas operasional, deadline, dan progress.
  6. `Konsumsi & Meal`: Jadwal katering, porsi peserta, dan menu makanan.
  7. `Public Area`: Riwayat pengumuman dan siaran untuk peserta.
  8. `Data Peserta`: Direktori lengkap seluruh peserta, rooming kamar, dan bus.

---

## 📸 Fitur Unggulan: Upload & Kompresi Foto Purchasing (Hemat Storage Supabase)

Untuk meningkatkan akurasi dan akuntabilitas pengadaan barang/jasa tanpa membebani kuota penyimpanan Supabase maupun memori lokal perangkat, fitur Purchasing telah dilengkapi dengan **Engine Kompresi Gambar Otomatis**:

1. **Kompresi Gambar Sisi Klien (*Client-Side Image Compression*)**:
   - Foto dari kamera ponsel beresolusi tinggi (biasanya 3 MB – 10 MB) secara otomatis dikompres sebelum dikirim ke server / disimpan ke database.
   - Menggunakan algoritma HTML5 Canvas dengan penskalaan proporsional (resolusi maksimal 1200x1200px) dan kompresi JPEG kualitas tinggi (`0.72`).
   - Ukuran file berkurang **> 95%** (menjadi rata-rata **40 KB – 80 KB** saja), namun teks faktur, nota belanja, dan detail barang tetap terbaca sangat tajam dan jelas.
   - Pengguna disajikan indikator live: `Ukuran Asli: 4.2 MB ➔ Terkompres: 58.4 KB (Hemat 98%)`.

2. **Area Unggah Modern & Multi-Input**:
   - Mendukung klik untuk memilih file dari galeri / kamera HP (`accept="image/*"`).
   - Mendukung **Drag-and-Drop**: Pengguna dapat menarik foto langsung dari file explorer ke area kotak dropzone.
   - Tombol **Ganti Foto** dan **Hapus Foto** instan untuk fleksibilitas saat pengisian form.

3. **Pratinjau Kartu & Lightbox Modal Interaktif**:
   - Setiap item pembelian yang memiliki foto akan menampilkan thumbnail visual pada daftar kartu beserta badge indikator `Ada Foto`.
   - Mengklik thumbnail atau tombol **"Lihat Foto"** akan membuka **Lightbox Modal** berukuran besar yang menampilkan foto lengkap dengan detail kuantitas, estimasi, biaya aktual, vendor, dan tombol **"Unduh Foto"**.

4. **Arsitektur Penyimpanan Hybrid yang Tangguh**:
   - Jika Supabase Storage bucket `purchases` aktif, file gambar kompresi diunggah ke CDN Storage Supabase dan disimpan URL publiknya.
   - Jika bucket belum dibuat atau terjadi kendala jaringan/RLS, sistem secara cerdas menggunakan *fallback* berupa Base64 Data URI terkompresi yang aman disimpan langsung di database PostgreSQL / LocalStorage tanpa memakan kuota besar.

---

## 🚀 Cara Menjalankan Project

Aplikasi ini bersifat *zero-dependency* di sisi frontend (menggunakan CDN Bootstrap 5.3, Bootstrap Icons, dan SheetJS), sehingga dapat dijalankan dengan sangat mudah:

### Opsi 1: Langsung Buka File HTML
Cukup buka file `index.html` dengan cara *double-click* atau klik kanan lalu buka menggunakan browser modern apa pun (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari).

### Opsi 2: Menggunakan Local Web Server (Direkomendasikan)
Jika menggunakan Python di terminal / PowerShell:
```powershell
# Jalankan web server lokal di direktori project:
python -m http.server 8080
```
Lalu buka browser di alamat: `http://localhost:8080`

Jika menggunakan VS Code:
- Pasang ekstensi **Live Server**, lalu klik kanan pada `index.html` dan pilih **"Open with Live Server"**.

---

## 🗄️ Panduan Setup Supabase di Akun Lain

Jika Anda ingin memindahkan atau menghubungkan project ini ke project Supabase baru di akun lain, ikuti panduan berikut:

### Langkah 1: Buat Project di Supabase
1. Buka [Supabase Dashboard](https://supabase.com/dashboard) dan klik **"New Project"**.
2. Masukkan nama project (contoh: `outing-management`), tentukan database password, dan pilih region terdekat (misal: `Singapore`).
3. Tunggu hingga proses setup database selesai (~1-2 menit).

### Langkah 2: Eksekusi Skema Database (DDL)
1. Di sidebar dashboard Supabase, buka menu **SQL Editor** (`</>`).
2. Klik tombol **"New query"**.
3. Buka file [`database_schema.sql`](file:///D:/PowerPro/Tools/Web/Outing/database_schema.sql) yang ada di folder project ini, salin seluruh isinya, dan tempel ke dalam SQL Editor Supabase.
4. Klik tombol **"Run"** (atau tekan `Ctrl+Enter`).
5. Seluruh tabel (`users`, `roles`, `sections`, `outings`, `rundowns`, `cash_transactions`, `purchase_requests`, `tasks`, `consumption_plans`, `announcements`, `participants`), relasi, view `v_cash_summary`, dan Row Level Security (RLS) akan otomatis terbentuk.

### Langkah 3: Hubungkan `index.html` dengan Akun Supabase Baru
1. Di dashboard Supabase Anda, buka menu **Project Settings** (ikon gerigi) -> **API**.
2. Salin nilai:
   - **Project URL** (contoh: `https://xyzcompany.supabase.co`)
   - **Project API Keys** bagian `anon` / `public`
3. Buka file [`index.html`](file:///D:/PowerPro/Tools/Web/Outing/index.html), cari baris konfigurasi berikut di awal tag `<script>`:
```javascript
/* =====================================================
   SUPABASE CLIENT CONFIGURATION
===================================================== */
const SUPABASE_URL = "https://URL_PROJECT_SUPABASE_ANDA.supabase.co";
const SUPABASE_ANON_KEY = "KEY_ANON_SUPABASE_ANDA";
```
4. Ganti dengan URL dan Anon Key project Supabase Anda yang baru, lalu simpan file.

---

## 🛠️ Detail Masalah yang Telah Diselesaikan

1. **Masalah Phone Signups (`Phone signups are disabled`)**:
   - Pendaftaran dan login difinalkan murni menggunakan **User ID (Username) + Password**. Nomor telepon WhatsApp peserta disimpan sebagai data profil tanpa membutuhkan verifikasi SMS gateway/OTP.
2. **Masalah Kredensial Invalid (`Invalid login credentials`)**:
   - Diterapkan **Hybrid Storage Engine** yang menjamin validasi autentikasi konsisten secara offline-first di LocalStorage dan sinkron ke Supabase, sehingga aplikasi tetap berjalan mulus tanpa terblokir batasan izin database anon.
3. **Ekspansi Fitur Excel Multi-Modul**:
   - Fitur manipulasi berkas Excel yang sebelumnya hanya terdapat pada modul Rundown telah diekspansi menjadi **Universal Excel Engine** yang melayani seluruh 7 modul aplikasi dan Master Backup multi-sheet.
4. **Proteksi Hak Akses (View-Only RBAC)**:
   - Peserta biasa tetap dapat melihat informasi umum dan mengekspor Excel jadwal/laporan, namun tombol edit, tambah baris, dan import data Excel otomatis disembunyikan.

---

## 📁 Struktur Berkas Project

```text
D:\PowerPro\Tools\Web\Outing│
├── index.html                               # Aplikasi utama (Single Page Application - SPA)
├── database_schema.sql                      # DDL Skema PostgreSQL / Supabase, View & RLS
├── README.md                                # Dokumentasi lengkap, progress, & panduan transfer akun
├── Rangkuman_Project_Outing_Management.docx # Dokumen spesifikasi acuan & catatan progress
└── index.backup-20260921.html               # Backup versi sebelum update Excel Engine
```

---

## 📋 Checklist & Rencana Langkah Selanjutnya (Next Steps)

- [x] Implementasi UI/UX seluruh modul (Home, Rundown, Keuangan, Purchasing, Logistic, Konsumsi, Public Area, Peserta, Pengaturan).
- [x] Fitur CRUD lengkap untuk seluruh modul dengan Bootstrap Modal interaktif.
- [x] Fitur **Export Excel Real-Time** (membaca data lokal mutakhir) di SELURUH modul.
- [x] Fitur **Import Excel Interaktif** dengan tabel pratinjau yang bisa diedit di SELURUH modul (seperti Rundown).
- [x] Fitur **Master Rekapitulasi Excel Multi-Sheet** (8 sheets) di Dashboard dan Pengaturan Outing.
- [x] Pengecualian hak akses (View-Only protection) untuk akun peserta biasa (*Participant*).
- [x] Simulasi Role Switcher di profil pengguna untuk pengujian wewenang instan tanpa logout.
- [x] Skema database lengkap dengan view `v_cash_summary` dan RLS policies.
- [x] Dokumentasi progress dan pembaruan pada `README.md` dan `Rangkuman_Project_Outing_Management.docx`.
- [ ] *(Opsional)* Integrasi WhatsApp Click-to-Chat URL pada nomor telepon peserta untuk memudahkan koordinator bus menghubungi peserta secara instan.
- [ ] *(Opsional)* Deployment frontend ke GitHub Pages, Vercel, atau Netlify (cukup upload file repositori ini).

---
*Dokumentasi ini diperbarui untuk memastikan kontinuitas pengembangan yang mulus dan pencatatan riwayat project yang transparan.*
