import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PATHS } from "@/routes";

interface NotFoundPageProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  currentPath = "/",
  onNavigate,
}) => (
  <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col">
    <Navbar currentPath={currentPath} onNavigate={onNavigate} />

    <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
      <p className="text-6xl sm:text-7xl font-black text-[#7d6aee]">404</p>
      <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 max-w-md text-text-secondary font-medium">
        Alamat yang kamu tuju tidak ada atau sudah dipindahkan.
      </p>
      <a
        href={PATHS.home}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(PATHS.home);
        }}
        className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-sm shadow-sm cursor-pointer"
      >
        Kembali ke Beranda
      </a>
    </main>

    <Footer currentPath={currentPath} onNavigate={onNavigate} />
    <BottomNav currentPath={currentPath} onNavigate={onNavigate} />
  </div>
);

export default NotFoundPage;
