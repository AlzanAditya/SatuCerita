import type { Env, SbSession } from "./types";

export const isDev = (env: Env) => env.ENVIRONMENT === "development";

const LOCAL_HOST_RE = /^(localhost|127\.0\.0\.1|\[::1\]|[a-z0-9-]+\.localhost)$/i;

/**
 * Request yang MASUK lewat localhost (vite dev / wrangler dev)? Hostname diambil dari URL request itu sendiri;
 * di produksi Cloudflare hanya merutekan host domain kita, jadi nilai ini tidak bisa dipalsukan untuk menyerang produksi.
 */
export const isLocalRequest = (url: URL) => LOCAL_HOST_RE.test(url.hostname);

/**
 * Saat dev lokal, config `vars` yang berisi URL produksi (LOGIN_URL, STUDIO_HOME_URL, COOKIE_DOMAIN, ...) tidak boleh dipakai:
 * semua redirect harus kembali ke origin lokal dan cookie tidak boleh ber-Domain produksi (browser menolaknya di localhost).
 * Tanpa ini, login Google di lokal berakhir di https://studio.satucerita.app.
 */
export function localizeEnv(env: Env, url: URL): Env {
  if (!isLocalRequest(url)) return env;
  const o = url.origin;
  return {
    ...env,
    ENVIRONMENT: "development",
    DEV_ORIGIN: env.DEV_ORIGIN || o,
    COOKIE_DOMAIN: "",
    ALLOWED_ORIGINS: [env.ALLOWED_ORIGINS, o].filter(Boolean).join(","),
    LOGIN_URL: `${o}/login`,
    APP_HOME_URL: `${o}/studio/home`,
    STUDIO_HOME_URL: `${o}/studio/home`,
    DASH_LOGIN_URL: `${o}/dash/login`,
    DASH_HOME_URL: `${o}/dash`,
  };
}

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
