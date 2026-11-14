import React, { useMemo, useState } from "react";
import { Heart, MessageCircle, MessageSquareText } from "lucide-react";
import { PATHS } from "@/routes";
import { StudioPageHeader } from "@/components/studio/StudioPageHeader";
import { DEMO_WISHES, isDemo, type Wish } from "@/lib/studioDemo";

export interface UcapanPageProps {
  /** Ucapan dari tamu. Belum ada sumber data server, jadi default kosong. */
  wishes?: Wish[];
  onNavigate?: (path: string) => void;
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const w = new Date(d.getTime() + 7 * 3600_000); // WIB
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCDate()} ${BULAN[w.getUTCMonth()]} ${w.getUTCFullYear()} • ${p(w.getUTCHours())}:${p(w.getUTCMinutes())}`;
}
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");

const PAGE_SIZE = 3;

export const UcapanPage: React.FC<UcapanPageProps> = ({ wishes, onNavigate }) => {
  const list = useMemo(() => wishes ?? (isDemo() ? DEMO_WISHES : []), [wishes]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const totalReactions = list.reduce((n, w) => n + w.reactions, 0) + liked.size;
  const visible = showAll ? list : list.slice(0, PAGE_SIZE);

  const toggle = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="animate-fadeIn">
      <StudioPageHeader
        title="Ucapan"
        subtitle="Lihat dan kelola ucapan dari tamu undangan Anda."
        onLogoClick={() => onNavigate?.(PATHS.home)}
      />

      <div className="space-y-4">
        <section className="rounded-3xl bg-[#e4defa] py-4 grid grid-cols-2 items-center">
          <div className="flex items-center justify-center gap-3 border-r border-[#c9bff0]">
            <MessageCircle className="w-9 h-9 text-[#7d6aee] fill-[#7d6aee]/90" strokeWidth={1.5} />
            <div>
              <div className="text-[26px] leading-none font-black text-[#17112e] tabular-nums">{list.length}</div>
              <div className="text-xs text-[#5a5476] mt-1">Ucapan Masuk</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Heart className="w-9 h-9 text-[#7d6aee] fill-[#7d6aee]" strokeWidth={1.5} />
            <div>
              <div className="text-[26px] leading-none font-black text-[#17112e] tabular-nums">{totalReactions}</div>
              <div className="text-xs text-[#5a5476] mt-1">Reaksi</div>
            </div>
          </div>
        </section>

        {list.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_6px_24px_rgba(94,75,180,0.08)] flex flex-col items-center">
            <div className="size-16 rounded-2xl bg-[#f1edff] flex items-center justify-center">
              <MessageSquareText className="w-8 h-8 text-[#7d6aee]" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#17112e]">Belum ada ucapan</h2>
            <p className="mt-1.5 text-sm text-[#5a5476] max-w-xs leading-relaxed">
              Ucapan dan doa dari tamu akan muncul di sini setelah undangan Anda dibagikan.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((w) => {
              const on = liked.has(w.id);
              return (
                <li key={w.id} className="rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(94,75,180,0.07)]">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="size-11 rounded-full bg-[#ece8fb] text-[#6b58e0] font-bold text-sm flex items-center justify-center shrink-0"
                    >
                      {initials(w.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[15px] font-extrabold text-[#17112e] truncate">{w.name}</div>
                          <div className="text-xs text-[#7a7494]">{stamp(w.createdAt)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggle(w.id)}
                          aria-pressed={on}
                          aria-label={on ? "Hapus reaksi" : "Beri reaksi"}
                          className="size-8 -mr-1 -mt-1 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#f1edff] focus-visible:outline-2 focus-visible:outline-[#7d6aee]"
                        >
                          <Heart
                            className={`w-5 h-5 ${on ? "fill-[#7d6aee] text-[#7d6aee]" : "text-[#5a5476]"}`}
                            strokeWidth={1.6}
                          />
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-[#17112e] leading-relaxed">{w.message}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {list.length > PAGE_SIZE && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="h-10 px-6 rounded-full bg-[#e9e4fb] hover:bg-[#e0daf8] text-sm font-bold text-[#5b49c9] cursor-pointer"
            >
              {showAll ? "Tampilkan lebih sedikit" : "Lihat Semua Ucapan"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UcapanPage;
