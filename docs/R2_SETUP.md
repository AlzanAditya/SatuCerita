# Editor undangan + R2 — panduan setup

## Alur
```
pesanan lunas (webhook Midtrans)  ─trigger SQL─▶  baris `invitations` (isi awal = templates.default_content)
/studio/edit  ─▶  Worker /api/invitations/:id  ─▶  Supabase (teks)  +  R2 invitations/{id}/… (foto)
Publikasikan  ─▶  published_content = content
tamu buka satucerita.app/i/{slug}/  ─▶  Worker: ambil templates/{tpl}/index.html dari R2 + terapkan bindings manifest
```
Semua file ada di SATU bucket R2:
- `templates/{slug}/…`  = salinan persis `src/templates/{slug}/` (tanpa hash / folder versi)
- `invitations/{invitationId}/{slot}-{uuid}.webp` = foto user

## Langkah (sekali)
1. **Bucket R2**: Cloudflare Dashboard → R2 → Create bucket `satucerita-assets` (atau ubah `bucket_name` di wrangler).
2. **Token S3 untuk script sync**: R2 → Manage API Tokens → izin *Object Read & Write* pada bucket itu.
3. **Migrasi DB**: `supabase db push` (file `supabase/migrations/20261114000000_invitations.sql`).
4. **Pasang dependensi**: `pnpm install` (menambah `@aws-sdk/client-s3`).
5. **Sync template + catat ke Supabase**:
   ```bash
   export R2_ACCOUNT_ID=… R2_ACCESS_KEY_ID=… R2_SECRET_ACCESS_KEY=… R2_BUCKET=satucerita-assets
   export SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=…
   pnpm templates:sync:dry     # lihat rencana
   pnpm templates:sync         # unggah (file yang ETag-nya sama dilewati) + isi tabel templates & template_files
   ```
6. **Backfill** pesanan yang sudah lunas sebelum migrasi (jalankan SEKALI setelah langkah 5, di SQL editor): blok komentar nomor 11 di file migrasi.
7. **Deploy Worker**: `pnpm deploy:api` (binding R2, rate limit `RL_RSVP`/`RL_UPLOAD`, dan route `/i/*`, `/m/*`, `/templates/*` sudah ada di wrangler).
8. Landing: `/templates/*` kini dilayani Worker dari R2, jadi `scripts/build.ts` tidak lagi menyalin folder templates (set `COPY_TEMPLATES=1` bila masih perlu).

## Mengubah template
Edit file di `src/templates/{slug}/` lalu `pnpm templates:sync` (tambahkan `--prune` untuk menghapus file yatim di R2).
Cache: browser 5 menit + revalidasi ETag; edge Cache API mengikuti header yang sama. Perubahan besar yang tidak boleh
memengaruhi undangan lama → buat slug baru (mis. `antheia-2`) + manifest baru.

## Menambah template baru
1. Taruh di `src/templates/{slug}/` (struktur sama).
2. Buat `shared/templates/{slug}.ts` (salin `antheia.ts`, ubah selector `bindings`, `defaultContent`, `slots`) dan daftarkan di `shared/templates/index.ts`.
3. `pnpm worker:test` — tes memastikan SETIAP selector menemukan elemen di `index.html` template.
4. `pnpm templates:sync {slug}`.

## Catatan keamanan
- Browser tidak pernah menulis langsung ke DB/R2; Worker memvalidasi konten sesuai manifest (panjang, tipe, URL hanya https, tanggal/jam valid) dan memeriksa magic-bytes foto (JPG/PNG/WebP, maks 5 MB).
- Nilai user di-escape oleh HTMLRewriter; JSON konfigurasi disuntik dengan `<` di-escape.
- Halaman undangan `noindex` dan hanya melayani undangan berstatus `published`.
- Tidak ada CSP khusus karena template memuat YouTube IFrame API & font; tambahkan bila diperlukan.

## Belum tersambung ke UI (API sudah ada)
- Daftar tamu & link personal `?g=kode`: `GET/POST/DELETE /api/invitations/:id/guests`.
- Moderasi ucapan: `GET /api/invitations/:id/wishes`, `PATCH|DELETE …/wishes/:wishId`.
- `UndanganPage`/`BagikanPage`/`UcapanPage` masih memakai data demo; ganti ke `invitationApi.ts`.
