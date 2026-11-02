-- ============================================================================
-- Satu Cerita — Migration 3: Midtrans Core API (UI pembayaran sendiri, tanpa Snap)
--
-- Sifat migrasi: ADITIF & AMAN DIULANG. Tidak ada DROP / DELETE / UPDATE data.
--  * Kolom `snap_token` DIPERTAHANKAN (nullable) agar pesanan lama tidak berubah; kode baru tidak menulisnya.
--  * Menambah `charge_claimed_at`: penanda "satu-satunya request yang boleh memanggil /v2/charge".
--  * Memperketat trigger pengaman: transaksi Midtrans & masa berlaku tidak bisa diubah setelah di-charge.
-- ============================================================================

-- 1) Penanda klaim charge ---------------------------------------------------
-- Request yang berhasil mengisi kolom ini (UPDATE ... WHERE charge_claimed_at IS NULL) adalah satu-satunya yang
-- memanggil Midtrans /v2/charge untuk pesanan itu. Klik ganda / banyak tab tidak bisa membuat transaksi ganda.
alter table public.orders
  add column if not exists charge_claimed_at timestamptz;

comment on column public.orders.charge_claimed_at is
  'Waktu request pertama mengklaim hak memanggil Midtrans Core API /v2/charge. NULL = belum pernah di-charge.';

-- 2) Satu transaksi Midtrans hanya boleh dimiliki satu pesanan ---------------
create unique index if not exists orders_midtrans_trx_key
  on public.orders (midtrans_trx_id)
  where midtrans_trx_id is not null;

-- 3) Trigger pengaman (menggantikan versi sebelumnya; semantik lama tetap sama) ----
-- Tambahan:
--  * midtrans_trx_id yang sudah terisi tidak boleh diganti (notifikasi/response aneh tidak bisa membelokkan pesanan).
--  * expires_at hanya boleh disetel SEKALI saat charge (ketika midtrans_trx_id masih NULL), mengikuti expiry_time Midtrans.
--  Keduanya hanya berlaku untuk pesanan era Core API.
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

  -- Hanya untuk pesanan era Core API (charge_claimed_at terisi). Pesanan lama era Snap dikecualikan karena Snap bisa
  -- membuat transaction_id baru bila pembeli mengganti metode di dalam popup.
  if old.charge_claimed_at is not null and old.midtrans_trx_id is not null then
    if new.midtrans_trx_id is distinct from old.midtrans_trx_id then
      raise exception 'ID transaksi Midtrans tidak boleh diganti.';
    end if;
    if new.expires_at is distinct from old.expires_at then
      raise exception 'Masa berlaku pesanan tidak boleh diubah setelah transaksi dibuat.';
    end if;
  end if;

  if old.status = 'paid' and new.status not in ('paid','needs_review') then
    raise exception 'Pesanan lunas tidak boleh diubah statusnya.';
  end if;

  if new.status = 'paid' and old.status <> 'paid' and new.paid_at is null then
    new.paid_at := now();
  end if;
  return new;
end $$;

-- (trigger orders_guard_update_trg dari migrasi 2 otomatis memakai fungsi terbaru ini)

-- 4) Indeks bantu untuk pencarian log notifikasi per pesanan sudah ada (payment_events_invoice_idx). Tidak ada perubahan.
