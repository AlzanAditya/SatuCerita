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
  invitationId: string;
  name: string;
  /** ISO string */
  createdAt: string;
  message: string;
  attendance: "yes" | "no" | "maybe";
  guestCount: number;
}

export const DEMO_INVITATIONS = [{ id: "demo-inv", slug: "alya-dimas", title: "Alya & Dimas" }];

export const DEMO_WISHES: Wish[] = [
  { id: "w1", invitationId: "demo-inv", name: "Andi Pratama", createdAt: "2026-10-12T10:24:00+07:00", message: "Selamat menempuh hidup baru!", attendance: "yes", guestCount: 2 },
  { id: "w2", invitationId: "demo-inv", name: "Siti Rahayu", createdAt: "2026-10-11T19:17:00+07:00", message: "Bahagia selalu ya!", attendance: "yes", guestCount: 1 },
  { id: "w3", invitationId: "demo-inv", name: "Dimas Saputra", createdAt: "2026-10-11T16:50:00+07:00", message: "Semoga lancar sampai hari H!", attendance: "maybe", guestCount: 1 },
  { id: "w4", invitationId: "demo-inv", name: "Rina Wulandari", createdAt: "2026-10-10T08:05:00+07:00", message: "Barakallah, semoga sakinah mawaddah warahmah.", attendance: "no", guestCount: 1 },
];
