import type { Env, SbSession } from "./types";
import {
  COOKIE, authCallbackBase, clearCookies, isDev, json, makeCookie, originAllowed, parseCookies,
  publicOrigin, readJson, redirect, sessionCookies,
} from "./http";
import { isAdminUser, resolveSession, sb, toPublicUser } from "./session";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const b64url = (buf: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const cleanName = (v: unknown) => str(v, 80).replace(/[<>\u0000-\u001f]/g, "");

function normalizePhone(raw: string): string | null {
  let p = raw.replace(/[\s\-().]/g, "");
  if (p.startsWith("0")) p = "+62" + p.slice(1);
  else if (p.startsWith("62")) p = "+" + p;
  return /^\+[1-9][0-9]{7,14}$/.test(p) ? p : null;
}

// GET /api/auth/google?next=studio|dash  -> mulai OAuth (PKCE) lewat Supabase
export async function googleStart(env: Env, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const nextParam = url.searchParams.get("next");
  const next = nextParam === "dash" ? "dash" : "studio";
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(48)));
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const callbackBase = authCallbackBase(env, url);
  const redirectTo = `${callbackBase}?next=${next}`;
  const target =
    `${env.SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectTo)}` +
    `&code_challenge=${challenge}&code_challenge_method=s256&prompt=select_account`;

  const cookies = [makeCookie(env, COOKIE.oauth, `${verifier}.${next}`, 600)];
  if (env.COOKIE_DOMAIN && !isDev(env)) {
    cookies.push(
      `${COOKIE.oauth}=${encodeURIComponent(`${verifier}.${next}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600; Secure`
    );
  }
  return redirect(target, cookies);
}

// GET /api/auth/callback?code=...  -> tukar code jadi sesi, set cookie, redirect
export async function googleCallback(env: Env, req: Request): Promise<Response> {
  const url = new URL(req.url);
  const [verifierFromCookie, nextFromCookie] = (parseCookies(req.headers.get("Cookie"))[COOKIE.oauth] || "").split(".");
  const nextFromQuery = url.searchParams.get("next");
  const next = nextFromQuery === "dash" ? "dash" : (nextFromCookie === "dash" ? "dash" : "studio");
  const loginUrl = next === "dash" ? env.DASH_LOGIN_URL : env.LOGIN_URL;
  const fail = (code: string) => redirect(`${loginUrl}?error=${code}`, clearCookies(env));

  const code = url.searchParams.get("code");
  const verifier = verifierFromCookie;
  if (url.searchParams.get("error") || !code || !verifier) {
    console.error("OAuth callback validation failed:", {
      error: url.searchParams.get("error"),
      hasCode: !!code,
      hasVerifier: !!verifier,
    });
    return fail("oauth_failed");
  }

  const r = await sb(env, "/auth/v1/token?grant_type=pkce", {
    method: "POST",
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    console.error("Supabase token exchange failed:", r.status, errText);
    return fail("oauth_failed");
  }
  const s = (await r.json()) as SbSession;

  // Dashboard admin: hanya satuceritadotid@gmail.com (via Google)
  if (next === "dash" && !isAdminUser(env, s.user)) return fail("forbidden");

  const home = next === "dash" ? env.DASH_HOME_URL : (env.STUDIO_HOME_URL || env.APP_HOME_URL);
  return redirect(home, [...sessionCookies(env, s), makeCookie(env, COOKIE.oauth, "", 0)]);
}

// POST /api/auth/login {email, password}
export async function login(env: Env, req: Request): Promise<Response> {
  const body = await readJson(req);
  const email = str(body?.email, 254).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  if (!EMAIL_RE.test(email) || password.length < 1 || password.length > 72)
    return json({ error: "Email atau kata sandi tidak valid." }, 400);
  if (email === env.ADMIN_EMAIL.toLowerCase())
    return json({ error: "Akun ini hanya bisa masuk lewat Google." }, 403);

  const r = await sb(env, "/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) {
    const e = (await r.json().catch(() => ({}))) as { error_code?: string };
    if (e.error_code === "email_not_confirmed")
      return json({ error: "Email belum dikonfirmasi. Cek kotak masuk Anda." }, 403);
    return json({ error: "Email atau kata sandi salah." }, 401);
  }
  const s = (await r.json()) as SbSession;
  return json({ user: await toPublicUser(env, s.user, s.access_token) }, 200, sessionCookies(env, s));
}

// POST /api/auth/signup {email, password, name}
export async function signup(env: Env, req: Request): Promise<Response> {
  const body = await readJson(req);
  const email = str(body?.email, 254).toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";
  const name = cleanName(body?.name);
  if (!EMAIL_RE.test(email)) return json({ error: "Format email tidak valid." }, 400);
  if (password.length < 8 || password.length > 72) return json({ error: "Kata sandi minimal 8 karakter." }, 400);
  if (name.length < 2) return json({ error: "Nama lengkap minimal 2 karakter." }, 400);
  if (email === env.ADMIN_EMAIL.toLowerCase())
    return json({ error: "Email ini tidak dapat didaftarkan." }, 403);

  const r = await sb(env, `/auth/v1/signup?redirect_to=${encodeURIComponent(env.LOGIN_URL)}`, {
    method: "POST",
    body: JSON.stringify({ email, password, data: { full_name: name } }),
  });
  const data = (await r.json().catch(() => ({}))) as Partial<SbSession> & { error_code?: string };
  if (!r.ok) {
    if (data.error_code === "weak_password") return json({ error: "Kata sandi terlalu lemah." }, 422);
    return json({ error: "Pendaftaran gagal. Periksa data Anda lalu coba lagi." }, 422);
  }
  if (data.access_token) {
    const s = data as SbSession;
    return json({ needsConfirm: false, user: await toPublicUser(env, s.user, s.access_token) }, 200, sessionCookies(env, s));
  }
  return json({ needsConfirm: true });
}

// POST /api/auth/logout
export async function logout(env: Env, req: Request): Promise<Response> {
  const at = parseCookies(req.headers.get("Cookie"))[COOKIE.at];
  if (at) await sb(env, "/auth/v1/logout", { method: "POST" }, at).catch(() => null);
  return json({ ok: true }, 200, clearCookies(env));
}

// GET /api/auth/me
export async function me(env: Env, req: Request): Promise<Response> {
  const s = await resolveSession(env, req);
  if (!s.user || !s.token) return json({ user: null }, 401, s.setCookies);
  return json({ user: await toPublicUser(env, s.user, s.token) }, 200, s.setCookies);
}

// PATCH /api/me {name?, phone?}
export async function updateMe(env: Env, req: Request): Promise<Response> {
  const s = await resolveSession(env, req);
  if (!s.user || !s.token) return json({ error: "Belum login." }, 401, s.setCookies);
  const body = await readJson(req);
  const patch: Record<string, string | null> = {};
  if (body && "name" in body) {
    const n = cleanName(body.name);
    if (n.length < 2) return json({ error: "Nama minimal 2 karakter." }, 400, s.setCookies);
    patch.full_name = n;
  }
  if (body && "phone" in body) {
    const raw = str(body.phone, 30);
    const p = raw ? normalizePhone(raw) : null;
    if (raw && !p) return json({ error: "Format nomor WhatsApp tidak valid." }, 400, s.setCookies);
    patch.phone = p;
  }
  if (!Object.keys(patch).length) return json({ error: "Tidak ada data untuk disimpan." }, 400, s.setCookies);
  const r = await sb(env, `/rest/v1/profiles?id=eq.${encodeURIComponent(s.user.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  }, s.token);
  if (!r.ok) return json({ error: "Gagal menyimpan profil." }, 500, s.setCookies);
  return json({ user: await toPublicUser(env, s.user, s.token) }, 200, s.setCookies);
}

export { originAllowed };
