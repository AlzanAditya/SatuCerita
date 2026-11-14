# Setup Pembayaran Midtrans (Sandbox) — Studio Satu Cerita

Ada **dua mode pembayaran**, dipilih lewat variabel `MIDTRANS_PAYMENT_MODE` (di `wrangler.api.jsonc` / `worker/wrangler.toml`):

| Mode | Isi | Status sekarang |
|---|---|---|
| `snap` | Popup **Midtrans Snap** (`snap.js`). Pembeli memilih & membayar di popup Midtrans. | **AKTIF (sementara)** |
| `core_api` | UI pembayaran milik sendiri + `POST /v2/charge`. | Kode utuh, tinggal ganti mode (default bila variabel kosong) |

Webhook, signature, Status API, SSE, tabel Supabase, dan migrasi **sama untuk kedua mode** — berpindah mode tidak perlu migrasi database.
Hanya **Cloudflare Worker** yang bicara ke Midtrans dengan Server Key. Browser tidak pernah menentukan harga, status, atau masa berlaku;
di mode Snap browser hanya menerima **token Snap** dan **Client Key** (keduanya memang publik menurut dokumentasi Midtrans).

Metode: **VA BNI, BRI, Permata, Mandiri Bill Payment, GoPay, QRIS**.

## 1a. Alur mode Snap (aktif)

```
Checkout ──POST /api/orders──▶ Worker: hitung harga, simpan 'pending'
                                 └─▶ Midtrans POST https://app.sandbox.midtrans.com/snap/v1/transactions ──▶ token
                                 └─▶ simpan snap_token ke Supabase, kirim token ke browser
Browser memuat snap.js (Client Key) ──▶ window.snap.pay(token) ──▶ popup Midtrans: pembeli pilih kanal & bayar
Midtrans ──POST webhook──▶ Worker: signature → nominal → Status API → UPDATE per invoice ──SSE──▶ halaman pesanan LUNAS
```
- Kanal di popup dibatasi sesuai metode yang dipilih di checkout (`enabled_payments`: `bni_va`, `bri_va`, `permata_va`, `echannel`, `other_qris`, `gopay`).
- Item transaksi selalu berjumlah sama dengan `gross_amount` (voucher = item berharga negatif), syarat validasi Snap.
- Callback popup (`onSuccess`/`onPending`/`onClose`) hanya untuk berpindah halaman. **Lunas hanya dari webhook / Status API.**
- Pembeli yang menutup popup bisa lanjut lewat tombol **Lanjutkan pembayaran** di halaman pesanan (token masih berlaku selama pesanan pending).
- Nomor VA / QR baru tersimpan di database setelah pembeli memilih kanal di popup dan notifikasi `pending` diterima.

## 1b. Alur mode Core API

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
3. **Settings → Configuration → Payment Notification URL** = `https://satucerita.app/api/payments/midtrans/webhook` (WAJIB untuk kedua mode).
   Mode Snap: Finish URL dikirim per transaksi (`callbacks.finish`) sehingga Finish/Unfinish/Error Redirect URL di dashboard boleh dikosongkan.
4. Server Key bersifat rahasia; tersimpan hanya sebagai secret Worker.

## 3. Supabase
Jalankan migrasi berurutan (aman diulang, tanpa DROP/DELETE/UPDATE data):
1. `20261016000000_init_profiles.sql`
2. `20261030000000_orders_payments.sql`
3. **`20261031000000_core_api_charge.sql`** — menambah `orders.charge_claimed_at`, unique index `midtrans_trx_id`, dan memperketat trigger (id transaksi & masa berlaku terkunci setelah charge, khusus pesanan era Core API). Kolom `snap_token` dipertahankan (legacy, tidak lagi dipakai).

## 4. Worker
Secret (sudah ada): `MIDTRANS_SERVER_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
Variabel: `MIDTRANS_ENV` (`sandbox`/`production`), `MIDTRANS_CLIENT_KEY` (publik; WAJIB terisi, dipakai `snap.js`), `MIDTRANS_PAYMENT_MODE` (`snap`/`core_api`).
Server Key dan Client Key harus dari **akun & environment yang sama** (`SB-Mid-server-…` + `SB-Mid-client-…` untuk sandbox).
Konfigurasi baru di `wrangler.api.jsonc` & `worker/wrangler.toml`:
- Durable Object `PAYMENT_HUB` (class `PaymentHub`, migrasi `v1-payment-hub`, SQLite-backed → tersedia di plan Free)
- Rate limit `RL_STREAM` (30 koneksi SSE/menit/user)

Deploy: `pnpm deploy:api`. Tanpa binding DO, SSE membalas 503 dan halaman otomatis memakai polling DB.

## 5a. Uji Sandbox mode Snap
0. (Opsional) Pastikan Server Key & kanal valid: `MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx npx tsx scripts/check-snap.ts`
1. Checkout → pilih metode → **Bayar sekarang**. Popup Midtrans Snap terbuka.
2. Pilih/lanjutkan di popup. Untuk VA: catat nomor VA → <https://simulator.sandbox.midtrans.com> → Virtual Account → Pay. Untuk GoPay/QRIS gunakan simulator yang sama.
3. Halaman pesanan berubah ke **Pembayaran Berhasil** tanpa refresh. Cek: *HTTP Notification History* di dashboard Midtrans = **200**, `orders.status = paid`, `payment_events` bertambah.
4. Tutup popup sebelum bayar → di halaman pesanan tekan **Lanjutkan pembayaran** → popup terbuka lagi.

## 5. Uji Sandbox mode Core API
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
| Popup Snap tidak terbuka / "Pembayaran belum dikonfigurasi" | `MIDTRANS_CLIENT_KEY` kosong/salah, atau domain diblokir ad-blocker; lihat console browser |
| Error 401 saat membuat token Snap (log `midtrans.snap_rejected`) | Server Key salah / beda akun & environment dengan Client Key |
| Error 400 `gross_amount is not equal to the sum of item_details` | Item ≠ total. Sudah dijaga `buildItems()`; jangan mengubah item tanpa menyesuaikan diskon |
| Kanal tidak muncul di popup | Kanal belum aktif di dashboard Midtrans (Settings → Snap Preferences / Payment channels) |
| Instruksi tidak muncul / "Menyiapkan instruksi" lama (Core API) | Charge gagal/terputus; pilih Ganti metode (pesanan lama dibatalkan otomatis) |
| 422 "Metode tidak tersedia" | Kanal belum aktif di dashboard Midtrans |
| Status tidak berubah otomatis | Webhook tidak sampai (lihat baris pertama) atau DO belum di-deploy (halaman memakai fallback polling) |

## 8. Kembali ke Core API (kapan saja)
Ganti `MIDTRANS_PAYMENT_MODE` ke `"core_api"` di kedua config → `pnpm deploy:api`. Pesanan pending era Snap tetap bisa dibayar/diselesaikan lewat webhook; pesanan baru memakai UI sendiri.

## 9. Go-live Production (nanti, setelah Sandbox lulus)
`MIDTRANS_ENV="production"` + Client Key production di kedua config, `wrangler secret put MIDTRANS_SERVER_KEY` (key production), set Notification URL di dashboard **Production**, tes 1 transaksi nominal kecil.
