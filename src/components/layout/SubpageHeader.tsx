import React from "react";
import { Sparkles } from "lucide-react";

interface SubpageHeaderProps {
  badgeText: string;
  badgeIcon?: React.ReactNode;
  titlePrefix: string;
  titleHighlight: string;
  description: string;
  children?: React.ReactNode;
}

export const SubpageHeader: React.FC<SubpageHeaderProps> = ({
  badgeText,
  badgeIcon,
  titlePrefix,
  titleHighlight,
  description,
  children,
}) => {
  return (
    <div className="w-full bg-[#7d6aee] px-4 sm:px-6 md:px-8 py-14 sm:py-20 md:py-24 text-left select-none transition-colors shadow-xs">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-start text-left">
        {/* Badge: latar putih dengan teks ungu aksen persis (#7d6aee) */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#7d6aee] text-xs sm:text-sm font-bold tracking-wide shadow-sm mb-4 sm:mb-5 [&_svg]:text-[#7d6aee]">
          {badgeIcon || <Sparkles className="w-3.5 h-3.5 text-[#7d6aee] shrink-0" />}
          <span>{badgeText}</span>
        </div>

        {/* Judul Halaman: teks warna putih */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.15] mb-3 sm:mb-5 text-left">
          {titlePrefix}{" "}
          <span className="text-white/95">
            {titleHighlight}
          </span>
        </h1>

        {/* Deskripsi Halaman: teks warna putih, diperbesar menjadi 20px di desktop */}
        <p className="text-base sm:text-lg md:text-[20px] md:leading-relaxed text-white/90 max-w-2xl font-normal leading-relaxed text-left">
          {description}
        </p>

        {children && <div className="mt-6 sm:mt-7 w-full">{children}</div>}
      </div>
    </div>
  );
};

export default SubpageHeader;
