/**
 * Akses R2. Struktur key:
 *   templates/{slug}/{path}                 -> file template, sama persis dengan src/templates/{slug}/ (tanpa hash)
 *   invitations/{invitationId}/{file}       -> foto unggahan user
 */
import type { Env } from "./types";

const CT: Record<string, string> = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json; charset=utf-8",
  svg: "image/svg+xml", webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", ico: "image/x-icon",
  woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", mp3: "audio/mpeg", m4a: "audio/mp4", mp4: "video/mp4", webm: "video/webm", txt: "text/plain; charset=utf-8",
  webmanifest: "application/manifest+json",
};
export const contentTypeFor = (path: string): string => CT[(path.split(".").pop() || "").toLowerCase()] || "application/octet-stream";

/** Path relatif aman: tanpa "..", backslash, atau awalan "/". Mengembalikan null bila tidak valid. */
export function safePath(raw: string): string | null {
  let p: string;
  try {
    p = decodeURIComponent(raw);
  } catch {
    return null;
  }
  p = p.replace(/^\/+/, "");
  if (!p || p.length > 200 || p.includes("\\") || p.split("/").some((s) => s === ".." || s === "." || s === "") || !/^[A-Za-z0-9._\-/]+$/.test(p)) return null;
  return p;
}

export const templateKey = (tpl: string, path: string) => `templates/${tpl}/${path}`;
export const mediaKey = (invitationId: string, file: string) => `invitations/${invitationId}/${file}`;

const htmlCache = new Map<string, { html: string; exp: number }>();

/** index.html template (dicache 60 detik di memori isolate). */
export async function getTemplateHtml(env: Env, tpl: string): Promise<string | null> {
  const hit = htmlCache.get(tpl);
  if (hit && hit.exp > Date.now()) return hit.html;
  const obj = await env.ASSETS_BUCKET.get(templateKey(tpl, "index.html"));
  if (!obj) return null;
  const html = await obj.text();
  htmlCache.set(tpl, { html, exp: Date.now() + 60_000 });
  return html;
}

export interface ServeOpts {
  cacheControl: string;
  /** Tambahan header, mis. X-Robots-Tag. */
  extra?: Record<string, string>;
}

/** Layani satu objek R2 (dengan ETag/304 dan Cache API). */
export async function serveObject(env: Env, req: Request, ctx: ExecutionContext | undefined, key: string, o: ServeOpts): Promise<Response> {
  const cache = (globalThis as unknown as { caches: { default: Cache } }).caches.default;
  const cacheKey = new Request(`https://cache.internal/${key}`, { headers: req.headers });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const obj = await env.ASSETS_BUCKET.get(key);
  if (!obj) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  const h = new Headers({
    "Content-Type": obj.httpMetadata?.contentType || contentTypeFor(key),
    "Cache-Control": o.cacheControl,
    ETag: obj.httpEtag,
    "X-Content-Type-Options": "nosniff",
    ...(o.extra ?? {}),
  });
  if (req.headers.get("If-None-Match") === obj.httpEtag) return new Response(null, { status: 304, headers: h });
  h.set("Content-Length", String(obj.size));
  const res = new Response(req.method === "HEAD" ? null : obj.body, { status: 200, headers: h });
  if (req.method === "GET" && ctx) ctx.waitUntil(cache.put(cacheKey, res.clone()));
  return res;
}

export const TEMPLATE_CACHE = "public, max-age=300, stale-while-revalidate=86400";
export const MEDIA_CACHE = "public, max-age=31536000, immutable";
