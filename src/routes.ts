/**
 * Tabel route + metadata SEO (single source of truth).
 *
 * Dipakai oleh:
 *  - `src/App.tsx`               -> router client-side + useSeo
 *  - `scripts/generate-ssg.ts`   -> HTML statis per route, sitemap.xml, robots.txt
 *
 * File ini HARUS tetap "pure data" (tanpa import React / API browser),
 * supaya aman dijalankan di Node saat proses SSG.
 */

export const PATHS = {
  home: "/",
  login: "/login",
  signup: "/signup",
  katalog: "/katalog",
  caraPesan: "/cara-pesan",
  kontak: "/kontak",
  kebijakan: "/kebijakan",
  appHome: "/app/home",
  appProses: "/app/proses",
  appProfile: "/app/profile",
  dash: "/dash",
  dashLogin: "/dash/login",
  dashCustomer: "/dash/customer",
  dashAnalytics: "/dash/analytics",
  dashFinance: "/dash/finance",
  dashTemplates: "/dash/templates",
  dashInvitations: "/dash/invitations",
  dashSettings: "/dash/settings",
} as const;

export type RouteId =
  | "home"
  | "login"
  | "signup"
  | "katalog"
  | "caraPesan"
  | "kontak"
  | "kebijakan"
  | "appHome"
  | "appProses"
  | "appProfile"
  | "dash"
  | "dashLogin"
  | "dashCustomer"
  | "dashAnalytics"
  | "dashFinance"
  | "dashTemplates"
  | "dashInvitations"
  | "dashSettings";

export interface RouteMeta {
  id: RouteId;
  /** Path kanonik (tanpa trailing slash, kecuali "/"). */
  path: string;
  /** Path alternatif yang akan di-redirect (client-side) ke `path`. */
  aliases?: string[];
  title: string;
  description: string;
  /** false => `noindex, nofollow` dan tidak masuk sitemap. */
  indexable: boolean;
  changefreq?: "daily" | "weekly" | "monthly" | "yearly";
  priority?: number;
}

export const ROUTES: RouteMeta[] = [
  {
    id: "home",
    path: PATHS.home,
    title:
      "Satu Cerita - Buat Momen Spesial Jadi Lebih Berkesan | Platform Undangan Digital & Event",
    description:
      "Hadirkan undangan yang istimewa dan bagikan momen spesial Anda. Satu Cerita adalah platform SaaS undangan digital dan manajemen perayaan modern dengan RSVP real-time, buku tamu digital, dan integrasi kustom.",
    indexable: true,
    changefreq: "weekly",
    priority: 1.0,
  },
  {
    id: "katalog",
    path: PATHS.katalog,
    title: "Katalog - Satu Cerita",
    description:
      "Jelajahi beragam pilihan template undangan digital terbaik di Satu Cerita.",
    indexable: true,
    changefreq: "weekly",
    priority: 0.9,
  },
  {
    id: "caraPesan",
    path: PATHS.caraPesan,
    aliases: ["/carapesan"],
    title: "Cara Pesan - Satu Cerita",
    description:
      "Panduan 4 langkah mudah membuat dan memesan undangan digital di Satu Cerita.",
    indexable: true,
    changefreq: "monthly",
    priority: 0.8,
  },
  {
    id: "kontak",
    path: PATHS.kontak,
    title: "Kontak - Satu Cerita",
    description:
      "Hubungi tim Satu Cerita untuk konsultasi dan bantuan pemesanan undangan digital.",
    indexable: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    id: "kebijakan",
    path: PATHS.kebijakan,
    title: "Kebijakan Privasi & Syarat Layanan — SatuCerita",
    description:
      "Kebijakan privasi dan syarat layanan SatuCerita: data apa yang kami simpan, cara kami menggunakannya, serta ketentuan pemesanan dan penggunaan undangan digital.",
    indexable: true,
    changefreq: "yearly",
    priority: 0.3,
  },
  {
    id: "login",
    path: PATHS.login,
    title: "Masuk ke Satu Cerita | Platform Undangan Digital",
    description:
      "Masuk untuk membuat dan mengelola undangan digital pernikahan, ulang tahun, dan acara spesial.",
    indexable: false,
  },
  {
    id: "signup",
    path: PATHS.signup,
    title: "Daftar Akun Satu Cerita | Mulai Buat Undangan",
    description:
      "Daftar gratis untuk memilih tema undangan digital favorit Anda di Satu Cerita.",
    indexable: false,
  },
  {
    id: "appHome",
    path: PATHS.appHome,
    aliases: ["/app"],
    title: "Undangan Saya | Satu Cerita",
    description: "Kelola undangan digital Anda di dashboard Satu Cerita.",
    indexable: false,
  },
  {
    id: "appProses",
    path: PATHS.appProses,
    aliases: ["/app/pesanan", "/app/task", "/app/bayar", "/app/pembayaran"],
    title: "Pesanan | Satu Cerita",
    description: "Pantau status pesanan dan pembayaran undangan digital Anda.",
    indexable: false,
  },
  {
    id: "appProfile",
    path: PATHS.appProfile,
    aliases: ["/app/profil"],
    title: "Profil | Satu Cerita",
    description: "Kelola profil akun Satu Cerita Anda.",
    indexable: false,
  },
  {
    id: "dash",
    path: PATHS.dash,
    aliases: ["/admin", "/dash/overview", "/overview"],
    title: "Admin Dashboard | Satu Cerita",
    description: "Portal admin dan ringkasan sistem Satu Cerita.",
    indexable: false,
  },
  {
    id: "dashLogin",
    path: PATHS.dashLogin,
    aliases: ["/admin/login"],
    title: "Login Admin | Satu Cerita",
    description: "Masuk ke portal administrator Satu Cerita.",
    indexable: false,
  },
  {
    id: "dashCustomer",
    path: PATHS.dashCustomer,
    aliases: ["/customer", "/dash/users", "/admin/users", "/admin/customer", "/users"],
    title: "Pengguna & Customer | Admin Satu Cerita",
    description: "Kelola data pengguna terdaftar dan customer di Satu Cerita.",
    indexable: false,
  },
  {
    id: "dashAnalytics",
    path: PATHS.dashAnalytics,
    aliases: ["/analytics", "/admin/analytics"],
    title: "Grafik & Penjualan | Admin Satu Cerita",
    description: "Pantau analitik dan performa penjualan di Satu Cerita.",
    indexable: false,
  },
  {
    id: "dashFinance",
    path: PATHS.dashFinance,
    aliases: ["/finance", "/admin/finance"],
    title: "Keuangan & Transaksi | Admin Satu Cerita",
    description: "Verifikasi pembayaran dan pembukuan transaksi di Satu Cerita.",
    indexable: false,
  },
  {
    id: "dashTemplates",
    path: PATHS.dashTemplates,
    aliases: ["/templates", "/admin/templates"],
    title: "Pantauan Template | Admin Satu Cerita",
    description: "Kelola katalog tema dan paket template undangan di Satu Cerita.",
    indexable: false,
  },
  {
    id: "dashInvitations",
    path: PATHS.dashInvitations,
    aliases: ["/invitations", "/admin/invitations"],
    title: "Undangan Tayang | Admin Satu Cerita",
    description: "Pantau undangan aktif yang sedang online di Satu Cerita.",
    indexable: false,
  },
  {
    id: "dashSettings",
    path: PATHS.dashSettings,
    aliases: ["/settings", "/admin/settings"],
    title: "Pengaturan Platform | Admin Satu Cerita",
    description: "Konfigurasi rekening, gateway pesan, dan sistem Satu Cerita.",
    indexable: false,
  },
];

/** Metadata untuk halaman 404 (juga dipakai untuk membuat dist/404.html). */
export const NOT_FOUND_META = {
  title: "Halaman Tidak Ditemukan | Satu Cerita",
  description: "Halaman yang Anda cari tidak ditemukan di Satu Cerita.",
} as const;

/** Buang query, hash, dan trailing slash. "/katalog/?a=1#x" -> "/katalog" */
export function normalizePath(input: string): string {
  const clean = (input || "/").split("#")[0].split("?")[0] || "/";
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, "") || "/" : "/";
}

/** Cari route berdasarkan path (termasuk alias). `null` jika tidak ada (404). */
export function resolveRoute(input: string): RouteMeta | null {
  const path = normalizePath(input);
  return (
    ROUTES.find((r) => r.path === path || r.aliases?.includes(path)) ?? null
  );
}
