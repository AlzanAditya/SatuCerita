import type { Env } from "./types";
import { json, originAllowed, readJson } from "./http";
import { resolveSession, isAdminUser } from "./session";
import { googleCallback, googleStart, login, logout, me, signup, updateMe } from "./auth";
import { redirect } from "./http";
import { cancelOrder, createOrder, getOrder, listOrders, paymentsConfig, quoteOrder, syncOrder } from "./orders";
import { midtransWebhook } from "./webhook";
import { streamOrder } from "./stream";

// Durable Object hub realtime: HARUS diekspor dari modul entry agar Cloudflare dapat meng-instansiasinya.
export { PaymentHub } from "./hub";

const isAsset = (p: string) => p.startsWith("/assets/") || (/\.[a-z0-9]{2,5}$/i.test(p) && !p.endsWith(".html"));

async function handleApi(env: Env, req: Request, url: URL): Promise<Response> {
  const { pathname: p } = url;
  const m = req.method;

  if (m === "GET" && p === "/api/auth/google") return googleStart(env, req);
  if (m === "GET" && p === "/api/auth/callback") return googleCallback(env, req);
  if (m === "GET" && p === "/api/auth/me") return me(env, req);

  if (m === "POST" && p === "/api/auth/logout") return logout(env, req);

  // ---- Pembayaran: rute baca (GET) ----
  if (m === "GET" && p === "/api/payments/config") return paymentsConfig(env);
  if (m === "GET" && p === "/api/orders") return listOrders(env, req);
  const orderPath = /^\/api\/orders\/([^/]+)(?:\/(sync|cancel|events))?$/.exec(p);
  if (m === "GET" && orderPath && !orderPath[2]) return getOrder(env, req, orderPath[1]);
  if (m === "GET" && orderPath?.[2] === "events") return streamOrder(env, req, orderPath[1]);

  // Webhook Midtrans: server-ke-server, TIDAK punya header Origin -> dikecualikan dari cek Origin di bawah.
  // Keamanannya ada di signature SHA512 + konfirmasi Status API (lihat webhook.ts).
  if (p === "/api/payments/midtrans/webhook") {
    if (m === "POST") return midtransWebhook(env, req);
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { "Content-Type": "application/json", Allow: "POST", "Cache-Control": "no-store" },
    });
  }

  // Semua request yang mengubah data wajib lolos cek Origin (anti-CSRF)
  if (m !== "GET" && !originAllowed(env, req)) return json({ error: "Origin tidak diizinkan." }, 403);

  if (m === "POST" && p === "/api/auth/login") return login(env, req);
  if (m === "POST" && p === "/api/auth/signup") return signup(env, req);
  if (m === "PATCH" && p === "/api/me") return updateMe(env, req);

  // ---- Pembayaran: rute tulis (wajib login + Origin) ----
  if (m === "POST" && p === "/api/orders/quote") return quoteOrder(env, req, await readJson(req));
  if (m === "POST" && p === "/api/orders") return createOrder(env, req, await readJson(req));
  if (m === "POST" && orderPath?.[2] === "sync") return syncOrder(env, req, orderPath[1]);
  if (m === "POST" && orderPath?.[2] === "cancel") return cancelOrder(env, req, orderPath[1]);

  return json({ error: "Not found" }, 404);
}

/** Guard halaman: studio.* wajib login, dash.* wajib login sebagai admin, satucerita.app/login dicek jika sudah login */
async function guardPage(env: Env, req: Request, url: URL): Promise<Response> {
  const isDash = url.hostname.startsWith("dash.");
  const isStudio = url.hostname.startsWith("studio.") || url.hostname.startsWith("app.");
  const isMain = !isDash && !isStudio;
  const s = await resolveSession(env, req);
  const admin = !!s.user && isAdminUser(env, s.user);
  const studioHome = env.STUDIO_HOME_URL || env.APP_HOME_URL;

  let deny: Response | null = null;
  if (isDash) {
    const onLogin = url.pathname === "/login" || url.pathname.startsWith("/login/");
    if (onLogin) {
      if (admin) deny = redirect(env.DASH_HOME_URL, s.setCookies);
    } else if (!s.user) {
      deny = redirect(env.DASH_LOGIN_URL, s.setCookies);
    } else if (!admin) {
      deny = redirect(`${env.DASH_LOGIN_URL}?error=forbidden`, s.setCookies);
    }
  } else if (isStudio) {
    const onLogin = url.pathname === "/login" || url.pathname.startsWith("/login/");
    if (onLogin) {
      if (s.user) deny = redirect(studioHome, s.setCookies);
      else deny = redirect(env.LOGIN_URL, s.setCookies);
    } else if (!s.user) {
      deny = redirect(env.LOGIN_URL, s.setCookies);
    }
  } else if (isMain) {
    const onLogin = url.pathname === "/login" || url.pathname.startsWith("/login/");
    if (onLogin && s.user) {
      deny = redirect(admin ? env.DASH_HOME_URL : studioHome, s.setCookies);
    }
  }
  if (deny) return deny;

  const res = await fetch(req); // teruskan ke Cloudflare Pages (origin)
  const h = new Headers(res.headers);
  h.set("Cache-Control", "private, no-store");
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "DENY");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  s.setCookies.forEach((c) => h.append("Set-Cookie", c));
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) return handleApi(env, req, url);

    // Jika ada kode auth dari Supabase (misal fallback ke / atau /login), teruskan ke handler callback
    if (url.searchParams.has("code")) {
      return redirect(`/api/auth/callback${url.search}`);
    }

    const isStudio = url.hostname.startsWith("studio.") || url.hostname.startsWith("app.");
    const isDash = url.hostname.startsWith("dash.");
    const isMainLogin = url.pathname === "/login" || url.pathname.startsWith("/login/");
    const guarded = isStudio || isDash || isMainLogin;

    if (guarded && (req.method === "GET" || req.method === "HEAD") && !isAsset(url.pathname)) {
      return guardPage(env, req, url);
    }
    return fetch(req);
  },
} satisfies ExportedHandler<Env>;
