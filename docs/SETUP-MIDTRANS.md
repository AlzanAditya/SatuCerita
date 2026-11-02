# Setup Pembayaran Midtrans (Sandbox) — Studio Satu Cerita

Pembayaran memakai **Midtrans Core API** dengan **UI milik sendiri** di `studio.satucerita.app` (tanpa Snap / popup Midtrans).
Hanya **Cloudflare Worker** yang bicara ke Midtrans. Browser tidak pernah menentukan harga, status, masa berlaku, atau memegang kunci.

Metode: **VA BNI, BRI, Permata, Mandiri Bill Payment, GoPay, QRIS**.

## 1. Alur

```
Checkout ──POST /api/orders──▶ Worker: hitung harga, simpan 'pending', KLAIM charge (atomik di DB)
                                 └─▶ Midtrans POST /v2/charge  ──▶ nomor VA / bill key / QR
                                 └─▶ simpan payment_info + transaction_id + expiry_time ke Supabase
Halaman pesanan menampilkan VA, countdown, instruksi (data dari database)
Pembeli bayar ──▶ Midtrans ──POST webhook──▶ Worker: signature → nominal → Status API → UPDATE per invoice (CAS)
                                 └─▶ PaymentHub (Durable Object) ──SSE──▶ halaman pesanan berubah jadi LUNAS tanpa refresh
```

Tiga mekanisme yang TERPISAH:
| Mekanisme | Arah | Fungsi |
|---|---|---|
| Webhook | Midtrans → Worker | Sumber utama perubahan status |
| SSE (`GET /api/orders/:invoice/events`) | Worker → browser | Mendorong perubahan status ke halaman |
| Polling fallback | browser → Worker → **database** | Hanya jika SSE tidak tersedia; berbatas 15 menit; tidak menyentuh Midtrans |

"Cek status" (tombol manual) adalah satu-satunya jalur dari browser yang membuat Worker bertanya ke Midtrans (cooldown 8 dtk + rate limit).

## 2. Konfigurasi Midtrans Sandbox
1. <https://dashboard.sandbox.midtrans.com> → environment **Sandbox**.
2. Pastikan kanal aktif: BNI VA, BRI VA, Permata VA, Mandiri Bill (e-channel), GoPay, QRIS. Kanal yang belum aktif → API membalas 402 → pembeli melihat "Metode pembayaran ini sedang tidak tersedia".
3. **Settings → Configuration → Payment Notification URL** = `https://satucerita.app/api/payments/midtrans/webhook`
   (Finish/Unfinish/Error redirect tidak dipakai lagi oleh alur Core API.)
4. Server Key bersifat rahasia; tersimpan hanya sebagai secret Worker.

## 3. Supabase
Jalankan migrasi berurutan (aman diulang, tanpa DROP/DELETE/UPDATE data):
1. `20261016000000_init_profiles.sql`
2. `20261030000000_orders_payments.sql`
3. **`20261031000000_core_api_charge.sql`** — menambah `orders.charge_claimed_at`, unique index `midtrans_trx_id`, dan memperketat trigger (id transaksi & masa berlaku terkunci setelah charge, khusus pesanan era Core API). Kolom `snap_token` dipertahankan (legacy, tidak lagi dipakai).

## 4. Worker
Secret (sudah ada): `MIDTRANS_SERVER_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. Tidak perlu variabel baru.
Konfigurasi baru di `wrangler.api.jsonc` & `worker/wrangler.toml`:
- Durable Object `PAYMENT_HUB` (class `PaymentHub`, migrasi `v1-payment-hub`, SQLite-backed → tersedia di plan Free)
- Rate limit `RL_STREAM` (30 koneksi SSE/menit/user)

Deploy: `pnpm deploy:api`. Tanpa binding DO, SSE membalas 503 dan halaman otomatis memakai polling DB.

## 5. Uji Sandbox (cara menguji ulang pembayaran)
1. Checkout → pilih **Permata VA** → Bayar sekarang. Anda tetap di studio.satucerita.app; nomor VA, nominal, countdown tampil.
2. Buka <https://simulator.sandbox.midtrans.com> → Virtual Account → masukkan nomor VA → Pay.
3. Halaman pesanan berubah ke **Pembayaran Berhasil** dalam beberapa detik, **tanpa refresh**.
4. Cek: Midtrans dashboard → *HTTP Notification History* harus **200**; Supabase `payment_events` bertambah satu baris; `orders.status = paid`.
5. *Resend notification* dari dashboard → tetap 200, status tetap paid, tidak ada UPDATE baru.
6. Log live: `pnpm worker:tail` (cari `midtrans.webhook.received` / `.processed`).

### Diagnosis webhook dari luar
```bash
MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx npx tsx scripts/check-webhook.ts
```
Membuktikan apakah permintaan server-ke-server benar-benar sampai ke Worker (bukan sekadar URL bisa dibuka di browser).

## 6. Arti status
| Midtrans | Status internal |
|---|---|
| settlement; capture + fraud accept | `paid` |
| pending | `pending` |
| deny / failure | `failed` |
| cancel | `cancelled` |
| expire | `expired` |
| capture (bukan accept), refund, partial_refund, chargeback | `needs_review` (keputusan manusia) |

Status hanya maju. `paid` tidak bisa turun (kode + trigger DB). Uang masuk setelah pesanan ditutup → `needs_review`.

## 7. Troubleshooting
| Gejala | Penyebab / solusi |
|---|---|
| Dashboard Midtrans: notifikasi gagal 6× | Midtrans mengulang 5× hanya untuk status di luar 2xx/500/503/400/404 (mis. 401/403/5xx edge). Jalankan `scripts/check-webhook.ts`; cek Cloudflare Security → Events (filter path webhook) |
| Webhook 401 | Server Key di Worker ≠ akun Midtrans pengirim |
| Webhook 503 | Status API/DB sementara gagal; Midtrans mengirim ulang otomatis |
| Instruksi tidak muncul / "Menyiapkan instruksi" lama | Charge gagal/terputus; pilih Ganti metode (pesanan lama dibatalkan otomatis) |
| 422 "Metode tidak tersedia" | Kanal belum aktif di dashboard Midtrans |
| Status tidak berubah otomatis | Webhook tidak sampai (lihat baris pertama) atau DO belum di-deploy (halaman memakai fallback polling) |

## 8. Go-live Production (nanti, setelah Sandbox lulus)
`MIDTRANS_ENV="production"` + Client Key production di kedua config, `wrangler secret put MIDTRANS_SERVER_KEY` (key production), set Notification URL di dashboard **Production**, tes 1 transaksi nominal kecil.
