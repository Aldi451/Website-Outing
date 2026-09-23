# Uji integrasi SQL dengan PostgreSQL asli (PGlite)

Folder ini memuat uji integrasi untuk berkas SQL di `supabase/`. Pengujian
memakai PostgreSQL 18 asli melalui `@electric-sql/pglite` (WASM), sehingga
fungsi `SECURITY DEFINER` benar-benar dijalankan — bukan sekadar diperiksa
sintaksnya.

```bash
cd scratch/pglite
npm install @electric-sql/pglite
node run.mjs
```

Isi pengujian:

1. `setup.sql` meniru struktur Supabase (schema `auth`, `auth.users`,
   `auth.identities`, `auth.uid()`) beserta skema publik versi lama:
   `public.users` tanpa `role_id`/`section_id`, `public.participants` tanpa
   kolom `username`/`room`, dan tabel master `roles`/`sections` tanpa kolom
   `description`.
2. `supabase/fix_admin_login.sql` dijalankan, lalu diperiksa: kolom & foreign
   key terbentuk, email Auth terkonfirmasi, password direset, baris
   `auth.identities` dibuat, dan seed tetap berjalan pada bentuk tabel lama.
3. `supabase/participant_management.sql` dijalankan, lalu fungsinya diuji:
   tambah peserta (membuat akun login), edit peserta lama, penolakan non-admin,
   penghapusan akun sendiri, hapus peserta (profil + data pelengkap + akun
   Auth), pengaman Admin terakhir, serta impor massal mode replace.

Catatan: PGlite tidak menyertakan `pgcrypto`, jadi `crypt()`/`gen_salt()`
digantikan stub `extensions.*` selama pengujian. Pada Supabase asli extension
tersebut tersedia dan dipakai apa adanya.
