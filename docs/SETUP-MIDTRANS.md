# Setup Pembayaran Midtrans (Sandbox) — Studio Satu Cerita

Pembayaran di `studio.satucerita.app` memakai **Midtrans Snap** (popup resmi Midtrans). Satu-satunya pihak yang
bicara ke Midtrans adalah **Cloudflare Worker**. Browser tidak pernah menentukan harga, status bayar, atau memegang
kunci rahasia.

Metode yang tersedia: **VA BNI, BRI, Permata, Mandiri Bill Payment, GoPay, QRIS**.

---

## 1. Cara kerjanya (singkat)

```
Browser ──POST /api/orders──▶ Worker ──(hitung harga, simpan pesanan 'pending')──▶ Supabase
                               │
                               └──Snap token──▶ Midtrans        Browser membuka popup Snap (snap.js)
Pembeli bayar di Midtrans ──notifikasi──▶ POST /api/payments/midtrans/webhook (Worker)
                               └─ cek signature → tanya Status API Midtrans → cek nominal → update Supabase
Browser membaca status dari GET /api/orders/:invoice (database), tidak pernah mengubahnya sendiri
```

---

## 2. Setup Midtrans Sandbox

1. Daftar/login di <https://dashboard.sandbox.midtrans.com> dan pilih environment **Sandbox**.
2. **Settings → Access Keys**: catat **Client Key** (`SB-Mid-client-…`) dan **Server Key** (`SB-Mid-server-…`).
3. **Settings → Snap Preferences / Payment**: pastikan metode berikut aktif: BNI VA, BRI VA, Permata VA,
   Mandiri Bill Payment (e-channel), GoPay, QRIS. Metode yang tidak aktif akan gagal saat dipilih.
4. **Settings → Configuration**:
   - **Payment Notification URL** = `https://satucerita.app/api/payments/midtrans/webhook`
   - **Finish / Unfinish / Error Redirect URL** = `https://studio.satucerita.app/home`
     (URL notifikasi ini sudah masuk route Worker `satucerita.app/api/*`).
5. Server Key itu **rahasia**. Jangan dikirim lewat chat, screenshot, atau di-commit ke Git.

## 3. Setup Supabase

1. Jalankan migrasi `supabase/migrations/20261030000000_orders_payments.sql`:
   - lewat CLI: `supabase db push`, **atau**
   - buka Supabase → **SQL Editor** → tempel isi file itu → **Run**.
   (Migrasi pertama `…_init…` harus sudah dijalankan; migrasi ini memakai fungsi `set_updated_at()` dan `is_admin()` darinya.)
2. Ambil **secret key** (service role): Supabase → **Project Settings → API Keys** → *Secret key* (`sb_secret_…`)
   atau *service_role* (key lama). Key ini melewati RLS, jadi **hanya** boleh ada di Worker sebagai secret.

## 4. Konfigurasi Worker

1. Isi **Client Key** (publik, aman di file config) di dua tempat:
   - `wrangler.api.jsonc` → `vars.MIDTRANS_CLIENT_KEY`
   - `worker/wrangler.toml` → `MIDTRANS_CLIENT_KEY`
   `MIDTRANS_ENV` biarkan `"sandbox"`.
2. Simpan dua **secret** (diminta interaktif, tidak tampil di terminal/log):

   ```bash
   npx wrangler secret put MIDTRANS_SERVER_KEY       --config wrangler.api.jsonc
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY --config wrangler.api.jsonc
   ```

   > `wrangler secret put` langsung membuat deployment baru.
3. (Opsional) **Rate limit**: sudah dikonfigurasi di `ratelimits` (`RL_ORDERS` 10/menit, `RL_SYNC` 20/menit).
   `namespace_id` (`7101`, `7102`) harus unik di akun Cloudflare Anda; ubah jika bentrok.

Worker menolak berjalan jika konfigurasi salah (mis. `MIDTRANS_ENV=sandbox` tapi Server Key bukan key Sandbox)
dan membalas `503 Pembayaran belum dikonfigurasi`.

## 5. Deploy

```bash
pnpm deploy:api       # build + deploy Worker
pnpm deploy:studio    # build + deploy frontend studio
```

## 6. Tes di lokal (opsional)

1. `cp worker/.dev.vars.example worker/.dev.vars` lalu isi nilai Supabase + Midtrans Sandbox.
2. Jalankan `pnpm dev:api` (Worker, port 8787) dan `pnpm dev` (Vite).
3. **Webhook butuh URL publik.** Untuk tes lokal:
   ```bash
   cloudflared tunnel --url http://localhost:8787
   ```
   Tempel URL `https://xxxx.trycloudflare.com/api/payments/midtrans/webhook` ke *Payment Notification URL* Sandbox
   **sementara**, lalu kembalikan ke `satucerita.app` setelah selesai.
   Tanpa tunnel, pembayaran tetap bisa dites: tombol **Cek status** akan menanyakan Midtrans langsung dari Worker.

## 7. Checklist tes Sandbox

Bayar lewat **Payment Simulator** Midtrans (<https://simulator.sandbox.midtrans.com>): masukkan nomor VA / kode bayar,
atau gunakan QR/link simulasi yang muncul di popup untuk GoPay & QRIS.

| # | Tes | Hasil yang benar |
|---|---|---|
| 1 | Checkout → pilih BNI VA → **Bayar sekarang** | Popup Midtrans terbuka, ada nomor VA |
| 2 | Bayar via simulator | Dalam beberapa detik halaman pesanan jadi **Lunas** (tanpa refresh) |
| 3 | Klik **Bayar sekarang** berkali-kali cepat | Hanya 1 pesanan & 1 transaksi (cek tabel `orders`) |
| 4 | Buka DevTools, ubah harga/total di request | Diabaikan; total tetap dari server |
| 5 | Voucher `HEMAT10` dipakai, lalu pakai lagi di pesanan lain | Pemakaian kedua ditolak |
| 6 | **Ganti metode** (BNI → GoPay) saat pending | Pesanan lama `cancelled`, pesanan baru `pending` |
| 7 | Biarkan pesanan kedaluwarsa (atau *expire* dari simulator) | Status **Kedaluwarsa** |
| 8 | Dashboard Midtrans → *Resend notification* | Tetap Lunas, tidak ada efek ganda (`payment_events` tidak bertambah) |
| 9 | Buka `/app/order/<invoice orang lain>` | "Pesanan tidak ditemukan" |
| 10 | `curl` webhook dengan signature ngawur | `401`, status tidak berubah |

Melihat data: Supabase → Table Editor → `orders` (status & nominal) dan `payment_events` (riwayat notifikasi).
Log Worker: `pnpm worker:tail`.

Tes otomatis (tanpa jaringan, tanpa akun Midtrans): `pnpm worker:test`.

## 8. Arti status pesanan

| Status | Arti |
|---|---|
| `pending` | Menunggu pembayaran |
| `paid` | Lunas (sudah dikonfirmasi Midtrans Status API & nominal cocok) |
| `expired` / `cancelled` / `failed` | Ditutup; buat pesanan baru |
| `needs_review` | **Perlu dicek manual**: nominal tidak cocok, uang masuk setelah pesanan ditutup, atau refund/sengketa. Cek di dashboard Midtrans lalu putuskan. Status ini tidak berubah otomatis. |

## 9. Perlindungan yang sudah diterapkan

- Harga & voucher dihitung **di server** dari katalog `src/data/templates.ts`.
- Webhook: signature SHA-512 (perbandingan waktu-konstan) → **konfirmasi ulang lewat Status API** → cek nominal → idempoten.
- Status hanya bergerak maju; `paid` tidak bisa mundur (dijaga di kode **dan** trigger database).
- Anti klik ganda: tombol terkunci + debounce, idempotency key, unique index "1 pesanan pending per user per template".
- Anti-CSRF (cek Origin), cookie HttpOnly, RLS (user hanya bisa *membaca* pesanannya; tulis hanya via Worker).
- Rate limit + cooldown pada "Cek status".
- Server Key & service key hanya sebagai `wrangler secret`; tidak pernah ke browser atau log.
- Salah-environment dicegah (key Sandbox tidak bisa dipakai di mode production, dan sebaliknya).
- Pesanan lama yang tersimpan di `localStorage` browser (data tiruan) dihapus otomatis.

## 10. Go-live ke Production (nanti, setelah Sandbox lulus semua tes)

1. Lengkapi data bisnis di dashboard Midtrans **Production** dan tunggu persetujuan; aktifkan metode bayarnya.
2. Ambil Client/Server Key **Production** (tanpa awalan `SB-`).
3. `MIDTRANS_ENV = "production"` + `MIDTRANS_CLIENT_KEY` production di kedua file config.
4. `wrangler secret put MIDTRANS_SERVER_KEY` dengan key production.
5. Set Payment Notification URL di dashboard **Production**.
6. Deploy, lalu tes 1 transaksi nominal kecil dengan uang asli.

## 11. Troubleshooting

| Gejala | Penyebab / solusi |
|---|---|
| "Pembayaran belum dikonfigurasi" (503) | `MIDTRANS_CLIENT_KEY` kosong, `MIDTRANS_SERVER_KEY` belum di-set, atau key tidak cocok dengan `MIDTRANS_ENV` |
| Popup tidak muncul | Metode bayar belum aktif di dashboard, atau pemblokir iklan memblokir `snap.js` |
| Status tetap *pending* setelah bayar | Notification URL belum diset / salah → klik **Cek status**; cek *HTTP Notification History* di dashboard |
| Webhook di dashboard menunjukkan 401 | Server Key di Worker beda dengan akun Midtrans yang mengirim |
| Webhook menunjukkan 503 | Status API / Supabase sedang bermasalah; Midtrans akan mengirim ulang otomatis |
| Error saat menyimpan pesanan | Migrasi belum dijalankan, atau `SUPABASE_SERVICE_ROLE_KEY` salah |
| Voucher ditolak padahal belum pernah dipakai | Ada pesanan `pending`/`paid` lain yang memakai voucher itu |

## 12. File yang ditambah / diubah

**Baru:** `worker/src/{midtrans,orders,webhook,state,pricing,db,ratelimit}.ts`, `worker/test/*.test.ts`,
`supabase/migrations/20261030000000_orders_payments.sql`, `src/lib/payments.ts`, `worker/.dev.vars.example`, dokumen ini.

**Diubah:** `worker/src/{index,types}.ts`, `wrangler.api.jsonc`, `worker/wrangler.toml`,
`src/pages/app/{CheckoutPage,OrderDetailPage,PesananPage,UserApp,types}.tsx|ts`, `.gitignore`
(folder `worker/` dan `supabase/` tidak lagi diabaikan Git), `package.json` (script `worker:test`).

**Belum disentuh:** dasbor admin (`dash`) — data pesanannya masih contoh statis. Menghubungkannya ke tabel `orders`
adalah langkah berikutnya.
