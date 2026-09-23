-- ====================================================================
-- MANAJEMEN PESERTA (SIMpan / HAPUS / IMPOR) — OUTING MANAGEMENT SYSTEM
-- ====================================================================
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query -> tempel
-- seluruh isi berkas ini -> RUN. Script bersifat idempoten.
-- Prasyarat patch terpisah: tabel users/participants dan helper RLS sudah ada.
-- Untuk update lengkap (register, approval, RLS, semua modul), gunakan
-- supabase/update_website.sql. Tidak perlu menjalankan seed/fix_admin_login.
--
-- Modul Peserta kini bersumber dari tabel public.users (akun terdaftar):
--   public.users          -> sumber utama data peserta (nama, User ID, telepon,
--                            departemen, role, seksi, status approval)
--   public.participants   -> data pelengkap (kamar/villa, armada bus, gender,
--                            status kehadiran) yang boleh kosong
--
-- Karena pembuatan & penghapusan akun menyentuh skema `auth` (tabel
-- auth.users/auth.identities), tindakan ini TIDAK boleh dilakukan langsung dari
-- browser dengan anon key. Fungsi SECURITY DEFINER di bawah memvalidasi
-- auth.uid() sebagai ADMIN/INITIATOR terlebih dahulu, lalu:
--   admin_save_participant            -> simpan/ubah peserta (opsional buat akun login)
--   admin_delete_participant          -> hapus peserta (profil + data pelengkap + akun login)
--   admin_bulk_import_participants    -> impor Excel massal
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Trigger Auth memakai kolom profil ini, termasuk pada project versi lama.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ====================================================================
-- 0. PENYELARASAN SKEMA TABEL PESERTA
-- ====================================================================
-- Tabel public.participants pada project lama bisa kehilangan sebagian kolom,
-- karena CREATE TABLE IF NOT EXISTS tidak menambah kolom pada tabel yang sudah
-- ada. Aplikasi memakai kolom di bawah ini, dan ADD COLUMN IF NOT EXISTS tidak
-- mengubah data yang sudah tersimpan.
DO $$
BEGIN
    IF to_regclass('public.participants') IS NOT NULL THEN
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS outing_id UUID;
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS user_id UUID;
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS username VARCHAR(100);
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS department VARCHAR(100);
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS gender CHAR(1) DEFAULT 'L';
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS transport VARCHAR(100);
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS room VARCHAR(100);
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'CONFIRMED';
        ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

        CREATE INDEX IF NOT EXISTS idx_participants_user_id ON public.participants (user_id);
        CREATE INDEX IF NOT EXISTS idx_participants_username_lower ON public.participants (LOWER(username));

        RAISE NOTICE '[0] Skema tabel public.participants diselaraskan.';
    ELSE
        RAISE NOTICE '[0] Tabel public.participants belum ada. Modul Peserta tetap berjalan dari data user; jalankan database_schema.sql bila ingin menyimpan kamar/armada.';
    END IF;
END $$;

-- ====================================================================
-- 1. SIMPAN / UBAH PESERTA
-- ====================================================================
CREATE OR REPLACE FUNCTION public.admin_save_participant(
    p_user_id UUID DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_transport TEXT DEFAULT NULL,
    p_room TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_password TEXT DEFAULT NULL,
    p_create_if_missing BOOLEAN DEFAULT FALSE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_manager BOOLEAN;
    v_username TEXT := lower(regexp_replace(trim(coalesce(p_username, '')), '^@+', ''));
    v_email TEXT;
    v_auth_id UUID;
    v_user_id UUID := p_user_id;
    v_target_username TEXT;
    v_action TEXT := 'updated';
    v_created_login BOOLEAN := FALSE;
    v_default_password BOOLEAN := FALSE;
    v_password TEXT;
    v_participant_id UUID;
    v_has_department BOOLEAN;
    v_outing_id UUID;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Sesi Supabase Auth tidak ditemukan. Silakan login ulang.';
    END IF;

    -- Validasi wewenang memakai kolom teks role/section agar tetap berfungsi
    -- pada database yang belum memiliki helper RLS.
    SELECT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_user_id = v_caller
          AND u.approval_status = 'APPROVED'
          AND (
              upper(coalesce(u.role, '')) IN ('ADMIN', 'INITIATOR')
              OR upper(coalesce(u.section, '')) IN ('INISIATOR')
          )
    ) INTO v_is_manager;

    IF v_is_manager IS NOT TRUE THEN
        RAISE EXCEPTION 'Hanya Admin atau Inisiator yang dapat mengubah data peserta.';
    END IF;

    -- Serialisasikan pembuatan username yang sama (double-click / impor bersamaan).
    PERFORM pg_advisory_xact_lock(hashtextextended(v_username, 0));

    IF NULLIF(p_gender, '') IS NOT NULL AND p_gender NOT IN ('L', 'P') THEN
        RAISE EXCEPTION 'Gender harus L atau P.';
    END IF;
    IF NULLIF(p_status, '') IS NOT NULL AND p_status NOT IN ('CONFIRMED', 'PENDING', 'CANCELLED') THEN
        RAISE EXCEPTION 'Status kehadiran tidak valid.';
    END IF;

    -- 1) Tentukan baris user yang akan diubah.
    IF v_user_id IS NOT NULL THEN
        SELECT u.id, lower(u.username) INTO v_user_id, v_target_username
        FROM public.users u WHERE u.id = v_user_id;
        IF v_user_id IS NULL THEN
            RAISE EXCEPTION 'Peserta tidak ditemukan di tabel users.';
        END IF;
    ELSIF v_username <> '' THEN
        SELECT u.id, lower(u.username) INTO v_user_id, v_target_username
        FROM public.users u WHERE lower(u.username) = v_username LIMIT 1;
    END IF;

    -- 2) Buat akun bila user belum ada.
    IF v_user_id IS NULL THEN
        IF COALESCE(p_create_if_missing, FALSE) IS NOT TRUE THEN
            RETURN jsonb_build_object(
                'action', 'skipped',
                'message', 'User ID tidak ditemukan di tabel users.'
            );
        END IF;

        IF v_username !~ '^[a-z0-9._-]{3,100}$' THEN
            RAISE EXCEPTION 'User ID minimal 3 karakter dan hanya boleh huruf, angka, titik, strip, atau underscore.';
        END IF;

        v_email := v_username || '@outing.local';

        -- Bila akun Auth dengan email internal ini sudah ada (mis. profilnya
        -- belum pernah dibuat), akun tersebut dipakai ulang.
        SELECT a.id INTO v_user_id FROM auth.users a WHERE lower(a.email) = v_email LIMIT 1;

        IF v_user_id IS NULL THEN
            v_user_id := gen_random_uuid();
            v_password := NULLIF(p_password, '');
            IF v_password IS NULL THEN
                v_password := encode(gen_random_bytes(12), 'hex');
                v_default_password := TRUE;
            ELSIF length(v_password) < 6 THEN
                RAISE EXCEPTION 'Password minimal 6 karakter.';
            END IF;

            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password,
                email_confirmed_at, confirmation_token, email_change,
                email_change_token_new, email_change_token_current, reauthentication_token,
                recovery_token, raw_app_meta_data,
                raw_user_meta_data, created_at, updated_at
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
                v_email, crypt(v_password, gen_salt('bf')), now(), '', '', '', '', '', '',
                '{"provider":"email","providers":["email"]}'::jsonb,
                jsonb_build_object(
                    'username', v_username,
                    'full_name', COALESCE(NULLIF(p_full_name, ''), v_username),
                    'phone', COALESCE(p_phone, ''),
                    'department', COALESCE(NULLIF(p_department, ''), 'Peserta')
                ),
                now(), now()
            );

            v_created_login := TRUE;
        END IF;

        -- Identity wajib untuk akun baru maupun Auth lama yang dipakai ulang.
        -- Error harus membatalkan transaksi, bukan disembunyikan sebagai NOTICE.
        INSERT INTO auth.identities (
            id, user_id, provider_id, identity_data, provider, created_at, updated_at
        )
        SELECT gen_random_uuid(), v_user_id, v_user_id::text,
               jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
               'email', now(), now()
        WHERE NOT EXISTS (
            SELECT 1 FROM auth.identities i WHERE i.user_id = v_user_id AND i.provider = 'email'
        );

        v_auth_id := v_user_id;
        -- Trigger Auth dapat membuat profil dengan UUID berbeda dari auth.users.
        SELECT u.id INTO v_user_id FROM public.users u WHERE u.auth_user_id = v_auth_id;
        v_user_id := COALESCE(v_user_id, v_auth_id);

        -- Profil public.users. Trigger legacy enforce_new_auth_user_pending bisa
        -- memaksa PARTICIPANT/PENDING, jadi status approval dipastikan lewat UPDATE.
        INSERT INTO public.users (
            id, auth_user_id, username, full_name, role, section,
            approval_status, approved_at, created_at, updated_at
        ) VALUES (
            v_user_id, v_auth_id, v_username,
            COALESCE(NULLIF(p_full_name, ''), v_username),
            'PARTICIPANT', 'PUBLIC', 'APPROVED', now(), now(), now()
        )
        ON CONFLICT (id) DO NOTHING;

        UPDATE public.users
        SET approval_status = 'APPROVED',
            approved_at = COALESCE(approved_at, now()),
            approved_by = (SELECT id FROM public.users WHERE auth_user_id = v_caller),
            rejection_reason = NULL,
            role = COALESCE(NULLIF(role, ''), 'PARTICIPANT'),
            section = COALESCE(NULLIF(section, ''), 'PUBLIC'),
            updated_at = now()
        WHERE id = v_user_id;

        -- Akun Auth lama yang dipakai ulang tidak di-reset passwordnya.
        UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now())
        WHERE id = v_auth_id AND lower(email) = v_email;

        v_action := 'created';
        v_target_username := v_username;
    END IF;

    -- 3) Perbarui profil user (sumber utama modul peserta).
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'department'
    ) INTO v_has_department;

    IF v_has_department THEN
        UPDATE public.users SET
            full_name = COALESCE(NULLIF(p_full_name, ''), full_name),
            phone = COALESCE(NULLIF(p_phone, ''), phone),
            department = COALESCE(NULLIF(p_department, ''), department),
            updated_at = now()
        WHERE id = v_user_id;
    ELSE
        UPDATE public.users SET
            full_name = COALESCE(NULLIF(p_full_name, ''), full_name),
            phone = COALESCE(NULLIF(p_phone, ''), phone),
            updated_at = now()
        WHERE id = v_user_id;
    END IF;

    -- 4) Data pelengkap (kamar/armada/kehadiran). Bersifat opsional: bila tabel
    --    participants belum ada, penyimpanan user tetap dianggap berhasil.
    IF to_regclass('public.participants') IS NOT NULL THEN
        BEGIN
            IF to_regclass('public.outings') IS NOT NULL THEN
                SELECT o.id INTO v_outing_id FROM public.outings o
                ORDER BY o.created_at DESC NULLS LAST LIMIT 1;
            END IF;

            SELECT p.id INTO v_participant_id
            FROM public.participants p
            WHERE p.user_id = v_user_id
               OR (v_target_username IS NOT NULL AND lower(coalesce(p.username, '')) = v_target_username)
            LIMIT 1;

            IF v_participant_id IS NOT NULL THEN
                UPDATE public.participants SET
                    user_id = v_user_id,
                    username = COALESCE(v_target_username, username),
                    full_name = COALESCE(NULLIF(p_full_name, ''), full_name),
                    phone = COALESCE(NULLIF(p_phone, ''), phone),
                    department = COALESCE(NULLIF(p_department, ''), department),
                    gender = COALESCE(NULLIF(p_gender, ''), gender),
                    transport = COALESCE(NULLIF(p_transport, ''), transport),
                    room = COALESCE(NULLIF(p_room, ''), room),
                    status = COALESCE(NULLIF(p_status, ''), status)
                WHERE id = v_participant_id;
            ELSE
                INSERT INTO public.participants (
                    id, outing_id, user_id, username, full_name, phone, department,
                    gender, transport, room, status, created_at
                ) VALUES (
                    gen_random_uuid(), v_outing_id, v_user_id, v_target_username,
                    COALESCE(NULLIF(p_full_name, ''), v_target_username),
                    NULLIF(p_phone, ''), NULLIF(p_department, ''), NULLIF(p_gender, ''),
                    NULLIF(p_transport, ''), NULLIF(p_room, ''),
                    COALESCE(NULLIF(p_status, ''), 'CONFIRMED'), now()
                );
            END IF;
        END; -- Error data pelengkap membatalkan seluruh simpan (termasuk akun baru).
    END IF;

    RETURN jsonb_build_object(
        'action', v_action,
        'user_id', v_user_id,
        'username', v_target_username,
        'created_login', v_created_login,
        'default_password_used', v_default_password,
        'default_password', CASE WHEN v_default_password THEN v_password ELSE NULL END
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_save_participant(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_save_participant(
    UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated;


-- ====================================================================
-- 2. HAPUS PESERTA
-- ====================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_participant(
    p_user_id UUID DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_delete_auth_account BOOLEAN DEFAULT TRUE
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_manager BOOLEAN;
    v_username TEXT := lower(regexp_replace(trim(coalesce(p_username, '')), '^@+', ''));
    -- Tidak memakai RECORD agar aman saat target belum ditemukan (record yang
    -- belum terisi tidak boleh diakses field-nya).
    v_target_id UUID;
    v_target_username TEXT;
    v_target_full_name TEXT;
    v_target_role TEXT;
    v_target_auth_id UUID;
    v_remaining_admins INTEGER;
    v_auth_deleted BOOLEAN := FALSE;
    v_participants_deleted INTEGER := 0;
    v_outing_users_deleted INTEGER := 0;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Sesi Supabase Auth tidak ditemukan. Silakan login ulang.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_user_id = v_caller
          AND u.approval_status = 'APPROVED'
          AND (
              upper(coalesce(u.role, '')) IN ('ADMIN', 'INITIATOR')
              OR upper(coalesce(u.section, '')) IN ('INISIATOR')
          )
    ) INTO v_is_manager;

    IF v_is_manager IS NOT TRUE THEN
        RAISE EXCEPTION 'Hanya Admin atau Inisiator yang dapat menghapus data peserta.';
    END IF;

    -- Tentukan peserta: lewat id (UUID) atau lewat User ID.
    IF p_user_id IS NOT NULL THEN
        SELECT u.id, lower(u.username), u.full_name, upper(coalesce(u.role, '')), u.auth_user_id
        INTO v_target_id, v_target_username, v_target_full_name, v_target_role, v_target_auth_id
        FROM public.users u
        WHERE u.id = p_user_id;
    END IF;

    IF v_target_id IS NULL AND v_username <> '' THEN
        SELECT u.id, lower(u.username), u.full_name, upper(coalesce(u.role, '')), u.auth_user_id
        INTO v_target_id, v_target_username, v_target_full_name, v_target_role, v_target_auth_id
        FROM public.users u
        WHERE lower(u.username) = v_username
        LIMIT 1;
    END IF;

    IF v_target_id IS NULL THEN
        RETURN jsonb_build_object(
            'action', 'not_found',
            'message', 'Peserta tidak ditemukan di tabel users.'
        );
    END IF;

    -- Pengaman: akun sendiri dan Admin terakhir tidak boleh terhapus.
    IF v_target_auth_id IS NOT NULL AND v_target_auth_id = v_caller THEN
        RAISE EXCEPTION 'Anda tidak dapat menghapus akun Anda sendiri dari modul Peserta.';
    END IF;

    IF v_target_role = 'ADMIN' THEN
        SELECT count(*) INTO v_remaining_admins
        FROM public.users
        WHERE upper(coalesce(role, '')) = 'ADMIN' AND id <> v_target_id;

        IF v_remaining_admins = 0 THEN
            RAISE EXCEPTION 'Admin terakhir tidak dapat dihapus. Tetapkan Admin lain terlebih dahulu.';
        END IF;
    END IF;

    -- Data pelengkap (kamar/armada/kehadiran).
    IF to_regclass('public.participants') IS NOT NULL THEN
        DELETE FROM public.participants
        WHERE user_id = v_target_id
           OR lower(coalesce(username, '')) = lower(coalesce(v_target_username, ''));
        GET DIAGNOSTICS v_participants_deleted = ROW_COUNT;
    END IF;

    -- Keanggotaan outing (bila tabelnya tersedia).
    IF to_regclass('public.outing_users') IS NOT NULL THEN
        DELETE FROM public.outing_users WHERE user_id = v_target_id;
        GET DIAGNOSTICS v_outing_users_deleted = ROW_COUNT;
    END IF;

    -- Profil aplikasi.
    DELETE FROM public.users WHERE id = v_target_id;

    -- Akun login Supabase Auth (menghapus auth.users sekaligus auth.identities).
    IF COALESCE(p_delete_auth_account, TRUE) AND v_target_auth_id IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = v_target_auth_id;
        v_auth_deleted := TRUE;
    END IF;

    RETURN jsonb_build_object(
        'action', 'deleted',
        'user_id', v_target_id,
        'username', v_target_username,
        'full_name', v_target_full_name,
        'auth_deleted', v_auth_deleted,
        'participants_deleted', v_participants_deleted,
        'outing_users_deleted', v_outing_users_deleted
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_participant(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_participant(UUID, TEXT, BOOLEAN) TO authenticated;


-- ====================================================================
-- 3. IMPOR PESERTA DARI EXCEL (MASSAL)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.admin_bulk_import_participants(
    p_rows JSONB,
    p_mode TEXT DEFAULT 'upsert',
    p_default_password TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_manager BOOLEAN;
    v_row JSONB;
    v_username TEXT;
    v_result JSONB;
    v_created INTEGER := 0;
    v_updated INTEGER := 0;
    v_skipped INTEGER := 0;
    v_removed_enrichment INTEGER := 0;
    v_new_logins JSONB := '[]'::jsonb;
    v_errors JSONB := '[]'::jsonb;
    v_usernames TEXT[] := ARRAY[]::TEXT[];
    v_is_replace BOOLEAN := upper(coalesce(p_mode, 'upsert')) = 'REPLACE';
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Sesi Supabase Auth tidak ditemukan. Silakan login ulang.';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.users u
        WHERE u.auth_user_id = v_caller
          AND u.approval_status = 'APPROVED'
          AND (
              upper(coalesce(u.role, '')) IN ('ADMIN', 'INITIATOR')
              OR upper(coalesce(u.section, '')) IN ('INISIATOR')
          )
    ) INTO v_is_manager;

    IF v_is_manager IS NOT TRUE THEN
        RAISE EXCEPTION 'Hanya Admin atau Inisiator yang dapat mengimpor data peserta.';
    END IF;

    IF jsonb_typeof(COALESCE(p_rows, '[]'::jsonb)) <> 'array' THEN
        RAISE EXCEPTION 'p_rows harus berupa array JSON.';
    END IF;
    IF lower(coalesce(p_mode, 'upsert')) NOT IN ('upsert', 'replace') THEN
        RAISE EXCEPTION 'Mode impor harus upsert atau replace.';
    END IF;

    -- Setiap baris diproses terpisah agar satu baris bermasalah tidak
    -- membatalkan seluruh berkas.
    FOR v_row IN SELECT value FROM jsonb_array_elements(COALESCE(p_rows, '[]'::jsonb)) AS t(value)
    LOOP
        v_username := lower(regexp_replace(coalesce(v_row ->> 'username', ''), '^@+', ''));

        IF v_username = '' THEN
            v_skipped := v_skipped + 1;
            v_errors := v_errors || jsonb_build_object('username', '(kosong)', 'error', 'User ID kosong');
            CONTINUE;
        END IF;

        BEGIN
            v_result := public.admin_save_participant(
                p_username => v_username,
                p_full_name => v_row ->> 'full_name',
                p_phone => v_row ->> 'phone',
                p_department => v_row ->> 'department',
                p_gender => v_row ->> 'gender',
                p_transport => v_row ->> 'transport',
                p_room => v_row ->> 'room',
                p_status => v_row ->> 'status',
                p_password => p_default_password,
                p_create_if_missing => TRUE
            );

            v_usernames := array_append(v_usernames, v_username);

            IF v_result ->> 'action' = 'created' THEN
                v_created := v_created + 1;
                IF (v_result ->> 'created_login')::boolean THEN
                    v_new_logins := v_new_logins || jsonb_build_object(
                        'username', v_result ->> 'username',
                        'password', COALESCE(v_result ->> 'default_password', p_default_password)
                    );
                END IF;
            ELSIF v_result ->> 'action' = 'updated' THEN
                v_updated := v_updated + 1;
            ELSE
                v_skipped := v_skipped + 1;
                v_errors := v_errors || jsonb_build_object(
                    'username', v_username,
                    'error', COALESCE(v_result ->> 'message', 'dilewati')
                );
            END IF;
        EXCEPTION WHEN OTHERS THEN
            v_skipped := v_skipped + 1;
            v_errors := v_errors || jsonb_build_object('username', v_username, 'error', SQLERRM);
        END;
    END LOOP;

    -- Mode "Gantikan Seluruh Data": hapus HANYA data pelengkap peserta yang tidak
    -- ada di berkas. Akun user (dan akun login) tidak pernah dihapus oleh impor.
    IF v_is_replace AND v_skipped = 0 AND to_regclass('public.participants') IS NOT NULL AND array_length(v_usernames, 1) IS NOT NULL THEN
        DELETE FROM public.participants
        WHERE lower(coalesce(username, '')) <> ALL (v_usernames);
        GET DIAGNOSTICS v_removed_enrichment = ROW_COUNT;
    END IF;

    RETURN jsonb_build_object(
        'action', 'bulk_import',
        'mode', CASE WHEN v_is_replace THEN 'replace' ELSE 'upsert' END,
        'created', v_created,
        'updated', v_updated,
        'skipped', v_skipped,
        'removed_enrichment', v_removed_enrichment,
        'replace_cleanup_skipped', v_is_replace AND v_skipped > 0,
        'new_logins', v_new_logins,
        'errors', v_errors
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_bulk_import_participants(JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_bulk_import_participants(JSONB, TEXT, TEXT) TO authenticated;


-- INITIATOR dapat membaca daftar yang dikelolanya; approval tetap ADMIN-only.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.users, public.participants TO authenticated;
DROP POLICY IF EXISTS "participant managers read users" ON public.users;
CREATE POLICY "participant managers read users" ON public.users
    FOR SELECT TO authenticated USING (
        public.current_app_user_is_approved() AND (
            public.current_app_role() IN ('ADMIN', 'INITIATOR')
            OR public.current_app_section() = 'INISIATOR'
        )
    );

-- ====================================================================
-- 4. VERIFIKASI
-- ====================================================================
-- Ketiga fungsi harus ada, SECURITY DEFINER, dan hanya dapat dieksekusi
-- oleh role `authenticated`.
SELECT p.proname AS fungsi,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS security_definer,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS bisa_dipanggil_login,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS bisa_dipanggil_anon
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('admin_save_participant', 'admin_delete_participant', 'admin_bulk_import_participants')
ORDER BY p.proname;

-- Ringkasan peserta saat ini (sumber: tabel users).
SELECT u.username,
       u.full_name,
       u.phone,
       to_jsonb(u) ->> 'department' AS department,
       u.role,
       u.section,
       u.approval_status,
       (u.auth_user_id IS NOT NULL) AS punya_akun_login,
       p.room,
       p.transport,
       p.status AS status_kehadiran
FROM public.users u
LEFT JOIN public.participants p
       ON p.user_id = u.id
       OR lower(coalesce(p.username, '')) = lower(u.username)
ORDER BY u.username
LIMIT 50;

NOTIFY pgrst, 'reload schema';
