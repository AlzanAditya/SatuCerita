/**
 * Konfigurasi situs (single source of truth).
 *
 * File ini dipakai oleh DUA konsumen:
 *  1. Aplikasi React (browser, lewat Vite)      -> useSeo, dll.
 *  2. Script SSG `scripts/generate-ssg.ts` (Node, lewat tsx)
 *
 * Karena itu: jangan import React / API browser di sini.
 */

// Domain produksi. Bisa dioverride lewat env `VITE_SITE_URL` saat build
// (misal untuk staging), tanpa trailing slash.
const envUrl: string | undefined =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL) ||
  (typeof process !== "undefined" ? process.env?.VITE_SITE_URL : undefined) ||
  undefined;

export const SITE = {
  name: "Satu Cerita",
  url: (envUrl || "https://satucerita.zanxa.studio").replace(/\/+$/, ""),
  lang: "id",
  locale: "id_ID",
  themeColor: "#7d6aee",
  backgroundColor: "#ffffff",
  tagline: "Buat Momen Spesial Jadi Lebih Berkesan",
  /** Gambar default untuk Open Graph / Twitter Card (path relatif dari /public). */
  ogImage: {
    path: "/logos/satucerita.png",
    width: 512,
    height: 512,
    alt: "Logo Satu Cerita",
  },
  contact: {
    whatsapp: "6285187978443",
    email: "satuceritadotid@gmail.com",
    instagram: "https://instagram.com/satuceritaid",
    tiktok: "https://www.tiktok.com/@satuceritaid",
  },
} as const;
