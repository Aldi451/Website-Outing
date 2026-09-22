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
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    department VARCHAR(100),
    role VARCHAR(50) DEFAULT 'PARTICIPANT',
    section VARCHAR(50) DEFAULT 'PUBLIC',
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rundowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Public READ (Anon Key) for informational modules (All participants can read)
CREATE POLICY "Allow anon read outings" ON public.outings FOR SELECT USING (true);
CREATE POLICY "Allow anon read rundowns" ON public.rundowns FOR SELECT USING (true);
CREATE POLICY "Allow anon read cash_transactions" ON public.cash_transactions FOR SELECT USING (true);
CREATE POLICY "Allow anon read purchase_requests" ON public.purchase_requests FOR SELECT USING (true);
CREATE POLICY "Allow anon read tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow anon read consumption_plans" ON public.consumption_plans FOR SELECT USING (true);
CREATE POLICY "Allow anon read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Allow anon read participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Allow anon read users" ON public.users FOR SELECT USING (true);

-- Permissive writes for demo / hybrid mode (Can be tightened for Supabase Auth in production):
CREATE POLICY "Allow anon insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update users" ON public.users FOR UPDATE USING (true);
CREATE POLICY "Allow anon insert cash_transactions" ON public.cash_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon delete cash_transactions" ON public.cash_transactions FOR DELETE USING (true);
CREATE POLICY "Allow anon insert rundowns" ON public.rundowns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update rundowns" ON public.rundowns FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete rundowns" ON public.rundowns FOR DELETE USING (true);
CREATE POLICY "Allow anon insert purchase_requests" ON public.purchase_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update purchase_requests" ON public.purchase_requests FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete purchase_requests" ON public.purchase_requests FOR DELETE USING (true);
CREATE POLICY "Allow anon insert tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete tasks" ON public.tasks FOR DELETE USING (true);
CREATE POLICY "Allow anon insert consumption_plans" ON public.consumption_plans FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update consumption_plans" ON public.consumption_plans FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete consumption_plans" ON public.consumption_plans FOR DELETE USING (true);
CREATE POLICY "Allow anon insert announcements" ON public.announcements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update announcements" ON public.announcements FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete announcements" ON public.announcements FOR DELETE USING (true);
CREATE POLICY "Allow anon insert participants" ON public.participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update participants" ON public.participants FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete participants" ON public.participants FOR DELETE USING (true);
CREATE POLICY "Allow anon insert outings" ON public.outings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update outings" ON public.outings FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete outings" ON public.outings FOR DELETE USING (true);

-- ====================================================================
-- 12. STORAGE BUCKET & MIGRATIONS (PURCHASING ATTACHMENTS)
-- ====================================================================

-- Migration for existing database deployments:
ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for purchases (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchases', 'purchases', true)
ON CONFLICT (id) DO NOTHING;

-- Storage object policies for anonymous public uploads & viewing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public read purchases'
    ) THEN
        CREATE POLICY "Allow public read purchases" ON storage.objects
            FOR SELECT USING (bucket_id = 'purchases');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow anon insert purchases'
    ) THEN
        CREATE POLICY "Allow anon insert purchases" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'purchases');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow anon update purchases'
    ) THEN
        CREATE POLICY "Allow anon update purchases" ON storage.objects
            FOR UPDATE USING (bucket_id = 'purchases');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow anon delete purchases'
    ) THEN
        CREATE POLICY "Allow anon delete purchases" ON storage.objects
            FOR DELETE USING (bucket_id = 'purchases');
    END IF;
END $$;

