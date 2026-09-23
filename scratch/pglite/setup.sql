-- Tiruan lingkungan Supabase (struktur auth yang sebenarnya)
create schema if not exists auth;
create schema if not exists extensions;
create role anon;
create role authenticated;

create table auth.users (
  instance_id uuid,
  id uuid primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255) unique,
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  invited_at timestamptz,
  confirmation_token varchar(255),
  confirmation_sent_at timestamptz,
  recovery_token varchar(255),
  email_change_token_new varchar(255),
  email_change varchar(255),
  email_change_sent_at timestamptz,
  last_sign_in_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz,
  updated_at timestamptz,
  phone text,
  phone_confirmed_at timestamptz,
  confirmed_at timestamptz generated always as (least(email_confirmed_at, phone_confirmed_at)) stored
);

create table auth.identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  identity_data jsonb not null,
  provider text not null,
  provider_id text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  unique (provider_id, provider)
);

-- auth.uid() versi uji: nilai diambil dari GUC agar bisa disimulasikan
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('test.uid', true), '')::uuid
$$;

-- Skema publik versi LAMA seperti di project Supabase pengguna
create table public.users (
  id uuid primary key default gen_random_uuid(),
  username varchar(100) not null unique,
  full_name varchar(255) not null,
  email varchar(255),
  phone varchar(30),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  auth_user_id uuid unique,
  role varchar(50) default 'PARTICIPANT',
  section varchar(50) default 'PUBLIC',
  approval_status varchar(20) not null default 'PENDING'
);

-- participants versi lama: TANPA kolom username & room (seperti di DB pengguna)
create table public.participants (
  id uuid primary key default gen_random_uuid(),
  outing_id uuid,
  user_id uuid,
  full_name varchar(255) not null,
  phone varchar(30),
  department varchar(100),
  gender char(1) default 'L',
  transport varchar(100),
  status varchar(50) default 'CONFIRMED',
  created_at timestamptz default now()
);

-- tabel master versi lama: hanya kolom name (untuk menguji seed yang aman)
create table public.roles (id uuid primary key default gen_random_uuid(), name varchar(50) not null unique);
create table public.sections (id uuid primary key default gen_random_uuid(), name varchar(50) not null unique);

create table public.outings (id uuid primary key default gen_random_uuid(), name varchar(255), created_at timestamptz default now());
create table public.outing_users (id uuid primary key default gen_random_uuid(), outing_id uuid, user_id uuid, created_at timestamptz default now());

-- akun Auth yang sudah ada tapi belum dikonfirmasi (kasus nyata pengguna)
insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values ('9b333b52-03e7-42ff-b30c-4ca6dd155572', 'authenticated', 'authenticated', 'admin@outing.local', 'lama', null,
        '{"provider":"email"}'::jsonb, '{"username":"admin"}'::jsonb, now(), now());

insert into public.users (id, username, full_name, auth_user_id, role, section, approval_status)
values ('9b333b52-03e7-42ff-b30c-4ca6dd155572', 'admin', 'Administrator', '9b333b52-03e7-42ff-b30c-4ca6dd155572', 'ADMIN', 'INISIATOR', 'APPROVED');

-- peserta kedua (belum punya akun login)
insert into public.users (username, full_name, role, section, approval_status)
values ('budi', 'Budi Santoso', 'PARTICIPANT', 'PUBLIC', 'APPROVED');
