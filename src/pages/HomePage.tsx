import React, { useState } from "react";
import { PATHS } from "@/routes";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import {
  ArrowRight,
  FileEdit,
  ImagePlus,
  Users,
  QrCode,
  LayoutGrid,
  CreditCard,
  SlidersHorizontal,
  Send,
  Eye,
  Plus,
  X,
  MessageCircle,
  Smartphone,
  ExternalLink,
} from "lucide-react";

interface HomePageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

interface TemplateItem {
  id: string;
  title: string;
  category: "ELYSIAN" | "DELUXE";
  originalPrice: number;
  discountPrice: number;
  badge?: string;
  discountBadge?: string;
  frameBg: string;
  image: string;
  coupleName: string;
  date: string;
}

const HOME_TEMPLATES: TemplateItem[] = [
  {
    id: "antheia",
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
  },
  {
    id: "hypatia",
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
  },
  {
    id: "serenade",
    title: "Serenade",
    category: "DELUXE",
    originalPrice: 189000,
    discountPrice: 89000,
    badge: "POPULER",
    discountBadge: "Hemat 53%",
    frameBg: "#7D6AEE",
    image: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=700&q=80",
    coupleName: "Fajar & Dina",
    date: "25 . 10 . 2027",
  },
  {
    id: "royal-emerald",
    title: "Royal Emerald",
    category: "DELUXE",
    originalPrice: 249000,
    discountPrice: 129000,
    badge: "PREMIUM",
    discountBadge: "Hemat 48%",
    frameBg: "#38BDF8",
    image: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=700&q=80",
    coupleName: "Rizky & Amanda",
    date: "08 . 11 . 2027",
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    question: "Apa itu undangan pernikahan digital?",
    answer:
      "Undangan pernikahan digital adalah website undangan interaktif yang dapat diakses melalui tautan khusus di ponsel maupun laptop. Dilengkapi dengan navigasi peta, hitung mundur, pemutar musik, galeri foto, RSVP, dan fitur kirim nama tamu otomatis.",
  },
  {
    question: "Bagaimana cara membuat undangan digital di Satu Cerita?",
    answer:
      "Pilih template di katalog, selesaikan pembayaran, lalu isi data mempelai, acara, foto, dan musik di dashboard. Setelah diterbitkan, undangan langsung bisa dibagikan ke tamu lewat WhatsApp.",
  },
  {
    question: "Berapa harga undangan digital?",
    answer:
      "Mulai dari Rp 10.000 sekali bayar per undangan. Tidak ada biaya langganan berulang, dan undangan dapat diakses tanpa batas waktu untuk para tamu.",
  },
  {
    question: "Apakah foto dan musik bisa disesuaikan sendiri?",
    answer:
      "Tentu saja! Anda bebas mengunggah foto galeri tanpa batas, memilih musik latar favorit, serta menambahkan cerita cinta dan nomor rekening hadiah digital.",
  },
  {
    question: "Berapa lama proses pembuatan undangan?",
    answer:
      "Setelah pembayaran terkonfirmasi, Anda bisa langsung mengisi form di dashboard dan undangan selesai dalam hitungan menit.",
  },
];

const formatRupiah = (val: number) => {
  return "Rp " + val.toLocaleString("id-ID");
};

export const HomePage: React.FC<HomePageProps> = ({
  currentPath = "/",
  onNavigate = (_path: string) => {},
}) => {
  const [activeCategory, setActiveCategory] = useState<"ALL" | "ELYSIAN" | "DELUXE">("ALL");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(1); // Default open item #2 as in screenshot
  const [selectedDemo, setSelectedDemo] = useState<TemplateItem | null>(null);

  const katalogPath = PATHS.katalog;
  const caraPesanPath = PATHS.caraPesan;
  const appPath = PATHS.appHome;

  const handleOrderTemplate = (templateTitle: string) => {
    const waText = encodeURIComponent(
      `Halo Satu Cerita, saya tertarik untuk memesan template undangan: "${templateTitle}". Boleh info detail pemesanannya?`
    );
    window.open(`https://wa.me/6285187978443?text=${waText}`, "_blank");
  };

  const filteredTemplates =
    activeCategory === "ALL"
      ? HOME_TEMPLATES
      : HOME_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
      {/* 1. Navbar Satu Cerita */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      <main className="flex-1 flex flex-col select-none">
        {/* ========================================================= */}
        {/* SECTION 1: HERO & PHONE SHOWCASE                         */}
        {/* Di desktop: Header dan Template Cards berada dalam SATU BARIS */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee]/[0.06] border-b border-[#7d6aee]/15 px-4 sm:px-6 md:px-8 lg:px-12 py-10 sm:py-14 lg:py-16 select-none transition-colors">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* SISI KIRI (DESKTOP): Header & CTA Buttons */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Judul Hero */}
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-neutral-900 leading-[1.12] mb-3 sm:mb-4 text-left">
                Momen Berharga Dimulai dari{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7d6aee] via-[#9484f4] to-[#ad9fff]">
                  Satu Cerita
                </span>
              </h1>

              {/* Deskripsi Hero (Diperbesar 2px menjadi 20px pada desktop) */}
              <p className="text-base sm:text-lg lg:text-[20px] lg:leading-relaxed text-neutral-600 max-w-xl font-normal leading-relaxed text-left mb-6">
                Platform pembuatan undangan pernikahan digital yang modern, elegan, dan interaktif. Buat momen spesial Anda berkesan dan bagikan dengan mudah kepada seluruh tamu.
              </p>

              {/* Tombol CTA */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => onNavigate(katalogPath)}
                  className="inline-flex items-center gap-2 bg-[#7d6aee] hover:bg-[#6c59dc] text-white font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer text-sm sm:text-base active:scale-95"
                >
                  <span>Lihat Katalog</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate(appPath)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-neutral-50 text-neutral-900 border border-purple-200 border-b-[3px] border-b-purple-300 font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-2xs hover:shadow-xs transition-all duration-200 cursor-pointer text-sm sm:text-base active:scale-95"
                >
                  <span>Buat Gratis</span>
                </button>
              </div>
            </div>

            {/* SISI KANAN (DESKTOP): Komponen Card Template Mockup (Lebih pendek & menyebar) */}
            <div className="lg:col-span-5 flex items-center justify-center w-full py-4">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[340px] aspect-[4/3.2] flex items-center justify-center">
                {/* Left Tilted Phone (Menjauh ke kiri) */}
                <div className="absolute -left-8 sm:-left-12 top-2 w-[58%] aspect-[9/12] bg-white rounded-2xl sm:rounded-3xl border border-purple-100 p-1.5 shadow-[0_8px_24px_rgba(125,106,238,0.12)] -rotate-12 transform origin-bottom-left transition-transform hover:-rotate-14">
                  <div className="w-full h-full rounded-xl overflow-hidden relative bg-neutral-900">
                    <img
                      src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
                      alt="Wedding Preview 1"
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white text-center">
                      <p className="text-[8px] uppercase tracking-wider opacity-80">Pawiwahan</p>
                      <p className="text-[10px] font-serif font-bold">John & Jane</p>
                    </div>
                  </div>

                  {/* Red Badge across bottom left */}
                  <div className="absolute -bottom-2 -left-2 z-30 bg-[#EE5B4F] text-white rounded-lg px-2 py-0.5 font-bold text-[9px] shadow-sm -rotate-3 select-none">
                    Live dalam menit
                  </div>
                </div>

                {/* Right Tilted Phone (Menjauh ke kanan) */}
                <div className="absolute -right-8 sm:-right-12 top-0 w-[58%] aspect-[9/12] bg-white rounded-2xl sm:rounded-3xl border border-purple-100 p-1.5 shadow-[0_8px_24px_rgba(125,106,238,0.12)] rotate-12 transform origin-bottom-right transition-transform hover:rotate-14">
                  <div className="w-full h-full rounded-xl overflow-hidden relative bg-neutral-900">
                    <img
                      src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80"
                      alt="Wedding Preview 2"
                      className="w-full h-full object-cover opacity-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-2 text-white text-center">
                      <p className="text-[8px] uppercase tracking-wider opacity-80">Undangan</p>
                      <p className="text-[10px] font-serif font-bold">John & Jane</p>
                      <div className="mt-1 w-full py-0.5 bg-[#7D6AEE] rounded-md text-[8px] font-bold text-white shadow-2xs">
                        Buka
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Front Phone Mockup (Lebih pendek) */}
                <div className="relative z-20 w-[62%] aspect-[9/12] bg-white rounded-2xl sm:rounded-3xl border border-purple-100 p-2 shadow-[0_16px_36px_rgba(125,106,238,0.16)] flex flex-col">
                  {/* Notch */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-8 h-2 bg-neutral-900 rounded-full z-30" />

                  {/* Inner Screen */}
                  <div className="w-full h-full rounded-xl overflow-hidden relative bg-neutral-100 flex flex-col justify-between">
                    <img
                      src="https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80"
                      alt="Wedding Preview Main"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="relative z-10 p-1.5 pt-3 text-center">
                      <p className="text-[7px] uppercase tracking-widest text-neutral-800 font-semibold bg-white/70 backdrop-blur-xs inline-block px-1.5 py-0.5 rounded-full border border-purple-100">
                        The Wedding Of
                      </p>
                    </div>
                    <div className="relative z-10 p-2 bg-gradient-to-t from-black/90 via-black/40 to-transparent text-white text-center">
                      <p className="text-[10px] font-serif font-bold leading-tight">John & Jane</p>
                      <p className="text-[7px] opacity-75 mt-0.5">{`15 . 05 . 2027`}</p>
                      <p className="text-[7px] opacity-70 mt-0.5">Kepada Yth. Tamu Undangan</p>
                    </div>
                  </div>

                  {/* Bottom Label inside frame */}
                  <div className="mt-1 py-0.5 px-2 bg-purple-50/60 border border-purple-100 rounded-lg text-center text-[9px] font-bold text-[#7D6AEE]">
                    Olympia
                  </div>

                  {/* Top-right Pill Badge: satucerita.id/nama-kalian */}
                  <div className="absolute -top-2.5 -right-3 z-40 bg-[#7D6AEE] text-white rounded-lg px-2.5 py-1 font-bold text-[9px] shadow-[0_2px_8px_rgba(125,106,238,0.3)] rotate-3 select-none">
                    satucerita.id/nama-kalian
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: KENAPA SATUCERITA (UNGU PUDAR LANDING PAGE)    */}
        {/* ========================================================= */}
        <section className="w-full bg-[#faf9ff] py-14 sm:py-20 px-4 sm:px-6 text-left border-t border-purple-100/60">
          <div className="max-w-4xl mx-auto w-full text-left">
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 text-[#7d6aee] border border-purple-200 text-xs font-bold tracking-wide uppercase shadow-2xs">
                KENAPA SATUCERITA
              </span>
            </div>

            {/* Section Title & Desc */}
            <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-snug mb-3">
              Semua yang kalian butuhkan, tanpa ribet.
            </h2>
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl font-normal">
              Fitur undangan digital lengkap untuk pasangan yang ingin undangan nikah online tampil memukau sekaligus mudah dikelola dari satu dashboard.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl border border-purple-100 bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs mb-4">
                    <FileEdit className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 mb-2">
                    Edit setiap section sendiri
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    Ubah teks, urutan, dan isi setiap bagian — dari pembuka, profil mempelai, kisah cinta, hingga penutup.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl border border-purple-100 bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs mb-4">
                    <ImagePlus className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 mb-2">
                    Drag & drop foto & musik
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    Unggah foto galeri tanpa kompresi manual dan pilih musik latar favorit. Cukup drag & drop langsung tersimpan.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl border border-purple-100 bg-purple-50 text-[#7D6AEE] flex items-center justify-center shadow-2xs mb-4">
                    <Users className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 mb-2">
                    Daftar tamu & RSVP otomatis
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    Kirim nama tamu khusus satu per satu lewat WhatsApp. Tamu dapat konfirmasi kehadiran dan mengirim ucapan doa secara instan.
                  </p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl border border-purple-100 bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs mb-4">
                    <QrCode className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-neutral-900 mb-2">
                    QR check-in & kado digital
                  </h3>
                  <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
                    Permudah absensi resepsi dengan scan QR code di meja penerima tamu serta integrasi rekening bank & e-Wallet untuk amplop digital.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: TEMPLATE PILIHAN (UNGU AKSEN & TEKS PUTIH)     */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee] py-14 sm:py-20 px-4 sm:px-6 text-white text-left">
          <div className="max-w-4xl mx-auto w-full text-left">
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold tracking-wide uppercase shadow-2xs">
                TEMPLATE PILIHAN
              </span>
            </div>

            {/* Section Title & Desc */}
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug mb-3">
              Template undangan digital yang siap bercerita.
            </h2>
            <p className="text-purple-100 text-sm sm:text-base leading-relaxed mb-6 max-w-2xl font-normal">
              Pratinjau setiap contoh undangan pernikahan digital langsung di ponsel sebelum kalian memilih.
            </p>

            {/* Button: Lihat semua template */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => onNavigate(katalogPath)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-white/40 font-bold text-sm text-[#7d6aee] bg-white hover:bg-purple-50 shadow-sm transition-all cursor-pointer"
              >
                <span>Lihat semua template</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 mb-8 [scrollbar-width:none]">
              <button
                type="button"
                onClick={() => setActiveCategory("ALL")}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs transition-all cursor-pointer ${
                  activeCategory === "ALL"
                    ? "bg-white text-[#7d6aee] border-white shadow-xs"
                    : "bg-white/15 text-white border-white/25 hover:bg-white/25 shadow-2xs"
                }`}
              >
                <span>Semua</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === "ALL" ? "bg-purple-100 text-[#7d6aee]" : "bg-white/20 text-white"}`}>14</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("ELYSIAN")}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs transition-all cursor-pointer ${
                  activeCategory === "ELYSIAN"
                    ? "bg-white text-[#7d6aee] border-white shadow-xs"
                    : "bg-white/15 text-white border-white/25 hover:bg-white/25 shadow-2xs"
                }`}
              >
                <span>Elysian</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === "ELYSIAN" ? "bg-purple-100 text-[#7d6aee]" : "bg-white/20 text-white"}`}>6</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory("DELUXE")}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs transition-all cursor-pointer ${
                  activeCategory === "DELUXE"
                    ? "bg-white text-[#7d6aee] border-white shadow-xs"
                    : "bg-white/15 text-white border-white/25 hover:bg-white/25 shadow-2xs"
                }`}
              >
                <span>Deluxe</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === "DELUXE" ? "bg-purple-100 text-[#7d6aee]" : "bg-white/20 text-white"}`}>8</span>
              </button>
            </div>

            {/* Cards Carousel on Mobile, Grid on Tablet/Desktop */}
            <div className="relative -mx-4 sm:mx-0 px-4 sm:px-0">
              <div
                className="flex sm:grid sm:grid-cols-2 gap-5 sm:gap-6 overflow-x-auto sm:overflow-visible pb-6 sm:pb-0 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {filteredTemplates.map((item) => (
                  <div
                    key={item.id}
                    className="snap-start shrink-0 w-[74vw] max-w-[275px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-200 border-b-[3px] border-b-purple-300 p-3.5 sm:p-4 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between text-left group"
                  >
                    <div>
                      {/* Top Frame dengan Smartphone Mockup */}
                      <div
                        className="relative w-full rounded-xl sm:rounded-2xl border border-purple-100/80 p-2.5 sm:p-3 mb-3 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: item.frameBg }}
                      >
                        {/* Smartphone Mockup (Ukuran lebih ramping & pendek) */}
                        <div className="relative w-[78%] max-w-[165px] aspect-[9/13] bg-neutral-950 rounded-[22px] p-1.5 shadow-xl border border-neutral-800 overflow-hidden flex flex-col my-0.5">
                          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-10 h-2.5 bg-neutral-900 rounded-full z-20 border border-neutral-800" />
                          <div className="w-full h-full rounded-[16px] overflow-hidden relative bg-neutral-100 flex flex-col justify-end">
                            <img
                              src={item.image}
                              alt={item.title}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="relative z-10 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white text-center">
                              <p className="text-[8px] uppercase tracking-widest font-serif opacity-80">Pawiwahan</p>
                              <p className="text-[11px] font-serif font-bold tracking-wide leading-tight">{item.coupleName}</p>
                              <p className="text-[7px] opacity-75 mt-0.5">{item.date}</p>
                              <div className="mt-1 inline-block px-1.5 py-0.5 bg-white/20 backdrop-blur-xs rounded-full text-[7px] font-semibold">
                                Buka Undangan
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Judul & Kategori */}
                      <div className="flex items-center justify-between gap-2 mt-1.5">
                        <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                          {item.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg border border-purple-200 font-bold text-[11px] uppercase tracking-wider bg-purple-50 text-[#7d6aee]">
                          {item.category}
                        </span>
                      </div>

                      {/* Harga */}
                      <div className="mt-2 mb-4">
                        <div className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight leading-none">
                          {formatRupiah(item.discountPrice)}
                        </div>
                        <div className="text-xs font-extrabold text-[#EE5B4F] line-through decoration-[#EE5B4F] decoration-2 mt-1">
                          {formatRupiah(item.originalPrice)}
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedDemo(item)}
                        className="w-full py-2 px-3.5 rounded-xl border border-purple-200 font-bold text-xs sm:text-sm text-neutral-800 bg-white hover:bg-neutral-50 shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4 stroke-[2.2]" />
                        <span>Lihat Demo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOrderTemplate(item.title)}
                        className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white bg-[#7d6aee] hover:bg-[#6b58e0] shadow-[0_2px_8px_rgba(125,106,238,0.25)] hover:shadow-[0_4px_12px_rgba(125,106,238,0.35)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Pilih Template</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: CARA PESAN (UNGU PUDAR LANDING PAGE)           */}
        {/* ========================================================= */}
        <section className="w-full bg-[#faf9ff] py-14 sm:py-20 px-4 sm:px-6 text-left border-y border-purple-100/60">
          <div className="max-w-4xl mx-auto w-full text-left">
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 text-[#7d6aee] border border-purple-200 text-xs font-bold tracking-wide uppercase shadow-2xs">
                CARA PESAN
              </span>
            </div>

            {/* Section Title */}
            <h2 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-snug mb-3">
              Cara membuat undangan digital dalam empat langkah.
            </h2>

            {/* Button: Lihat detail cara pesan (font diperbesar 2px menjadi text-[16px]) */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => onNavigate(caraPesanPath)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-purple-200 font-bold text-[16px] text-neutral-800 bg-white hover:bg-neutral-50 shadow-2xs transition-all cursor-pointer"
              >
                <span>Lihat detail cara pesan</span>
                <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* 4 Steps Showcase */}
            <div className="flex flex-col gap-6">
              {/* Step 1 */}
              <div className="flex flex-col items-start w-full">
                <div className="w-12 h-12 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 bg-white text-[#7d6aee] flex items-center justify-center font-black text-xl shadow-2xs mb-3">
                  1
                </div>
                <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-5 sm:p-6 shadow-2xs hover:border-purple-200 transition-all text-left">
                  {/* Judul card satu baris dengan icon */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                      Pilih template
                    </h3>
                    <LayoutGrid className="w-6 h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[16px] sm:text-[18px] text-neutral-600 leading-relaxed font-normal">
                    Jelajahi katalog dan pratinjau setiap template secara langsung.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-start w-full">
                <div className="w-12 h-12 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 bg-white text-[#7d6aee] flex items-center justify-center font-black text-xl shadow-2xs mb-3">
                  2
                </div>
                <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-5 sm:p-6 shadow-2xs hover:border-purple-200 transition-all text-left">
                  {/* Judul card satu baris dengan icon */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                      Bayar
                    </h3>
                    <CreditCard className="w-6 h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[16px] sm:text-[18px] text-neutral-600 leading-relaxed font-normal">
                    Masuk dengan akun Google dan selesaikan pembayaran dengan metode favorit.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-start w-full">
                <div className="w-12 h-12 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 bg-white text-[#7d6aee] flex items-center justify-center font-black text-xl shadow-2xs mb-3">
                  3
                </div>
                <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-5 sm:p-6 shadow-2xs hover:border-purple-200 transition-all text-left">
                  {/* Judul card satu baris dengan icon */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                      Edit di dashboard
                    </h3>
                    <SlidersHorizontal className="w-6 h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[16px] sm:text-[18px] text-neutral-600 leading-relaxed font-normal">
                    Isi data mempelai, acara, foto, musik, dan daftar tamu sesuka hati.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-start w-full">
                <div className="w-12 h-12 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 bg-white text-[#7d6aee] flex items-center justify-center font-black text-xl shadow-2xs mb-3">
                  4
                </div>
                <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-5 sm:p-6 shadow-2xs hover:border-purple-200 transition-all text-left">
                  {/* Judul card satu baris dengan icon */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                      Bagikan
                    </h3>
                    <Send className="w-6 h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[16px] sm:text-[18px] text-neutral-600 leading-relaxed font-normal">
                    Kirim undangan personal ke setiap tamu lewat WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: FAQ ACCORDION (UNGU & TEKS PUTIH)               */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee] py-14 sm:py-20 px-4 sm:px-6 text-white text-left">
          <div className="max-w-4xl mx-auto w-full text-left">
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold tracking-wide uppercase shadow-2xs">
                FAQ
              </span>
            </div>

            {/* Section Title */}
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug mb-8">
              Pertanyaan seputar undangan digital.
            </h2>

            {/* Accordion List */}
            <div className="flex flex-col gap-4">
              {FAQ_LIST.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div key={index} className="w-full text-left">
                    {isOpen ? (
                      /* Open State Card: Purple Header + White Body */
                      <div className="rounded-2xl border border-purple-200 border-b-[3px] border-b-purple-300 bg-white shadow-2xs overflow-hidden transition-all">
                        <button
                          type="button"
                          onClick={() => setOpenFaqIndex(null)}
                          className="w-full bg-purple-50/80 p-4 sm:p-5 flex items-center justify-between gap-4 border-b border-purple-100 cursor-pointer text-left"
                        >
                          <span className="font-bold text-base sm:text-lg text-neutral-900 leading-snug">
                            {faq.question}
                          </span>
                          <div className="w-8 h-8 rounded-full border border-purple-200 bg-white text-[#7d6aee] flex items-center justify-center shrink-0">
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </div>
                        </button>
                        <div className="bg-white p-5 text-sm sm:text-base text-neutral-700 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    ) : (
                      /* Closed State Card: White with Plus Icon */
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(index)}
                        className="w-full bg-white rounded-2xl border border-purple-200 border-b-[3px] border-b-purple-300 p-4 sm:p-5 flex items-center justify-between gap-4 shadow-2xs hover:border-purple-300 transition-all cursor-pointer text-left"
                      >
                        <span className="font-bold text-base sm:text-lg text-neutral-900 leading-snug">
                          {faq.question}
                        </span>
                        <div className="w-8 h-8 rounded-full border border-purple-100 bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Modal Demo Preview Interaktif */}
      {selectedDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#7d6aee]" />
                <h4 className="text-lg font-black text-neutral-900">
                  Demo: {selectedDemo.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDemo(null)}
                className="w-8 h-8 rounded-xl bg-purple-50 text-[#7d6aee] border border-purple-200 flex items-center justify-center font-bold hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="relative rounded-2xl border border-purple-100/80 p-4 mb-4 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: selectedDemo.frameBg }}
            >
              <div className="relative w-[75%] max-w-[200px] aspect-[9/16] bg-neutral-950 rounded-[26px] p-2 border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-neutral-900 rounded-full z-20" />
                <div className="w-full h-full rounded-[18px] overflow-hidden relative">
                  <img
                    src={selectedDemo.image}
                    alt={selectedDemo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3 text-white text-center">
                    <p className="text-[10px] uppercase font-serif opacity-80">Pawiwahan</p>
                    <p className="text-sm font-serif font-bold">{selectedDemo.coupleName}</p>
                    <p className="text-[9px] opacity-75 mt-0.5">{selectedDemo.date}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase">Harga Promo</span>
                <p className="text-xl font-black text-neutral-900">
                  {formatRupiah(selectedDemo.discountPrice)}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-lg border border-purple-200 font-bold text-xs uppercase bg-purple-50 text-[#7d6aee]">
                {selectedDemo.category}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleOrderTemplate(selectedDemo.title);
                  setSelectedDemo(null);
                }}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#7d6aee] hover:bg-[#6b58e0] shadow-[0_2px_8px_rgba(125,106,238,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Pilih Template Ini</span>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDemo(null)}
                className="w-full py-2.5 px-4 rounded-xl border border-neutral-200 font-bold text-xs text-neutral-700 bg-neutral-50 hover:bg-neutral-100 transition-colors text-center cursor-pointer"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reusable Footer */}
      <Footer currentPath={currentPath} onNavigate={onNavigate} />

      {/* 5. Bottom Navigation Bar */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        activeTab="home"
      />
    </div>
  );
};

export default HomePage;
