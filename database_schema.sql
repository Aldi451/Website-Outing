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

-- Kolom penghubung ke tabel master roles/sections. Tabel users versi lama hanya
-- memiliki kolom teks `role`/`section`, dan CREATE TABLE IF NOT EXISTS tidak
-- menambah kolom pada tabel yang sudah ada. Tanpa kolom & foreign key berikut,
-- permintaan profil dari frontend (select('*, roles(id, name), sections(id, name)'))
-- ditolak PostgREST dengan PGRST200 sehingga login selalu gagal.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS section_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_role_id_fkey'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_section_id_fkey'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_section_id_fkey
            FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users (role_id);
CREATE INDEX IF NOT EXISTS idx_users_section_id ON public.users (section_id);

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

-- Lihat catatan pada migrasi public.users: tabel lama tidak ikut mendapat kolom
-- baru dari CREATE TABLE IF NOT EXISTS.
ALTER TABLE public.outing_users ADD COLUMN IF NOT EXISTS role_id UUID;
ALTER TABLE public.outing_users ADD COLUMN IF NOT EXISTS section_id UUID;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'outing_users_role_id_fkey'
          AND conrelid = 'public.outing_users'::regclass
    ) THEN
        ALTER TABLE public.outing_users
            ADD CONSTRAINT outing_users_role_id_fkey
            FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'outing_users_section_id_fkey'
          AND conrelid = 'public.outing_users'::regclass
    ) THEN
        ALTER TABLE public.outing_users
            ADD CONSTRAINT outing_users_section_id_fkey
            FOREIGN KEY (section_id) REFERENCES public.sections(id) ON DELETE SET NULL;
    END IF;
END $$;

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
-- 11. DONATION PROGRAMS, DONORS, BENEFICIARIES & REMINDERS
-- ====================================================================
-- Donation deliberately has its own domain tables. It never reuses outing
-- rules or outing_id: an outing is an event, while a donation is a donor,
-- beneficiary, program, contribution period, and reminder relationship.

CREATE TABLE IF NOT EXISTS public.donation_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, ACTIVE, PAUSED, CLOSED
    reminder_day SMALLINT NOT NULL DEFAULT 1 CHECK (reminder_day BETWEEN 1 AND 28),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
    default_amount NUMERIC(15,2) CHECK (default_amount IS NULL OR default_amount > 0),
    allow_variable_amount BOOLEAN NOT NULL DEFAULT TRUE,
    whatsapp_template TEXT,
    start_date DATE,
    end_date DATE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_programs_status_check CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'CLOSED')),
    CONSTRAINT donation_programs_date_check CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE TABLE IF NOT EXISTS public.donation_beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_type VARCHAR(20) NOT NULL DEFAULT 'PERSON', -- USER, PERSON, FOUNDATION
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    phone VARCHAR(30),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_beneficiaries_type_check CHECK (beneficiary_type IN ('USER', 'PERSON', 'FOUNDATION'))
);

CREATE TABLE IF NOT EXISTS public.donation_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.donation_programs(id) ON DELETE CASCADE,
    donor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    beneficiary_id UUID REFERENCES public.donation_beneficiaries(id) ON DELETE SET NULL,
    amount_mode VARCHAR(10) NOT NULL DEFAULT 'FIXED', -- FIXED or VARIABLE
    fixed_amount NUMERIC(15,2),
    frequency VARCHAR(20) NOT NULL DEFAULT 'MONTHLY',
    reminder_day SMALLINT CHECK (reminder_day IS NULL OR reminder_day BETWEEN 1 AND 28),
    whatsapp_opt_in BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, CANCELLED, COMPLETED
    notes TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_memberships_amount_mode_check CHECK (amount_mode IN ('FIXED', 'VARIABLE')),
    CONSTRAINT donation_memberships_frequency_check CHECK (frequency IN ('MONTHLY')),
    CONSTRAINT donation_memberships_status_check CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED')),
    CONSTRAINT donation_memberships_fixed_amount_check CHECK (
        amount_mode = 'VARIABLE' OR (fixed_amount IS NOT NULL AND fixed_amount > 0)
    ),
    CONSTRAINT donation_memberships_date_check CHECK (end_date IS NULL OR end_date >= start_date)
);

-- A donor may support multiple beneficiaries, but the same donor/program/
-- beneficiary combination must only have one active membership record.
CREATE UNIQUE INDEX IF NOT EXISTS donation_memberships_identity_idx
    ON public.donation_memberships (
        program_id,
        donor_user_id,
        (COALESCE(beneficiary_id, '00000000-0000-0000-0000-000000000000'::UUID))
    );
CREATE INDEX IF NOT EXISTS donation_memberships_donor_idx ON public.donation_memberships (donor_user_id, status);
CREATE INDEX IF NOT EXISTS donation_memberships_program_idx ON public.donation_memberships (program_id, status);

CREATE TABLE IF NOT EXISTS public.donation_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.donation_memberships(id) ON DELETE CASCADE,
    donor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    beneficiary_id UUID REFERENCES public.donation_beneficiaries(id) ON DELETE SET NULL,
    period_start DATE NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, FAILED, CANCELLED
    payment_date DATE,
    payment_method VARCHAR(30), -- TRANSFER, CASH, E_WALLET, OTHER
    reference VARCHAR(255),
    proof_path TEXT,
    notes TEXT,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_transactions_status_check CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'CANCELLED')),
    CONSTRAINT donation_transactions_period_check CHECK (period_start = date_trunc('month', period_start)::DATE)
);
CREATE UNIQUE INDEX IF NOT EXISTS donation_transactions_period_idx
    ON public.donation_transactions (membership_id, period_start);
CREATE INDEX IF NOT EXISTS donation_transactions_donor_idx ON public.donation_transactions (donor_user_id, period_start DESC);

CREATE TABLE IF NOT EXISTS public.donation_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id = TRUE),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    default_reminder_day SMALLINT NOT NULL DEFAULT 1 CHECK (default_reminder_day BETWEEN 1 AND 28),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Jakarta',
    default_channel VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP',
    message_template TEXT NOT NULL DEFAULT 'Halo {donor_name}, ini pengingat donasi bulanan untuk {program_name}. Nominal: {amount}. Terima kasih.',
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_settings_channel_check CHECK (default_channel IN ('WHATSAPP'))
);
INSERT INTO public.donation_settings (id)
VALUES (TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.donation_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES public.donation_memberships(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP',
    scheduled_for TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED', -- QUEUED, PROCESSING, SENT, FAILED, SKIPPED
    sent_at TIMESTAMPTZ,
    provider_message_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_reminders_channel_check CHECK (channel IN ('WHATSAPP')),
    CONSTRAINT donation_reminders_status_check CHECK (status IN ('QUEUED', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED')),
    CONSTRAINT donation_reminders_period_check CHECK (period_start = date_trunc('month', period_start)::DATE),
    UNIQUE (membership_id, period_start, channel)
);
CREATE INDEX IF NOT EXISTS donation_reminders_queue_idx ON public.donation_reminders (status, scheduled_for);

-- A foundation is the fallback recipient for a fund year. Sensitive bank
-- details are intentionally not stored in the browser-facing table.
CREATE TABLE IF NOT EXISTS public.donation_foundations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(30),
    address TEXT,
    public_description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Existing donation programs become annual funds without changing their
-- existing IDs or contribution history.
ALTER TABLE public.donation_programs ADD COLUMN IF NOT EXISTS fund_year SMALLINT;
UPDATE public.donation_programs
SET fund_year = EXTRACT(YEAR FROM COALESCE(start_date, CURRENT_DATE))::SMALLINT
WHERE fund_year IS NULL;
ALTER TABLE public.donation_programs ALTER COLUMN fund_year SET DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::SMALLINT;
ALTER TABLE public.donation_programs ALTER COLUMN fund_year SET NOT NULL;
ALTER TABLE public.donation_programs ADD COLUMN IF NOT EXISTS allocation_policy VARCHAR(50) NOT NULL DEFAULT 'STAFF_FIRST_FOUNDATION_FALLBACK';
ALTER TABLE public.donation_programs ADD COLUMN IF NOT EXISTS fallback_foundation_id UUID;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'donation_programs_fallback_foundation_fkey'
          AND conrelid = 'public.donation_programs'::regclass
    ) THEN
        ALTER TABLE public.donation_programs
            ADD CONSTRAINT donation_programs_fallback_foundation_fkey
            FOREIGN KEY (fallback_foundation_id) REFERENCES public.donation_foundations(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.donation_incident_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.donation_programs(id) ON DELETE RESTRICT,
    staff_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    staff_name_snapshot VARCHAR(255) NOT NULL,
    case_title VARCHAR(255) NOT NULL,
    public_summary TEXT NOT NULL,
    incident_category VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_amount NUMERIC(15,2) NOT NULL CHECK (requested_amount > 0),
    approved_amount NUMERIC(15,2) CHECK (approved_amount IS NULL OR approved_amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, PAID, CLOSED
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_incident_cases_status_check CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CLOSED')),
    CONSTRAINT donation_incident_cases_category_check CHECK (incident_category IN ('HEALTH', 'ACCIDENT', 'DEATH_FAMILY', 'NATURAL_DISASTER', 'OTHER')),
    CONSTRAINT donation_incident_cases_approved_amount_check CHECK (approved_amount IS NULL OR approved_amount <= requested_amount)
);
CREATE INDEX IF NOT EXISTS donation_incident_cases_program_idx ON public.donation_incident_cases (program_id, status);
CREATE INDEX IF NOT EXISTS donation_incident_cases_staff_idx ON public.donation_incident_cases (staff_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.donation_staff_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL UNIQUE REFERENCES public.donation_incident_cases(id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES public.donation_programs(id) ON DELETE RESTRICT,
    recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    recipient_name_snapshot VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, CANCELLED
    payment_date DATE,
    payment_method VARCHAR(30),
    reference VARCHAR(255),
    notes TEXT,
    proof_path TEXT,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_staff_allocations_status_check CHECK (status IN ('PENDING', 'PAID', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS donation_staff_allocations_program_idx ON public.donation_staff_allocations (program_id, status);

CREATE TABLE IF NOT EXISTS public.donation_year_closures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.donation_programs(id) ON DELETE RESTRICT,
    fund_year SMALLINT NOT NULL,
    fallback_foundation_id UUID REFERENCES public.donation_foundations(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING_TRANSFER', -- PENDING_TRANSFER, CLOSED, CANCELLED
    unresolved_case_count INTEGER NOT NULL DEFAULT 0,
    contributions_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    staff_allocated_total NUMERIC(15,2) NOT NULL DEFAULT 0,
    available_balance NUMERIC(15,2) NOT NULL DEFAULT 0,
    fallback_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    closed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_year_closures_status_check CHECK (status IN ('PENDING_TRANSFER', 'CLOSED', 'CANCELLED')),
    UNIQUE (program_id, fund_year)
);

CREATE TABLE IF NOT EXISTS public.donation_foundation_disbursements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    closure_id UUID NOT NULL UNIQUE REFERENCES public.donation_year_closures(id) ON DELETE RESTRICT,
    program_id UUID NOT NULL REFERENCES public.donation_programs(id) ON DELETE RESTRICT,
    foundation_id UUID NOT NULL REFERENCES public.donation_foundations(id) ON DELETE RESTRICT,
    foundation_name_snapshot VARCHAR(255) NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, PAID, CANCELLED
    transfer_date DATE,
    payment_method VARCHAR(30),
    reference VARCHAR(255),
    notes TEXT,
    proof_path TEXT,
    recorded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT donation_foundation_disbursements_status_check CHECK (status IN ('PENDING', 'PAID', 'CANCELLED'))
);
CREATE INDEX IF NOT EXISTS donation_foundation_disbursements_program_idx ON public.donation_foundation_disbursements (program_id, status);

-- Unified read-only ledger for reports. It is a security-invoker view so the
-- RLS policies on the underlying donation tables still apply.
CREATE OR REPLACE VIEW public.v_donation_ledger AS
SELECT
    t.id, m.program_id, p.fund_year, 'CONTRIBUTION'::TEXT AS entry_type,
    'IN'::TEXT AS direction, t.amount, t.status,
    COALESCE(u.full_name, u.username)::TEXT AS counterparty_name,
    t.period_start AS entry_date, t.created_at
FROM public.donation_transactions t
JOIN public.donation_memberships m ON m.id = t.membership_id
JOIN public.donation_programs p ON p.id = m.program_id
JOIN public.users u ON u.id = t.donor_user_id
UNION ALL
SELECT
    a.id, a.program_id, p.fund_year, 'STAFF_ALLOCATION'::TEXT,
    'OUT'::TEXT, a.amount, a.status, a.recipient_name_snapshot::TEXT,
    COALESCE(a.payment_date, a.created_at::DATE), a.created_at
FROM public.donation_staff_allocations a
JOIN public.donation_programs p ON p.id = a.program_id
UNION ALL
SELECT
    d.id, d.program_id, p.fund_year, 'FOUNDATION_FALLBACK'::TEXT,
    'OUT'::TEXT, d.amount, d.status, d.foundation_name_snapshot::TEXT,
    COALESCE(d.transfer_date, d.created_at::DATE), d.created_at
FROM public.donation_foundation_disbursements d
JOIN public.donation_programs p ON p.id = d.program_id;
ALTER VIEW public.v_donation_ledger SET (security_invoker = true);
REVOKE ALL ON public.v_donation_ledger FROM anon;
GRANT SELECT ON public.v_donation_ledger TO authenticated;

CREATE OR REPLACE FUNCTION public.enforce_donation_incident_staff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT;
    v_name TEXT;
BEGIN
    SELECT approval_status, full_name INTO v_status, v_name
    FROM public.users
    WHERE id = NEW.staff_user_id;
    IF v_status IS DISTINCT FROM 'APPROVED' THEN
        RAISE EXCEPTION 'Penerima kasus harus merupakan staff/user yang sudah approved';
    END IF;
    NEW.staff_name_snapshot := COALESCE(NULLIF(TRIM(v_name), ''), NEW.staff_name_snapshot);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_donation_incident_staff ON public.donation_incident_cases;
CREATE TRIGGER trg_enforce_donation_incident_staff
BEFORE INSERT OR UPDATE ON public.donation_incident_cases
FOR EACH ROW EXECUTE FUNCTION public.enforce_donation_incident_staff();

CREATE OR REPLACE FUNCTION public.enforce_donation_staff_allocation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_case public.donation_incident_cases;
BEGIN
    SELECT * INTO v_case FROM public.donation_incident_cases WHERE id = NEW.case_id;
    IF v_case.id IS NULL THEN RAISE EXCEPTION 'Kasus donasi tidak ditemukan'; END IF;
    IF v_case.status NOT IN ('APPROVED', 'PAID') THEN
        RAISE EXCEPTION 'Kasus harus berstatus APPROVED sebelum dibuatkan alokasi';
    END IF;
    NEW.program_id := v_case.program_id;
    NEW.recipient_user_id := v_case.staff_user_id;
    NEW.recipient_name_snapshot := v_case.staff_name_snapshot;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_donation_staff_allocation ON public.donation_staff_allocations;
CREATE TRIGGER trg_enforce_donation_staff_allocation
BEFORE INSERT OR UPDATE ON public.donation_staff_allocations
FOR EACH ROW EXECUTE FUNCTION public.enforce_donation_staff_allocation();

CREATE OR REPLACE FUNCTION public.enforce_donation_membership_donor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_approval_status TEXT;
BEGIN
    SELECT approval_status INTO v_approval_status
    FROM public.users
    WHERE id = NEW.donor_user_id;

    IF v_approval_status IS DISTINCT FROM 'APPROVED' THEN
        RAISE EXCEPTION 'Donatur harus merupakan user yang sudah approved';
    END IF;
    IF NEW.amount_mode = 'FIXED' AND (NEW.fixed_amount IS NULL OR NEW.fixed_amount <= 0) THEN
        RAISE EXCEPTION 'Nominal tetap donasi harus lebih besar dari nol';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_donation_membership_donor ON public.donation_memberships;
CREATE TRIGGER trg_enforce_donation_membership_donor
BEFORE INSERT OR UPDATE ON public.donation_memberships
FOR EACH ROW
EXECUTE FUNCTION public.enforce_donation_membership_donor();

CREATE OR REPLACE FUNCTION public.touch_donation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_donation_programs ON public.donation_programs;
CREATE TRIGGER trg_touch_donation_programs BEFORE UPDATE ON public.donation_programs FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_beneficiaries ON public.donation_beneficiaries;
CREATE TRIGGER trg_touch_donation_beneficiaries BEFORE UPDATE ON public.donation_beneficiaries FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_transactions ON public.donation_transactions;
CREATE TRIGGER trg_touch_donation_transactions BEFORE UPDATE ON public.donation_transactions FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_reminders ON public.donation_reminders;
CREATE TRIGGER trg_touch_donation_reminders BEFORE UPDATE ON public.donation_reminders FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_foundations ON public.donation_foundations;
CREATE TRIGGER trg_touch_donation_foundations BEFORE UPDATE ON public.donation_foundations FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_incident_cases ON public.donation_incident_cases;
CREATE TRIGGER trg_touch_donation_incident_cases BEFORE UPDATE ON public.donation_incident_cases FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_staff_allocations ON public.donation_staff_allocations;
CREATE TRIGGER trg_touch_donation_staff_allocations BEFORE UPDATE ON public.donation_staff_allocations FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_year_closures ON public.donation_year_closures;
CREATE TRIGGER trg_touch_donation_year_closures BEFORE UPDATE ON public.donation_year_closures FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();
DROP TRIGGER IF EXISTS trg_touch_donation_foundation_disbursements ON public.donation_foundation_disbursements;
CREATE TRIGGER trg_touch_donation_foundation_disbursements BEFORE UPDATE ON public.donation_foundation_disbursements FOR EACH ROW EXECUTE FUNCTION public.touch_donation_updated_at();

-- Called by the scheduled WhatsApp worker. The unique period key makes this
-- idempotent: a retried cron invocation cannot enqueue duplicate reminders.
CREATE OR REPLACE FUNCTION public.enqueue_due_donation_reminders(p_run_at TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_inserted INTEGER := 0;
BEGIN
    INSERT INTO public.donation_reminders (membership_id, period_start, channel, scheduled_for)
    SELECT
        m.id,
        date_trunc('month', local_day)::DATE,
        'WHATSAPP',
        p_run_at
    FROM public.donation_memberships m
    JOIN public.donation_programs p ON p.id = m.program_id
    JOIN public.users u ON u.id = m.donor_user_id
    CROSS JOIN public.donation_settings s
    CROSS JOIN LATERAL (
        SELECT (p_run_at AT TIME ZONE COALESCE(NULLIF(p.timezone, ''), s.timezone))::DATE AS local_day
    ) d
    WHERE s.id = TRUE
      AND s.enabled = TRUE
      AND p.status = 'ACTIVE'
      AND m.status = 'ACTIVE'
      AND m.whatsapp_opt_in = TRUE
      AND u.approval_status = 'APPROVED'
      AND NULLIF(TRIM(u.phone), '') IS NOT NULL
      AND (m.start_date IS NULL OR local_day >= m.start_date)
      AND (m.end_date IS NULL OR local_day <= m.end_date)
      AND (p.start_date IS NULL OR local_day >= p.start_date)
      AND (p.end_date IS NULL OR local_day <= p.end_date)
      AND EXTRACT(DAY FROM local_day) >= LEAST(COALESCE(m.reminder_day, p.reminder_day, s.default_reminder_day), 28)
    ON CONFLICT (membership_id, period_start, channel) DO NOTHING;

    GET DIAGNOSTICS v_inserted = ROW_COUNT;
    RETURN v_inserted;
END;
$$;

-- Claim rows with row locking so two worker instances cannot send the same
-- WhatsApp reminder at the same time.
CREATE OR REPLACE FUNCTION public.claim_donation_reminders(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    reminder_id UUID,
    membership_id UUID,
    period_start DATE,
    donor_user_id UUID,
    donor_name TEXT,
    donor_phone TEXT,
    program_name TEXT,
    amount NUMERIC,
    amount_mode TEXT,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    WITH candidates AS (
        SELECT r.id
        FROM public.donation_reminders r
        WHERE r.status = 'QUEUED'
          AND r.scheduled_for <= NOW()
        ORDER BY r.scheduled_for, r.created_at
        FOR UPDATE SKIP LOCKED
        LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500)
    ), claimed AS (
        UPDATE public.donation_reminders r
        SET status = 'PROCESSING', updated_at = NOW()
        FROM candidates c
        WHERE r.id = c.id
        RETURNING r.id, r.membership_id, r.period_start
    )
    SELECT
        c.id,
        c.membership_id,
        c.period_start,
        m.donor_user_id,
        COALESCE(u.full_name, u.username)::TEXT,
        u.phone::TEXT,
        p.name::TEXT,
        m.fixed_amount,
        m.amount_mode::TEXT,
        replace(
            replace(
                replace(
                    replace(
                        COALESCE(p.whatsapp_template, s.message_template),
                        '{donor_name}', COALESCE(u.full_name, u.username)
                    ),
                    '{program_name}', p.name
                ),
                '{period}', to_char(c.period_start, 'TMMonth YYYY')
            ),
            '{amount}', CASE WHEN m.amount_mode = 'FIXED' THEN COALESCE(m.fixed_amount::TEXT, '-') ELSE 'sesuai kemampuan' END
        )::TEXT
    FROM claimed c
    JOIN public.donation_memberships m ON m.id = c.membership_id
    JOIN public.donation_programs p ON p.id = m.program_id
    JOIN public.users u ON u.id = m.donor_user_id
    CROSS JOIN public.donation_settings s
    WHERE s.id = TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_donation_reminder(
    p_reminder_id UUID,
    p_status TEXT,
    p_provider_message_id TEXT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_status TEXT := UPPER(TRIM(COALESCE(p_status, '')));
BEGIN
    IF v_status NOT IN ('SENT', 'FAILED', 'SKIPPED') THEN
        RAISE EXCEPTION 'Status reminder tidak valid';
    END IF;
    UPDATE public.donation_reminders
    SET status = v_status,
        sent_at = CASE WHEN v_status = 'SENT' THEN NOW() ELSE sent_at END,
        provider_message_id = NULLIF(TRIM(p_provider_message_id), ''),
        error_message = NULLIF(TRIM(p_error_message), ''),
        updated_at = NOW()
    WHERE id = p_reminder_id
      AND status = 'PROCESSING';
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    RETURN TRUE;
END;
$$;

-- ====================================================================
-- 12. SUPABASE AUTH HELPERS & ROW LEVEL SECURITY (RLS)
-- ====================================================================
-- The legacy schema used permissive policies, which allowed anyone with the
-- public anon key to read/write/delete all data. The policies below require a
-- real Supabase Auth session and enforce role/section permissions in Postgres.

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT id
    FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
$$;

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

CREATE OR REPLACE FUNCTION public.current_app_user_is_active_donor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.donation_memberships
        WHERE donor_user_id = public.current_app_user_id()
          AND status = 'ACTIVE'
    );
$$;

-- Donors receive a column-safe public projection. Internal rejection notes,
-- actor IDs, and proof object paths remain Admin-only on the base tables.
CREATE OR REPLACE VIEW public.v_donation_public_cases AS
SELECT id, program_id, staff_user_id, staff_name_snapshot, case_title,
       public_summary, incident_category, incident_date, requested_amount,
       approved_amount, status, approved_at, closed_at, created_at
FROM public.donation_incident_cases
WHERE public.current_app_user_is_active_donor() OR public.current_app_user_is_admin();
GRANT SELECT ON public.v_donation_public_cases TO authenticated;
REVOKE ALL ON public.v_donation_public_cases FROM anon;

CREATE OR REPLACE VIEW public.v_donation_public_allocations AS
SELECT id, case_id, program_id, recipient_user_id, recipient_name_snapshot,
       amount, status, payment_date, payment_method, reference, notes, created_at
FROM public.donation_staff_allocations
WHERE public.current_app_user_is_active_donor() OR public.current_app_user_is_admin();
GRANT SELECT ON public.v_donation_public_allocations TO authenticated;
REVOKE ALL ON public.v_donation_public_allocations FROM anon;

CREATE OR REPLACE VIEW public.v_donation_public_foundation_disbursements AS
SELECT id, closure_id, program_id, foundation_id, foundation_name_snapshot,
       amount, status, transfer_date, payment_method, reference, notes, created_at
FROM public.donation_foundation_disbursements
WHERE public.current_app_user_is_active_donor() OR public.current_app_user_is_admin();
GRANT SELECT ON public.v_donation_public_foundation_disbursements TO authenticated;
REVOKE ALL ON public.v_donation_public_foundation_disbursements FROM anon;

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

-- Admin can manually enqueue a test/run-now batch; the worker-only functions
-- remain unavailable to normal browser sessions.
CREATE OR REPLACE FUNCTION public.admin_enqueue_donation_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.current_app_user_is_admin() THEN
        RAISE EXCEPTION 'Hanya Admin yang dapat membuat antrean reminder donasi';
    END IF;
    RETURN public.enqueue_due_donation_reminders(NOW());
END;
$$;

-- Manual year closing: the system never sends funds automatically. Admin
-- confirms that no unresolved staff case remains, then records the foundation
-- fallback as a pending transfer.
CREATE OR REPLACE FUNCTION public.admin_prepare_donation_year_closure(
    p_program_id UUID,
    p_foundation_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_program public.donation_programs;
    v_foundation public.donation_foundations;
    v_closure_id UUID;
    v_existing_status TEXT;
    v_unresolved INTEGER := 0;
    v_contributions NUMERIC(15,2) := 0;
    v_allocated NUMERIC(15,2) := 0;
    v_available NUMERIC(15,2) := 0;
BEGIN
    IF NOT public.current_app_user_is_admin() THEN
        RAISE EXCEPTION 'Hanya Admin yang dapat menutup periode dana donasi';
    END IF;

    SELECT * INTO v_program FROM public.donation_programs WHERE id = p_program_id;
    IF v_program.id IS NULL THEN RAISE EXCEPTION 'Program dana tidak ditemukan'; END IF;
    SELECT * INTO v_foundation FROM public.donation_foundations WHERE id = p_foundation_id AND is_active = TRUE;
    IF v_foundation.id IS NULL THEN RAISE EXCEPTION 'Yayasan fallback aktif tidak ditemukan'; END IF;

    SELECT status INTO v_existing_status
    FROM public.donation_year_closures
    WHERE program_id = p_program_id AND fund_year = v_program.fund_year;
    IF v_existing_status = 'CLOSED' THEN
        RAISE EXCEPTION 'Periode dana ini sudah ditutup';
    END IF;

    SELECT COUNT(*) INTO v_unresolved
    FROM public.donation_incident_cases
    WHERE program_id = p_program_id
      AND status IN ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED');
    IF v_unresolved > 0 THEN
        RAISE EXCEPTION 'Masih ada % kasus staff yang belum selesai diproses', v_unresolved;
    END IF;

    SELECT COALESCE(SUM(t.amount), 0) INTO v_contributions
    FROM public.donation_transactions t
    JOIN public.donation_memberships m ON m.id = t.membership_id
    WHERE m.program_id = p_program_id AND t.status = 'PAID';

    SELECT COALESCE(SUM(a.amount), 0) INTO v_allocated
    FROM public.donation_staff_allocations a
    WHERE a.program_id = p_program_id AND a.status = 'PAID';

    v_available := GREATEST(v_contributions - v_allocated, 0);

    INSERT INTO public.donation_year_closures (
        program_id, fund_year, fallback_foundation_id, status,
        unresolved_case_count, contributions_total, staff_allocated_total,
        available_balance, fallback_amount, notes, closed_by, closed_at, updated_at
    ) VALUES (
        p_program_id, v_program.fund_year, p_foundation_id,
        CASE WHEN v_available > 0 THEN 'PENDING_TRANSFER' ELSE 'CLOSED' END,
        v_unresolved, v_contributions, v_allocated, v_available,
        v_available, NULLIF(TRIM(p_notes), ''),
        public.current_app_user_id(),
        CASE WHEN v_available > 0 THEN NULL ELSE NOW() END,
        NOW()
    )
    ON CONFLICT (program_id, fund_year) DO UPDATE SET
        fallback_foundation_id = EXCLUDED.fallback_foundation_id,
        status = EXCLUDED.status,
        unresolved_case_count = EXCLUDED.unresolved_case_count,
        contributions_total = EXCLUDED.contributions_total,
        staff_allocated_total = EXCLUDED.staff_allocated_total,
        available_balance = EXCLUDED.available_balance,
        fallback_amount = EXCLUDED.fallback_amount,
        notes = EXCLUDED.notes,
        closed_by = EXCLUDED.closed_by,
        closed_at = EXCLUDED.closed_at,
        updated_at = NOW()
    RETURNING id INTO v_closure_id;

    IF v_available > 0 THEN
        INSERT INTO public.donation_foundation_disbursements (
            closure_id, program_id, foundation_id, foundation_name_snapshot,
            amount, status, notes, recorded_by
        ) VALUES (
            v_closure_id, p_program_id, p_foundation_id, v_foundation.name,
            v_available, 'PENDING', NULLIF(TRIM(p_notes), ''), public.current_app_user_id()
        )
        ON CONFLICT (closure_id) DO UPDATE SET
            foundation_id = EXCLUDED.foundation_id,
            foundation_name_snapshot = EXCLUDED.foundation_name_snapshot,
            amount = EXCLUDED.amount,
            status = CASE WHEN donation_foundation_disbursements.status = 'PAID' THEN donation_foundation_disbursements.status ELSE 'PENDING' END,
            notes = EXCLUDED.notes,
            updated_at = NOW();
    END IF;

    UPDATE public.donation_programs
    SET status = 'CLOSED', updated_at = NOW()
    WHERE id = p_program_id;

    RETURN jsonb_build_object(
        'closure_id', v_closure_id,
        'program_id', p_program_id,
        'fund_year', v_program.fund_year,
        'contributions_total', v_contributions,
        'staff_allocated_total', v_allocated,
        'fallback_amount', v_available,
        'status', CASE WHEN v_available > 0 THEN 'PENDING_TRANSFER' ELSE 'CLOSED' END,
        'foundation_name', v_foundation.name
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_foundation_disbursement_paid(
    p_disbursement_id UUID,
    p_transfer_date DATE,
    p_payment_method TEXT,
    p_reference TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_disbursement public.donation_foundation_disbursements;
BEGIN
    IF NOT public.current_app_user_is_admin() THEN
        RAISE EXCEPTION 'Hanya Admin yang dapat mencatat transfer yayasan';
    END IF;
    UPDATE public.donation_foundation_disbursements
    SET status = 'PAID', transfer_date = COALESCE(p_transfer_date, CURRENT_DATE),
        payment_method = NULLIF(TRIM(p_payment_method), ''),
        reference = NULLIF(TRIM(p_reference), ''),
        notes = NULLIF(TRIM(p_notes), ''),
        recorded_by = public.current_app_user_id(), updated_at = NOW()
    WHERE id = p_disbursement_id AND status = 'PENDING'
    RETURNING * INTO v_disbursement;
    IF v_disbursement.id IS NULL THEN RAISE EXCEPTION 'Transfer yayasan tidak ditemukan atau sudah diproses'; END IF;

    UPDATE public.donation_year_closures
    SET status = 'CLOSED', closed_at = NOW(), updated_at = NOW()
    WHERE id = v_disbursement.closure_id;

    RETURN jsonb_build_object(
        'id', v_disbursement.id,
        'status', v_disbursement.status,
        'amount', v_disbursement.amount,
        'foundation_name', v_disbursement.foundation_name_snapshot
    );
END;
$$;

-- Used before login so phone-number login still works without exposing the
-- users table or password hashes to anonymous callers.
REVOKE ALL ON FUNCTION public.current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_section() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_is_approved() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_is_active_donor() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_app_user_has_role(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_section() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_is_approved() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_app_user_is_active_donor() TO authenticated;
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
REVOKE ALL ON FUNCTION public.admin_enqueue_donation_reminders() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_enqueue_donation_reminders() TO authenticated;
REVOKE ALL ON FUNCTION public.admin_prepare_donation_year_closure(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_prepare_donation_year_closure(UUID, UUID, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.admin_mark_foundation_disbursement_paid(UUID, DATE, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_mark_foundation_disbursement_paid(UUID, DATE, TEXT, TEXT, TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.enqueue_due_donation_reminders(TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_donation_reminders(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_donation_reminder(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_due_donation_reminders(TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_donation_reminders(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_donation_reminder(UUID, TEXT, TEXT, TEXT) TO service_role;

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
ALTER TABLE public.donation_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_foundations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_incident_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_staff_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_year_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_foundation_disbursements ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.donation_programs, public.donation_beneficiaries,
    public.donation_memberships, public.donation_transactions,
    public.donation_settings, public.donation_reminders,
    public.donation_foundations, public.donation_incident_cases,
    public.donation_staff_allocations, public.donation_year_closures,
    public.donation_foundation_disbursements FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donation_programs,
    public.donation_beneficiaries, public.donation_memberships,
    public.donation_transactions, public.donation_settings,
    public.donation_reminders, public.donation_foundations,
    public.donation_incident_cases, public.donation_staff_allocations,
    public.donation_year_closures, public.donation_foundation_disbursements TO authenticated;

DO $$
DECLARE
    policy_row RECORD;
BEGIN
    FOR policy_row IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('roles','sections','users','outings','outing_users','rundowns','cash_accounts','cash_transactions','purchase_requests','tasks','consumption_plans','announcements','participants','donation_programs','donation_beneficiaries','donation_memberships','donation_transactions','donation_settings','donation_reminders','donation_foundations','donation_incident_cases','donation_staff_allocations','donation_year_closures','donation_foundation_disbursements')
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

-- Donation policies are intentionally separate from outing policies.
CREATE POLICY "approved users read active donation programs" ON public.donation_programs
    FOR SELECT TO authenticated
    USING (public.current_app_user_is_approved() AND (status = 'ACTIVE' OR public.current_app_user_is_admin()));
CREATE POLICY "admin manage donation programs" ON public.donation_programs
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "approved users read active beneficiaries" ON public.donation_beneficiaries
    FOR SELECT TO authenticated
    USING (public.current_app_user_is_approved() AND (is_active OR public.current_app_user_is_admin()));
CREATE POLICY "admin manage donation beneficiaries" ON public.donation_beneficiaries
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "active donors read active donation foundations" ON public.donation_foundations
    FOR SELECT TO authenticated
    USING ((public.current_app_user_is_active_donor() OR public.current_app_user_is_admin()) AND (is_active OR public.current_app_user_is_admin()));
CREATE POLICY "admin manage donation foundations" ON public.donation_foundations
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "admin manage donation cases" ON public.donation_incident_cases
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "admin manage staff allocations" ON public.donation_staff_allocations
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "active donors read year closures" ON public.donation_year_closures
    FOR SELECT TO authenticated USING (public.current_app_user_is_active_donor() OR public.current_app_user_is_admin());
CREATE POLICY "admin manage year closures" ON public.donation_year_closures
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "admin manage foundation disbursements" ON public.donation_foundation_disbursements
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "donors read own memberships" ON public.donation_memberships
    FOR SELECT TO authenticated
    USING (
        public.current_app_user_is_approved()
        AND (donor_user_id = public.current_app_user_id() OR public.current_app_user_is_admin())
    );
CREATE POLICY "admin manage donation memberships" ON public.donation_memberships
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "donors read own donation transactions" ON public.donation_transactions
    FOR SELECT TO authenticated
    USING (
        public.current_app_user_is_approved()
        AND (donor_user_id = public.current_app_user_id() OR public.current_app_user_is_admin())
    );
CREATE POLICY "admin manage donation transactions" ON public.donation_transactions
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "approved users read donation settings" ON public.donation_settings
    FOR SELECT TO authenticated USING (public.current_app_user_is_approved());
CREATE POLICY "admin manage donation settings" ON public.donation_settings
    FOR ALL TO authenticated
    USING (public.current_app_user_is_admin())
    WITH CHECK (public.current_app_user_is_admin());

CREATE POLICY "donors read own donation reminders" ON public.donation_reminders
    FOR SELECT TO authenticated
    USING (
        public.current_app_user_is_approved()
        AND (
            public.current_app_user_is_admin()
            OR EXISTS (
                SELECT 1 FROM public.donation_memberships m
                WHERE m.id = membership_id
                  AND m.donor_user_id = public.current_app_user_id()
            )
        )
    );

-- ====================================================================
-- 13. STORAGE BUCKET & MIGRATIONS (PURCHASING ATTACHMENTS)
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
