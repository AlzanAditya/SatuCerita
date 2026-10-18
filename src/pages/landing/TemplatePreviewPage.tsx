import React, { useEffect, useRef, useState } from "react";
import { X, ArrowLeft, ExternalLink, Loader2 } from "lucide-react";

interface TemplatePreviewPageProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

/**
 * TemplatePreviewPage
 * Diakses via /preview/:templateSlug
 * Menampilkan src/templates/:templateSlug/index.html dalam iframe fullscreen.
 * File template diakses via /templates/:slug/ (symlink public/templates -> src/templates).
 */
export const TemplatePreviewPage: React.FC<TemplatePreviewPageProps> = ({
  currentPath,
  onNavigate = (_path: string) => {},
}) => {
  // Extract slug dari /preview/:slug
  const slug = currentPath.replace(/^\/preview\/?/, "").split("/")[0];

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const templateSrc = `/templates/${slug}/index.html`;

  // Judul yang dibaca dari template slug
  const templateTitle = slug
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const handleBack = () => {
    onNavigate(`/katalog/${slug}`);
  };

  const handleOpenNewTab = () => {
    window.open(templateSrc, "_blank");
  };

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [slug]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950">
      {/* Top Bar */}
      <div
        className="relative z-10 flex items-center justify-between gap-3 px-4 py-2.5 bg-neutral-900/95 backdrop-blur-md border-b border-white/10"
        style={{ minHeight: "52px" }}
      >
        {/* Back Button */}
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/15"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kembali ke Detail</span>
          <span className="sm:hidden">Kembali</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white text-sm font-bold tracking-tight">
            Preview{" "}
            <span className="text-purple-300">{templateTitle}</span>
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Open in new tab */}
          <button
            type="button"
            onClick={handleOpenNewTab}
            title="Buka di tab baru"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/15"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tab Baru</span>
          </button>

          {/* Close / back to katalog */}
          <button
            type="button"
            onClick={handleBack}
            title="Tutup preview"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/80 text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 top-[52px] z-20 flex flex-col items-center justify-center bg-neutral-950 gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
          </div>
          <p className="text-white/60 text-sm font-medium">
            Memuat template <span className="text-purple-300 font-bold">{templateTitle}</span>…
          </p>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 top-[52px] z-20 flex flex-col items-center justify-center bg-neutral-950 gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Template tidak ditemukan</p>
            <p className="text-white/50 text-sm mt-1">
              Template <span className="text-purple-300">{templateTitle}</span> belum tersedia untuk pratinjau.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBack}
            className="mt-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all cursor-pointer border border-white/15"
          >
            Kembali ke Detail Template
          </button>
        </div>
      )}

      {/* Iframe */}
      <iframe
        ref={iframeRef}
        src={templateSrc}
        title={`Preview Template ${templateTitle}`}
        className="flex-1 w-full border-0"
        style={{ display: hasError ? "none" : "block" }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        allow="autoplay; fullscreen"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
      />
    </div>
  );
};

export default TemplatePreviewPage;
