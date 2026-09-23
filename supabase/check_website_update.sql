-- READ-ONLY: jalankan setelah update_website.sql, sebagai postgres di SQL Editor.
-- Tidak menampilkan password/hash/token. Semua RPC harus ada, SECURITY DEFINER,
-- login=true, anon=false (kecuali resolve_login_username memang untuk login).
WITH expected(name) AS (VALUES
    ('resolve_login_username'), ('admin_set_user_approval'),
    ('admin_pending_registration_notifications'), ('admin_save_participant'),
    ('admin_delete_participant'), ('admin_bulk_import_participants'),
    ('admin_enqueue_donation_reminders'), ('admin_prepare_donation_year_closure'),
    ('admin_mark_foundation_disbursement_paid')
)
SELECT e.name AS rpc, p.oid IS NOT NULL AS terpasang,
       pg_get_function_identity_arguments(p.oid) AS argumen,
       p.prosecdef AS security_definer,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS login,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon
FROM expected e
LEFT JOIN pg_namespace n ON n.nspname = 'public'
LEFT JOIN pg_proc p ON p.pronamespace = n.oid AND p.proname = e.name
ORDER BY e.name;

SELECT n.nspname AS schema, c.relname AS tabel, t.tgname AS trigger,
       t.tgenabled AS enabled, p.proname AS fungsi
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal AND (
    (n.nspname = 'auth' AND c.relname = 'users') OR
    (n.nspname = 'public' AND c.relname = 'users')
);
-- Harus ada on_auth_user_created dan trg_enforce_new_auth_user_pending.
-- Trigger tambahan/custom perlu dicek bila registrasi tetap error.

SELECT approval_status, count(*) AS jumlah FROM public.users GROUP BY approval_status;
SELECT username, role, section, approval_status,
       auth_user_id IS NOT NULL AS terhubung_auth
FROM public.users WHERE upper(role) IN ('ADMIN', 'INITIATOR') ORDER BY username;

-- Seharusnya kosong; jika ada, review manual benturan profil/username.
SELECT a.id AS auth_id, a.email, a.created_at
FROM auth.users a
WHERE lower(a.email) LIKE '%@outing.local'
  AND NOT EXISTS (SELECT 1 FROM public.users u WHERE u.auth_user_id = a.id);

-- Seharusnya kosong; username case-insensitive harus unik secara operasional.
SELECT lower(username) AS username, count(*) AS jumlah
FROM public.users GROUP BY lower(username) HAVING count(*) > 1;

-- Akun APPROVED internal yang belum dapat login / identity email belum ada.
SELECT u.username, a.id AS auth_id,
       a.email_confirmed_at IS NOT NULL AS email_confirmed,
       EXISTS (SELECT 1 FROM auth.identities i WHERE i.user_id = a.id AND i.provider = 'email') AS email_identity
FROM public.users u JOIN auth.users a ON a.id = u.auth_user_id
WHERE lower(a.email) = lower(u.username) || '@outing.local'
  AND u.approval_status = 'APPROVED'
  AND (a.email_confirmed_at IS NULL OR NOT EXISTS (
      SELECT 1 FROM auth.identities i WHERE i.user_id = a.id AND i.provider = 'email'
  ));

SELECT schemaname, tablename, policyname, roles, cmd, qual
FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'participants')
ORDER BY tablename, policyname;
