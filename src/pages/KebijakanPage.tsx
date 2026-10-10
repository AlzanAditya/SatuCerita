import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ChevronRight } from "lucide-react";

interface KebijakanPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const KebijakanPage: React.FC<KebijakanPageProps> = ({
  currentPath = "/kebijakan",
  onNavigate = (_path: string) => {},
}) => {

  const [activeSection, setActiveSection] = useState<"privasi" | "syarat">("privasi");

  useEffect(() => {
    const handleScroll = () => {
      const syaratElement = document.getElementById("syarat");
      if (syaratElement) {
        const rect = syaratElement.getBoundingClientRect();
        if (rect.top <= 160) {
          setActiveSection("syarat");
          return;
        }
      }
      setActiveSection("privasi");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: "privasi" | "syarat") => {
    e.preventDefault();
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - topOffset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-neutral-800 flex flex-col antialiased selection:bg-[#7d6aee]/20 selection:text-[#5c49dc]">
      {/* Top Navigation */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Content */}
      <main id="konten" className="flex-1 bg-[#faf9ff]">
        {/* 
          1. Header Hero Section:
          Warna latar menggunakan warna aksen persis (#7d6aee),
          Teks berwarna putih, dan badge putih dengan teks ungu.
        */}
        <section className="relative overflow-hidden bg-[#7d6aee] py-14 sm:py-20 md:py-24 select-none shadow-xs">
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex max-w-3xl flex-col gap-3.5 sm:gap-4 items-start text-left">
              {/* Badge: Legal */}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#7d6aee] text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xs">
                Legal
              </span>

              {/* H1 Title: Teks putih */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.12]">
                Kebijakan Privasi &amp; Syarat Layanan
              </h1>

              {/* Subtitle Terakhir Diperbarui: Teks putih, diperbesar 2px menjadi 20px */}
              <p className="max-w-2xl text-base sm:text-lg md:text-[20px] md:leading-relaxed text-white/90 font-medium">
                Terakhir diperbarui: 24 September 2026
              </p>
            </div>
          </div>
        </section>

        {/* 
          2. Content Section:
          Warna latar halaman polosan mengikuti app SatuCerita (bg-[#faf9ff]).
          2 Kolom di Desktop (Daftar Isi Sticky di Kiri, Konten di Kanan)
        */}
        <div className="mx-auto grid max-w-6xl gap-8 lg:gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[14rem_1fr] lg:px-8">
          {/* Sisi Kiri: Daftar Isi Sticky (Tanpa Ikon) */}
          <nav aria-label="Daftar isi" className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-neutral-400 mb-3 sm:mb-4">
              Daftar isi
            </p>
            <ul className="grid gap-2 sm:gap-2.5">
              <li>
                <a
                  href="#privasi"
                  onClick={(e) => scrollToSection(e, "privasi")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                    activeSection === "privasi"
                      ? "bg-[#7d6aee] text-white shadow-[0_2px_8px_rgba(125,106,238,0.25)]"
                      : "bg-white text-neutral-700 hover:text-[#7d6aee] hover:bg-purple-50/50 border border-purple-100 shadow-2xs"
                  }`}
                >
                  <span>Kebijakan Privasi</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      activeSection === "privasi" ? "translate-x-0.5" : "opacity-40"
                    }`}
                  />
                </a>
              </li>
              <li>
                <a
                  href="#syarat"
                  onClick={(e) => scrollToSection(e, "syarat")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                    activeSection === "syarat"
                      ? "bg-[#7d6aee] text-white shadow-[0_2px_8px_rgba(125,106,238,0.25)]"
                      : "bg-white text-neutral-700 hover:text-[#7d6aee] hover:bg-purple-50/50 border border-purple-100 shadow-2xs"
                  }`}
                >
                  <span>Syarat &amp; Ketentuan</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      activeSection === "syarat" ? "translate-x-0.5" : "opacity-40"
                    }`}
                  />
                </a>
              </li>
            </ul>
          </nav>

          {/* Sisi Kanan: Konten Utama */}
          <div className="grid gap-10 sm:gap-12">
            {/* 
              1. Bagian Kebijakan Privasi:
              - Judul berlatar lebih ungu dibanding item di bawahnya (#7d6aee).
              - Tanpa ikon.
              - Nomor item tanpa badge pembungkus.
              - Tanpa garis separator antar item.
            */}
            <section
              id="privasi"
              aria-labelledby="privasi-judul"
              className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 shadow-[0_4px_20px_rgba(125,106,238,0.06)] overflow-hidden scroll-mt-24 transition-all"
            >
              {/* Judul: Latar lebih ungu (#7d6aee), tanpa ikon */}
              <div className="bg-[#7d6aee] text-white px-6 py-5 sm:px-8 sm:py-6">
                <h2
                  id="privasi-judul"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight"
                >
                  Kebijakan Privasi
                </h2>
              </div>

              {/* Item-item di bawahnya: Tanpa separator, nomor tanpa badge */}
              <ol className="grid gap-6 sm:gap-7 p-6 sm:p-8">
                {/* 01 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      01
                    </span>
                    Data yang kami kumpulkan
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Kami mengumpulkan data akun dari Google (nama, email, foto profil), data pesanan, serta konten undangan yang kalian masukkan seperti nama mempelai, jadwal acara, foto, musik, dan daftar tamu. Tamu yang mengisi RSVP atau ucapan memberikan nama dan pesan yang mereka tulis.
                  </p>
                </li>

                {/* 02 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      02
                    </span>
                    Cara kami menggunakan data
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Data digunakan untuk menyediakan layanan undangan, memproses pembayaran, mengirim notifikasi terkait pesanan, dan meningkatkan kualitas layanan. Kami tidak menjual data pribadi kepada pihak mana pun.
                  </p>
                </li>

                {/* 03 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      03
                    </span>
                    Pihak ketiga
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Pembayaran diproses oleh payment gateway resmi, dan login menggunakan Google. Pihak tersebut memproses data sesuai kebijakan privasi masing-masing. Kami hanya membagikan data seperlunya untuk menjalankan layanan.
                  </p>
                </li>

                {/* 04 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      04
                    </span>
                    Keamanan &amp; penyimpanan
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Data disimpan di server yang diamankan dan dicadangkan secara berkala. Informasi sensitif seperti kredensial integrasi disimpan terenkripsi. Konten undangan disimpan selama akun aktif atau sampai kalian memintanya dihapus.
                  </p>
                </li>

                {/* 05 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      05
                    </span>
                    Hak kalian
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Kalian dapat mengakses, memperbarui, atau meminta penghapusan data kapan saja melalui dashboard atau dengan menghubungi kami. Tamu yang ingin ucapannya dihapus dapat menghubungi pemilik undangan atau tim kami.
                  </p>
                </li>

                {/* 06 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      06
                    </span>
                    Cookie
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Kami menggunakan cookie yang diperlukan untuk menjaga sesi login dan menyimpan preferensi bahasa. Kami tidak menggunakan cookie iklan pihak ketiga.
                  </p>
                </li>
              </ol>
            </section>

            {/* 
              2. Bagian Syarat & Ketentuan:
              - Judul berlatar lebih ungu dibanding item di bawahnya (#7d6aee).
              - Tanpa ikon.
              - Nomor item tanpa badge pembungkus.
              - Tanpa garis separator antar item.
            */}
            <section
              id="syarat"
              aria-labelledby="syarat-judul"
              className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 shadow-[0_4px_20px_rgba(125,106,238,0.06)] overflow-hidden scroll-mt-24 transition-all"
            >
              {/* Judul: Latar lebih ungu (#7d6aee), tanpa ikon */}
              <div className="bg-[#7d6aee] text-white px-6 py-5 sm:px-8 sm:py-6">
                <h2
                  id="syarat-judul"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight"
                >
                  Syarat &amp; Ketentuan
                </h2>
              </div>

              {/* Item-item di bawahnya: Tanpa separator, nomor tanpa badge */}
              <ol className="grid gap-6 sm:gap-7 p-6 sm:p-8">
                {/* 01 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      01
                    </span>
                    Layanan
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    SatuCerita menyediakan template dan alat untuk membuat, mengelola, dan membagikan undangan pernikahan digital. Setiap pembelian template berlaku untuk satu undangan.
                  </p>
                </li>

                {/* 02 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      02
                    </span>
                    Akun
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Kalian bertanggung jawab menjaga keamanan akun dan seluruh aktivitas di dalamnya. Kami dapat menangguhkan akun yang melanggar ketentuan ini.
                  </p>
                </li>

                {/* 03 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      03
                    </span>
                    Pembayaran &amp; pengembalian dana
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Harga tercantum dalam Rupiah dan dibayar di muka. Karena produk digital langsung dapat digunakan setelah pembayaran, pengembalian dana hanya diberikan bila terjadi kesalahan teknis dari pihak kami yang tidak dapat diperbaiki.
                  </p>
                </li>

                {/* 04 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      04
                    </span>
                    Konten pengguna
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Kalian memiliki hak atas konten yang diunggah dan menjamin konten tersebut tidak melanggar hukum atau hak pihak lain. Konten yang melanggar dapat kami turunkan tanpa pemberitahuan.
                  </p>
                </li>

                {/* 05 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      05
                    </span>
                    Ketersediaan layanan
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Kami berupaya menjaga layanan selalu tersedia, namun tidak menjamin bebas gangguan. Pemeliharaan terjadwal akan diinformasikan sebisa mungkin.
                  </p>
                </li>

                {/* 06 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      06
                    </span>
                    Perubahan ketentuan
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    Ketentuan ini dapat diperbarui sewaktu-waktu. Perubahan penting akan diumumkan melalui situs atau email. Dengan terus menggunakan layanan, kalian menyetujui ketentuan terbaru.
                  </p>
                </li>
              </ol>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer currentPath={currentPath} onNavigate={onNavigate} />

      {/* Mobile Bottom Navigation */}
      <BottomNav currentPath={currentPath} onNavigate={onNavigate} />
    </div>
  );
};

export default KebijakanPage;
