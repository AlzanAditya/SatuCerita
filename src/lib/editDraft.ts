/**
 * Draft editor undangan (DUMMY): disimpan di localStorage browser sampai API undangan tersedia.
 * Foto tidak ikut disimpan (hanya data teks dan jumlah tahap yang selesai).
 */
export interface EditDraft {
  done: number; // 0–5 tahap selesai
  data: {
    groom: string;
    bride: string;
    date: string; // yyyy-mm-dd
    time: string; // HH:mm
    venue: string;
    address: string;
    opening: string;
    story: string;
    closing: string;
  };
}

const KEY = "satucerita_edit_draft_v1";

export const DEFAULT_DRAFT: EditDraft = {
  done: 0,
  data: {
    groom: "Andi Pratama",
    bride: "Siti Rahayu",
    date: "2026-12-24",
    time: "16:00",
    venue: "Gedung Serbaguna Nusantara",
    address: "Jl. Merdeka No.123, Jakarta Pusat",
    opening: "Dengan penuh rasa syukur, kami mengundang Anda untuk merayakan hari bahagia kami.",
    story:
      "Kami berdua percaya, bahwa cinta bukan hanya tentang saling mencintai, tetapi juga tentang berjalan bersama dalam setiap langkah kehidupan.",
    closing: "Terima kasih atas doa dan kehadiran Anda.",
  },
};

export function loadDraft(): EditDraft {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<EditDraft>;
      return { done: Math.min(5, Math.max(0, p.done ?? 0)), data: { ...DEFAULT_DRAFT.data, ...(p.data ?? {}) } };
    }
  } catch {
    /* abaikan */
  }
  return DEFAULT_DRAFT;
}

export function saveDraft(d: EditDraft): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    /* abaikan */
  }
}

export const draftDone = (): number => {
  try {
    return localStorage.getItem(KEY) ? loadDraft().done : 0;
  } catch {
    return 0;
  }
};
