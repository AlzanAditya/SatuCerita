/**
 * API pemilik undangan (wajib login). Semua tulis lewat Worker (service role) dengan filter user_id eksplisit:
 * validasi konten mengikuti manifest template, foto diunggah ke R2.
 *
 *   GET    /api/invitations                         daftar undangan milik user
 *   GET    /api/invitations/:id                     detail + manifest form + foto
 *   PUT    /api/invitations/:id                     simpan draft {content?, progressStep?, slug?, title?}
 *   POST   /api/invitations/:id/publish             salin draft -> versi tayang
 *   POST   /api/invitations/:id/media?slot=cover    unggah foto (body = bytes gambar)
 *   DELETE /api/invitations/:id/media/:mediaId
 *   GET    /api/invitations/:id/preview/            pratinjau draft (HTML) + aset di bawahnya
 *   GET|POST /api/invitations/:id/guests, DELETE /api/invitations/:id/guests/:guestId
 *   GET    /api/invitations/:id/wishes, PATCH|DELETE /api/invitations/:id/wishes/:wishId
 *   GET    /api/wishes                              semua ucapan dari undangan TERPUBLIKASI milik user (halaman /studio/ucapan)
 */
import type { Env } from "./types";
import { json, isDev } from "./http";
import { requireUser } from "./orders";
import { DbError, dbDelete, dbInsert, dbPatch, dbSelect } from "./db";
import { allow } from "./ratelimit";
import { renderInvitation } from "./render";
import { mediaKey } from "./storage";
import { serveTemplateAsset, templateOf } from "./public";
import { getManifest, missingRequired, publicManifest, sanitizeContent, validSlug } from "../../shared/templates";

interface InvRow {
  id: string; user_id: string; template_slug: string; slug: string; title: string | null; status: string; progress_step: number;
  content: Record<string, unknown>; published_content: Record<string, unknown> | null; published_at: string | null; created_at: string; updated_at: string;
}
interface MediaRow { id: string; slot: string; sort_order: number; path: string; mime_type: string | null; size_bytes: number | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_UPLOAD = 5 * 1024 * 1024;

const publicBase = (env: Env, url: URL): string => {
  if (isDev(env)) return env.DEV_ORIGIN || url.origin;
  const root = env.COOKIE_DOMAIN ? env.COOKIE_DOMAIN.trim().replace(/^\./, "") : "";
  return root ? `https://${root}` : url.origin;
};

const view = (env: Env, url: URL, r: InvRow) => ({
  id: r.id, slug: r.slug, title: r.title, status: r.status, progressStep: r.progress_step, templateSlug: r.template_slug,
  publishedAt: r.published_at, updatedAt: r.updated_at, createdAt: r.created_at,
  publicUrl: `${publicBase(env, url)}/i/${r.slug}/`,
  hasUnpublishedChanges: !!r.published_at && JSON.stringify(r.content) !== JSON.stringify(r.published_content),
});

const mediaView = (invId: string, m: MediaRow) => ({ id: m.id, slot: m.slot, sortOrder: m.sort_order, url: `/m/${invId}/${m.path.split("/").pop()}` });

async function own(env: Env, userId: string, id: string): Promise<InvRow | null> {
  if (!UUID.test(id)) return null;
  const rows = await dbSelect<InvRow>(env, "invitations", `id=eq.${id}&user_id=eq.${userId}&select=*&limit=1`);
  return rows[0] ?? null;
}

async function readBody(req: Request, max = 64_000): Promise<Record<string, unknown> | null> {
  if (Number(req.headers.get("Content-Length") || "0") > max) return null;
  try {
    const t = await req.text();
    if (t.length > max) return null;
    const b = JSON.parse(t);
    return b && typeof b === "object" ? (b as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const fail = (e: unknown, cookies: string[]) => {
  if (e instanceof DbError && e.status === 409) return json({ error: "Alamat link sudah dipakai. Coba yang lain." }, 409, cookies);
  console.error("invitations.error", { message: e instanceof Error ? e.message : String(e) });
  return json({ error: "Terjadi gangguan di server. Coba lagi sebentar lagi." }, 500, cookies);
};

/** Hitung ulang content.media dari tabel invitation_media (satu-satunya penulis kunci `media`). */
async function syncMedia(env: Env, invId: string, userId: string): Promise<Record<string, unknown>> {
  const [rows, cur] = await Promise.all([
    dbSelect<MediaRow>(env, "invitation_media", `invitation_id=eq.${invId}&select=id,slot,sort_order,path,mime_type,size_bytes&order=sort_order.asc`),
    dbSelect<InvRow>(env, "invitations", `id=eq.${invId}&user_id=eq.${userId}&select=template_slug,content&limit=1`),
  ]);
  const m = cur[0] ? getManifest(cur[0].template_slug) : null;
  const media: Record<string, unknown> = {};
  for (const s of m?.slots ?? []) {
    const urls = rows.filter((r) => r.slot === s.slot).map((r) => mediaView(invId, r).url);
    if (urls.length) media[s.slot] = s.max === 1 ? urls[0] : urls;
  }
  await dbPatch(env, "invitations", `id=eq.${invId}&user_id=eq.${userId}`, { content: { ...(cur[0]?.content ?? {}), media } });
  return media;
}

function sniff(b: Uint8Array): { ext: string; mime: string } | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", mime: "image/png" };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { ext: "webp", mime: "image/webp" };
  return null;
}

interface WishRow { id: string; invitation_id: string; name: string; attendance: string; guest_count: number; message: string; created_at: string }

/** Ucapan dari semua undangan yang sudah dipublikasikan milik user (satu query undangan + satu query ucapan). */
async function ownerWishes(env: Env, userId: string) {
  const invs = await dbSelect<{ id: string; slug: string; title: string | null }>(
    env, "invitations", `user_id=eq.${userId}&status=eq.published&select=id,slug,title&order=published_at.desc&limit=50`,
  );
  if (!invs.length) return { invitations: [], wishes: [] };
  const rows = await dbSelect<WishRow>(
    env, "invitation_wishes",
    `invitation_id=in.(${invs.map((i) => i.id).join(",")})&select=id,invitation_id,name,attendance,guest_count,message,created_at&order=created_at.desc&limit=500`,
  );
  return {
    invitations: invs,
    wishes: rows.map((r) => ({ id: r.id, invitationId: r.invitation_id, name: r.name, attendance: r.attendance, guestCount: r.guest_count, message: r.message, createdAt: r.created_at })),
  };
}

export async function invitationsApi(env: Env, req: Request, url: URL, ctx?: ExecutionContext): Promise<Response | null> {
  if (url.pathname === "/api/wishes") {
    if (req.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const a = await requireUser(env, req);
    if (a instanceof Response) return a;
    try {
      return json(await ownerWishes(env, a.user.id), 200, a.cookies);
    } catch (e) {
      return fail(e, a.cookies);
    }
  }
  const m = /^\/api\/invitations(?:\/([^/]+)(?:\/(.*))?)?$/.exec(url.pathname);
  if (!m) return null;
  const [, id, rest = ""] = m;

  // Aset di bawah pratinjau: file template publik, tak perlu sesi (hanya butuh id undangan yang valid).
  if (id && rest.startsWith("preview/") && rest.length > 8 && req.method === "GET") {
    const tpl = UUID.test(id) ? await templateOf(env, "id", id) : null;
    return tpl ? serveTemplateAsset(env, req, ctx, tpl, rest.slice(8)) : json({ error: "Not found" }, 404);
  }

  const a = await requireUser(env, req);
  if (a instanceof Response) return a;
  const uid = a.user.id;
  const c = a.cookies;

  try {
    if (!id) {
      if (req.method !== "GET") return json({ error: "Method not allowed" }, 405, c);
      const rows = await dbSelect<InvRow>(env, "invitations", `user_id=eq.${uid}&select=id,slug,title,status,progress_step,template_slug,content,published_content,published_at,created_at,updated_at&order=created_at.desc&limit=50`);
      return json({ invitations: rows.map((r) => view(env, url, r)) }, 200, c);
    }
    const inv = await own(env, uid, id);
    if (!inv) return json({ error: "Undangan tidak ditemukan." }, 404, c);
    const manifest = getManifest(inv.template_slug);
    if (!manifest) return json({ error: "Template belum tersedia." }, 409, c);

    // ---- detail ----
    if (rest === "" && req.method === "GET") {
      const media = await dbSelect<MediaRow>(env, "invitation_media", `invitation_id=eq.${id}&select=id,slot,sort_order,path,mime_type,size_bytes&order=sort_order.asc`);
      return json({ invitation: { ...view(env, url, inv), content: inv.content }, manifest: publicManifest(manifest), media: media.map((x) => mediaView(id, x)) }, 200, c);
    }

    // ---- simpan draft ----
    if (rest === "" && req.method === "PUT") {
      const b = await readBody(req);
      if (!b) return json({ error: "Data tidak valid atau terlalu besar." }, 422, c);
      const patch: Record<string, unknown> = {};
      if (b.content && typeof b.content === "object") patch.content = sanitizeContent(manifest, inv.content, b.content as Record<string, unknown>);
      if (typeof b.progressStep === "number") patch.progress_step = Math.max(inv.progress_step, Math.min(Math.max(Math.round(b.progressStep), 0), 5));
      if (typeof b.title === "string") patch.title = b.title.trim().slice(0, 80) || null;
      if (typeof b.slug === "string" && b.slug !== inv.slug) {
        if (inv.published_at) return json({ error: "Link tidak bisa diubah setelah undangan dipublikasikan." }, 409, c);
        if (!validSlug(b.slug)) return json({ error: "Link hanya boleh huruf kecil, angka, dan tanda hubung (3–48 karakter)." }, 422, c);
        patch.slug = b.slug;
      }
      if (!Object.keys(patch).length) return json({ invitation: view(env, url, inv) }, 200, c);
      const [row] = await dbPatch<InvRow>(env, "invitations", `id=eq.${id}&user_id=eq.${uid}`, patch);
      return json({ invitation: view(env, url, row ?? inv) }, 200, c);
    }

    // ---- publikasi ----
    if (rest === "publish" && req.method === "POST") {
      const content = inv.content;
      const media = (content.media ?? {}) as Record<string, unknown>;
      const missing = [
        ...missingRequired(manifest, content),
        ...manifest.slots.filter((s) => s.required && !media[s.slot]).map((s) => s.label),
      ];
      if (missing.length) return json({ error: `Lengkapi dulu: ${missing.join(", ")}.`, missing }, 422, c);
      const [row] = await dbPatch<InvRow>(env, "invitations", `id=eq.${id}&user_id=eq.${uid}`, {
        published_content: content, published_at: new Date().toISOString(), status: "published", progress_step: 5,
      });
      return json({ invitation: view(env, url, row ?? inv) }, 200, c);
    }

    // ---- pratinjau draft ----
    if ((rest === "preview" || rest === "preview/") && req.method === "GET") {
      if (rest === "preview") return new Response(null, { status: 301, headers: { Location: `${url.pathname}/`, "Cache-Control": "no-store" } });
      return renderInvitation(env, { tpl: inv.template_slug, content: inv.content, mode: "preview", origin: url.origin });
    }

    // ---- foto ----
    if (rest === "media" && req.method === "POST") {
      if (!(await allow(env.RL_UPLOAD, uid))) return json({ error: "Terlalu banyak unggahan. Coba lagi sebentar lagi." }, 429, c);
      const slot = url.searchParams.get("slot") || "";
      const def = manifest.slots.find((s) => s.slot === slot);
      if (!def) return json({ error: "Slot foto tidak dikenal." }, 422, c);
      const len = Number(req.headers.get("Content-Length") || "0");
      if (!len || len > MAX_UPLOAD) return json({ error: "Ukuran foto maksimal 5 MB." }, 413, c);
      const buf = await req.arrayBuffer();
      if (buf.byteLength > MAX_UPLOAD) return json({ error: "Ukuran foto maksimal 5 MB." }, 413, c);
      const type = sniff(new Uint8Array(buf.slice(0, 12)));
      if (!type) return json({ error: "Format foto harus JPG, PNG, atau WebP." }, 415, c);

      const existing = await dbSelect<MediaRow>(env, "invitation_media", `invitation_id=eq.${id}&slot=eq.${slot}&select=id,slot,sort_order,path&order=sort_order.asc`);
      let order = 0;
      if (def.max === 1) {
        for (const old of existing) {
          await dbDelete(env, "invitation_media", `id=eq.${old.id}&invitation_id=eq.${id}`);
          await env.ASSETS_BUCKET.delete(old.path);
        }
      } else {
        if (existing.length >= def.max) return json({ error: `Maksimal ${def.max} foto.` }, 409, c);
        const used = new Set(existing.map((e) => e.sort_order));
        while (used.has(order)) order++;
      }
      const key = mediaKey(id, `${slot}-${crypto.randomUUID()}.${type.ext}`);
      await env.ASSETS_BUCKET.put(key, buf, { httpMetadata: { contentType: type.mime, cacheControl: "public, max-age=31536000, immutable" } });
      const { rows } = await dbInsert<MediaRow>(env, "invitation_media", {
        invitation_id: id, slot, sort_order: order, provider: "r2", path: key, mime_type: type.mime, size_bytes: buf.byteLength,
      });
      await syncMedia(env, id, uid);
      return json({ media: mediaView(id, rows[0]) }, 201, c);
    }
    const del = /^media\/([0-9a-f-]{36})$/.exec(rest);
    if (del && req.method === "DELETE") {
      const rows = await dbDelete<MediaRow>(env, "invitation_media", `id=eq.${del[1]}&invitation_id=eq.${id}`);
      if (!rows[0]) return json({ error: "Foto tidak ditemukan." }, 404, c);
      await env.ASSETS_BUCKET.delete(rows[0].path);
      await syncMedia(env, id, uid);
      return json({ ok: true }, 200, c);
    }

    // ---- tamu ----
    if (rest === "guests" && req.method === "GET") {
      const rows = await dbSelect(env, "invitation_guests", `invitation_id=eq.${id}&select=id,name,code,phone,group_label,max_pax,sent_at,opened_at,created_at&order=created_at.desc&limit=1000`);
      return json({ guests: rows, linkBase: `${publicBase(env, url)}/i/${inv.slug}/?g=` }, 200, c);
    }
    if (rest === "guests" && req.method === "POST") {
      const b = await readBody(req, 4000);
      const name = String(b?.name ?? "").replace(/\s+/g, " ").trim();
      if (!name || name.length > 80) return json({ error: "Nama tamu wajib diisi (maks. 80 karakter)." }, 422, c);
      const phoneRaw = String(b?.phone ?? "").replace(/[\s-]/g, "");
      const phone = /^\+[1-9][0-9]{7,14}$/.test(phoneRaw) ? phoneRaw : /^0[0-9]{8,14}$/.test(phoneRaw) ? `+62${phoneRaw.slice(1)}` : null;
      const maxPax = Math.min(Math.max(Math.round(Number(b?.maxPax)) || 2, 1), 10);
      const { rows } = await dbInsert(env, "invitation_guests", { invitation_id: id, name, phone, group_label: String(b?.group ?? "").trim().slice(0, 40) || null, max_pax: maxPax });
      return json({ guest: rows[0] }, 201, c);
    }
    const g = /^guests\/([0-9a-f-]{36})$/.exec(rest);
    if (g && req.method === "DELETE") {
      await dbDelete(env, "invitation_guests", `id=eq.${g[1]}&invitation_id=eq.${id}`);
      return json({ ok: true }, 200, c);
    }

    // ---- ucapan ----
    if (rest === "wishes" && req.method === "GET") {
      const rows = await dbSelect(env, "invitation_wishes", `invitation_id=eq.${id}&select=id,name,attendance,guest_count,message,reactions,is_hidden,created_at&order=created_at.desc&limit=500`);
      return json({ wishes: rows }, 200, c);
    }
    const w = /^wishes\/([0-9a-f-]{36})$/.exec(rest);
    if (w && req.method === "PATCH") {
      const b = await readBody(req, 1000);
      const rows = await dbPatch(env, "invitation_wishes", `id=eq.${w[1]}&invitation_id=eq.${id}`, { is_hidden: b?.hidden === true });
      return rows.length ? json({ ok: true }, 200, c) : json({ error: "Ucapan tidak ditemukan." }, 404, c);
    }
    if (w && req.method === "DELETE") {
      const gone = await dbDelete(env, "invitation_wishes", `id=eq.${w[1]}&invitation_id=eq.${id}`);
      return gone.length ? json({ ok: true }, 200, c) : json({ error: "Ucapan tidak ditemukan." }, 404, c);
    }
    return json({ error: "Not found" }, 404, c);
  } catch (e) {
    return fail(e, c);
  }
}
