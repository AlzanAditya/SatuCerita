/**
 * Data contoh untuk pratinjau tampilan studio. HANYA aktif di dev (`vite`) dengan `?demo` di URL,
 * mis. http://localhost:5173/studio/ucapan?demo. Tidak pernah aktif di produksi.
 */
export const isDemo = (): boolean =>
  import.meta.env.DEV &&
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("demo");

export interface Wish {
  id: string;
  name: string;
  /** ISO string */
  createdAt: string;
  message: string;
  reactions: number;
}

export const DEMO_WISHES: Wish[] = [
  { id: "w1", name: "Andi Pratama", createdAt: "2026-10-12T10:24:00+07:00", message: "Selamat menempuh hidup baru!", reactions: 12 },
  { id: "w2", name: "Siti Rahayu", createdAt: "2026-10-11T19:17:00+07:00", message: "Bahagia selalu ya!", reactions: 8 },
  { id: "w3", name: "Dimas Saputra", createdAt: "2026-10-11T16:50:00+07:00", message: "Semoga lancar sampai hari H!", reactions: 5 },
  { id: "w4", name: "Rina Wulandari", createdAt: "2026-10-10T08:05:00+07:00", message: "Barakallah, semoga sakinah mawaddah warahmah.", reactions: 21 },
];
