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
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80",
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
    id: "hypatia",
    slug: "hypatia",
    title: "Hypatia",
    category: "ELYSIAN",
    originalPrice: 199000,
    discountPrice: 99000,
    badge: "UNGGULAN",
    discountBadge: "Hemat 50%",
    frameBg: "#EE5B4F",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=700&q=80",
    coupleName: "John & Jane",
    date: "12 . 06 . 2027",
    tagline: "Kehangatan floral terracotta bernuansa hangat dan elegan.",
    description:
      "Undangan pernikahan bertema botanical modern dengan dedaunan tropis lembut, tipografi serif artistik, galeri foto grid asimetris, dan ornamen floral bernuansa warm terracotta.",
    availableSections: [
      "Sampul",
      "Halaman utama",
      "Salam pembuka",
      "Profil mempelai",
      "Kisah cinta",
      "Hitung mundur",
      "Detail acara",
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
    id: "serenade",
    slug: "serenade",
    title: "Serenade",
    category: "MINIMALIS",
    originalPrice: 189000,
    discountPrice: 89000,
    badge: "POPULER",
    discountBadge: "Hemat 53%",
    frameBg: "#7D6AEE",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=80",
    coupleName: "Fajar & Dina",
    date: "25 . 10 . 2027",
    tagline: "Kemurnian estetika minimalis modern bernuansa lilac & lavender.",
    description:
      "Tema minimalis kontemporer bernuansa lilac ungu dan lavender. Memadukan estetika bersih, tipografi sans modern, pemutar musik melayang, dan animasi transisi kartu halus untuk pasangan urban.",
    availableSections: [
      "Sampul",
      "Halaman utama",
      "Salam pembuka",
      "Profil mempelai",
      "Kisah cinta",
      "Hitung mundur",
      "Detail acara",
      "Galeri foto",
      "RSVP & ucapan",
      "Amplop digital",
      "Penutup",
      "Musik latar",
    ],
    languages: ["Indonesia", "Inggris"],
    demoType: "modern",
  },
  {
    id: "royal-emerald",
    slug: "royal-emerald",
    title: "Royal Emerald",
    category: "PREMIUM",
    originalPrice: 249000,
    discountPrice: 129000,
    badge: "PREMIUM",
    discountBadge: "Hemat 48%",
    frameBg: "#38BDF8",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80",
    coupleName: "Rizky & Amanda",
    date: "08 . 11 . 2027",
    tagline: "Kemewahan royal emerald berpadu dengan aksen foil emas.",
    description:
      "Kemewahan warna hijau zamrud berpadu dengan foil emas berkilau. Desain mewah dengan kartu undangan bertingkat, monogram eksklusif, countdown megah, dan rute navigasi lokasi interaktif.",
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
    demoType: "luxury",
  },
  {
    id: "golden-classic",
    slug: "golden-classic",
    title: "Golden Classic",
    category: "TRADISIONAL",
    originalPrice: 179000,
    discountPrice: 79000,
    badge: "KLASIK",
    discountBadge: "Hemat 55%",
    frameBg: "#22C55E",
    image: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=700&q=80",
    coupleName: "Dimas & Sarah",
    date: "14 . 12 . 2027",
    tagline: "Sentuhan adat nusantara yang khidmat dengan ukiran keemasan.",
    description:
      "Sentuhan adat nusantara yang anggun dengan ornamen ukiran tradisional keemasan, sulaman motif khas batik, dan nuansa khidmat penuh doa restu untuk perayaan sakral keluarga.",
    availableSections: [
      "Sampul",
      "Halaman utama",
      "Salam pembuka",
      "Profil mempelai",
      "Hitung mundur",
      "Detail acara",
      "Dress code",
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
    id: "sweet-lavender",
    slug: "sweet-lavender",
    title: "Sweet Lavender",
    category: "ROMANTIS",
    originalPrice: 219000,
    discountPrice: 109000,
    badge: "FAVORIT",
    discountBadge: "Hemat 50%",
    frameBg: "#F472B6",
    image: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=700&q=80",
    coupleName: "Aditya & Tiara",
    date: "20 . 01 . 2028",
    tagline: "Kisah cinta manis bernuansa pastel floral dan kelopak mekar.",
    description:
      "Nuansa romantis pastel dengan kelopak bunga mekar, font kaligrafi anggun, timeline kisah cinta bertanggal, filter galeri aesthetic, serta amplop hadiah digital instan.",
    availableSections: [
      "Sampul",
      "Halaman utama",
      "Salam pembuka",
      "Profil mempelai",
      "Kisah cinta",
      "Hitung mundur",
      "Detail acara",
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
    frameBg: "#F59E0B",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=700&q=80",
    coupleName: "Arya & Kirana",
    date: "10 . 10 . 2027",
    tagline: "Kehangatan rustic modern dengan aksen pampas dan nuansa senja.",
    description:
      "Undangan pernikahan bernuansa rustic modern dan kehangatan senja, dengan bingkai geometris minimalis, aksen daun pampas kering lembut, dan tipografi kontemporer bernilai seni tinggi.",
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
