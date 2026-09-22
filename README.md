# 🌴 Outing Management System
> **Single-Page Application (SPA)** berbasis HTML5, CSS3, JavaScript Vanilla, Bootstrap 5.3, SheetJS, dan Supabase Backend.

Aplikasi ini dikembangkan untuk mengelola seluruh rangkaian kegiatan outing secara terpusat, transparan, dan terstruktur. Setiap seksi kepanitiaan (Keuangan, Purchasing, Logistik, Konsumsi, Public Area, dan Inisiator) memiliki wewenang untuk mengelola kebutuhan masing-masing, sementara seluruh peserta dapat melihat informasi umum kegiatan secara real-time.

---

## 📌 Ringkasan Status & Perkembangan Project

Progress pengembangan website ini telah menyelesaikan seluruh modul utama yang tercantum dalam dokumen acuan `Rangkuman_Project_Outing_Management.docx`, termasuk standarisasi **Universal Excel Engine (Export & Import di Seluruh Modul)**:

| No | Modul / Fitur | Status | Deskripsi & Hak Akses |
|---|---|:---:|---|
| 1 | **Supabase Auth & Registrasi** | ✅ **Selesai** | Login User ID / No. HP + Password melalui Supabase Auth. Profile terhubung ke `auth.users.id`; akun baru otomatis **PENDING** dan baru dapat login setelah disetujui Admin. |
| 2 | **Dashboard Utama & Master Excel** | ✅ **Selesai** | Banner dinamis acara outing, counter peserta, saldo kas aktif, progress bar persiapan, quick preview, dan **tombol Unduh Master Rekap Excel (8 sheets)**. |
| 3 | **Modul Rundown** | ✅ **Selesai** | Susunan acara, jam, lokasi, catatan. Dilengkapi tombol **Export Excel** (data lokal terkini) dan **Import Excel** interaktif dengan preview table. |
| 4 | **Modul Keuangan (Cash)** | ✅ **Selesai** | Laporan kas masuk/keluar, saldo otomatis. Dilengkapi tombol **Export Excel** (beserta summary saldo) dan **Import Excel** transaksi kas. |
| 5 | **Modul Purchasing** | ✅ **Selesai** | Permintaan belanja kebutuhan outing, Qty, Satuan, Estimasi vs Aktual, Vendor, approval cepat. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 6 | **Modul Logistic** | ✅ **Selesai** | Manajemen perlengkapan & armada, prioritas, deadline, progress bar, siklus status. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 7 | **Modul Konsumsi** | ✅ **Selesai** | Meal plan terperinci (Sarapan, Makan Siang, BBQ, Snack), porsi peserta, vendor, estimasi biaya. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 8 | **Modul Public Area** | ✅ **Selesai** | Siaran broadcast pengumuman outing, indikator prioritas, tanggal terbit. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 9 | **Modul Data Peserta** | ✅ **Selesai** | Direktori seluruh peserta, live search, pembagian kamar (rooming) dan armada bus. Dilengkapi tombol **Export Excel** dan **Import Excel**. |
| 10 | **Pengaturan Outing** | ✅ **Selesai** | Konfigurasi nama acara outing, tanggal, venue, alamat, status, dan **Master Backup Excel Multi-Sheet**. Akses Inisiator/Admin. |
| 11 | **Simulasi Role Pengguna** | ✅ **Selesai** | Fitur simulasi role pada halaman Profil sekarang hanya dapat digunakan oleh akun Admin. |
| 12 | **Supabase Data + UI Cache** | ✅ **Selesai** | Supabase/Postgres menjadi sumber data dan otorisasi; LocalStorage hanya cache tampilan/offline seed dan tidak pernah menjadi sumber session, password, role, atau approval. |
| 13 | **Universal Excel Engine** | ✅ **Selesai** | Fitur **Export Excel Real-Time** (membaca data lokal terkini) dan **Import Excel Interaktif** (seperti rundown) di SELURUH modul. |
| 14 | **Upload & Kompresi Foto Purchasing** | ✅ **Selesai** | Unggah foto/nota terkompresi ke **private Supabase Storage bucket**; tabel menyimpan object path dan UI menggunakan signed URL. |

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
| **Admin / Inisiator** | `admin` | `power88` | Akses penuh ke seluruh menu, approval user, Pengaturan Outing, Export & Import semua modul |
| **Section Keuangan** | `keuangan` | `finance123` | Kelola transaksi kas masuk/keluar, saldo kas, Export & Import Excel Keuangan |
| **Section Purchasing** | `purchasing` | `purchase123` | Buat & approve request pengadaan, vendor, Export & Import Excel Purchasing |
| **Section Logistic** | `logistic` | `logistik123` | Kelola task persiapan, armada bus, perlengkapan, Export & Import Excel Logistik |
| **Section Konsumsi** | `konsumsi` | `makan123` | Kelola jadwal makan, katering, porsi, menu, Export & Import Excel Konsumsi |
| **Section Public Area** | `public` | `public123` | Publikasi pengumuman penting, prioritas, Export & Import Excel Pengumuman |
| **Peserta Biasa** | `peserta` | `peserta123` | View-only rundown, laporan kas, pengumuman, Export Excel dokumen jadwal/kas |

> 💡 **Tips Pengujian:** jalankan `supabase/seed.sql` setelah schema untuk membuat akun Auth demo. Login langsung memakai User ID di atas; aplikasi memetakan User ID ke email internal `username@outing.local`. Nomor WhatsApp tetap dapat dipakai karena resolver server-side. Untuk beralih perspektif antar role secara cepat, gunakan dropdown **"Simulasi Hak Akses"** pada menu Profil. **Approval hanya dapat dilakukan oleh Admin asli; simulator tidak dapat menaikkan privilege database.**

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
6. **Sinkronisasi Data Supabase**: Perubahan modul disinkronkan ke tabel PostgreSQL Supabase; LocalStorage hanya cache UI/seed dan bukan otoritas keamanan.

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

4. **Arsitektur Private Supabase Storage**:
   - File gambar kompresi diunggah ke private Supabase Storage bucket `purchases`; tabel hanya menyimpan object path dan UI membuat signed URL.
   - Bucket `purchases` bersifat private. Upload/update/delete dibatasi oleh Storage RLS untuk user approved dengan role Admin/Initiator/Purchasing; UI membuat signed URL berumur pendek untuk preview/download. Tidak ada anonymous upload fallback.

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

### Langkah 1: Buat Project dan siapkan Auth
1. Buka [Supabase Dashboard](https://supabase.com/dashboard), buat project baru, dan tunggu database siap.
2. Di **Authentication → Providers → Email**, aktifkan provider Email.
3. Untuk demo `username@outing.local`, nonaktifkan **Confirm email** atau gunakan `supabase/seed.sql` yang menandai akun demo sudah terkonfirmasi. Untuk production, gunakan domain email yang valid dan alur konfirmasi email resmi; jangan memakai domain `.local` untuk pengguna nyata.
4. Di **Project Settings → API**, salin Project URL dan anon/public key ke konstanta di `index.html`.

### Langkah 2: Jalankan schema dan seed demo
1. Di SQL Editor, jalankan seluruh [`database_schema.sql`](database_schema.sql). Schema membuat linkage `users.auth_user_id → auth.users.id`, trigger profile/participant, helper RLS, RPC approval Admin, serta private Storage bucket `purchases`.
2. Jalankan [`supabase/seed.sql`](supabase/seed.sql) untuk akun demo. Script ini memakai `crypt()` di database Auth, bukan `users.password_hash` atau LocalStorage. Kredensial demo adalah akun development; ganti password atau hapus seed sebelum production.
3. Jika project sudah berisi user custom lama, password PBKDF2 lama tidak dimigrasikan. Buat/reset akun tersebut di Supabase Auth, isi metadata `username`, lalu hubungkan profile `users.auth_user_id` melalui prosedur admin/migrasi terkontrol.

### Langkah 3: Jalankan frontend

```bash
python -m http.server 8080
```

Buka `http://localhost:8080`. Hosting production wajib memakai HTTPS agar session Supabase Auth tersimpan aman. Browser tidak lagi mengirim password ke tabel `public.users`; login, session, dan ganti password seluruhnya memakai Supabase Auth.

---

## 🔐 Model Keamanan, Approval, dan RLS

Alur autentikasi dan otorisasi production:

1. Form registrasi memanggil `supabase.auth.signUp()` menggunakan email internal `username@outing.local` dan metadata profil. Password hanya diproses oleh Supabase Auth.
2. Trigger `public.handle_new_auth_user()` membuat profile `public.users` dengan `auth_user_id = auth.users.id`, `role = PARTICIPANT`, `section = PUBLIC`, dan `approval_status = PENDING`. Trigger juga membuat baris peserta; metadata client tidak dapat menyuntikkan role Admin.
3. Login memanggil `signInWithPassword()`, mengambil profile berdasarkan `auth_user_id`, memeriksa status approval, lalu menolak dan sign-out bila status `PENDING` atau `REJECTED`.
4. **Hanya Admin asli** yang dapat memanggil `public.admin_set_user_approval(...)` melalui RPC `SECURITY DEFINER`. REST `UPDATE public.users` untuk anon maupun authenticated tidak diberi policy terbuka, sehingga role/status/approval tidak dapat diubah langsung dari client.
5. Semua tabel modul dan Storage menggunakan RLS dengan `TO authenticated`, `auth.uid()`, status `APPROVED`, serta role. LocalStorage hanya cache data UI dan tidak dipakai sebagai session, password, role, atau sumber keputusan approval.
6. Ganti password di Profil melakukan re-authentication lalu `supabase.auth.updateUser({ password })`; kolom `users.password_hash` dihapus oleh migration.

Fungsi SQL penting:

- `resolve_login_username(text)`: resolver User ID/nomor telepon anonim yang hanya mengembalikan username, tanpa membaca profile atau hash password.
- `admin_set_user_approval(uuid, text, text)`: RPC approval yang memvalidasi `auth.uid()` sebagai Admin.
- `current_app_user_is_approved()`, `current_app_role()`, dan `current_app_user_has_role(text[])`: helper `SECURITY DEFINER` yang dipakai policy RLS.

> **Catatan migrasi:** jalankan schema pada project Supabase yang benar. Migration menghapus kolom legacy `users.password_hash` karena kolom tersebut tidak boleh lagi menjadi sumber otorisasi. Profile lama tanpa `auth_user_id` harus dipasangkan dengan user Auth melalui SQL/admin migration yang terkontrol.

## 🛠️ Detail Masalah yang Telah Diselesaikan

1. **Masalah Phone Signups (`Phone signups are disabled`)**:
   - Pendaftaran dan login difinalkan murni menggunakan **User ID (Username) + Password**. Nomor telepon WhatsApp peserta disimpan sebagai data profil tanpa membutuhkan verifikasi SMS gateway/OTP.
2. **Masalah Kredensial Invalid (`Invalid login credentials`)**:
   - Autentikasi kini memakai **Supabase Auth**. REST anon tidak lagi dapat membaca profile atau menulis modul; RLS dan RPC server-side menjadi otoritas approval/role, sementara LocalStorage tidak pernah dipakai untuk login.
3. **Ekspansi Fitur Excel Multi-Modul**:
   - Fitur manipulasi berkas Excel yang sebelumnya hanya terdapat pada modul Rundown telah diekspansi menjadi **Universal Excel Engine** yang melayani seluruh 7 modul aplikasi dan Master Backup multi-sheet.
4. **Proteksi Hak Akses (View-Only RBAC)**:
   - Peserta biasa tetap dapat melihat informasi umum dan mengekspor Excel jadwal/laporan, namun tombol edit, tambah baris, dan import data Excel otomatis disembunyikan.

---

## 📁 Struktur Berkas Project

```text
D:\PowerPro\Tools\Web\Outing│
├── index.html                               # Aplikasi utama (Single Page Application - SPA)
├── database_schema.sql                      # DDL PostgreSQL/Supabase, Auth trigger, RPC & RLS
├── supabase/seed.sql                        # Seed akun demo Supabase Auth (development)
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
- [x] Simulasi Role Switcher di profil pengguna yang dibatasi hanya untuk Admin.
- [x] Fitur ganti password mandiri dari halaman Profil melalui Supabase Auth (tanpa hash password di public.users).
- [x] Skema database lengkap dengan view `v_cash_summary`, RLS policies, serta approval user baru di Supabase.
- [x] Approval user baru: registrasi berstatus `PENDING`, approval Admin-only melalui RPC, dan validasi status login dari Supabase Auth/RLS.
- [x] Dokumentasi progress dan pembaruan pada `README.md` dan `Rangkuman_Project_Outing_Management.docx`.
- [ ] *(Opsional)* Integrasi WhatsApp Click-to-Chat URL pada nomor telepon peserta untuk memudahkan koordinator bus menghubungi peserta secara instan.
- [ ] *(Opsional)* Deployment frontend ke GitHub Pages, Vercel, atau Netlify (cukup upload file repositori ini).

---
*Dokumentasi ini diperbarui untuk memastikan kontinuitas pengembangan yang mulus dan pencatatan riwayat project yang transparan.*
