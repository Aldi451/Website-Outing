-- ====================================================================
-- PERBAIKAN LOGIN ADMIN — OUTING MANAGEMENT SYSTEM
-- ====================================================================
-- Cara pakai: buka Supabase Dashboard -> SQL Editor -> New query,
-- tempel SELURUH isi berkas ini, lalu klik RUN.
-- Script bersifat idempoten (aman dijalankan berulang kali).
--
-- Latar belakang masalah "Admin tidak bisa login padahal role sudah ADMIN":
--   1. Tabel public.users versi lama hanya punya kolom teks `role`/`section`.
--      Kolom `role_id`/`section_id` beserta foreign key ke tabel `roles` dan
--      `sections` tidak pernah dibuat karena CREATE TABLE IF NOT EXISTS tidak
--      menambah kolom pada tabel yang sudah ada.
--      Akibatnya permintaan profil dari frontend
--          select('*, roles(id, name), sections(id, name)')
--      ditolak PostgREST dengan error PGRST200 ("Could not find a relationship
--      between 'users' and 'roles'"). Dashboard gagal dimuat, sesi langsung
--      di-signOut, dan pengguna kembali ke halaman login seolah-olah password
--      atau role-nya salah.  -> diperbaiki oleh BAGIAN A.
--   2. Supabase Auth di project ini memakai "Confirm email" aktif
--      (mailer_autoconfirm = false). Akun admin@outing.local berada pada domain
--      yang tidak bisa menerima email, sehingga email_confirmed_at tetap NULL
--      dan login dijawab "Email not confirmed".  -> diperbaiki oleh BAGIAN B.
--   3. Profil public.users harus terhubung ke auth.users (auth_user_id),
--      ber-role ADMIN, dan berstatus APPROVED.  -> BAGIAN C.
--
-- Jalankan BAGIAN D di akhir untuk melihat status ringkas keterbacaan.
-- ====================================================================


-- ====================================================================
-- BAGIAN A. SINKRONISASI SKEMA (akar masalah PGRST200)
-- ====================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabel master role & seksi + seed. Dibuat bila belum ada supaya foreign key
-- di bawah selalu punya tabel tujuan.
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.roles (name, description) VALUES
    ('ADMIN', 'Akses penuh dan konfigurasi sistem outing'),
    ('INITIATOR', 'Inisiator acara dengan kewenangan management outing'),
    ('FINANCE', 'Pengelola transaksi kas dan laporan keuangan'),
    ('PURCHASING', 'Pengelola pengadaan barang dan purchase request'),
    ('LOGISTIC', 'Pengelola perlengkapan, armada, dan tugas operasional'),
    ('KONSUMSI', 'Pengelola rencana konsumsi dan meal plan'),
    ('PUBLIC_AREA', 'Pengelola informasi publik dan pengumuman'),
    ('PARTICIPANT', 'Peserta biasa dengan hak akses view-only')
ON CONFLICT DO NOTHING;

INSERT INTO public.sections (name, description) VALUES
    ('INISIATOR', 'Tim Inisiator / Ketua Panitia Acara'),
    ('KEUANGAN', 'Seksi Keuangan & Kas'),
    ('PURCHASING', 'Seksi Purchasing & Pengadaan Barang'),
    ('LOGISTIC', 'Seksi Logistik, Perlengkapan & Transport'),
    ('KONSUMSI', 'Seksi Konsumsi & Katering'),
    ('PUBLIC_AREA', 'Seksi Public Area & Informasi'),
    ('PUBLIC', 'Peserta Umum')
ON CONFLICT DO NOTHING;

-- Kolom penghubung ke tabel master. Inilah yang membuat embed
-- roles(...) / sections(...) dikenali PostgREST.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS section_id UUID;

-- Kolom pendukung approval (bila tabel users masih versi lama).
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Kolom profil lain. Tabel legacy sering hanya punya sebagian kolom, sedangkan
-- aplikasi membaca semuanya. ADD COLUMN IF NOT EXISTS aman diulang dan tidak
-- mengubah data yang sudah ada.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Migrasi data: baris lama tanpa auth_user_id dianggap sudah aktif.
UPDATE public.users
SET approval_status = 'APPROVED'
WHERE approval_status IS NULL;

-- Foreign key wajib ada agar PostgREST dapat menyalurkan relasi users -> roles
-- dan users -> sections (muncul sebagai error PGRST200 bila tidak ada).
DO $$
DECLARE
    v_fk RECORD;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_auth_user_id_fkey'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_auth_user_id_fkey
            FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_role_id_fkey'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;
        RAISE NOTICE 'Foreign key users.role_id -> roles.id dibuat.';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_section_id_fkey'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_section_id_fkey
            FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
        RAISE NOTICE 'Foreign key users.section_id -> sections.id dibuat.';
    END IF;

    -- Tabel outing_users (bila sudah ada) memakai kolom yang sama.
    IF to_regclass('public.outing_users') IS NOT NULL THEN
        FOR v_fk IN
            SELECT * FROM (VALUES
                ('outing_users_role_id_fkey', 'role_id', 'public.roles'),
                ('outing_users_section_id_fkey', 'section_id', 'public.sections')
            ) AS t(conname, colname, reftable)
        LOOP
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = v_fk.conname
                  AND conrelid = 'public.outing_users'::regclass
            ) THEN
                EXECUTE format(
                    'ALTER TABLE public.outing_users ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE SET NULL',
                    v_fk.conname, v_fk.colname, v_fk.reftable
                );
            END IF;
        END LOOP;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users (role_id);
CREATE INDEX IF NOT EXISTS idx_users_section_id ON public.users (section_id);
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));

-- Constraint status approval (dilewati bila masih ada data tidak valid).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_approval_status_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        BEGIN
            ALTER TABLE public.users
                ADD CONSTRAINT users_approval_status_check
                CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));
        EXCEPTION WHEN check_violation THEN
            RAISE NOTICE 'Constraint approval dilewati: masih ada nilai approval_status di luar PENDING/APPROVED/REJECTED.';
        END;
    END IF;
END $$;

-- Paksa PostgREST memuat ulang skema setelah kolom & foreign key berubah.
NOTIFY pgrst, 'reload schema';


-- ====================================================================
-- BAGIAN B. PERBAIKAN AKUN SUPABASE AUTH
-- ====================================================================
-- Script ini TIDAK membuat akun Auth baru. Bila hasil NOTICE menyatakan user
-- belum ada, buat dulu user admin@outing.local di
-- Authentication -> Users -> Add user (boleh centang "Auto Confirm User"),
-- lalu jalankan ulang berkas ini.
DO $$
DECLARE
    v_admin_email TEXT := 'admin@outing.local';
    v_auth_id UUID;
    v_has_identities BOOLEAN;
BEGIN
    SELECT id INTO v_auth_id
    FROM auth.users
    WHERE lower(email) = v_admin_email
    LIMIT 1;

    IF v_auth_id IS NULL THEN
        RAISE NOTICE '[B] User Auth % BELUM ADA. Buat di Authentication -> Users, lalu jalankan ulang script ini.', v_admin_email;
        RETURN;
    END IF;

    -- Password diambil alih menjadi power88 dan email ditandai terkonfirmasi.
    -- Catatan: kolom confirmed_at TIDAK diubah karena pada Supabase terbaru
    -- kolom tersebut adalah generated column.
    UPDATE auth.users
    SET encrypted_password = crypt('power88', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_auth_id;

    RAISE NOTICE '[B] Password akun % direset ke power88 dan email ditandai terkonfirmasi.', v_admin_email;

    -- Bila user pernah dibuat lewat INSERT manual ke auth.users, baris
    -- auth.identities tidak ikut terbuat dan login password bisa gagal.
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'auth' AND table_name = 'identities'
    ) INTO v_has_identities;

    IF v_has_identities THEN
        BEGIN
            INSERT INTO auth.identities (
                id, user_id, provider_id, identity_data, provider,
                last_sign_in_at, created_at, updated_at
            )
            SELECT gen_random_uuid(), u.id, u.id::text,
                   jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
                   'email', now(), now(), now()
            FROM auth.users u
            WHERE u.id = v_auth_id
              AND NOT EXISTS (
                  SELECT 1 FROM auth.identities i
                  WHERE i.user_id = u.id AND i.provider = 'email'
              );

            IF FOUND THEN
                RAISE NOTICE '[B] Baris auth.identities provider email dibuat untuk %.', v_admin_email;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '[B] Pelewatan perbaikan auth.identities: %', SQLERRM;
        END;
    END IF;
END $$;


-- ====================================================================
-- BAGIAN C. PERBAIKAN PROFIL public.users
-- ====================================================================
DO $$
DECLARE
    v_auth_id UUID;
    v_role_id UUID;
    v_section_id UUID;
    v_profile_id UUID;
BEGIN
    SELECT id INTO v_auth_id
    FROM auth.users
    WHERE lower(email) = 'admin@outing.local'
    LIMIT 1;

    IF v_auth_id IS NULL THEN
        RAISE NOTICE '[C] Dilewati: akun Auth admin@outing.local belum ada.';
        RETURN;
    END IF;

    SELECT id INTO v_role_id FROM public.roles WHERE upper(name) = 'ADMIN' LIMIT 1;
    SELECT id INTO v_section_id FROM public.sections WHERE upper(name) = 'INISIATOR' LIMIT 1;

    -- 1) Profil yang sudah terhubung ke akun Auth ini.
    SELECT id INTO v_profile_id FROM public.users WHERE auth_user_id = v_auth_id LIMIT 1;

    -- 2) Profil legacy bernama 'admin' yang belum terhubung ke akun Auth mana pun.
    IF v_profile_id IS NULL THEN
        SELECT id INTO v_profile_id
        FROM public.users
        WHERE lower(username) = 'admin' AND auth_user_id IS NULL
        LIMIT 1;
    END IF;

    IF v_profile_id IS NOT NULL THEN
        UPDATE public.users
        SET auth_user_id = v_auth_id,
            username = COALESCE(NULLIF(username, ''), 'admin'),
            full_name = COALESCE(NULLIF(full_name, ''), 'Administrator')
        WHERE id = v_profile_id;

        RAISE NOTICE '[C] Profil % dihubungkan ke akun Auth admin (bila belum).', v_profile_id;
    ELSE
        -- 3) Belum ada profil sama sekali -> buat baru.
        BEGIN
            INSERT INTO public.users (
                auth_user_id, username, full_name, department, email,
                role, section, approval_status, approved_at,
                role_id, section_id, is_active, created_at, updated_at
            ) VALUES (
                v_auth_id, 'admin', 'Administrator', 'Management', 'admin@outing.local',
                'ADMIN', 'INISIATOR', 'APPROVED', now(),
                v_role_id, v_section_id, TRUE, now(), now()
            );

            RAISE NOTICE '[C] Profil baru dengan username admin dibuat dan dihubungkan ke akun Auth.';
        EXCEPTION WHEN unique_violation THEN
            RAISE NOTICE '[C] Profil baru gagal dibuat: username ''admin'' sudah dipakai baris lain yang terhubung ke akun Auth berbeda. Periksa tabel public.users lalu jalankan ulang script ini.';
        END;
    END IF;

    -- Penegasan akhir. Trigger legacy public.enforce_new_auth_user_pending memaksa
    -- setiap baris baru ber-auth_user_id menjadi PARTICIPANT/PENDING, sehingga
    -- role Admin harus dipastikan lewat UPDATE setelah INSERT.
    UPDATE public.users
    SET role = 'ADMIN',
        section = 'INISIATOR',
        approval_status = 'APPROVED',
        approved_at = COALESCE(approved_at, now()),
        rejection_reason = NULL,
        role_id = v_role_id,
        section_id = v_section_id,
        updated_at = now()
    WHERE auth_user_id = v_auth_id;

    IF NOT FOUND THEN
        RAISE NOTICE '[C] Peringatan: tidak ada baris public.users dengan auth_user_id = %. Periksa manual di Table Editor.', v_auth_id;
    END IF;

    IF v_role_id IS NULL OR v_section_id IS NULL THEN
        RAISE NOTICE '[C] Peringatan: baris master ADMIN/INISIATOR tidak ditemukan, kolom role_id/section_id dibiarkan NULL. Kolom teks role/section tetap dipakai aplikasi.';
    END IF;
END $$;

NOTIFY pgrst, 'reload schema';


-- ====================================================================
-- BAGIAN D. VERIFIKASI
-- ====================================================================
-- Semua kolom harus bernilai true/tidak kosong agar login Admin berhasil.
--   auth_ada            : akun admin@outing.local ada di Authentication -> Users
--   email_confirmed     : wajib true; bila false login dijawab "Email not confirmed"
--   identity_email      : wajib ada; tanpa ini login password bisa ditolak
--   profil_admin        : profil terhubung + role ADMIN + status APPROVED
--   kolom_role_section  : kolom yang membuat embed roles/sections berfungsi
--   fk_role_section     : foreign key penyebab error PGRST200
SELECT
    EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = 'admin@outing.local') AS auth_ada,
    (SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE lower(email) = 'admin@outing.local') AS email_confirmed,
    EXISTS (
        SELECT 1 FROM auth.identities i
        JOIN auth.users u ON u.id = i.user_id
        WHERE lower(u.email) = 'admin@outing.local' AND i.provider = 'email'
    ) AS identity_email,
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN auth.users a ON a.id = u.auth_user_id
        WHERE lower(a.email) = 'admin@outing.local'
          AND upper(u.role) = 'ADMIN'
          AND u.approval_status = 'APPROVED'
    ) AS profil_admin,
    (
        SELECT count(*) = 2 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
          AND column_name IN ('role_id', 'section_id')
    ) AS kolom_role_section,
    (
        SELECT count(*) = 2 FROM pg_constraint
        WHERE conname IN ('users_role_id_fkey', 'users_section_id_fkey')
          AND conrelid = 'public.users'::regclass
    ) AS fk_role_section;

-- Rincian profil Admin (password tidak pernah ditampilkan).
SELECT au.email,
       au.email_confirmed_at,
       u.username,
       u.full_name,
       u.role,
       u.section,
       u.approval_status,
       r.name AS role_master,
       s.name AS section_master
FROM auth.users au
LEFT JOIN public.users u ON u.auth_user_id = au.id
LEFT JOIN public.roles r ON r.id = u.role_id
LEFT JOIN public.sections s ON s.id = u.section_id
WHERE lower(au.email) = 'admin@outing.local';
