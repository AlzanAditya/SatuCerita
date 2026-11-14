/**
 * API admin (khusus akun admin; dash.satucerita.app). Semua data dibaca dengan SERVICE ROLE di Worker,
 * jadi browser tidak pernah memegang kunci dan tidak bergantung pada RLS.
 *
 *   GET /api/admin/overview   pengguna, pesanan, template, dan undangan untuk seluruh halaman dash
 *
 * Hanya MEMBACA. Status pembayaran tidak pernah diubah dari sini: pelunasan hanya lewat webhook/sinkronisasi Midtrans
 * (lihat webhook.ts / state.ts); pesanan `needs_review` (nominal tidak cocok / fraud challenge) harus ditinjau di Midtrans.
 */
import type { Env } from "./types";
import { isDev, json } from "./http";
import { isAdminUser, resolveSession } from "./session";
import { dbSelect } from "./db";
import { PAYMENT_METHODS } from "./pricing";
import { TEMPLATES_DATA } from "../../src/data/templates";

async function requireAdmin(env: Env, req: Request): Promise<{ cookies: string[] } | Response> {
  const s = await resolveSession(env, req);
  if (!s.user) return json({ error: "Belum login." }, 401, s.setCookies);
  if (!isAdminUser(env, s.user)) return json({ error: "Akses ditolak." }, 403, s.setCookies);
  return { cookies: s.setCookies };
}

/** PostgREST membatasi 1000 baris per request (max-rows Supabase), jadi baca berhalaman. Query WAJIB punya `order=` yang stabil. */
async function selectAll<T>(env: Env, table: string, query: string, maxRows = 20_000): Promise<T[]> {
  const page = 1000;
  const out: T[] = [];
  for (let offset = 0; offset < maxRows; offset += page) {
    const rows = await dbSelect<T>(env, table, `${query}&limit=${page}&offset=${offset}`);
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}

interface ProfileRow { id: string; email: string; full_name: string | null; phone: string | null; avatar_url: string | null; role: string; created_at: string }
interface OrderRow {
  invoice_no: string; user_id: string | null; template_slug: string; template_title: string; template_category: string | null; template_cover: string | null;
  package_tier: string | null; base_price: number; discount_amount: number; gross_amount: number; payment_method: string; status: string;
  customer_name: string | null; customer_email: string | null; customer_phone: string | null; created_at: string; paid_at: string | null;
}
interface InvRow {
  id: string; user_id: string; slug: string; title: string | null; status: string; template_slug: string; published_at: string | null; created_at: string;
  groom: string | null; groom_nick: string | null; bride: string | null; bride_nick: string | null; event_date: string | null;
}

const ORDER_STATUS: Record<string, string> = {
  paid: "LUNAS",
  needs_review: "MENUNGGU_VERIFIKASI",
  pending: "MENUNGGU_BAYAR",
  expired: "DIBATALKAN",
  cancelled: "DIBATALKAN",
  failed: "DIBATALKAN",
};
const INV_STATUS: Record<string, string> = { published: "Online", draft: "Draf", archived: "Arsip" };

const publicBase = (env: Env, url: URL): string => {
  if (isDev(env)) return env.DEV_ORIGIN || url.origin;
  const root = env.COOKIE_DOMAIN ? env.COOKIE_DOMAIN.trim().replace(/^\./, "") : "";
  return root ? `https://${root}` : url.origin;
};

const countBy = <T>(rows: T[], key: (r: T) => string): Map<string, number> => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return m;
};

export async function adminOverview(env: Env, req: Request, url: URL): Promise<Response> {
  const a = await requireAdmin(env, req);
  if (a instanceof Response) return a;
  try {
    const [profiles, orders, invs, guests, wishes, tplRows] = await Promise.all([
      selectAll<ProfileRow>(env, "profiles", "select=id,email,full_name,phone,avatar_url,role,created_at&order=created_at.desc,id.asc"),
      selectAll<OrderRow>(
        env, "orders",
        "select=invoice_no,user_id,template_slug,template_title,template_category,template_cover,package_tier,base_price,discount_amount,gross_amount,payment_method,status,customer_name,customer_email,customer_phone,created_at,paid_at&order=created_at.desc,id.asc",
      ),
      selectAll<InvRow>(
        env, "invitations",
        "select=id,user_id,slug,title,status,template_slug,published_at,created_at,groom:published_content->groom->>full,groom_nick:published_content->groom->>nick,bride:published_content->bride->>full,bride_nick:published_content->bride->>nick,event_date:published_content->events->0->>date&order=created_at.desc,id.asc",
      ),
      selectAll<{ invitation_id: string }>(env, "invitation_guests", "select=id,invitation_id&order=id.asc"),
      selectAll<{ invitation_id: string; attendance: string }>(env, "invitation_wishes", "select=id,invitation_id,attendance&order=id.asc"),
      dbSelect<{ slug: string; is_active: boolean }>(env, "templates", "select=slug,is_active&limit=200").catch(() => []),
    ]);

    const paid = orders.filter((o) => o.status === "paid");
    const spentByUser = new Map<string, number>();
    for (const o of paid) if (o.user_id) spentByUser.set(o.user_id, (spentByUser.get(o.user_id) ?? 0) + o.gross_amount);
    const invByUser = countBy(invs, (i: InvRow) => i.user_id);
    const guestsByInv = countBy(guests, (g: { invitation_id: string }) => g.invitation_id);
    const wishesByInv = countBy(wishes, (w: { invitation_id: string }) => w.invitation_id);
    const yesByInv = countBy(wishes.filter((w) => w.attendance === "yes"), (w: { invitation_id: string }) => w.invitation_id);

    const users = profiles.map((p) => {
      const spent = spentByUser.get(p.id) ?? 0;
      const count = invByUser.get(p.id) ?? 0;
      return {
        id: p.id,
        name: p.full_name || p.email.split("@")[0],
        email: p.email,
        phone: p.phone || "",
        role: p.role === "admin" ? "Admin" : "Pengguna",
        avatar: p.avatar_url || "",
        joinedAt: p.created_at,
        invitationsCount: count,
        totalSpent: spent,
        status: spent > 0 || count > 0 ? "Aktif" : "Belum Beli",
      };
    });

    const catalog = new Map(TEMPLATES_DATA.map((t) => [t.slug, t]));
    const orderView = orders.map((o) => ({
      id: o.invoice_no,
      customer: o.customer_name || o.customer_email || "-",
      customerEmail: o.customer_email || "",
      customerPhone: o.customer_phone || "",
      template: o.template_title,
      templateSlug: o.template_slug,
      templateCategory: o.template_category || catalog.get(o.template_slug)?.category || "",
      tier: o.package_tier || "",
      amount: o.base_price,
      discount: o.discount_amount,
      total: o.gross_amount,
      paymentMethod: PAYMENT_METHODS[o.payment_method as keyof typeof PAYMENT_METHODS]?.label ?? o.payment_method,
      status: ORDER_STATUS[o.status] ?? "DIBATALKAN",
      createdAt: o.created_at,
      paidAt: o.paid_at,
    }));

    const active = new Map(tplRows.map((t) => [t.slug, t.is_active]));
    const templates = TEMPLATES_DATA.map((t) => {
      const sold = paid.filter((o) => o.template_slug === t.slug);
      return {
        id: t.slug,
        name: t.title,
        category: t.category,
        price: t.discountPrice,
        originalPrice: t.originalPrice,
        totalUsers: sold.length,
        totalRevenue: sold.reduce((n, o) => n + o.gross_amount, 0),
        status: active.get(t.slug) === false ? "Nonaktif" : "Aktif",
        thumbnail: t.image,
      };
    });

    const base = publicBase(env, url);
    const invitations = invs.map((i) => {
      const groom = i.groom || i.groom_nick || "";
      const bride = i.bride || i.bride_nick || "";
      return {
        id: i.id,
        title: i.title || [groom, bride].filter(Boolean).join(" & ") || i.slug,
        groom,
        bride,
        eventDate: i.event_date || "",
        template: catalog.get(i.template_slug)?.title ?? i.template_slug,
        templateSlug: i.template_slug,
        slug: i.slug,
        guestCount: guestsByInv.get(i.id) ?? 0,
        rsvpCount: yesByInv.get(i.id) ?? 0,
        wishesCount: wishesByInv.get(i.id) ?? 0,
        status: INV_STATUS[i.status] ?? i.status,
        createdAt: i.created_at,
        publishedAt: i.published_at,
        publicUrl: `${base}/i/${i.slug}/`,
      };
    });

    return json({ generatedAt: new Date().toISOString(), users, orders: orderView, templates, invitations }, 200, a.cookies);
  } catch (e) {
    console.error("admin.overview_error", { message: e instanceof Error ? e.message : String(e) });
    return json({ error: "Gagal memuat data dashboard." }, 500, a.cookies);
  }
}
