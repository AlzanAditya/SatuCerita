import type { Env, SbSession } from "./types";

export const isDev = (env: Env) => env.ENVIRONMENT === "development";

const SEC_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cache-Control": "no-store",
};

export function json(data: unknown, status = 200, cookies: string[] = []): Response {
  const h = new Headers({ "Content-Type": "application/json; charset=utf-8", ...SEC_HEADERS });
  cookies.forEach((c) => h.append("Set-Cookie", c));
  return new Response(JSON.stringify(data), { status, headers: h });
}

export function redirect(url: string, cookies: string[] = []): Response {
  const h = new Headers({ Location: url, ...SEC_HEADERS });
  cookies.forEach((c) => h.append("Set-Cookie", c));
  return new Response(null, { status: 302, headers: h });
}

/** Origin publik request ini (di dev dipaksa ke origin Vite karena lewat proxy). */
export function publicOrigin(env: Env, url: URL): string {
  return isDev(env) && env.DEV_ORIGIN ? env.DEV_ORIGIN : url.origin;
}

/** Base callback OAuth Supabase. Selalu ke domain utama di produksi agar hanya 1 redirect_to yang perlu diatur di Supabase. */
export function authCallbackBase(env: Env, url: URL): string {
  if (isDev(env)) {
    return `${env.DEV_ORIGIN || url.origin}/api/auth/callback`;
  }
  const root = env.COOKIE_DOMAIN ? env.COOKIE_DOMAIN.trim().replace(/^\./, "") : "";
  if (root) {
    return `https://${root}/api/auth/callback`;
  }
  return `${url.origin}/api/auth/callback`;
}

/** Proteksi CSRF: request yang mengubah data wajib datang dari origin yang diizinkan. */
export function originAllowed(env: Env, req: Request): boolean {
  const origin = req.headers.get("Origin");
  if (!origin) return false;
  return env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).includes(origin);
}

export async function readJson(req: Request): Promise<Record<string, unknown> | null> {
  const len = Number(req.headers.get("Content-Length") || "0");
  if (len > 10_000) return null;
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// ---------- Cookie ----------
export const COOKIE = { at: "sc_at", rt: "sc_rt", oauth: "sc_oauth" } as const;

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  (header || "").split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    try {
      out[k] = decodeURIComponent(part.slice(i + 1).trim());
    } catch {
      /* abaikan cookie rusak */
    }
  });
  return out;
}

export function makeCookie(env: Env, name: string, value: string, maxAge: number): string {
  const cleanDom = env.COOKIE_DOMAIN ? env.COOKIE_DOMAIN.trim().replace(/^\./, "") : "";
  const p = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (!isDev(env)) p.push("Secure");
  if (cleanDom) p.push(`Domain=.${cleanDom}`);
  return p.join("; ");
}

export const sessionCookies = (env: Env, s: SbSession): string[] => [
  makeCookie(env, COOKIE.at, s.access_token, Math.max(60, s.expires_in)),
  makeCookie(env, COOKIE.rt, s.refresh_token, 60 * 60 * 24 * 30),
];

export const clearCookies = (env: Env): string[] => {
  const names = [COOKIE.at, COOKIE.rt, COOKIE.oauth];
  const list: string[] = [];
  for (const n of names) {
    // 1. Host-only cookie (tanpa Domain)
    list.push(
      `${n}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax`
    );
    // 2. Cookie dengan Domain jika dikonfigurasi
    if (env.COOKIE_DOMAIN) {
      const cleanDom = env.COOKIE_DOMAIN.trim().replace(/^\./, "");
      list.push(
        `${n}=; Path=/; Domain=.${cleanDom}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${isDev(env) ? "" : "; Secure"}`
      );
      list.push(
        `${n}=; Path=/; Domain=${cleanDom}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; HttpOnly; SameSite=Lax${isDev(env) ? "" : "; Secure"}`
      );
    }
  }
  return list;
};
