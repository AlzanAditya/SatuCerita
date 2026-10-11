import React from "react";
import { PATHS } from "@/routes";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import {
  HelpCircle,
  CheckCircle2,
  LayoutGrid,
  CreditCard,
  SlidersHorizontal,
  Send,
  ArrowRight,
  Headphones,
} from "lucide-react";

interface CaraPesanPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

interface StepItem {
  number: number;
  badgeBg: string;
  badgeTextColor: string;
  title: string;
  subtitle: string;
  points: string[];
  icon: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
}

export const CaraPesanPage: React.FC<CaraPesanPageProps> = ({
  currentPath = "/cara-pesan",
  onNavigate = (_path: string) => {},
}) => {

  const katalogPath = PATHS.katalog;
  const loginPath = PATHS.login;

  const STEPS: StepItem[] = [
    {
      number: 1,
      badgeBg: "#F5C744",
      badgeTextColor: "#171717",
      title: "Pilih template",
      subtitle: "Jelajahi katalog dan pratinjau setiap template secara langsung.",
      icon: <LayoutGrid className="w-6 h-6 text-neutral-900 stroke-[2.2]" />,
      points: [
        "Buka halaman Katalog dan saring berdasarkan kategori.",
        "Klik Lihat Demo untuk mencoba template di tampilan ponsel maupun desktop.",
        "Tekan Pilih Template pada template favorit kalian.",
      ],
      ctaText: "Lihat Katalog",
      ctaLink: katalogPath,
    },
    {
      number: 2,
      badgeBg: "#EE5B4F",
      badgeTextColor: "#FFFFFF",
      title: "Bayar",
      subtitle: "Masuk dengan akun Google dan selesaikan pembayaran dengan metode favorit.",
      icon: <CreditCard className="w-6 h-6 text-neutral-900 stroke-[2.2]" />,
      points: [
        "Masuk atau daftar dengan akun Google dalam satu klik.",
        "Bayar melalui transfer bank virtual account, e-wallet, QRIS, atau metode lain yang tersedia.",
        "Setelah pembayaran terkonfirmasi, undangan otomatis dibuat di dashboard.",
      ],
      ctaText: "Daftar & Mulai",
      ctaLink: loginPath,
    },
    {
      number: 3,
      badgeBg: "#7D6AEE",
      badgeTextColor: "#FFFFFF",
      title: "Edit di dashboard",
      subtitle: "Isi data mempelai, acara, foto, musik, dan daftar tamu sesuka hati.",
      icon: <SlidersHorizontal className="w-6 h-6 text-neutral-900 stroke-[2.2]" />,
      points: [
        "Lengkapi setiap section: mempelai, acara, galeri, kisah cinta, hadiah, dan lainnya.",
        "Unggah foto dengan drag & drop dan pilih musik latar.",
        "Atur link custom satucerita.id/nama-kalian lalu terbitkan.",
      ],
    },
    {
      number: 4,
      badgeBg: "#22C55E",
      badgeTextColor: "#FFFFFF",
      title: "Bagikan",
      subtitle: "Kirim undangan personal ke setiap tamu lewat WhatsApp.",
      icon: <Send className="w-6 h-6 text-neutral-900 stroke-[2.2]" />,
      points: [
        "Tambahkan tamu satu per satu atau sekaligus, lengkap dengan label VIP atau Reguler.",
        "Kirim pesan WhatsApp berisi nama tamu dan tautan undangan personal.",
        "Pantau RSVP, ucapan, dan check-in QR di hari bahagia.",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
      {/* 1. Navbar Satu Cerita */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* 2. Header Bagian Khusus */}
      <SubpageHeader
        badgeText="Panduan Cara Pesan"
        badgeIcon={<HelpCircle className="w-3.5 h-3.5 text-[#7d6aee] shrink-0" />}
        titlePrefix="Langkah Mudah Memulai di"
        titleHighlight="Satu Cerita"
        description="Proses pemesanan yang cepat, transparan, dan tanpa ribet. Mulai dari pemilihan template hingga undangan siap dibagikan ke seluruh tamu."
      />

      {/* 3. Konten Utama: 4 Langkah Alur Pemesanan */}
      <main className="flex-1 bg-[#faf9ff] py-10 sm:py-14 md:py-16 select-none">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col gap-9 sm:gap-11">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-start w-full">
                {/* Step Number Badge */}
                <div
                  className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 bg-white text-[#7d6aee] flex items-center justify-center font-black text-xl shadow-2xs mb-3 select-none"
                >
                  {step.number}
                </div>

                {/* Step Content Card */}
                <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-6 sm:p-8 shadow-2xs hover:border-purple-200 transition-all text-left">
                  {/* Top Header Inside Card: judul card satu baris dengan icon */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                      {step.title}
                    </h3>
                    <div className="text-neutral-900 shrink-0">
                      {step.icon}
                    </div>
                  </div>

                  {/* Subtitle / Deskripsi: diperbesar 2px menjadi text-[16px] sm:text-[18px] */}
                  <p className="text-neutral-600 text-[16px] sm:text-[18px] leading-relaxed mb-6 font-normal">
                    {step.subtitle}
                  </p>

                  {/* Bullets with CheckCircle2: poin-poin diperbesar 2px menjadi text-[16px] sm:text-[18px] */}
                  <div className="space-y-3.5 sm:space-y-4 mb-6">
                    {step.points.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-[#7d6aee] shrink-0 mt-0.5 stroke-[2.2]" />
                        <p className="text-[16px] sm:text-[18px] text-neutral-800 font-medium leading-snug">
                          {point}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button: font diperbesar 2px menjadi text-[16px] */}
                  {step.ctaText && (
                    <div className="pt-2">
                      <a
                        href={step.ctaLink}
                        onClick={(e) => {
                          if (step.ctaLink && onNavigate) {
                            e.preventDefault();
                            onNavigate(step.ctaLink);
                          }
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[16px] bg-[#7d6aee] hover:bg-[#6b58e0] text-white shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                      >
                        <span>{step.ctaText}</span>
                        <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Kotak Bantuan / Konsultasi Gratis */}
          <div className="mt-12 p-5 sm:p-6 rounded-2xl bg-white border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-[#7D6AEE] text-white flex items-center justify-center shrink-0 shadow-sm">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-sm sm:text-base font-extrabold text-neutral-900">
                  Butuh Bantuan atau Masih Bingung?
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600">
                  Konsultasikan konsep acara Anda secara gratis dengan tim admin kami di WhatsApp.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/6285187978443?text=Halo%20Satu%20Cerita,%20saya%20mau%20tanya-tanya%20tentang%20pemesanan%20undangan"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs sm:text-sm font-bold shadow-[0_2px_8px_rgba(37,211,102,0.25)] hover:shadow-[0_4px_12px_rgba(37,211,102,0.35)] transition-all"
            >
              Konsultasi WhatsApp
            </a>
          </div>
        </div>
      </main>

      {/* 4. Reusable Footer */}
      <Footer currentPath={currentPath} onNavigate={onNavigate} />

      {/* 5. Bottom Navigation Bar */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        activeTab="carapesan"
      />
    </div>
  );
};

export default CaraPesanPage;
