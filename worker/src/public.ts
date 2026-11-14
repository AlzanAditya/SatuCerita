/**
 * Rute publik (tanpa login):
 *   /i/{slug}/            undangan yang sudah dipublikasi (HTML hasil render)
 *   /i/{slug}/{path}      file template (css/js/aset) — relatif terhadap halaman, jadi template tidak perlu diubah
 *   /templates/{tpl}/...  template mentah (demo / pratinjau katalog)
 *   /m/{id}/{file}        foto unggahan user
 *   /api/public/{slug}/wishes (GET) & /rsvp (POST)
 */
import type { Env } from "./types";
import { json, readJson } from "./http";
import { dbInsert, dbSelect } from "./db";
import { allow } from "./ratelimit";
import { renderInvitation } from "./render";
import { MEDIA_CACHE, mediaKey, safePath, serveObject, templateKey, TEMPLATE_CACHE } from "./storage";
import { getManifest, validSlug } from "../../shared/templates";

const NOINDEX = { "X-Robots-Tag": "noindex, nofollow" };
const notFoundPage = () =>
  new Response("<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'><title>Undangan tidak ditemukan</title><body style='font-family:system-ui;text-align:center;padding:4rem 1rem'><h1>Undangan tidak ditemukan</h1><p>Periksa kembali link yang Anda terima.</p>", {
    status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", ...NOINDEX },
  });

const slugTpl = new Map<string, { tpl: string; exp: number }>();
/** slug / id undangan -> slug template (dicache 5 menit). Dipakai untuk melayani aset template. */
export async function templateOf(env: Env, by: "slug" | "id", value: string): Promise<string | null> {
  const k = `${by}:${value}`;
  const hit = slugTpl.get(k);
  if (hit && hit.exp > Date.now()) return hit.tpl;
  const rows = await dbSelect<{ template_slug: string }>(env, "invitations", `${by}=eq.${encodeURIComponent(value)}&select=template_slug&limit=1`);
  if (!rows[0]) return null;
  slugTpl.set(k, { tpl: rows[0].template_slug, exp: Date.now() + 300_000 });
  return rows[0].template_slug;
}

export async function serveTemplateAsset(env: Env, req: Request, ctx: ExecutionContext | undefined, tpl: string, rawPath: string): Promise<Response> {
  const p = safePath(rawPath);
  if (!p || !getManifest(tpl)) return new Response("Not found", { status: 404 });
  return serveObject(env, req, ctx, templateKey(tpl, p), { cacheControl: TEMPLATE_CACHE });
}

export async function handlePublicAsset(env: Env, req: Request, url: URL, ctx?: ExecutionContext): Promise<Response | null> {
  const p = url.pathname;
  if (req.method !== "GET" && req.method !== "HEAD") return null;

  const media = /^\/m\/([0-9a-f-]{36})\/([A-Za-z0-9._-]+)$/.exec(p);
  if (media) return serveObject(env, req, ctx, mediaKey(media[1], media[2]), { cacheControl: MEDIA_CACHE });

  const tplRaw = /^\/templates\/([a-z0-9-]+)\/(.+)$/.exec(p);
  if (tplRaw) return serveTemplateAsset(env, req, ctx, tplRaw[1], tplRaw[2]);

  const inv = /^\/i\/([a-z0-9-]+)(\/.*)?$/.exec(p);
  if (!inv) return null;
  const [, slug, rest = ""] = inv;
  if (!validSlug(slug)) return notFoundPage();
  if (rest === "") return new Response(null, { status: 301, headers: { Location: `/i/${slug}/${url.search}`, "Cache-Control": "public, max-age=3600" } });
  if (rest !== "/") {
    const tpl = await templateOf(env, "slug", slug);
    return tpl ? serveTemplateAsset(env, req, ctx, tpl, rest) : notFoundPage();
  }

  const rows = await dbSelect<{ id: string; template_slug: string; published_content: Record<string, unknown> | null }>(
    env, "invitations", `slug=eq.${slug}&status=eq.published&select=id,template_slug,published_content&limit=1`,
  );
  const row = rows[0];
  if (!row?.published_content) return notFoundPage();

  let guest: { name: string; code: string; maxPax: number } | null = null;
  const g = url.searchParams.get("g");
  if (g && /^[a-z0-9]{4,16}$/i.test(g)) {
    const gr = await dbSelect<{ name: string; code: string; max_pax: number }>(env, "invitation_guests", `invitation_id=eq.${row.id}&code=eq.${encodeURIComponent(g)}&select=name,code,max_pax&limit=1`);
    if (gr[0]) guest = { name: gr[0].name, code: gr[0].code, maxPax: gr[0].max_pax };
  }
  return renderInvitation(env, { tpl: row.template_slug, content: row.published_content, mode: "public", origin: url.origin, slug, guest });
}

// ------------------------------------------------------------------ RSVP & ucapan publik
const getPublished = async (env: Env, slug: string) => {
  if (!validSlug(slug)) return null;
  const rows = await dbSelect<{ id: string; max: string | null }>(env, "invitations", `slug=eq.${slug}&status=eq.published&select=id,max:published_content->rsvp->>max_guests&limit=1`);
  return rows[0] ?? null;
};

export async function getWishes(env: Env, url: URL, slug: string): Promise<Response> {
  const inv = await getPublished(env, slug);
  if (!inv) return json({ error: { message: "Undangan tidak ditemukan." } }, 404);
  const perPage = Math.min(Math.max(Number(url.searchParams.get("perPage")) || 20, 1), 50);
  const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
  const q = `invitation_id=eq.${inv.id}&is_hidden=eq.false`;
  const [rows, all] = await Promise.all([
    dbSelect<{ id: string; name: string; attendance: string; guest_count: number; message: string; created_at: string }>(
      env, "invitation_wishes", `${q}&select=id,name,attendance,guest_count,message,created_at&order=created_at.desc&limit=${perPage}&offset=${(page - 1) * perPage}`),
    dbSelect<{ attendance: string }>(env, "invitation_wishes", `${q}&select=attendance&limit=5000`),
  ]);
  return json({
    data: rows.map((r) => ({ id: r.id, name: r.name, attendance: r.attendance, guestCount: r.guest_count, message: r.message, createdAt: r.created_at })),
    stats: { total: all.length, yes: all.filter((a) => a.attendance === "yes").length, no: all.filter((a) => a.attendance === "no").length },
    page, perPage,
  });
}

export async function postRsvp(env: Env, req: Request, slug: string): Promise<Response> {
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  if (!(await allow(env.RL_RSVP, `${ip}:${slug}`))) return json({ error: { message: "Terlalu banyak percobaan. Coba lagi sebentar lagi." } }, 429);
  const inv = await getPublished(env, slug);
  if (!inv) return json({ error: { message: "Undangan tidak ditemukan." } }, 404);
  const b = await readJson(req);
  if (!b) return json({ error: { message: "Data tidak valid." } }, 422);

  const name = String(b.name ?? "").replace(/\s+/g, " ").trim();
  const message = String(b.message ?? "").trim();
  const attendance = String(b.attendance ?? "");
  const max = Math.min(Math.max(Number(inv.max) || 2, 1), 10);
  if (!name || name.length > 60) return json({ error: { message: "Nama wajib diisi (maks. 60 karakter)." } }, 422);
  if (!["yes", "no", "maybe"].includes(attendance)) return json({ error: { message: "Pilih konfirmasi kehadiran." } }, 422);
  if (!message || message.length > 500) return json({ error: { message: "Ucapan wajib diisi (maks. 500 karakter)." } }, 422);
  const guestCount = attendance === "no" ? 1 : Math.min(Math.max(Math.round(Number(b.guestCount)) || 1, 1), max);

  let guestId: string | null = null;
  const code = typeof b.guestCode === "string" ? b.guestCode : "";
  if (/^[a-z0-9]{4,16}$/i.test(code)) {
    const g = await dbSelect<{ id: string }>(env, "invitation_guests", `invitation_id=eq.${inv.id}&code=eq.${encodeURIComponent(code)}&select=id&limit=1`);
    guestId = g[0]?.id ?? null;
  }
  const { rows } = await dbInsert<{ id: string; created_at: string }>(env, "invitation_wishes", {
    invitation_id: inv.id, guest_id: guestId, name, attendance, guest_count: guestCount, message,
  });
  const r = rows[0];
  return json({ data: { id: r?.id, name, attendance, guestCount, message, createdAt: r?.created_at ?? new Date().toISOString() } }, 201);
}
