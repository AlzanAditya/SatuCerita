-- ============================================================================
-- Satu Cerita — Migration 5: Kode Redeem (diskon) yang diatur admin
--
-- Menggantikan voucher hardcode (HEMAT10) di Worker. Aturan:
--  * Potongan: persen (opsional batas maksimal rupiah) ATAU nominal flat.
--  * Masa berlaku: starts_at / expires_at (opsional; WAJIB expires_at untuk mode 'time_based').
--  * Mode pemakaian:
--      - 'per_invitation' : tiap pesanan (= 1 undangan) yang memakai kode menghabiskan 1 jatah;
--                           jatah per akun = max_invitations_per_user (bisa > 1).
--      - 'time_based'     : tidak dibatasi jumlah pesanan, selama masa berlaku masih ada.
--  * Satu pesanan hanya boleh 1 kode (kolom orders.discount_code tunggal; tidak bisa ditumpuk).
--  * Audiens: 'all' (semua pengguna) atau 'selected' (hanya email di redeem_code_users).
--
-- Pola mengikuti migrasi sebelumnya: client TIDAK boleh menulis; semua penulisan lewat Worker (service role).
-- Aditif & aman diulang. Pesanan lama tidak berubah (diskon sudah tersimpan di orders sebagai angka).
-- ============================================================================

-- ---------- 1) Tabel kode redeem ----------
create table if not exists public.redeem_codes (
  id                        uuid primary key default gen_random_uuid(),
  code                      text not null,                         -- huruf besar; tidak boleh diubah setelah dibuat
  description               text,
  discount_type             text not null,                         -- 'percent' | 'flat'
  discount_value            integer not null,                      -- percent: 1-100 | flat: rupiah
  max_discount              integer,                               -- batas potongan (rupiah), hanya untuk percent; null = tanpa batas
  usage_mode                text not null default 'per_invitation',-- 'per_invitation' | 'time_based'
  max_invitations_per_user  integer not null default 1,            -- jatah undangan per akun (mode per_invitation)
  starts_at                 timestamptz,
  expires_at                timestamptz,
  audience                  text not null default 'all',           -- 'all' | 'selected'
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint redeem_code_format    check (code ~ '^[A-Z0-9_-]{3,32}$'),
  constraint redeem_desc_len       check (description is null or char_length(description) <= 120),
  constraint redeem_type_valid     check (discount_type in ('percent', 'flat')),
  constraint redeem_value_range    check (
    (discount_type = 'percent' and discount_value between 1 and 100)
    or (discount_type = 'flat' and discount_value between 1 and 10000000)
  ),
  constraint redeem_cap_valid      check (max_discount is null or (discount_type = 'percent' and max_discount between 1 and 10000000)),
  constraint redeem_mode_valid     check (usage_mode in ('per_invitation', 'time_based')),
  constraint redeem_per_user_range check (max_invitations_per_user between 1 and 1000),
  constraint redeem_audience_valid check (audience in ('all', 'selected')),
  constraint redeem_time_needs_end check (usage_mode <> 'time_based' or expires_at is not null),
  constraint redeem_dates_order    check (starts_at is null or expires_at is null or expires_at > starts_at)
);

create unique index if not exists redeem_codes_code_key on public.redeem_codes (code);

drop trigger if exists redeem_codes_set_updated_at on public.redeem_codes;
create trigger redeem_codes_set_updated_at
  before update on public.redeem_codes
  for each row execute function public.set_updated_at();

-- Nama kode adalah kunci hitung pemakaian (orders.discount_code), jadi tidak boleh diganti.
create or replace function public.redeem_codes_guard_update()
returns trigger language plpgsql as $$
begin
  if new.code is distinct from old.code then
    raise exception 'Nama kode redeem tidak boleh diubah.';
  end if;
  return new;
end $$;

drop trigger if exists redeem_codes_guard_update_trg on public.redeem_codes;
create trigger redeem_codes_guard_update_trg
  before update on public.redeem_codes
  for each row execute function public.redeem_codes_guard_update();

-- ---------- 2) Daftar email yang boleh memakai kode (audience = 'selected') ----------
create table if not exists public.redeem_code_users (
  code_id    uuid not null references public.redeem_codes (id) on delete cascade,
  email      text not null,
  created_at timestamptz not null default now(),
  primary key (code_id, email),
  constraint redeem_user_email_fmt check (email = lower(email) and char_length(email) between 3 and 254)
);

-- ---------- 3) Pesanan: voucher sekali-pakai-per-akun DICABUT, diganti aturan per kode ----------
-- Index lama melarang kode yang sama dipakai dua kali oleh satu akun. Sekarang batasnya ditentukan admin per kode.
drop index if exists public.orders_voucher_once;
create index if not exists orders_user_code_idx on public.orders (user_id, discount_code) where discount_code is not null;

-- Penjaga terakhir (defense in depth, di atas logika Worker): saat pesanan dibuat dengan kode, pastikan kode masih
-- sah untuk akun itu. Kunci advisory per (user, kode) menutup balapan dua pesanan bersamaan yang sama-sama lolos cek.
create or replace function public.orders_enforce_redeem()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  rc    public.redeem_codes;
  mail  text;
  used  integer;
begin
  if new.discount_code is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(coalesce(new.user_id::text, '') || ':' || new.discount_code, 0));

  select * into rc from public.redeem_codes where code = new.discount_code;
  if not found or not rc.is_active then
    raise exception 'Kode redeem tidak valid.';
  end if;
  if rc.starts_at is not null and now() < rc.starts_at then
    raise exception 'Kode redeem belum berlaku.';
  end if;
  if rc.expires_at is not null and now() >= rc.expires_at then
    raise exception 'Kode redeem sudah kedaluwarsa.';
  end if;

  if rc.audience = 'selected' then
    select lower(u.email) into mail from auth.users u where u.id = new.user_id;
    if mail is null or not exists (select 1 from public.redeem_code_users ru where ru.code_id = rc.id and ru.email = mail) then
      raise exception 'Kode redeem tidak tersedia untuk akun ini.';
    end if;
  end if;

  if rc.usage_mode = 'per_invitation' then
    select count(*) into used
      from public.orders o
     where o.user_id = new.user_id
       and o.discount_code = new.discount_code
       and o.status in ('pending', 'paid', 'needs_review');
    if used >= rc.max_invitations_per_user then
      raise exception 'Jatah pemakaian kode redeem untuk akun ini sudah habis.';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists orders_enforce_redeem_trg on public.orders;
create trigger orders_enforce_redeem_trg
  before insert on public.orders
  for each row execute function public.orders_enforce_redeem();

-- ---------- 4) Row Level Security ----------
-- Pengguna biasa TIDAK boleh membaca daftar kode (agar kode tidak bocor). Admin boleh membaca; penulisan hanya lewat Worker.
alter table public.redeem_codes      enable row level security;
alter table public.redeem_code_users enable row level security;

drop policy if exists "redeem_codes_select_admin" on public.redeem_codes;
create policy "redeem_codes_select_admin" on public.redeem_codes
  for select to authenticated using (public.is_admin());
drop policy if exists "redeem_code_users_select_admin" on public.redeem_code_users;
create policy "redeem_code_users_select_admin" on public.redeem_code_users
  for select to authenticated using (public.is_admin());

revoke all on public.redeem_codes      from anon, authenticated;
revoke all on public.redeem_code_users from anon, authenticated;
grant select on public.redeem_codes, public.redeem_code_users to authenticated;

-- ---------- 5) Pertahankan voucher lama ----------
-- HEMAT10 sebelumnya hardcode di Worker (10%, sekali pakai per akun, untuk semua pengguna).
insert into public.redeem_codes (code, description, discount_type, discount_value, usage_mode, max_invitations_per_user, audience)
values ('HEMAT10', 'Diskon 10% (kode bawaan)', 'percent', 10, 'per_invitation', 1, 'all')
on conflict (code) do nothing;
