import type { Language } from "@/context/LanguageContext";
import type { TemplateItemData } from "@/data/templates";

/**
 * Teks template (katalog) dalam Bahasa Inggris.
 * Nama template, kategori (ELYSIAN, dst.) dan nama pasangan tidak diterjemahkan
 * karena merupakan nama/brand. Data asli (Indonesia) di `src/data/templates.ts`
 * tidak diubah supaya SSG, worker, dan dash tetap konsisten.
 */
const BADGE_EN: Record<string, string> = {
  UNGGULAN: "FEATURED",
  BARU: "NEW",
  EKSKLUSIF: "EXCLUSIVE",
};

const DISCOUNT_EN: Record<string, string> = {
  "Hemat 50%": "Save 50%",
};

const SECTION_EN: Record<string, string> = {
  Sampul: "Cover",
  "Halaman utama": "Main page",
  "Salam pembuka": "Opening greeting",
  "Profil mempelai": "Couple profiles",
  "Kisah cinta": "Love story",
  "Hitung mundur": "Countdown",
  "Detail acara": "Event details",
  "Dress code": "Dress code",
  "Live streaming": "Live streaming",
  "Galeri foto": "Photo gallery",
  Kutipan: "Quote",
  "RSVP & ucapan": "RSVP & wishes",
  "Amplop digital": "Digital envelope",
  Penutup: "Closing",
  "Musik latar": "Background music",
};

const LANGUAGE_EN: Record<string, string> = {
  Indonesia: "Indonesian",
  Inggris: "English",
};

const COPY_EN: Record<string, { tagline: string; description: string }> = {
  antheia: {
    tagline: "A grand Balinese wedding invitation in navy blue and gold.",
    description:
      "A Balinese wedding invitation in navy blue and gold: a gate that swings open, penjor (woven palm-leaf) ornaments framing the photo, pearl-trimmed arch and oval frames, stacked story cards, and a blue flower garden over an engraved landscape painting.",
  },
  aglaia: {
    tagline: "A calm voyage across an engraved lake, opened with a wax-sealed envelope.",
    description:
      "A tranquil engraved lake, a sailboat gliding slowly, and sky-blue flowers. Opened with a wax-sealed envelope, with a story of a journey that docks at every chapter.",
  },
  thaleia: {
    tagline: "Strands of white jasmine and sage green over a painting of a joglo house.",
    description:
      "An invitation themed with strands of white jasmine and sage green over an engraved painting of a joglo house: a wax-sealed envelope that opens, hexagon and wavy frames, a postage-stamped timeline, a torn event ticket, a dress palette hung on a clothesline, and a stack of polaroid photos.",
  },
};

export type LocalizedTemplate = TemplateItemData & {
  /** Label section yang ditampilkan (urutan sama dengan availableSections). */
  sectionLabels: string[];
  /** Label bahasa undangan yang ditampilkan. */
  languageLabels: string[];
};

/** Kembalikan salinan template dengan teks sesuai bahasa aktif. */
export function localizeTemplate(item: TemplateItemData, lang: Language): LocalizedTemplate {
  if (lang === "id") {
    return { ...item, sectionLabels: item.availableSections, languageLabels: item.languages };
  }
  const copy = COPY_EN[item.slug];
  return {
    ...item,
    badge: BADGE_EN[item.badge] ?? item.badge,
    discountBadge: DISCOUNT_EN[item.discountBadge] ?? item.discountBadge,
    tagline: copy?.tagline ?? item.tagline,
    description: copy?.description ?? item.description,
    sectionLabels: item.availableSections.map((s) => SECTION_EN[s] ?? s),
    languageLabels: item.languages.map((l) => LANGUAGE_EN[l] ?? l),
  };
}
