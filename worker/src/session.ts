import type { Env, PublicUser, SbSession, SbUser } from "./types";
import { COOKIE, clearCookies, parseCookies, sessionCookies } from "./http";

export async function sb(env: Env, path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("apikey", env.SUPABASE_ANON_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(env.SUPABASE_URL + path, { ...init, headers });
}

/**
 * Admin HANYA: email == ADMIN_EMAIL, email sudah terverifikasi, dan terhubung ke Google.
 * (Login email+password tidak pernah dianggap admin.)
 */
export function isAdminUser(env: Env, u: SbUser): boolean {
  const email = (u.email || "").toLowerCase();
  const viaGoogle =
    (u.identities || []).some((i) => i.provider === "google") ||
    (u.app_metadata?.providers || []).includes("google");
  return email === env.ADMIN_EMAIL.trim().toLowerCase() && !!u.email_confirmed_at && viaGoogle;
}

async function getUser(env: Env, at: string): Promise<SbUser | null> {
  const r = await sb(env, "/auth/v1/user", {}, at);
  return r.ok ? ((await r.json()) as SbUser) : null;
}

export interface Resolved {
  user: SbUser | null;
  token: string | null;
  setCookies: string[];
}

/** Validasi cookie sesi ke Supabase; kalau access token habis, refresh otomatis. */
export async function resolveSession(env: Env, req: Request): Promise<Resolved> {
  const c = parseCookies(req.headers.get("Cookie"));
  if (c[COOKIE.at]) {
    const user = await getUser(env, c[COOKIE.at]);
    if (user) return { user, token: c[COOKIE.at], setCookies: [] };
  }
  if (c[COOKIE.rt]) {
    const r = await sb(env, "/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: c[COOKIE.rt] }),
    });
    if (r.ok) {
      const s = (await r.json()) as SbSession;
      return { user: s.user, token: s.access_token, setCookies: sessionCookies(env, s) };
    }
    return { user: null, token: null, setCookies: clearCookies(env) };
  }
  return { user: null, token: null, setCookies: [] };
}

export async function toPublicUser(env: Env, u: SbUser, token: string): Promise<PublicUser> {
  const meta = (u.user_metadata || {}) as Record<string, string | undefined>;
  type Row = { full_name?: string; phone?: string; avatar_url?: string };
  let profile: Row | null = null;
  try {
    const r = await sb(env, `/rest/v1/profiles?id=eq.${encodeURIComponent(u.id)}&select=full_name,phone,avatar_url`, {}, token);
    if (r.ok) profile = ((await r.json()) as Row[])[0] ?? null;
  } catch {
    /* tabel profiles belum ada -> pakai data Auth */
  }
  const email = u.email || "";
  return {
    id: u.id,
    email,
    name: profile?.full_name || meta.full_name || meta.name || email.split("@")[0],
    avatar: profile?.avatar_url || meta.avatar_url || meta.picture || null,
    phone: profile?.phone || "",
    role: isAdminUser(env, u) ? "admin" : "user",
    createdAt: u.created_at || "",
  };
}
