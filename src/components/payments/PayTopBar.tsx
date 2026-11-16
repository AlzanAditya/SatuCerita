import React from "react";
import { ArrowLeft } from "lucide-react";

interface PayTopBarProps {
  title: string;
  backLabel: string;
  onBack: () => void;
}

/** Navbar atas halaman pembayaran: tombol kembali + judul di tengah (tanpa ikon beranda). */
export const PayTopBar: React.FC<PayTopBarProps> = ({ title, backLabel, onBack }) => (
  <header className="sticky top-0 z-30 bg-[#f6f4ff]/90 backdrop-blur-md">
    <div className="max-w-md mx-auto h-14 px-3 grid grid-cols-[2.5rem_1fr_2.5rem] items-center">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="size-10 rounded-full flex items-center justify-center text-[#17112e] hover:bg-white/80 active:scale-95 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7d6aee]"
      >
        <ArrowLeft className="w-5 h-5" strokeWidth={2} />
      </button>
      <h1 className="text-center text-base font-extrabold text-[#17112e] tracking-tight">{title}</h1>
      <span aria-hidden="true" />
    </div>
  </header>
);

export default PayTopBar;
