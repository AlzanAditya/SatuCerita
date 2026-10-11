-- Schema Database Satu Cerita (Platform Undangan Digital)
-- PostgreSQL / Supabase Migration

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUM TYPES
create type user_role as enum ('user', 'admin');
create type order_status as enum ('pending', 'paid', 'processing', 'completed', 'cancelled');
create type invitation_tier as enum ('standard', 'deluxe', 'elysian');

-- 3. PROFILES TABLE (sinkron dengan auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique,
  full_name text,
  phone text,
  role user_role default 'user'::user_role not null,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. TEMPLATES TABLE (Katalog template undangan)
create table if not exists public.templates (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  category text not null default 'WEDDING',
  tier invitation_tier not null default 'elysian',
  original_price integer not null default 199000,
  discount_price integer not null default 149000,
  thumbnail_url text,
  preview_url text,
  frame_bg text default 'linear-gradient(135deg, #1f1b2e 0%, #161320 100%)',
  features jsonb default '["Buku Tamu", "RSVP Online", "Hitung Mundur", "Google Maps", "Galeri Foto", "Musik Latar"]'::jsonb,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. INVITATIONS TABLE (Undangan yang dibuat pengguna)
create table if not exists public.invitations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  template_id uuid references public.templates(id) on delete set null,
  slug text unique not null,
  title text not null,
  bride_name text not null,
  groom_name text not null,
  event_date timestamp with time zone not null,
  event_location text,
  event_address text,
  event_maps_url text,
  cover_image_url text,
  gallery_urls text[] default array[]::text[],
  music_url text,
  tier invitation_tier not null default 'elysian',
  is_published boolean default false not null,
  views_count integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. ORDERS TABLE (Transaksi & pemesanan undangan)
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  invitation_id uuid references public.invitations(id) on delete set null,
  order_number text unique not null,
  amount integer not null,
  status order_status default 'pending'::order_status not null,
  payment_method text default 'bank_transfer',
  payment_proof_url text,
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. RSVPS TABLE (Konfirmasi kehadiran tamu)
create table if not exists public.rsvps (
  id uuid default gen_random_uuid() primary key,
  invitation_id uuid references public.invitations(id) on delete cascade not null,
  guest_name text not null,
  attendance text not null, -- 'hadir', 'tidak_hadir', 'ragu'
  guest_count integer default 1 not null,
  message text,
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. GUESTBOOK TABLE (Ucapan & doa tamu undangan)
create table if not exists public.guestbook (
  id uuid default gen_random_uuid() primary key,
  invitation_id uuid references public.invitations(id) on delete cascade not null,
  sender_name text not null,
  message text not null,
  is_hidden boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.templates enable row level security;
alter table public.invitations enable row level security;
alter table public.orders enable row level security;
alter table public.rsvps enable row level security;
alter table public.guestbook enable row level security;

-- Templates: Siapa saja bisa baca template yang aktif
create policy "Templates are readable by all"
  on public.templates for select
  using (is_active = true);

-- Profiles: Pengguna bisa melihat dan update profil miliknya sendiri
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Invitations: Pengguna bisa kelola undangan miliknya; publik bisa baca undangan yang sudah dipublikasi
create policy "Public can view published invitations"
  on public.invitations for select
  using (is_published = true or auth.uid() = user_id);

create policy "Users can insert own invitations"
  on public.invitations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invitations"
  on public.invitations for update
  using (auth.uid() = user_id);

create policy "Users can delete own invitations"
  on public.invitations for delete
  using (auth.uid() = user_id);

-- Orders: Pengguna bisa melihat dan membuat order miliknya
create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update payment proof on own orders"
  on public.orders for update
  using (auth.uid() = user_id);

-- RSVPs: Publik bisa membuat RSVP pada undangan terbit; pemilik undangan bisa melihat semua RSVP
create policy "Public can submit RSVP"
  on public.rsvps for insert
  with check (true);

create policy "Invitation owners can view RSVPs"
  on public.rsvps for select
  using (
    exists (
      select 1 from public.invitations
      where invitations.id = rsvps.invitation_id
      and invitations.user_id = auth.uid()
    )
  );

-- Guestbook: Publik bisa kirim ucapan dan baca ucapan yang tidak disembunyikan
create policy "Public can view non-hidden guestbook"
  on public.guestbook for select
  using (is_hidden = false);

create policy "Public can submit guestbook"
  on public.guestbook for insert
  with check (true);

-- 10. TRIGGERS
-- Trigger otomatis buat profil saat user daftar di auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger update timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger set_invitations_updated_at
  before update on public.invitations
  for each row execute procedure public.handle_updated_at();

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();
