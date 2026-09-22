-- Perbaikan akun Admin untuk aplikasi Outing Management
-- Jalankan di Supabase Dashboard -> SQL Editor sebagai postgres/service role.
-- Script ini tidak membuat user Auth baru. Jika hasil NOTICE menyatakan user
-- belum ada, buat user admin@outing.local di Authentication -> Users dahulu,
-- lalu jalankan script ini kembali.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_auth_id uuid;
    v_role_id uuid;
    v_section_id uuid;
BEGIN
    SELECT id INTO v_auth_id
    FROM auth.users
    WHERE lower(email) = 'admin@outing.local'
    LIMIT 1;

    IF v_auth_id IS NULL THEN
        RAISE NOTICE 'User Auth admin@outing.local belum ditemukan. Buat user tersebut di Authentication -> Users, lalu jalankan ulang script ini.';
        RETURN;
    END IF;

    -- Reset password Admin sesuai permintaan dan aktifkan emailnya.
    UPDATE auth.users
    SET encrypted_password = crypt('power88', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = v_auth_id;

    SELECT id INTO v_role_id FROM public.roles WHERE upper(name) = 'ADMIN' LIMIT 1;
    SELECT id INTO v_section_id FROM public.sections WHERE upper(name) = 'INISIATOR' LIMIT 1;

    -- Kaitkan profile lama (bila ada) sebelum INSERT agar tidak bentrok
    -- dengan UNIQUE(username) maupun UNIQUE(auth_user_id).
    UPDATE public.users
    SET auth_user_id = v_auth_id,
        full_name = COALESCE(NULLIF(full_name, ''), 'Administrator'),
        department = 'Management', role = 'ADMIN', section = 'INISIATOR',
        approval_status = 'APPROVED', approved_at = COALESCE(approved_at, now()),
        role_id = v_role_id, section_id = v_section_id, updated_at = now()
    WHERE lower(username) = 'admin' AND (auth_user_id IS NULL OR auth_user_id = v_auth_id);

    IF NOT FOUND THEN
        INSERT INTO public.users (
            auth_user_id, username, full_name, phone, department,
            role, section, approval_status, approved_at, role_id, section_id,
            updated_at
        ) VALUES (
            v_auth_id, 'admin', 'Administrator', NULL, 'Management',
            'ADMIN', 'INISIATOR', 'APPROVED', now(), v_role_id, v_section_id,
            now()
        )
        ON CONFLICT (auth_user_id) DO UPDATE SET
            username = 'admin', full_name = 'Administrator', department = 'Management',
            role = 'ADMIN', section = 'INISIATOR', approval_status = 'APPROVED',
            approved_at = COALESCE(public.users.approved_at, now()),
            role_id = v_role_id, section_id = v_section_id, updated_at = now();
    END IF;

    RAISE NOTICE 'Akun Admin sudah diperbaiki. Login memakai User ID admin dan password power88.';
END $$;

-- Verifikasi (password tidak pernah ditampilkan):
SELECT au.id AS auth_user_id, au.email, au.email_confirmed_at,
       u.username, u.role, u.section, u.approval_status
FROM auth.users au
LEFT JOIN public.users u ON u.auth_user_id = au.id
WHERE lower(au.email) = 'admin@outing.local';
