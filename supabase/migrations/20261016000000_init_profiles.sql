-- ============================================================================
-- Satu Cerita — Migration 1: profiles + aturan admin tunggal
-- Admin satu-satunya: satuceritadotid@gmail.com (login via Google).
-- Untuk mengganti email admin, ubah fungsi public.admin_email() di bawah
-- (dan ADMIN_EMAIL di worker/wrangler.toml).
-- ============================================================================

create type public.user_role as enum ('user', 'admin');

create or replace function public.admin_email()
returns text language sql immutable as $$ select 'satuceritadotid@gmail.com'::text $$;

-- ---------- Tabel profiles ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  avatar_url  text,
  role        public.user_role not null default 'user',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_name_len     check (full_name is null or char_length(full_name) between 1 and 80),
  constraint profiles_phone_format check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  constraint profiles_avatar_https check (avatar_url is null or avatar_url ~ '^https://')
);

create unique index profiles_email_key    on public.profiles (lower(email));
create unique index profiles_single_admin on public.profiles (role) where role = 'admin';

-- ---------- Helper: cek admin (security definer agar RLS tidak rekursif) ----------
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Trigger: updated_at ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Trigger: blokir signup NON-Google dengan email admin ----------
create or replace function public.guard_admin_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if lower(new.email) = lower(public.admin_email())
     and coalesce(new.raw_app_meta_data ->> 'provider', '') <> 'google' then
    raise exception 'Email ini hanya dapat didaftarkan melalui Google.';
  end if;
  return new;
end $$;

create trigger guard_admin_email_before_insert
  before insert on auth.users
  for each row execute function public.guard_admin_email();

-- ---------- Trigger: buat profile otomatis saat user baru ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_role   public.user_role := 'user';
  v_name   text;
  v_avatar text;
begin
  -- role admin hanya untuk email admin + Google + email terverifikasi
  if lower(new.email) = lower(public.admin_email())
     and new.raw_app_meta_data ->> 'provider' = 'google'
     and new.email_confirmed_at is not null then
    v_role := 'admin';
  end if;

  v_name   := nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name',
                                        new.raw_user_meta_data ->> 'name', '')), 80), '');
  v_avatar := coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture');
  if v_avatar is not null and v_avatar !~ '^https://' then v_avatar := null; end if;

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (new.id, new.email, v_name, v_avatar, v_role);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Trigger: sinkron email saat berubah di auth ----------
create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- ---------- Backfill user yang sudah ada ----------
insert into public.profiles (id, email, full_name, role)
select u.id, u.email,
       nullif(left(trim(coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', '')), 80), ''),
       case when lower(u.email) = lower(public.admin_email())
                 and u.raw_app_meta_data ->> 'provider' = 'google'
                 and u.email_confirmed_at is not null
            then 'admin'::public.user_role else 'user'::public.user_role end
from auth.users u
on conflict (id) do nothing;

-- ---------- Row Level Security ----------
alter table public.profiles enable row level security;

create policy "profiles_select_own"  on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles_select_admin" on public.profiles for select to authenticated using (public.is_admin());
create policy "profiles_update_own"  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- User hanya boleh mengubah kolom ini. role/email/id TIDAK bisa diubah dari client.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_url) on public.profiles to authenticated;
