# Satu Cerita

Platform undangan digital (landing page, katalog, cara pesan, kontak, kebijakan,
login/signup, dan dashboard user). Dibangun dengan **React 19 + Vite 6 + Tailwind CSS 4**
dan dirender statis (SSG) per halaman untuk SEO.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # vite build + SSG  ->  dist/
npm run preview    # cek hasil build
npm run lint       # type-check (tsc --noEmit)
```

Opsional: salin `.env.example` ke `.env` dan isi `VITE_SITE_URL` bila domain produksi berbeda
dari default (`https://satucerita.zanxa.studio`).

## Struktur

```
├─ index.html                 # shell HTML preview lokal / dev server
├─ supabase/                  # ★ skema, config.toml & migrasi database PostgreSQL
│   ├─ config.toml
│   ├─ migrations/
│   └─ seed.sql
├─ scripts/
│   ├─ build.ts               # ★ build mandiri Cloudflare Pages (dist/landing-page, dist/app, dist/dash)
│   └─ generate-ssg.ts        # SSG untuk landing-page: HTML per route, sitemap.xml, robots.txt, 404.html
├─ public/                    # aset statis global (fonts, icons, logos, manifest, sw.js)
└─ src/
    ├─ entries/               # entry points mandiri per aplikasi
    │   ├─ landing/           # index.html, AppLanding.tsx, main.tsx
    │   ├─ app/               # index.html, AppUser.tsx, main.tsx
    │   └─ dash/              # index.html, AppDash.tsx, main.tsx
    ├─ pages/                 # ★ halaman terkelompok
    │   ├─ landing-page/      # HomePage, KatalogPage, CaraPesan, Kontak, Kebijakan, LoginPage, NotFoundPage
    │   ├─ app/               # UserApp (dashboard pemesan)
    │   └─ dash/              # AdminDash (dashboard admin)
    ├─ routes.ts              # tabel route + metadata SEO
    ├─ config/site.ts         # konfigurasi domain, kontak, OG image
    └─ lib/supabase.ts        # helper client Supabase
```

## Cloudflare Pages (Build Mandiri)

Saat menjalankan `npm run build`, folder `dist/` menghasilkan 3 aplikasi mandiri:

1. **`dist/landing-page/`**  
   Untuk Cloudflare Pages proyek Landing Page (mis. `satucerita.zanxa.studio`). Dilengkapi seluruh halaman SSG statis, meta SEO lengkap, sitemap.xml, robots.txt, dan `_redirects`.
2. **`dist/app/`**  
   Untuk Cloudflare Pages proyek User Dashboard (mis. `app.satucerita.zanxa.studio`). Memiliki bundle SPA sendiri, routing mandiri, aset lengkap, dan `_redirects` (`/* /index.html 200`).
3. **`dist/dash/`**  
   Untuk Cloudflare Pages proyek Admin Dashboard (mis. `dash.satucerita.zanxa.studio` / `admin.satucerita.zanxa.studio`). Mandiri dengan SPA rewrite `_redirects`.

## Route

| Path | Halaman | Indexable |
| --- | --- | --- |
| `/` | Beranda | ✅ |
| `/katalog`, `/cara-pesan`, `/kontak`, `/kebijakan` | Halaman publik | ✅ |
| `/login`, `/signup` | Autentikasi | ❌ `noindex` |
| `/app/home`, `/app/proses`, `/app/profile` | Dashboard | ❌ `noindex` |
| lainnya | 404 | ❌ `noindex` |

Alias lama (`/carapesan`, `/app`, `/app/pesanan`, `/app/task`, `/app/bayar`, `/app/pembayaran`, `/app/profil`)
otomatis diarahkan ke path kanonik oleh router.

## SEO & SSG

`npm run build` menjalankan `vite build`, lalu `scripts/generate-ssg.ts` yang menulis
`<route>/index.html` + `<route>.html` untuk setiap route di `src/routes.ts`, berisi
`<title>`, description, canonical, Open Graph, Twitter Card, robots, dan JSON-LD
(Organization + WebSite di beranda). Juga menghasilkan `404.html`, `sitemap.xml`
(hanya route `indexable`), dan `robots.txt`.

> Catatan: SSG ini menyisipkan **metadata** ke tiap halaman; isi halaman tetap dirender React di
> browser (bukan pre-render konten).

**Menambah halaman baru**
1. Tambahkan entry di `ROUTES` (dan `PATHS`/`RouteId`) pada `src/routes.ts`.
2. Tambahkan `case` di `switch` pada `src/App.tsx`.
3. Selesai — SSG, sitemap, dan `useSeo` otomatis ikut.


## Autentikasi (Supabase + Cloudflare Worker)

Login email/Google, guard dashboard, dan migration database ada di folder `worker/` dan `supabase/`.
Panduan konfigurasi lengkap: [`docs/SETUP-AUTH.md`](docs/SETUP-AUTH.md).
