-- Development/demo seed for Supabase Auth.
-- Run AFTER database_schema.sql in the Supabase SQL Editor.
-- The passwords below are demo credentials; change or remove them before
-- exposing a production project.

DO $$
DECLARE
    demo RECORD;
    v_id UUID;
    v_email TEXT;
BEGIN
    FOR demo IN
        SELECT * FROM (VALUES
            ('admin',      'Budi Santoso (Admin)',       '081234567890', 'Management',          'ADMIN',       'INISIATOR',  'power88'),
            ('keuangan',   'Siti Rahma (Finance)',       '081234567891', 'Finance',              'FINANCE',     'KEUANGAN',   'finance123'),
            ('purchasing', 'Dedi Kurniawan (Purchasing)','081234567892', 'Procurement',          'PURCHASING',  'PURCHASING',  'purchase123'),
            ('logistic',   'Hendra Saputra (Logistik)',  '081234567893', 'General Affairs',      'LOGISTIC',    'LOGISTIC',    'logistik123'),
            ('konsumsi',   'Dewi Lestari (Konsumsi)',    '081234567894', 'HR',                   'KONSUMSI',    'KONSUMSI',    'makan123'),
            ('public',     'Rian Pratama (Public Area)','081234567895', 'Corporate Secretary',  'PUBLIC_AREA', 'PUBLIC_AREA', 'public123'),
            ('peserta',    'Ahmad Fauzi (Peserta)',      '081234567896', 'Engineering',          'PARTICIPANT',  'PUBLIC',      'peserta123')
        ) AS d(username, full_name, phone, department, role, section, demo_password)
    LOOP
        v_email := demo.username || '@outing.local';
        SELECT id INTO v_id FROM auth.users WHERE email = v_email LIMIT 1;

        IF v_id IS NULL THEN
            v_id := gen_random_uuid();
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password,
                email_confirmed_at, confirmation_token, email_change,
                email_change_token_new, recovery_token, raw_app_meta_data,
                raw_user_meta_data, created_at, updated_at
            ) VALUES (
                '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
                v_email, crypt(demo.demo_password, gen_salt('bf')), NOW(), '', '', '', '',
                '{"provider":"email","providers":["email"]}'::jsonb,
                jsonb_build_object(
                    'username', demo.username,
                    'full_name', demo.full_name,
                    'phone', demo.phone,
                    'department', demo.department
                ), NOW(), NOW()
            );
        ELSE
            UPDATE auth.users
            SET encrypted_password = crypt(demo.demo_password, gen_salt('bf')),
                email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
                updated_at = NOW()
            WHERE id = v_id;
        END IF;

        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, created_at, updated_at
        ) VALUES (
            v_id, v_id,
            jsonb_build_object('sub', v_id::text, 'email', v_email),
            'email', v_id::text, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING;

        -- The auth trigger normally creates this profile. The fallback makes
        -- the seed safe to re-run after a partially completed migration.
        IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = v_id) THEN
            UPDATE public.users
            SET auth_user_id = v_id,
                full_name = demo.full_name,
                phone = demo.phone,
                department = demo.department,
                updated_at = NOW()
            WHERE LOWER(username) = LOWER(demo.username)
              AND auth_user_id IS NULL;

            IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = v_id) THEN
                INSERT INTO public.users (
                    id, auth_user_id, username, full_name, phone, department,
                    role, section, approval_status, approved_at, created_at, updated_at
                ) VALUES (
                    v_id, v_id, demo.username, demo.full_name, demo.phone, demo.department,
                    'PARTICIPANT', 'PUBLIC', 'PENDING', NULL, NOW(), NOW()
                );
            END IF;
        END IF;

        UPDATE public.users
        SET full_name = demo.full_name,
            phone = demo.phone,
            department = demo.department,
            role = demo.role,
            section = demo.section,
            role_id = (SELECT id FROM public.roles WHERE name = demo.role LIMIT 1),
            section_id = (SELECT id FROM public.sections WHERE name = demo.section LIMIT 1),
            approval_status = 'APPROVED',
            approved_at = COALESCE(approved_at, NOW()),
            rejection_reason = NULL,
            updated_at = NOW()
        WHERE auth_user_id = v_id;
    END LOOP;
END $$;
