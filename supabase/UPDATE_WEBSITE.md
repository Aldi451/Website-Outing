# Update Supabase Website Outing — 23 September 2026

## Yang perlu dijalankan

**Satu file utama: [`update_website.sql`](update_website.sql).** File ini menggabungkan schema website terkini, migrasi kolom, RLS/grants, trigger registrasi, approval, seluruh RPC yang dipanggil frontend, serta modul peserta. Bisa ditempel langsung di Supabase SQL Editor, tanpa `\i`/perintah khusus psql.

1. **Backup database terlebih dahulu**, idealnya uji pada project staging/duplikat.
2. Buka **Supabase Dashboard → SQL Editor → New query**, role **postgres**.
3. Salin **seluruh** `supabase/update_website.sql`, lalu **Run**. Jangan hanya menjalankan baris yang terseleksi. Script memakai transaksi: jika satu bagian error, perubahan dalam file dibatalkan. Jika editor masih menunjukkan transaksi gagal, jalankan `ROLLBACK;` sebelum mencoba lagi.
4. Pastikan selesai **tanpa error**. Hasil SELECT verifikasi bisa berupa tabel, bukan hanya tulisan “No rows returned”.
5. Jalankan [`check_website_update.sql`](check_website_update.sql). Semua 9 RPC harus terpasang; `anon = false` kecuali `resolve_login_username`. Trigger `on_auth_user_created` dan `trg_enforce_new_auth_user_pending` harus aktif.
6. **Deploy `index.html` terbaru juga**, hard refresh, kemudian logout/login sebagai **ADMIN yang APPROVED**, bukan role simulator. SQL saja tidak menambahkan banner pada frontend lama.
7. Buka dua browser/incognito: satu untuk Admin, satu untuk registrasi uji. Dalam maksimal sekitar **30 detik saat tab Admin aktif**, banner dan toast akan muncul. Klik **Buka Approval**.

Tidak perlu menjalankan `participant_management.sql` atau `registration_notifications.sql` lagi setelah file gabungan sukses; keduanya sudah termasuk. `database_schema.sql` untuk instalasi baru juga memuat modul yang sama. **Jangan menjalankan `seed.sql` / `fix_admin_login.sql` sebagai bagian update rutin ini**: file demo/perbaikan akun tersebut memiliki tujuan berbeda.

## Temuan dan perbaikan

| Area | Temuan di repository | Perbaikan |
|---|---|---|
| Schema berhenti sebelum RPC peserta | CHECK inline `approved_amount` menghasilkan nama yang sama dengan CHECK bernama eksplisit pada `donation_incident_cases` | Nama constraint dibedakan; fresh install dan rerun sudah diuji |
| Tidak ada notif Admin | Badge hanya dimuat saat halaman approval dibuka | RPC `admin_pending_registration_notifications`, banner dashboard, toast awal/registrasi baru, polling 30 detik dan refresh saat kembali ke tab |
| Notif saat Admin offline | Tidak ada pemuatan antrean global saat login | Antrean berasal dari `public.users.approval_status = PENDING`, sehingga tetap terbaca pada login berikutnya; tidak bergantung localStorage |
| Register gagal karena outing lama | Trigger langsung menggunakan UUID dari cache browser | Cek keberadaan outing dulu; ID yang sudah tidak ada tidak menggagalkan signup |
| Kolom lama tertinggal | `CREATE TABLE IF NOT EXISTS` tidak menambah kolom tabel existing | Penyelarasan kolom profil/peserta sebelum trigger dijalankan |
| Tambah peserta tampak sukses padahal tidak lengkap | Error `auth.identities` dan kamar/armada ditelan sebagai NOTICE | Error membatalkan transaksi agar tidak ada akun/peserta setengah jadi |
| Login akun buatan Admin | Beberapa kolom token Auth bisa NULL; identity lama mungkin hilang | Isi string token pada akun baru, normalisasi NULL akun internal lama, pulihkan identity yang hilang tanpa reset password |
| Profil Auth tidak sama ID dengan profil aplikasi | RPC mengasumsikan ID selalu sama | Resolve ID profil dari `auth_user_id` setelah trigger Auth berjalan |
| Inisiator tidak melihat daftar yang dikelolanya | Read policy `users` hanya self/Admin, sementara RPC memperbolehkan Inisiator | Read policy manager peserta; approval/notifikasi tetap hanya Admin |
| Register lama belum tampil | Akun Auth ada, trigger profil sebelumnya belum terpasang | Backfill akun `@outing.local` tanpa profil sebagai PARTICIPANT/PENDING; benturan username dilaporkan, tidak ditautkan sembarangan |
| Replace impor dengan baris gagal | Bisa menghapus data pelengkap yang tidak masuk daftar sukses | Cleanup replace dibatalkan bila ada baris gagal; ringkasan error tetap dikembalikan |
| Password fallback | Password pendek diam-diam diganti password bersama | Password pendek ditolak; jika benar-benar kosong RPC membuat password acak. UI impor lama masih mengirim `outing123` secara eksplisit—ganti setelah dibagikan |

## Batas dan perubahan yang perlu diketahui

- **Notifikasi ini dalam website**, bukan email, WhatsApp, atau browser push. Tidak memerlukan Realtime publication, cron, maupun Edge Function. Saat tab tertutup tidak ada toast; antrean muncul saat Admin login lagi.
- **Approval hanya ADMIN**. INITIATOR/seksi INISIATOR dapat mengelola peserta, tetapi tidak memperoleh hak approval registrasi. Hasil role simulator tidak membuka notifikasi/approval.
- Tidak mereset password Auth, menghapus peserta existing, atau mempromosikan akun menjadi Admin. Profil existing dengan status approval NULL mengikuti migrasi legacy schema: menjadi APPROVED. Akun orphan baru yang dipulihkan tetap PENDING.
- Seperti schema repo sebelumnya, update **mengganti policy aplikasi** pada tabel-tabel website, menghapus kolom password legacy `public.users.password_hash`, dan mempertahankan bucket `purchases` sebagai **public**. Jika project memiliki policy/storage kustom, review terlebih dahulu. Password Supabase Auth tetap utuh.
- SQL tidak mengubah konfigurasi Authentication Dashboard. Website saat ini memakai email sintetis `username@outing.local`, yang tidak bisa menerima email. Untuk mode ini, cek **Authentication → Providers/Sign In → Email → Confirm email**. Nonaktifkan pengiriman konfirmasi jika memakai akun internal; status PENDING tetap dilindungi RLS. Approval juga mengonfirmasi email internal yang cocok. Untuk email sungguhan, pertahankan verifikasi email dan sesuaikan alur frontend.
- Error SMTP/rate limit/CAPTCHA/email provider tidak diselesaikan oleh SQL. Cek Auth Logs jika signup gagal sebelum insert `auth.users`.
- Akun tanpa profil yang username-nya bentrok dengan profil legacy **tidak otomatis ditautkan** demi keamanan. Periksa hasil diagnostik dan identitas pemiliknya dahulu; jangan langsung menyalin `auth_user_id` antar akun.
- RPC peserta masih memakai pola repo: operasi `auth.users`/`auth.identities` server-side lewat SECURITY DEFINER. Pola ini terikat struktur Auth Supabase. Untuk jangka panjang, provisioning akun dapat dipindahkan ke backend/Edge Function dengan Supabase Auth Admin API; service-role key jangan pernah ditempatkan di browser.
- Bundle menyelaraskan struktur yang diketahui dalam repo, bukan semua variasi schema kustom di project lain. Tidak ada koneksi ke database produksi selama perubahan ini dibuat.

## Checklist setelah deploy

- Register username baru → profil `PARTICIPANT / PUBLIC / PENDING`, satu baris peserta.
- Admin di dashboard → toast + banner jumlah pending; refresh tidak mengulang toast untuk ID yang sama.
- Approve → status APPROVED, `approved_by` terisi; jumlah pending berkurang; akun internal dapat login.
- Reject → hilang dari antrean pending; login ke aplikasi tetap ditolak.
- Data Peserta → Tambah → isi nama/User ID/password/kamar/armada → simpan → login dengan akun baru melalui incognito.
- Edit kamar/armada → refresh → nilai tersimpan.
- Impor upsert/replace → cek created/updated/skipped; satu baris invalid tidak menghapus data pelengkap lama.
- User biasa tidak bisa memanggil RPC admin; logout menghentikan polling.

Jika RPC masih `PGRST202` setelah SQL sukses, tunggu beberapa detik atau jalankan:

```sql
NOTIFY pgrst, 'reload schema';
```

## Tes lokal dan sinkronisasi SQL

```bash
npm install --prefix .testtools embedded-postgres@18.4.0-beta.17 pg@8.23.0 jsdom@30.1.1 --no-audit --no-fund
python scripts/build_sql_update.py --check
node tests/sql_update.test.mjs
node tests/registration_notifications.test.mjs
```

Tes SQL menjalankan PostgreSQL lokal sementara (port 55432) dengan fixture schema `auth`/`storage`: fresh install, rerun, signup, approval, RLS, RPC peserta, rollback, impor, backfill, dan kecocokan nama parameter/grants seluruh 9 RPC frontend. Tes UI memakai DOM lokal untuk polling, deduplikasi, error/retry, role guard, dan cleanup logout. Ini **bukan** tes GoTrue/PostgREST atau login end-to-end pada Supabase produksi; checklist browser di atas tetap perlu dilakukan.

Sumber perubahan: edit bagian dasar `database_schema.sql` sebelum marker generated, atau `participant_management.sql` / `registration_notifications.sql`, lalu jalankan:

```bash
python scripts/build_sql_update.py
```

Jangan mengedit `update_website.sql` langsung; generator menjaganya sama dengan instalasi baru.
