import React from "react";

/* =========================================================
   Ornamen latar bertema undangan digital:
   hati, surat/amplop, bintang kilau, bunga, cincin, musik.
   Semua murni dekoratif — pointer-events-none & aria-hidden.
   ========================================================= */

type OrnProps = { className?: string };

/** Hati (outline) */
export const OrnHeart = ({ className = "" }: OrnProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
    <path d="M12 20.5C7 16 3.5 12.8 3.5 8.9 3.5 6.2 5.6 4 8.2 4c1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2 2.6 0 4.7 2.2 4.7 4.9 0 3.9-3.5 7.1-8.5 11.6Z" />
  </svg>
);

/** Hati (penuh) */
export const OrnHeartFill = ({ className = "" }: OrnProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 20.5C7 16 3.5 12.8 3.5 8.9 3.5 6.2 5.6 4 8.2 4c1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2 2.6 0 4.7 2.2 4.7 4.9 0 3.9-3.5 7.1-8.5 11.6Z" />
  </svg>
);

/** Surat / amplop */
export const OrnLetter = ({ className = "" }: OrnProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className} aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="m3.8 7.5 8.2 5.7 8.2-5.7" />
  </svg>
);

/** Bintang kilau (penuh) */
export const OrnStar = ({ className = "" }: OrnProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2c.6 4.8 2.4 7.4 8 8-5.6.6-7.4 3.2-8 8-.6-4.8-2.4-7.4-8-8 5.6-.6 7.4-3.2 8-8Z" />
  </svg>
);

/** Bunga 5 kelopak */
export const OrnFlower = ({ className = "" }: OrnProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
    <circle cx="12" cy="6.8" r="3" />
    <circle cx="16.9" cy="10.2" r="3" />
    <circle cx="15.1" cy="15.9" r="3" />
    <circle cx="8.9" cy="15.9" r="3" />
    <circle cx="7.1" cy="10.2" r="3" />
    <circle cx="12" cy="11.8" r="2" />
  </svg>
);

/** Cincin pasangan (dua cincin bertaut) */
export const OrnRings = ({ className = "" }: OrnProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <circle cx="9.3" cy="12" r="6" />
    <circle cx="14.7" cy="12" r="6" />
  </svg>
);

/** Not musik (nota ganda) */
export const OrnMusic = ({ className = "" }: OrnProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
    <path d="M9.5 18.5V6.6l10-2.1v11.9" />
    <circle cx="6.8" cy="18.5" r="2.6" />
    <circle cx="16.8" cy="16.4" r="2.6" />
  </svg>
);

/* =========================================================
   Ombak besar di tepi section dengan gradasi memudar.
   Taruh di dalam <section className="relative ... overflow-hidden">,
   biasanya absolute bottom-0. Warna & kekuatan gradasi bisa diatur.
   ========================================================= */

interface SectionWaveProps {
  /** Posisi & ukuran, mis. "absolute bottom-0 left-0 w-full h-20 sm:h-36" */
  className?: string;
  /** Warna gradasi (hex) */
  color?: string;
  /** Kekuatan warna di tepi (0–1) */
  strength?: number;
}

export const SectionWave = ({ className = "", color = "#7d6aee", strength = 0.12 }: SectionWaveProps) => {
  const gradId = React.useId();
  return (
    <svg
      viewBox="0 0 1440 190"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0" />
          <stop offset="1" stopColor={color} stopOpacity={strength} />
        </linearGradient>
      </defs>
      {/* Lapis belakang: ombak lebih landai & lebih pudar */}
      <path
        d="M0 74 C 260 10 520 150 760 104 C 1010 56 1230 128 1440 58 L1440 190 L0 190 Z"
        fill={color}
        opacity={strength * 0.45}
      />
      {/* Lapis depan: ombak utama dengan gradasi memudar ke atas */}
      <path
        d="M0 116 C 220 46 430 172 720 122 C 1000 74 1220 152 1440 86 L1440 190 L0 190 Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
};

