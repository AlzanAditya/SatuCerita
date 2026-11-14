/**
 * Client API dashboard admin. Data asli dari Supabase lewat Worker (GET /api/admin/overview, hanya akun admin).
 */
import type {
  AdminInvitationItem,
  AdminOrderItem,
  AdminTemplateItem,
  AdminUserData,
} from "@/pages/dash/types";
import { avatarFallback } from "@/lib/auth";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const pad = (n: number) => String(n).padStart(2, "0");

/** "14 Nov 2026" (WIB). */
export function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const w = new Date(d.getTime() + 7 * 3600_000);
  return `${w.getUTCDate()} ${BULAN[w.getUTCMonth()]} ${w.getUTCFullYear()}`;
}
/** "14 Nov 2026, 14:20" (WIB). */
export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return "";
  const w = new Date(d.getTime() + 7 * 3600_000);
  return `${fmtDate(iso)}, ${pad(w.getUTCHours())}:${pad(w.getUTCMinutes())}`;
}

type RawUser = Omit<AdminUserData, "joinedDate" | "avatar"> & { avatar: string };
type RawOrder = Omit<AdminOrderItem, "date">;
type RawInvitation = Omit<AdminInvitationItem, "eventDate"> & { eventDate: string };

interface RawOverview {
  generatedAt: string;
  users: RawUser[];
  orders: RawOrder[];
  templates: AdminTemplateItem[];
  invitations: RawInvitation[];
}

export interface AdminData {
  users: AdminUserData[];
  orders: AdminOrderItem[];
  templates: AdminTemplateItem[];
  invitations: AdminInvitationItem[];
}

export async function fetchAdminOverview(): Promise<{ ok: true; data: AdminData } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${BASE}/api/admin/overview`, { credentials: "include" });
    const raw = (await res.json().catch(() => ({}))) as Partial<RawOverview> & { error?: string };
    if (!res.ok || !Array.isArray(raw.users) || !Array.isArray(raw.orders)) {
      return { ok: false, error: raw.error || "Gagal memuat data dashboard." };
    }
    return {
      ok: true,
      data: {
        users: raw.users.map((u) => ({ ...u, joinedDate: fmtDate(u.joinedAt), avatar: u.avatar || avatarFallback(u.name) })),
        orders: raw.orders.map((o) => ({ ...o, date: fmtDateTime(o.createdAt) })),
        templates: raw.templates ?? [],
        invitations: (raw.invitations ?? []).map((i) => ({ ...i, eventDate: i.eventDate ? fmtDate(`${i.eventDate}T00:00:00+07:00`) : "" })),
      },
    };
  } catch {
    return { ok: false, error: "Tidak dapat terhubung ke server." };
  }
}

/** Unduh CSV di browser (BOM + CRLF agar terbuka benar di Excel). */
export function downloadCsv(filename: string, header: string[], rows: (string | number)[][]): void {
  const esc = (v: string | number) => {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // cegah formula injection saat dibuka di spreadsheet
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const text = [header, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
