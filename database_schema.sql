-- ====================================================================
-- DATABASE SCHEMA: OUTING MANAGEMENT SYSTEM
-- Compatible with Supabase (PostgreSQL 15+)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 2. MASTER TABLES: ROLES & SECTIONS
-- ====================================================================

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

-- SEED ROLES & SECTIONS
INSERT INTO public.roles (name, description) VALUES
    ('ADMIN', 'Akses penuh dan konfigurasi sistem outing'),
    ('INITIATOR', 'Inisiator acara dengan kewenangan management outing'),
    ('FINANCE', 'Pengelola transaksi kas dan laporan keuangan'),
    ('PURCHASING', 'Pengelola pengadaan barang dan purchase request'),
    ('LOGISTIC', 'Pengelola perlengkapan, armada, dan tugas operasional'),
    ('KONSUMSI', 'Pengelola rencana konsumsi dan meal plan'),
    ('PUBLIC_AREA', 'Pengelola informasi publik dan pengumuman'),
    ('PARTICIPANT', 'Peserta biasa dengan hak akses view-only')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.sections (name, description) VALUES
    ('INISIATOR', 'Tim Inisiator / Ketua Panitia Acara'),
    ('KEUANGAN', 'Seksi Keuangan & Kas'),
    ('PURCHASING', 'Seksi Purchasing & Pengadaan Barang'),
    ('LOGISTIC', 'Seksi Logistik, Perlengkapan & Transport'),
    ('KONSUMSI', 'Seksi Konsumsi & Katering'),
    ('PUBLIC_AREA', 'Seksi Public Area & Informasi'),
    ('PUBLIC', 'Peserta Umum')
ON CONFLICT (name) DO NOTHING;

-- ====================================================================
-- 3. USERS TABLE
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Link ke auth.users; semua akses produksi divalidasi lewat auth.uid().
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    department VARCHAR(100),
    role VARCHAR(50) DEFAULT 'PARTICIPANT',
    section VARCHAR(50) DEFAULT 'PUBLIC',
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT users_approval_status_check CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

-- ====================================================================
-- 3A. USER APPROVAL MIGRATION & SAFETY DEFAULTS
-- ====================================================================
-- Baris user lama dibuat sebelum fitur approval dianggap sudah aktif agar
-- akun/demo existing tidak tiba-tiba terkunci. Registrasi baru mengirim
-- approval_status = PENDING secara eksplisit.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
-- Password lama tidak lagi dipakai untuk autentikasi; hapus hash legacy saat migrasi.
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20);

DO $$
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
        WHERE conname = 'users_auth_user_id_key'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);
    END IF;
END $$;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

UPDATE public.users
SET approval_status = 'APPROVED'
WHERE approval_status IS NULL;

ALTER TABLE public.users ALTER COLUMN approval_status SET DEFAULT 'PENDING';
ALTER TABLE public.users ALTER COLUMN approval_status SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_approval_status_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_approval_status_check
            CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_approval_status ON public.users (approval_status);
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));

-- Semua profile yang dibuat dari Supabase Auth selalu mulai sebagai PENDING.
-- Role ADMIN tidak dapat disuntikkan lewat metadata registrasi.
CREATE OR REPLACE FUNCTION public.enforce_new_auth_user_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.auth_user_id IS NOT NULL THEN
        NEW.role := 'PARTICIPANT';
        NEW.section := 'PUBLIC';
        NEW.approval_status := 'PENDING';
        NEW.approved_at := NULL;
        NEW.approved_by := NULL;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_new_participant_pending ON public.users;
DROP TRIGGER IF EXISTS trg_enforce_new_auth_user_pending ON public.users;
CREATE TRIGGER trg_enforce_new_auth_user_pending
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_new_auth_user_pending();

-- ====================================================================
-- 4. OUTINGS & PARTICIPANTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.outings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    event_date DATE,
    location VARCHAR(255),
    address TEXT,
    description TEXT,
    status VARCHAR(50) DEFAULT 'PLANNING', -- PLANNING, ACTIVE, COMPLETED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.outing_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(outing_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    department VARCHAR(100),
    gender CHAR(1) DEFAULT 'L', -- 'L' or 'P'
    transport VARCHAR(100), -- 'Bus 1', 'Bus 2', 'Mobil Pribadi'
    room VARCHAR(100),      -- 'Villa Utama', 'Kamar 101'
    status VARCHAR(50) DEFAULT 'CONFIRMED', -- CONFIRMED, PENDING, CANCELLED
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 5. RUNDOWNS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.rundowns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    start_time VARCHAR(50) NOT NULL,
    end_time VARCHAR(50),
    activity VARCHAR(255),
    title VARCHAR(255),
    location VARCHAR(255),
    description TEXT,
    order_index INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 6. FINANCE & CASH TRANSACTIONS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.cash_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(100),
    initial_balance NUMERIC(15,2) DEFAULT 0,
    current_balance NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    cash_account_id UUID REFERENCES public.cash_accounts(id) ON DELETE SET NULL,
    type VARCHAR(10) NOT NULL, -- 'IN' (Pemasukan) / 'OUT' (Pengeluaran)
    amount NUMERIC(15,2) NOT NULL,
    category VARCHAR(100),
    description TEXT NOT NULL,
    transaction_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'POSTED', -- 'POSTED', 'DRAFT'
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIEW: v_cash_summary
CREATE OR REPLACE VIEW public.v_cash_summary AS
SELECT
    COALESCE(SUM(CASE WHEN UPPER(type) IN ('IN', 'INCOME', 'MASUK') THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN UPPER(type) IN ('OUT', 'EXPENSE', 'KELUAR') THEN amount ELSE 0 END), 0) AS total_expense,
    (COALESCE(SUM(CASE WHEN UPPER(type) IN ('IN', 'INCOME', 'MASUK') THEN amount ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN UPPER(type) IN ('OUT', 'EXPENSE', 'KELUAR') THEN amount ELSE 0 END), 0)) AS balance,
    (COALESCE(SUM(CASE WHEN UPPER(type) IN ('IN', 'INCOME', 'MASUK') THEN amount ELSE 0 END), 0) -
     COALESCE(SUM(CASE WHEN UPPER(type) IN ('OUT', 'EXPENSE', 'KELUAR') THEN amount ELSE 0 END), 0)) AS saldo
FROM public.cash_transactions
WHERE status = 'POSTED';

-- Do not let a default SECURITY DEFINER view bypass cash_transactions RLS.
ALTER VIEW public.v_cash_summary SET (security_invoker = true);
REVOKE ALL ON public.v_cash_summary FROM anon;
GRANT SELECT ON public.v_cash_summary TO authenticated;

-- ====================================================================
-- 7. PURCHASING REQUESTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    item VARCHAR(255),
    quantity NUMERIC(10,2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'Pcs',
    estimated_cost NUMERIC(15,2) DEFAULT 0,
    actual_cost NUMERIC(15,2) DEFAULT 0,
    vendor VARCHAR(255),
    needed_date DATE,
    section VARCHAR(50) DEFAULT 'LOGISTIC',
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, COMPLETED
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 8. LOGISTIC TASKS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- HIGH, MEDIUM, LOW
    deadline DATE,
    status VARCHAR(30) DEFAULT 'TODO',     -- TODO, IN_PROGRESS, DONE
    progress INT DEFAULT 0,                 -- 0 - 100%
    assigned_to VARCHAR(255),
    section VARCHAR(50) DEFAULT 'LOGISTIC',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 9. KONSUMSI / MEAL PLANS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.consumption_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- SARAPAN, MAKAN_SIANG, MAKAN_MALAM, SNACK_PAGI, SNACK_SORE
    location VARCHAR(255),
    participant_count INT DEFAULT 0,
    vendor VARCHAR(255),
    estimated_cost NUMERIC(15,2) DEFAULT 0,
    actual_cost NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'PLANNED', -- PLANNED, ORDERED, SERVED, CANCELLED
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 10. PUBLIC AREA: ANNOUNCEMENTS
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outing_id UUID REFERENCES public.outings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'NORMAL', -- HIGH, NORMAL, LOW
    publish_date DATE DEFAULT CURRENT_DATE,
    expired_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 11. SUPABASE AUTH HELPERS & ROW LEVEL SECURITY (RLS)
-- ====================================================================
-- The legacy schema used permissive policies, which allowed anyone with the
-- public anon key to read/write/delete all data. The policies below require a
-- real Supabase Auth session and enforce role/section permissions in Postgres.

CREATE OR REPLACE FUNCTION public.current_app_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT UPPER(role)
    FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_section()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT UPPER(section)
    FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_is_approved()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_user_id = auth.uid()
          AND approval_status = 'APPROVED'
    );
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_user_id = auth.uid()
          AND approval_status = 'APPROVED'
          AND UPPER(role) = 'ADMIN'
    );
$$;

CREATE OR REPLACE FUNCTION public.current_app_user_has_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE auth_user_id = auth.uid()
          AND approval_status = 'APPROVED'
          AND UPPER(role) = ANY(required_roles)
    );
$$;

-- Used before login so phone-number login still works without exposing the
-- users table or password hashes to anonymous callers.
REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_section() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_is_approved() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_has_role(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_section() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_is_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_has_role(TEXT[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.resolve_login_username(p_identifier TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT username
    FROM public.users
    WHERE auth_user_id IS NOT NULL
      AND (
          LOWER(username) = LOWER(REGEXP_REPLACE(COALESCE(p_identifier, ''), '^@+', ''))
          OR (
              LENGTH(REGEXP_REPLACE(COALESCE(p_identifier, ''), '[^0-9]', '', 'g')) >= 8
              AND REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g') = REGEXP_REPLACE(COALESCE(p_identifier, ''), '[^0-9]', '', 'g')
          )
      )
    LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.resolve_login_username(TEXT) TO anon, authenticated;

-- Auth trigger: a successful sign-up automatically creates the public profile
-- and participant row in one database transaction. Client-side role metadata
-- is deliberately ignored.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_username TEXT;
    v_full_name TEXT;
    v_phone TEXT;
    v_department TEXT;
    v_outing_id UUID;
BEGIN
    v_username := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'username', SPLIT_PART(NEW.email, '@', 1))));
    v_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data ->> 'full_name', v_username)), '');
    v_phone := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'phone'), '');
    v_department := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data ->> 'department'), ''), 'Peserta');
    IF COALESCE(NEW.raw_user_meta_data ->> 'outing_id', '') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' THEN
        v_outing_id := (NEW.raw_user_meta_data ->> 'outing_id')::UUID;
    ELSE
        v_outing_id := NULL;
    END IF;

    IF v_username IS NULL OR v_username !~ '^[a-z0-9._-]{3,100}$' THEN
        RAISE EXCEPTION 'Username registrasi tidak valid';
    END IF;

    INSERT INTO public.users (
        id, auth_user_id, username, full_name, phone, department,
        role, section, approval_status, created_at, updated_at
    ) VALUES (
        NEW.id, NEW.id, v_username, COALESCE(v_full_name, v_username), v_phone, v_department,
        'PARTICIPANT', 'PUBLIC', 'PENDING', NOW(), NOW()
    );

    INSERT INTO public.participants (
        id, outing_id, user_id, username, full_name, phone, department,
        gender, transport, room, status, created_at
    ) VALUES (
        gen_random_uuid(), v_outing_id, NEW.id, v_username, COALESCE(v_full_name, v_username),
        v_phone, v_department, 'L', 'Bus 1', 'Villa', 'CONFIRMED', NOW()
    );

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_auth_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Admin approval is a SECURITY DEFINER function, not a client-side UPDATE.
CREATE OR REPLACE FUNCTION public.admin_set_user_approval(
    p_user_id UUID,
    p_status TEXT,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT := UPPER(TRIM(COALESCE(p_status, '')));
    v_user public.users;
BEGIN
    IF NOT public.current_app_user_is_admin() THEN
        RAISE EXCEPTION 'Hanya Admin yang dapat melakukan approval user';
    END IF;
    IF v_status NOT IN ('PENDING', 'APPROVED', 'REJECTED') THEN
        RAISE EXCEPTION 'Status approval tidak valid';
    END IF;

    UPDATE public.users
    SET approval_status = v_status,
        approved_at = CASE WHEN v_status = 'APPROVED' THEN NOW() ELSE NULL END,
        approved_by = CASE WHEN v_status = 'APPROVED' THEN (
            SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1
        ) ELSE NULL END,
        rejection_reason = CASE WHEN v_status = 'REJECTED' THEN NULLIF(TRIM(p_rejection_reason), '') ELSE NULL END,
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING * INTO v_user;

    IF v_user.id IS NULL THEN
        RAISE EXCEPTION 'User tidak ditemukan';
    END IF;

    RETURN jsonb_build_object(
        'id', v_user.id,
        'auth_user_id', v_user.auth_user_id,
        'username', v_user.username,
        'full_name', v_user.full_name,
        'phone', v_user.phone,
        'department', v_user.department,
        'role', v_user.role,
        'section', v_user.section,
        'approval_status', v_user.approval_status,
        'approved_at', v_user.approved_at,
        'approved_by', v_user.approved_by,
        'rejection_reason', v_user.rejection_reason,
        'created_at', v_user.created_at,
        'updated_at', v_user.updated_at
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_approval(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_approval(UUID, TEXT, TEXT) TO authenticated;

-- Secure table policies. Drop the legacy anon policies first.
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outing_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rundowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    policy_row RECORD;
BEGIN
    FOR policy_row IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('roles','sections','users','outings','outing_users','rundowns','cash_accounts','cash_transactions','purchase_requests','tasks','consumption_plans','announcements','participants')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
    END LOOP;
END $$;

CREATE POLICY "authenticated roles read" ON public.roles
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "authenticated sections read" ON public.sections
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());

CREATE POLICY "users self or admin read" ON public.users
    FOR SELECT TO authenticated
    USING (auth_user_id = auth.uid() OR public.current_app_user_is_admin());

CREATE POLICY "approved users read outings" ON public.outings
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "admin manage outings" ON public.outings
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']));

CREATE POLICY "approved users read outing users" ON public.outing_users
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "admin manage outing users" ON public.outing_users
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']));

CREATE POLICY "approved users read rundowns" ON public.rundowns
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "admin manage rundowns" ON public.rundowns
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']));

CREATE POLICY "approved users read cash accounts" ON public.cash_accounts
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "finance manage cash accounts" ON public.cash_accounts
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','FINANCE']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','FINANCE']));

CREATE POLICY "approved users read cash" ON public.cash_transactions
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "finance manage cash" ON public.cash_transactions
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','FINANCE']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','FINANCE']));

CREATE POLICY "approved users read purchases" ON public.purchase_requests
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "purchasing manage purchases" ON public.purchase_requests
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PURCHASING']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PURCHASING']));

CREATE POLICY "approved users read tasks" ON public.tasks
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "logistic manage tasks" ON public.tasks
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','LOGISTIC']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','LOGISTIC']));

CREATE POLICY "approved users read consumption" ON public.consumption_plans
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "konsumsi manage consumption" ON public.consumption_plans
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','KONSUMSI']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','KONSUMSI']));

CREATE POLICY "approved users read announcements" ON public.announcements
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "public area manage announcements" ON public.announcements
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PUBLIC_AREA']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PUBLIC_AREA']));

CREATE POLICY "approved users read participants" ON public.participants
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "admin manage participants" ON public.participants
    FOR ALL TO authenticated
    USING (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']))
    WITH CHECK (public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR']));

-- ====================================================================
-- 12. STORAGE BUCKET & MIGRATIONS (PURCHASING ATTACHMENTS)
-- ====================================================================

-- Migration for existing database deployments:
ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Keep the existing bucket and object paths for compatibility. The bucket is
-- private: existing public URLs must be displayed through a signed URL after
-- the object path is migrated to purchase_requests.image_path.
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchases', 'purchases', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read purchases" ON storage.objects;
    DROP POLICY IF EXISTS "Allow anon insert purchases" ON storage.objects;
    DROP POLICY IF EXISTS "Allow anon update purchases" ON storage.objects;
    DROP POLICY IF EXISTS "Allow anon delete purchases" ON storage.objects;
    DROP POLICY IF EXISTS "Approved users read purchases" ON storage.objects;
    DROP POLICY IF EXISTS "Purchasing users upload purchases" ON storage.objects;
    DROP POLICY IF EXISTS "Purchasing users update purchases" ON storage.objects;
    DROP POLICY IF EXISTS "Purchasing users delete purchases" ON storage.objects;

    CREATE POLICY "Approved users read purchases" ON storage.objects
        FOR SELECT TO authenticated USING (bucket_id = 'purchases' AND public.current_app_user_is_approved());
    CREATE POLICY "Purchasing users upload purchases" ON storage.objects
        FOR INSERT TO authenticated WITH CHECK (bucket_id = 'purchases' AND public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PURCHASING']));
    CREATE POLICY "Purchasing users update purchases" ON storage.objects
        FOR UPDATE TO authenticated USING (bucket_id = 'purchases' AND public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PURCHASING']))
        WITH CHECK (bucket_id = 'purchases' AND public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PURCHASING']));
    CREATE POLICY "Purchasing users delete purchases" ON storage.objects
        FOR DELETE TO authenticated USING (bucket_id = 'purchases' AND public.current_app_user_has_role(ARRAY['ADMIN','INITIATOR','PURCHASING']));
END $$;
