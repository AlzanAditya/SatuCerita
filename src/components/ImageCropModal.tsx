import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, ZoomIn, Crop } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageSrc,
  onClose,
  onApplyCrop,
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  const applyCrop = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const containerSize = 340;
    const scale = (img.naturalWidth / img.width) * zoom;
    const sx = (img.naturalWidth / 2 - containerSize / 2 / zoom - offset.x / zoom) / (img.naturalWidth / img.width);
    const sy = (img.naturalHeight / 2 - containerSize / 2 / zoom - offset.y / zoom) / (img.naturalHeight / img.height);
    const sw = containerSize / scale;
    const sh = containerSize / scale;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    onApplyCrop(dataUrl);
    onClose();
  }, [zoom, offset, onApplyCrop, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-neutral-900 overflow-hidden flex flex-col">
        {/* Header - Kuning aksen persis seperti screenshot referensi */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3.5 bg-[#f5c744] border-b-2 border-neutral-900">
          <div>
            <h3 className="text-base font-black text-neutral-900 leading-snug">
              Potong gambar
            </h3>
            <p className="text-xs font-semibold text-neutral-800/80 mt-0.5">
              Geser dan perbesar untuk mengatur bagian foto (rasio 1:1).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-xl bg-white/70 hover:bg-white border border-neutral-900 flex items-center justify-center text-neutral-900 cursor-pointer shrink-0 ml-3 transition-colors shadow-2xs"
            title="Tutup"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Crop Area */}
        <div className="p-4 bg-white">
          <div
            className="relative w-full aspect-square rounded-xl bg-neutral-900 overflow-hidden cursor-grab active:cursor-grabbing select-none border border-neutral-200"
            style={{ maxHeight: "340px" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {/* Image layer */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="crop preview"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                transformOrigin: "center",
              }}
              draggable={false}
            />

            {/* Circular cutout vignette mask */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, transparent 48%, rgba(0,0,0,0.65) 50%)`,
              }}
            />

            {/* Grid lines inside circle */}
            <div className="absolute inset-[2%] pointer-events-none rounded-full border border-white/60">
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 mt-4 px-1">
            <ZoomIn className="w-4 h-4 text-neutral-600 shrink-0" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-neutral-900 cursor-pointer h-1.5 bg-neutral-200 rounded-lg"
            />
          </div>
        </div>

        {/* Hidden canvas for extraction */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3.5 bg-neutral-50 border-t border-neutral-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:bg-neutral-200/60 cursor-pointer transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={applyCrop}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f5c744] hover:bg-[#e6b833] text-neutral-900 border-2 border-neutral-900 font-extrabold text-xs shadow-2xs active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Crop className="w-4 h-4 stroke-[2.2]" />
            <span>Potong &amp; unggah</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
