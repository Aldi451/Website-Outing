# Deployment InfinityFree — Outing Management

Versi aktif aplikasi ini memakai **PHP 8.1+ dan MySQL/MariaDB** untuk login, sesi, serta penyimpanan bersama. InfinityFree menjalankan PHP di server; Python + SQLite tidak digunakan. HTML/CSS/JavaScript tetap berjalan di browser karena merupakan antarmuka SPA.

## 1. Buat website dan database

1. Buat/aktifkan website di InfinityFree dan pastikan domain/subdomain sudah mengarah ke akun hosting.
2. Buka **VistaPanel → MySQL Databases**, buat database baru, lalu catat persis nilai **MySQL Hostname, Database Name, Username, dan Password**. Host database bukan selalu `localhost`; gunakan nilai yang diberikan control panel.
3. Pastikan versi PHP website disetel ke **PHP 8.1 atau yang lebih baru** dan ekstensi **PDO MySQL** tersedia.

## 2. Isi konfigurasi secara privat

1. Di komputer sendiri, salin `config.example.php` menjadi `config.php`.
2. Buka `config.php` dan ganti semua nilai contoh:
   - `db_host`, `db_name`, `db_user`, `db_password`: salin dari VistaPanel.
   - `admin_username` / `admin_password`: akun pengelola.
   - `member_username` / `member_password`: akun baca-saja.
   - `app_secret`: string acak rahasia minimal 32 karakter.
3. Pilih username Admin dan Member yang berbeda serta password kuat dan berbeda. Jangan memakai password yang digunakan di layanan lain.
4. Password boleh diisi sebagai teks biasa di file privat tersebut atau sebagai hash bcrypt/Argon2 dari PHP `password_hash()`. **Jangan kirim password database atau file `config.php` lewat chat, jangan commit ke Git, dan jangan menaruhnya di `index.html`.** File `config.php` sudah masuk `.gitignore` dan dilindungi `.htaccess`.

`config.example.php` hanya template. Aplikasi tidak menyediakan password default untuk production.

## 3. Upload file yang diperlukan

Gunakan File Manager atau FTP InfinityFree. Upload file berikut ke direktori `htdocs` (atau document root yang ditunjukkan panel):

- `index.html`
- `api.php`
- `.htaccess`
- `config.php` yang sudah diisi

Jangan upload `.git/`, folder `tests/`, berkas dokumentasi, berkas SQLite/Python, atau `database_schema.sql`/folder `supabase/`. SQL tersebut dibuat untuk PostgreSQL/Supabase lama, bukan untuk database MySQL InfinityFree.

Pastikan domain dibuka dengan **HTTPS**. Jangan menguji dengan membuka `index.html` sebagai `file://`, GitHub Pages, atau server statis saja karena endpoint PHP harus dijalankan oleh hosting.

## 4. Inisialisasi database dan tes login

1. Buka domain website. API akan membuat tabel MySQL aplikasi secara otomatis saat permintaan pertama diterima. Tidak perlu mengimpor `database_schema.sql` atau membuat tabel manual.
2. Login dengan username/password Admin yang diatur di `config.php`. Atur informasi outing dan data lain seperti biasa; perubahan Admin disimpan bersama di MySQL.
3. Buka website di browser/perangkat lain dan login sebagai Member. Member dapat membaca data yang sama, tetapi tidak dapat mengubahnya. Perlindungan tulis diterapkan di backend API juga, bukan hanya dengan menyembunyikan tombol UI.
4. Data peserta dimasukkan manual. Penyimpanan peserta hanya mempertahankan **nama, nomor telepon/WhatsApp, dan status** (serta ID teknis untuk edit/hapus).

## Hak akses dan penyimpanan

- **Admin:** dapat mengelola data outing dan peserta.
- **Member:** hanya dapat membaca data; server menolak permintaan tulis dengan HTTP 403.
- Akun Admin/Member diatur dalam `config.php`; tidak ada registrasi publik atau role tambahan pada deployment ini.
- Sesi login disimpan server-side di tabel MySQL, dengan cookie HttpOnly/SameSite dan masa berlaku 12 jam.
- Status percobaan login disimpan sebagai hash alamat IP, bukan alamat IP mentah. Data aplikasi disimpan bersama pada database hosting, bukan browser `localStorage`.

## Data dari server lokal lama

Database MySQL di InfinityFree dimulai dengan data outing kosong/default. Berkas SQLite lokal lama, bila pernah dibuat di komputer lain, tidak otomatis tersedia atau dikonversi oleh deployment ini. Simpan backup SQLite dan jangan hapus instalasi lama sampai data yang diperlukan sudah diekspor/dipindahkan dan diverifikasi di hosting.

## Pemecahan masalah

- **Pesan `config.php` belum dibuat / konfigurasi belum lengkap:** salin template ke `config.php` dan ganti seluruh placeholder.
- **Koneksi database gagal:** cocokkan host, nama, username, dan password dengan VistaPanel. Jangan menebak hostname atau menggunakan `localhost` kecuali panel memang menyatakannya.
- **Database belum siap atau tabel belum ada:** buka kembali website agar API membuat tabel. Periksa log error PHP di control panel jika pesan tetap muncul; detail internal database sengaja tidak ditampilkan ke browser.
- **Error 500 setelah upload `.htaccess`:** pastikan file diunggah utuh dan directive Apache diizinkan host. Jika perlu, periksa log error hosting sebelum mengubah aturan akses.
- **Tidak bisa login sebagai Member:** pastikan username/password Member diisi berbeda dari Admin di `config.php` dan perubahan konfigurasi sudah ter-upload.
- **Browser menampilkan file PHP atau mengunduhnya:** domain belum menjalankan PHP dengan benar; pastikan file berada di document root akun InfinityFree.

`config.php` memuat rahasia dan kredensial. Jika pernah terunggah ke tempat publik atau Git, segera ganti password database dan password akun di control panel/config.
