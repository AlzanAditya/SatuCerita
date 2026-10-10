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
├─ index.html                 # shell HTML + PWA tags (placeholder <!--ssg:head--> diisi SSG)
├─ scripts/generate-ssg.ts    # SSG: HTML per route, sitemap.xml, robots.txt, 404.html
├─ public/                    # disajikan apa adanya di root domain
│   ├─ favicon.ico, sw.js, manifest.webmanifest
│   ├─ fonts/  icons/  logos/
└─ src/
    ├─ main.tsx               # entry + registrasi service worker (production saja)
    ├─ App.tsx                # router client-side + useSeo
    ├─ routes.ts              # ★ tabel route + metadata SEO (dipakai App & SSG)
    ├─ config/site.ts         # ★ nama, domain, kontak, OG image
    ├─ context/               # LanguageContext (ID/EN)
    ├─ hooks/useSeo.ts        # sinkron <title>/meta saat navigasi SPA
    ├─ components/{layout,app,auth,ui}
    └─ pages/                 # Home, Katalog, CaraPesan, Kontak, Kebijakan, Login, NotFound
        └─ app/UserApp.tsx    # dashboard user (/app/*)
```

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
