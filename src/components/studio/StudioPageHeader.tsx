/**
 * Header halaman studio: logo Satu Cerita (dari /public/logos) + lonceng, lalu judul & subjudul.
 * Dipakai oleh Beranda, Pesanan, Ucapan, dan Bagikan.
 * Di desktop logo disembunyikan (sudah ada di sidebar), lonceng tetap tampil.
 */
import React, { useState } from "react";
import { Bell } from "lucide-react";

export interface StudioPageHeaderProps {
  title: string;
  subtitle: string;
  onLogoClick?: () => void;
  onBellClick?: () => void;
}

export const StudioPageHeader: React.FC<StudioPageHeaderProps> = ({
  title,
  subtitle,
  onLogoClick,
  onBellClick,
}) => {
  const [unread, setUnread] = useState(true);

  return (
    <header className="mb-5 sm:mb-6">
      <div className="flex items-center justify-between md:justify-end">
        <button
          type="button"
          onClick={onLogoClick}
          aria-label="Satu Cerita"
          className="md:hidden rounded-xl cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d6aee]"
        >
          <img
            src="/logos/satucerita.png"
            alt="Satu Cerita"
            width={36}
            height={36}
            className="size-9 rounded-xl object-cover shadow-[0_2px_8px_rgba(125,106,238,0.25)]"
          />
        </button>

        <button
          type="button"
          onClick={() => {
            setUnread(false);
            onBellClick?.();
          }}
          aria-label="Notifikasi"
          className="relative size-10 rounded-full flex items-center justify-center text-[#5b49c9] hover:bg-white/70 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#7d6aee]"
        >
          <Bell className="w-5 h-5" strokeWidth={1.8} />
          {unread && (
            <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-[#7d6aee] ring-2 ring-[#f4f1ff]" />
          )}
        </button>
      </div>

      <h1 className="mt-5 md:mt-1 text-[28px] sm:text-3xl font-black tracking-tight text-[#17112e] leading-tight">
        {title}
      </h1>
      <p className="mt-1.5 text-[15px] leading-snug text-[#5a5476] max-w-md">{subtitle}</p>
    </header>
  );
};

export default StudioPageHeader;
