/**
 * Client auth: semua request lewat Cloudflare Worker (/api/*).
 * Token disimpan di cookie HttpOnly oleh Worker — TIDAK ada token di JavaScript/localStorage.
 */
export type Role = "user" | "admin";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  phone: string;
  role: Role;
  createdAt: string;
}

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T & { error?: string };
}

async function api<T = Record<string, unknown>>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(BASE + path, {
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    });
    const data = (await res.json().catch(() => ({}))) as ApiResult<T>["data"];
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Tidak dapat terhubung ke server." } as ApiResult<T>["data"] };
  }
}

export async function fetchSession(): Promise<SessionUser | null> {
  const r = await api<{ user: SessionUser | null }>("/api/auth/me");
  return r.ok ? r.data.user : null;
}

export async function loginWithEmail(email: string, password: string) {
  const r = await api<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  return { ok: r.ok, error: r.data.error, user: r.data.user };
}

export async function signUpWithEmail(email: string, password: string, name: string) {
  const r = await api<{ needsConfirm: boolean; user?: SessionUser }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
  return { ok: r.ok, error: r.data.error, needsConfirm: !!r.data.needsConfirm };
}

export async function logoutRequest(): Promise<void> {
  await api("/api/auth/logout", { method: "POST" });
}

export async function updateProfile(p: { name?: string; phone?: string }) {
  const r = await api<{ user: SessionUser }>("/api/me", { method: "PATCH", body: JSON.stringify(p) });
  return { ok: r.ok, error: r.data.error, user: r.data.user };
}

/** Awal alur "Masuk dengan Google" (full-page redirect, ditangani Worker). */
export const googleLoginUrl = (next: "app" | "dash") => `${BASE}/api/auth/google?next=${next}`;

export function avatarFallback(name: string): string {
  const ch = (name.trim()[0] || "?").toUpperCase().replace(/[<>&"']/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='#7d6aee'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='56' font-weight='700' fill='white'>${ch}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

export function formatMemberSince(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
