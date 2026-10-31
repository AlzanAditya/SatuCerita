-- ============================================================================
-- Satu Cerita — Migration 2: pesanan (orders) + log notifikasi pembayaran
-- Pembayaran lewat Midtrans Snap. Tabel ini HANYA ditulis oleh Cloudflare Worker
-- (service role). User login hanya boleh MEMBACA pesanannya sendiri (RLS).
-- ============================================================================

-- ---------- Tabel orders ----------
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  invoice_no        text not null,                       -- juga dipakai sebagai order_id di Midtrans
  user_id           uuid references auth.users (id) on delete set null,

  template_slug     text not null,
  template_title    text not null,
  template_category text,
  template_cover    text,
  package_tier      text,

  base_price        integer not null,
  discount_code     text,
  discount_amount   integer not null default 0,
  gross_amount      integer not null,

  payment_method    text not null,
  status            text not null default 'pending',
  snap_token        text,
  payment_info      jsonb not null default '{}'::jsonb,   -- VA / bill key / QR dari Midtrans
  midtrans_trx_id   text,

  idempotency_key   text not null,
  customer_name     text,
  customer_email    text,
  customer_phone    text,

  expires_at        timestamptz not null,
  paid_at           timestamptz,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint orders_invoice_format   check (invoice_no ~ '^SC[0-9]{6}-[0-9A-Z]{8}$'),
  constraint orders_base_positive    check (base_price > 0),
  constraint orders_discount_range   check (discount_amount >= 0 and discount_amount < base_price),
  constraint orders_amount_consistent check (gross_amount = base_price - discount_amount and gross_amount > 0),
  constraint orders_method_valid     check (payment_method in ('bni_va','bri_va','permata_va','mandiri_bill','qris','gopay')),
  constraint orders_status_valid     check (status in ('pending','paid','expired','cancelled','failed','needs_review')),
  constraint orders_idem_len         check (char_length(idempotency_key) between 16 and 64)
);

create unique index orders_invoice_key     on public.orders (invoice_no);
create unique index orders_user_idem_key   on public.orders (user_id, idempotency_key);
-- Satu pesanan "pending" per (user, template): mencegah pesanan dobel dari klik cepat / banyak tab.
create unique index orders_one_pending     on public.orders (user_id, template_slug) where status = 'pending';
-- Voucher hanya boleh dipakai sekali per akun (selama pesanannya masih hidup / lunas).
create unique index orders_voucher_once    on public.orders (user_id, discount_code)
  where discount_code is not null and status in ('pending','paid','needs_review');
create index orders_user_created_idx       on public.orders (user_id, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------- Trigger pengaman (defense in depth, di atas logika Worker) ----------
-- 1) Nominal / pemilik / invoice tidak boleh berubah setelah dibuat.
-- 2) Pesanan yang sudah 'paid' tidak boleh mundur ke status lain (kecuali 'needs_review' untuk refund/sengketa).
create or replace function public.orders_guard_update()
returns trigger language plpgsql as $$
begin
  if new.invoice_no      is distinct from old.invoice_no
     or (new.user_id is distinct from old.user_id and new.user_id is not null)  -- null = user dihapus (ON DELETE SET NULL)
     or new.base_price   is distinct from old.base_price
     or new.gross_amount is distinct from old.gross_amount
     or new.discount_amount is distinct from old.discount_amount
     or new.payment_method  is distinct from old.payment_method then
    raise exception 'Kolom pesanan ini tidak boleh diubah.';
  end if;
  if old.status = 'paid' and new.status not in ('paid','needs_review') then
    raise exception 'Pesanan lunas tidak boleh diubah statusnya.';
  end if;
  if new.status = 'paid' and old.status <> 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end $$;

create trigger orders_guard_update_trg
  before update on public.orders
  for each row execute function public.orders_guard_update();

-- ---------- Tabel payment_events (audit + anti-replay) ----------
-- Hanya notifikasi dengan signature VALID yang dicatat (agar tidak bisa di-spam penyerang).
create table public.payment_events (
  id                 bigint generated always as identity primary key,
  dedupe_key         text not null unique,
  invoice_no         text,
  transaction_status text,
  status_code        text,
  gross_amount       text,
  payment_type       text,
  result             text,        -- hasil pemrosesan, mis. 'paid', 'ignored', 'amount_mismatch'
  payload            jsonb,
  created_at         timestamptz not null default now()
);
create index payment_events_invoice_idx on public.payment_events (invoice_no, created_at desc);

-- ---------- Row Level Security ----------
alter table public.orders          enable row level security;
alter table public.payment_events  enable row level security;

create policy "orders_select_own" on public.orders
  for select to authenticated using (user_id = auth.uid());
create policy "orders_select_admin" on public.orders
  for select to authenticated using (public.is_admin());

-- Client (anon/authenticated) TIDAK boleh menulis apa pun. Hanya service role (Worker).
revoke all on public.orders         from anon, authenticated;
revoke all on public.payment_events from anon, authenticated;
grant select on public.orders to authenticated;
-- payment_events: tanpa policy & tanpa grant => tidak terbaca dari client sama sekali.
