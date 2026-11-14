-- ============================================================================
-- Satu Cerita — Migration 4 (DRAFT): undangan yang bisa diedit setelah dibeli
--
-- Pola mengikuti migrasi 1-3:
--  * Client (anon/authenticated) hanya boleh MEMBACA miliknya (RLS).
--  * Semua penulisan (simpan draft, foto, tamu, RSVP publik, publikasi) lewat Cloudflare Worker (service role); undangan dibuat oleh trigger.
--  * Aditif & aman diulang: tidak ada DROP / DELETE data lama.
--
-- Alur:
--   orders.status -> 'paid'  ==>  trigger membuat 1 baris `invitations` (isi awal = templates.default_content)
--   /studio/edit  ==>  user mengubah invitations.content + invitation_media (RLS: hanya miliknya)
--   Tombol "Publikasikan"  ==>  Worker menyalin content ke published_content (versi live) setelah validasi
--   Halaman publik /{slug}  ==>  Worker membaca published_content (service role), menyuntikkan ke template
-- ============================================================================

-- ---------- 1) templates: registry template (file-nya TIDAK di sini, hanya penunjuk) ----------
create table if not exists public.templates (
  slug             text primary key,
  title            text not null,
  version          integer not null default 1,
  is_active        boolean not null default true,
  storage_provider text not null default 'r2' check (storage_provider in ('r2', 'supabase', 'static')),
  asset_prefix     text not null,                              -- mis. 'templates/antheia/' = sama persis dengan struktur folder lokal (tanpa hash/versi)
  entry_path       text not null default 'index.html',
  manifest         jsonb not null default '{}'::jsonb,         -- section, field & slot foto yang bisa diedit user
  default_content  jsonb not null default '{}'::jsonb,         -- isi awal undangan baru
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint templates_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- Inventaris file template di R2 (diisi script sync lokal -> R2). Berguna untuk diff / audit, bukan untuk melayani file.
create table if not exists public.template_files (
  template_slug text not null references public.templates (slug) on delete cascade,
  path          text not null,                                 -- relatif terhadap asset_prefix, mis. 'assets/flower/rose-divider.webp'
  content_type  text,
  size_bytes    integer not null check (size_bytes >= 0),
  etag          text,                                          -- ETag dari R2, dipakai script sync untuk melewati file yang tidak berubah
  updated_at    timestamptz not null default now(),
  primary key (template_slug, path)
);

drop trigger if exists templates_set_updated_at on public.templates;
create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- ---------- 2) invitations: 1 pesanan lunas = 1 undangan ----------
create table if not exists public.invitations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  order_id         uuid not null unique references public.orders (id) on delete restrict,
  template_slug    text not null references public.templates (slug),
  template_version integer not null,

  slug             text not null,                              -- URL publik: satucerita.app/{slug}
  title            text,
  status           text not null default 'draft',
  progress_step    smallint not null default 0,               -- 0-5, sama dengan stepper di /studio/edit

  content          jsonb not null default '{}'::jsonb,        -- draft yang sedang diedit
  published_content jsonb,                                    -- salinan yang tayang (null = belum pernah dipublikasi)
  published_at     timestamptz,
  active_until     timestamptz,                               -- masa aktif undangan (opsional, sesuai paket)

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint invitations_status_valid  check (status in ('draft', 'published', 'archived')),
  constraint invitations_step_range    check (progress_step between 0 and 5),
  constraint invitations_slug_format   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 48),
  constraint invitations_slug_reserved check (slug <> all (array['admin','api','app','dash','studio','login','signup','katalog','preview','templates','t','kontak','kebijakan','cara-pesan'])),
  constraint invitations_content_size  check (pg_column_size(content) < 200000)
);

create unique index if not exists invitations_slug_key     on public.invitations (slug);
create index        if not exists invitations_user_idx     on public.invitations (user_id, created_at desc);

drop trigger if exists invitations_set_updated_at on public.invitations;
create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- Slug tidak boleh diganti setelah undangan pernah dipublikasi (link yang sudah dibagikan tidak boleh mati).
create or replace function public.invitations_guard_update()
returns trigger language plpgsql as $$
begin
  if old.published_at is not null and new.slug is distinct from old.slug then
    raise exception 'Slug undangan tidak boleh diubah setelah dipublikasikan.';
  end if;
  if new.user_id is distinct from old.user_id
     or new.order_id is distinct from old.order_id
     or new.template_slug is distinct from old.template_slug then
    raise exception 'Kolom undangan ini tidak boleh diubah.';
  end if;
  return new;
end $$;

drop trigger if exists invitations_guard_update_trg on public.invitations;
create trigger invitations_guard_update_trg
  before update on public.invitations
  for each row execute function public.invitations_guard_update();

-- ---------- 3) Otomatis buat undangan saat pesanan lunas ----------
-- Sengaja TIDAK melempar error bila template belum ada di tabel `templates`:
-- error di sini akan menggagalkan update status 'paid' dari webhook Midtrans.
create or replace function public.orders_create_invitation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'paid' and old.status is distinct from 'paid' and new.user_id is not null then
    insert into public.invitations (user_id, order_id, template_slug, template_version, slug, content)
    select new.user_id, new.id, t.slug, t.version,
           'u-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
           t.default_content
      from public.templates t
     where t.slug = new.template_slug
    on conflict (order_id) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists orders_create_invitation_trg on public.orders;
create trigger orders_create_invitation_trg
  after update of status on public.orders
  for each row execute function public.orders_create_invitation();

-- ---------- 4) Publikasi: dilakukan Worker (POST /api/invitations/:id/publish) setelah validasi field wajib ----------

-- ---------- 5) invitation_media: foto per slot (cover, groom, bride, story_1.., gallery, closing, og) ----------
create table if not exists public.invitation_media (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  slot          text not null,
  sort_order    smallint not null default 0,                  -- urutan untuk slot berulang (gallery)
  provider      text not null default 'r2' check (provider in ('r2', 'supabase')),
  path          text not null,                                -- key di R2: invitations/{invitation_id}/{slot}-{uuid}.webp
  mime_type     text,
  size_bytes    integer check (size_bytes is null or size_bytes between 1 and 5242880),
  width         integer,
  height        integer,
  alt           text check (alt is null or char_length(alt) <= 160),
  created_at    timestamptz not null default now(),
  constraint invitation_media_slot_format check (slot ~ '^[a-z0-9_]{2,32}$'),
  constraint invitation_media_sort_range  check (sort_order between 0 and 31),
  constraint invitation_media_slot_unique unique (invitation_id, slot, sort_order)
);

-- ---------- 6) invitation_guests: daftar tamu + link personal (?to=) ----------
create table if not exists public.invitation_guests (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name          text not null check (char_length(name) between 1 and 80),
  code          text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  phone         text check (phone is null or phone ~ '^\+[1-9][0-9]{7,14}$'),
  group_label   text check (group_label is null or char_length(group_label) <= 40),
  max_pax       smallint not null default 2 check (max_pax between 1 and 10),
  sent_at       timestamptz,
  opened_at     timestamptz,
  created_at    timestamptz not null default now(),
  constraint invitation_guests_code_unique unique (invitation_id, code)
);
create index if not exists invitation_guests_inv_idx on public.invitation_guests (invitation_id, created_at desc);

-- ---------- 7) invitation_wishes: RSVP + ucapan dari tamu ----------
-- Kontrak dengan template (js/rsvp.js): POST {name, attendance, guestCount, message, guestCode?}
-- GET -> {data: [...], stats: {total, yes, no}}. Insert publik HANYA lewat Worker (rate limit RL_*).
create table if not exists public.invitation_wishes (
  id            uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  guest_id      uuid references public.invitation_guests (id) on delete set null,
  name          text not null check (char_length(name) between 1 and 80),
  attendance    text not null check (attendance in ('yes', 'no', 'maybe')),
  guest_count   smallint not null default 1 check (guest_count between 1 and 10),
  message       text not null check (char_length(message) between 1 and 500),
  reactions     integer not null default 0 check (reactions >= 0),
  is_hidden     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists invitation_wishes_inv_idx on public.invitation_wishes (invitation_id, created_at desc);

-- ---------- 8) Row Level Security ----------
alter table public.templates          enable row level security;
alter table public.template_files     enable row level security;
alter table public.invitations        enable row level security;
alter table public.invitation_media   enable row level security;
alter table public.invitation_guests  enable row level security;
alter table public.invitation_wishes  enable row level security;

-- templates: katalog boleh dibaca publik (hanya yang aktif); tulis = service role.
create policy "templates_select_active" on public.templates
  for select to anon, authenticated using (is_active or public.is_admin());

-- invitations / media / tamu / ucapan: pemilik hanya MEMBACA langsung. SEMUA penulisan lewat Worker (service role),
-- agar konten divalidasi sesuai manifest template dan kunci `media` tidak bisa dipalsukan dari browser.
create policy "invitations_select_own"   on public.invitations
  for select to authenticated using (user_id = auth.uid());
create policy "invitations_select_admin" on public.invitations
  for select to authenticated using (public.is_admin());
create policy "invitation_media_select_owner" on public.invitation_media
  for select to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));
create policy "invitation_guests_select_owner" on public.invitation_guests
  for select to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));
create policy "invitation_wishes_select_owner" on public.invitation_wishes
  for select to authenticated
  using (exists (select 1 from public.invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- ---------- 9) Grant (default: tutup semua, buka seperlunya) ----------
revoke all on public.templates         from anon, authenticated;
revoke all on public.template_files    from anon, authenticated;
revoke all on public.invitations       from anon, authenticated;
revoke all on public.invitation_media  from anon, authenticated;
revoke all on public.invitation_guests from anon, authenticated;
revoke all on public.invitation_wishes from anon, authenticated;

grant select on public.templates to anon, authenticated;
grant select on public.invitations, public.invitation_media, public.invitation_guests, public.invitation_wishes to authenticated;

-- ---------- 10) Penyimpanan file: SEMUA di Cloudflare R2 (satu bucket), dicatat di tabel di atas ----------
--   templates/{slug}/...                         -> file template, struktur sama persis dengan src/templates/{slug}/ (tanpa hash)
--   invitations/{invitation_id}/{slot}-{uuid}.webp -> foto unggahan user (dicatat di invitation_media)
-- Tidak ada bucket / policy Supabase Storage yang dibuat.

-- ---------- 11) Backfill (jalankan MANUAL setelah tabel `templates` di-seed) ----------
-- insert into public.invitations (user_id, order_id, template_slug, template_version, slug, content)
-- select o.user_id, o.id, t.slug, t.version,
--        'u-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10), t.default_content
--   from public.orders o join public.templates t on t.slug = o.template_slug
--  where o.status = 'paid' and o.user_id is not null
-- on conflict (order_id) do nothing;
