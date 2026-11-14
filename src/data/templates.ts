export interface TemplateItemData {
  id: string;
  slug: string;
  title: string;
  category: "ELYSIAN" | "DELUXE" | "MINIMALIS" | "PREMIUM" | "TRADISIONAL" | "ROMANTIS";
  originalPrice: number;
  discountPrice: number;
  badge: string;
  discountBadge: string;
  frameBg: string;
  image: string;
  coupleName: string;
  date: string;
  tagline: string;
  description: string;
  availableSections: string[];
  languages: string[];
  demoType: "pawiwahan" | "modern" | "luxury" | "rustic";
}

export const TEMPLATES_DATA: TemplateItemData[] = [
  {
    id: "antheia",
    slug: "antheia",
    title: "Antheia",
    category: "ELYSIAN",
    originalPrice: 199000,
    discountPrice: 99000,
    badge: "UNGGULAN",
    discountBadge: "Hemat 50%",
    frameBg: "#F5C744",
    image: "/covers/antheia.webp",
    coupleName: "John & Jane",
    date: "18 . 09 . 2027",
    tagline: "Undangan pawiwahan agung bernuansa biru dongker dan emas.",
    description:
      "Undangan pawiwahan bernuansa biru dongker dan emas: gerbang pintu yang berayun terbuka, penjor janur yang membingkai foto, bingkai lengkung & oval bermutiara, kartu cerita bertumpuk, serta taman bunga biru di atas lukisan ukiran pemandangan.",
    availableSections: [
      "Sampul",
      "Halaman utama",
      "Salam pembuka",
      "Profil mempelai",
      "Kisah cinta",
      "Hitung mundur",
      "Detail acara",
      "Dress code",
      "Live streaming",
      "Galeri foto",
      "Kutipan",
      "RSVP & ucapan",
      "Amplop digital",
      "Penutup",
      "Musik latar",
    ],
    languages: ["Indonesia", "Inggris"],
    demoType: "pawiwahan",
  },
  {
    id: "aglaia",
    slug: "aglaia",
    title: "Aglaia",
    category: "ELYSIAN",
    originalPrice: 199000,
    discountPrice: 99000,
    badge: "BARU",
    discountBadge: "Hemat 50%",
    frameBg: "#9CC9E4",
    image: "/covers/aglaia.webp",
    coupleName: "John & Jane",
    date: "20 . 12 . 2026",
    tagline: "Pelayaran tenang di danau berukir, dibuka dengan amplop bersegel lilin.",
    description:
      "Danau berukir yang teduh, perahu layar yang berlayar perlahan, dan bunga biru langit. Dibuka dengan amplop bersegel lilin, dengan kisah perjalanan yang berlabuh di setiap babak.",
    availableSections: [
      "Sampul",
      "Halaman utama",
      "Salam pembuka",
      "Profil mempelai",
      "Kisah cinta",
      "Hitung mundur",
      "Detail acara",
      "Dress code",
      "Live streaming",
      "Galeri foto",
      "Kutipan",
      "RSVP & ucapan",
      "Amplop digital",
      "Penutup",
      "Musik latar",
    ],
    languages: ["Indonesia", "Inggris"],
    demoType: "modern",
  },
  {
    id: "thaleia",
    slug: "thaleia",
    title: "Thaleia",
    category: "ELYSIAN",
    originalPrice: 199000,
    discountPrice: 99000,
    badge: "EKSKLUSIF",
    discountBadge: "Hemat 50%",
    frameBg: "#9AAB8C",
    image: "/covers/thaleia.webp",
    coupleName: "John & Jane",
    date: "20 . 11 . 2027",
    tagline: "Untaian melati putih dan hijau sage di atas lukisan rumah joglo.",
    description:
      "Undangan bernuansa untaian melati putih dan hijau sage di atas lukisan gravir rumah joglo: amplop bersegel yang terbuka, bingkai heksagon dan bergelombang, garis waktu berperangko, tiket acara bersobek, palet busana di tali jemuran, serta tumpukan foto polaroid.",
    availableSections: [
      "Sampul",
      "Halaman utama",
      "Salam pembuka",
      "Profil mempelai",
      "Kisah cinta",
      "Hitung mundur",
      "Detail acara",
      "Dress code",
      "Live streaming",
      "Galeri foto",
      "Kutipan",
      "RSVP & ucapan",
      "Amplop digital",
      "Penutup",
      "Musik latar",
    ],
    languages: ["Indonesia", "Inggris"],
    demoType: "rustic",
  },
];

export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^katalog\//, "");
}

export function getTemplateBySlug(slug: string): TemplateItemData | undefined {
  const normalized = normalizeSlug(slug);
  return TEMPLATES_DATA.find(
    (t) =>
      t.slug.toLowerCase() === normalized ||
      t.id.toLowerCase() === normalized ||
      t.title.toLowerCase() === normalized
  );
}

export function formatRupiah(val: number): string {
  return "Rp " + val.toLocaleString("id-ID");
}
