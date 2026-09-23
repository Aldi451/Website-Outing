-- Registrasi tertinggal & notifikasi dalam aplikasi.
-- Prasyarat: database_schema.sql versi terbaru (termasuk users, helpers, trigger).
-- Untuk sekali RUN di SQL Editor gunakan update_website.sql, bukan file ini saja.
-- Tidak memakai tabel notifikasi duplikat: users.PENDING adalah antrean persisten.
-- Tidak mengirim email/WhatsApp dan tidak memerlukan Realtime publication.

CREATE OR REPLACE FUNCTION public.admin_pending_registration_notifications()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF NOT public.current_app_user_is_admin() THEN
        RAISE EXCEPTION 'Hanya Admin yang dapat melihat notifikasi registrasi.';
    END IF;

    SELECT jsonb_build_object(
        'pending_count', count(*),
        'pending_ids', COALESCE(jsonb_agg(id ORDER BY created_at, id), '[]'::jsonb)
    ) INTO v_result
    FROM public.users
    WHERE approval_status = 'PENDING';
    RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_pending_registration_notifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_pending_registration_notifications() TO authenticated;

-- Pulihkan hanya akun internal yang belum punya profil. Jangan menautkan akun
-- berdasarkan username saja: benturan dengan profil legacy perlu review manual.
-- Tidak mengambil role/approval dari metadata Auth yang dapat ditulis user.
DO $$
DECLARE
    a RECORD;
    v_username TEXT;
BEGIN
    FOR a IN
        SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
        FROM auth.users au
        WHERE lower(au.email) LIKE '%@outing.local'
          AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = au.id)
    LOOP
        v_username := lower(split_part(a.email, '@', 1));
        IF v_username !~ '^[a-z0-9._-]{3,100}$' OR EXISTS (
            SELECT 1 FROM public.users u WHERE u.id = a.id OR lower(u.username) = v_username
        ) THEN
            RAISE NOTICE 'Profil Auth % perlu review manual (username tidak valid / bentrok); tidak ditautkan otomatis.', a.id;
            CONTINUE;
        END IF;
        INSERT INTO public.users (
            id, auth_user_id, username, full_name, phone, department,
            role, section, approval_status, created_at, updated_at
        ) VALUES (
            a.id, a.id, v_username,
            left(COALESCE(NULLIF(trim(a.raw_user_meta_data ->> 'full_name'), ''), v_username), 255),
            left(a.raw_user_meta_data ->> 'phone', 30),
            left(COALESCE(NULLIF(a.raw_user_meta_data ->> 'department', ''), 'Peserta'), 100),
            'PARTICIPANT', 'PUBLIC', 'PENDING', COALESCE(a.created_at, now()), now()
        );
    END LOOP;
END $$;

-- Data pelengkap user terdaftar yang terlewat trigger lama. Tidak menimpa kamar,
-- armada, status, atau baris legacy yang sudah cocok berdasarkan username.
INSERT INTO public.participants (user_id, username, full_name, phone, department, gender, status)
SELECT u.id, u.username, u.full_name, u.phone, u.department, 'L', 'CONFIRMED'
FROM public.users u
WHERE u.auth_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM public.participants p
      WHERE p.user_id = u.id OR lower(p.username) = lower(u.username)
  );

-- Akun internal yang sudah di-approve sebelum patch juga harus bisa login.
-- Domain email sungguhan tetap mengikuti verifikasi Supabase Auth biasa.
UPDATE auth.users a
SET email_confirmed_at = COALESCE(a.email_confirmed_at, now()), updated_at = now()
FROM public.users u
WHERE u.auth_user_id = a.id AND u.approval_status = 'APPROVED'
  AND lower(a.email) = lower(u.username) || '@outing.local'
  AND a.email_confirmed_at IS NULL;

-- RPC versi lama menelan error auth.identities. Perbaiki akun internal yang
-- profilnya sudah terhubung tanpa mengubah password/identity yang sudah ada.
INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, created_at, updated_at
)
SELECT gen_random_uuid(), a.id, a.id::text,
       jsonb_build_object('sub', a.id::text, 'email', a.email,
                          'email_verified', a.email_confirmed_at IS NOT NULL),
       'email', now(), now()
FROM auth.users a JOIN public.users u ON u.auth_user_id = a.id
WHERE lower(a.email) = lower(u.username) || '@outing.local'
  AND NOT EXISTS (
      SELECT 1 FROM auth.identities i WHERE i.user_id = a.id AND i.provider = 'email'
  );

-- GoTrue membaca token sebagai string; NULL dari INSERT legacy bisa membuat
-- login error. Hanya normalisasi NULL, jangan menghapus token aktif yang ada.
UPDATE auth.users a SET
    confirmation_token = COALESCE(a.confirmation_token, ''),
    recovery_token = COALESCE(a.recovery_token, ''),
    email_change = COALESCE(a.email_change, ''),
    email_change_token_new = COALESCE(a.email_change_token_new, ''),
    email_change_token_current = COALESCE(a.email_change_token_current, ''),
    reauthentication_token = COALESCE(a.reauthentication_token, '')
FROM public.users u
WHERE u.auth_user_id = a.id AND lower(a.email) = lower(u.username) || '@outing.local'
  AND (a.confirmation_token IS NULL OR a.recovery_token IS NULL OR a.email_change IS NULL
       OR a.email_change_token_new IS NULL OR a.email_change_token_current IS NULL
       OR a.reauthentication_token IS NULL);

NOTIFY pgrst, 'reload schema';
