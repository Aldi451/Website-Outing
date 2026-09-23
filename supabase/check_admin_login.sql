-- ====================================================================
-- DIAGNOSA LOGIN ADMIN (READ-ONLY) — OUTING MANAGEMENT SYSTEM
-- ====================================================================
-- Script ini TIDAK mengubah apa pun. Tempel di Supabase Dashboard ->
-- SQL Editor -> RUN untuk melihat penyebab Admin tidak bisa login.
-- Bila ada baris bernilai false / kosong, jalankan supabase/fix_admin_login.sql.
-- ====================================================================


-- --------------------------------------------------------------------
-- 1. RINGKASAN STATUS LOGIN ADMIN
-- --------------------------------------------------------------------
-- Semua kolom harus true agar login Admin berhasil.
SELECT
    EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'admin@outing.local') AS auth_ada,
    (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE lower(email) = 'admin@outing.local') AS email_confirmed,
    EXISTS (
        SELECT 1 FROM auth.identities i
        JOIN auth.users u ON u.id = i.user_id
        WHERE lower(u.email) = 'admin@outing.local' AND i.provider = 'email'
    ) AS identity_email_ada,
    EXISTS (
        SELECT 1 FROM public.users u
        WHERE upper(u.role) = 'ADMIN' AND u.approval_status = 'APPROVED'
    ) AS ada_profil_admin_approved,
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN auth.users a ON a.id = u.auth_user_id
        WHERE lower(a.email) = 'admin@outing.local'
    ) AS profil_terhubung_ke_auth,
    (
        SELECT count(*) = 2 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name IN ('role_id', 'section_id')
    ) AS kolom_role_section_ada,
    (
        SELECT count(*) = 2 FROM pg_constraint
        WHERE conname IN ('users_role_id_fkey', 'users_section_id_fkey')
          AND conrelid = 'public.users'::regclass
    ) AS fk_role_section_ada;

-- Penjelasan singkat tiap kolom:
--   auth_ada                  : akun admin@outing.local ada di Authentication -> Users
--   email_confirmed           : bila false, login dijawab "Email not confirmed"
--   identity_email_ada        : baris auth.identities provider 'email'; tanpa ini login password gagal
--   ada_profil_admin_approved : ada profil dengan role ADMIN dan status APPROVED
--   profil_terhubung_ke_auth  : public.users.auth_user_id terisi ke akun Auth di atas
--   kolom_role_section_ada    : kolom yang dipakai embed roles(...)/sections(...)
--   fk_role_section_ada       : foreign key yang bila tidak ada memicu error PGRST200


-- --------------------------------------------------------------------
-- 2. ISI TABEL public.users SAAT INI
-- --------------------------------------------------------------------
-- Kolom opsional dibaca lewat to_jsonb supaya query ini tetap berjalan
-- walaupun kolom role_id/section_id/approved_at belum ada di tabel legacy.
-- Nilai NULL/kosong pada kolom opsional menandakan migrasi belum dijalankan.
SELECT u.id,
       u.auth_user_id,
       u.username,
       u.full_name,
       u.role,
       u.section,
       u.approval_status,
       to_jsonb(u) ->> 'role_id' AS role_id,
       to_jsonb(u) ->> 'section_id' AS section_id,
       to_jsonb(u) ->> 'approved_at' AS approved_at,
       to_jsonb(u) ->> 'department' AS department,
       u.created_at
FROM public.users u
ORDER BY (upper(u.role) = 'ADMIN') DESC, u.username
LIMIT 50;


-- --------------------------------------------------------------------
-- 3. ISI TABEL MASTER roles & sections
-- --------------------------------------------------------------------
-- Bila salah satu kosong, kolom role_id/section_id akan NULL dan validasi
-- di aplikasi perlu mengandalkan kolom teks role/section.
SELECT 'roles' AS tabel, name, created_at FROM public.roles
UNION ALL
SELECT 'sections' AS tabel, name, created_at FROM public.sections
ORDER BY tabel, name;


-- --------------------------------------------------------------------
-- 4. KOLOM YANG ADA DI public.users
-- --------------------------------------------------------------------
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;


-- --------------------------------------------------------------------
-- 5. FOREIGN KEY YANG ADA DI public.users
-- --------------------------------------------------------------------
SELECT con.conname AS nama_constraint,
       pg_get_constraintdef(con.oid) AS definisi
FROM pg_constraint con
WHERE con.conrelid = 'public.users'::regclass
  AND con.contype = 'f'
ORDER BY con.conname;


-- --------------------------------------------------------------------
-- 6. TABEL APLIKASI YANG BELUM ADA DI DATABASE
-- --------------------------------------------------------------------
-- Tabel Donasi (donation_*) hanya dibutuhkan modul donasi; tabel inti
-- (users, roles, sections, outings, dst.) wajib ada untuk login & dashboard.
WITH expected(nama) AS (
    VALUES
        ('users'), ('roles'), ('sections'), ('outings'), ('outing_users'),
        ('participants'), ('rundowns'), ('cash_accounts'), ('cash_transactions'),
        ('purchase_requests'), ('tasks'), ('consumption_plans'), ('announcements'),
        ('donation_programs'), ('donation_beneficiaries'), ('donation_memberships'),
        ('donation_transactions'), ('donation_settings'), ('donation_reminders'),
        ('donation_foundations'), ('donation_incident_cases'),
        ('donation_staff_allocations'), ('donation_year_closures'),
        ('donation_foundation_disbursements')
)
SELECT e.nama AS tabel_belum_ada
FROM expected e
WHERE to_regclass('public.' || e.nama) IS NULL
ORDER BY e.nama;


-- --------------------------------------------------------------------
-- 7. FUNGSI & RLS YANG DIPAKAI APLIKASI
-- --------------------------------------------------------------------
SELECT p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS security_definer
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('resolve_login_username', 'handle_new_auth_user',
                    'admin_set_user_approval', 'current_app_user_is_admin',
                    'current_app_user_is_approved')
ORDER BY p.proname;

SELECT c.relname AS tabel, c.relrowsecurity AS rls_aktif, c.relforcerowsecurity AS rls_force
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname IN ('users', 'roles', 'sections')
ORDER BY c.relname;

SELECT tablename, policyname, cmd, roles, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users'
ORDER BY policyname;
