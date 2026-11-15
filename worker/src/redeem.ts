/**
 * Kode redeem (diskon) yang diatur admin.
 *
 * Bagian 1 — dipakai checkout (quote & buat pesanan): `quoteWithRedeem` memvalidasi kode & menghitung potongan DI SERVER.
 * Bagian 2 — API admin (CRUD): GET/POST /api/admin/redeem, PATCH/DELETE /api/admin/redeem/:id.
 *
 * Aturan (lihat juga supabase/migrations/20261115000000_redeem_codes.sql, yang menjadi penjaga terakhir di database):
 *  - Potongan persen (+ batas maksimal rupiah opsional) atau flat.
 *  - Masa berlaku starts_at / expires_at.
 *  - Mode 'per_invitation': tiap pesanan (= 1 undangan) menghabiskan 1 jatah; jatah per akun = max_invitations_per_user.
 *    Mode 'time_based': tidak dibatasi jumlah pesanan selama masa berlaku masih ada.
 *  - Hanya 1 kode per pesanan (tidak bisa ditumpuk).
 *  - Audiens 'all' atau 'selected' (daftar email).
 */
import type { Env, SbUser } from "./types";
import { json } from "./http";
import { dbDelete, dbInsert, dbInsertManyIgnore, dbPatch, dbSelect } from "./db";
import { computeQuote, type QuoteResult } from "./pricing";
import { requireAdmin, selectAll } from "./admin";

export type DiscountType = "percent" | "flat";
export type UsageMode = "per_invitation" | "time_based";
export type Audience = "all" | "selected";

export interface RedeemCodeRow {
  id: string;
  code: string;
  description: string | null;
  discount_type: DiscountType;
  discount_value: number;
  max_discount: number | null;
  usage_mode: UsageMode;
  max_invitations_per_user: number;
  starts_at: string | null;
  expires_at: string | null;
  audience: Audience;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const LIVE_STATUSES = "(pending,paid,needs_review)";
const LIVE = new Set(["pending", "paid", "needs_review"]);
/** Total bayar tidak boleh lebih kecil dari ini (potongan dibatasi supaya pesanan tetap bisa diproses Midtrans). */
const MIN_PAYABLE = 1_000;
const CODE_RE = /^[A-Z0-9_-]{3,32}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;
const MAX_EMAILS = 500;
const enc = encodeURIComponent;

export const MSG = {
  invalid: "Kode redeem tidak valid.",
  notStarted: "Kode redeem belum berlaku.",
  expired: "Kode redeem sudah kedaluwarsa.",
  notEligible: "Kode redeem ini tidak tersedia untuk akunmu.",
  exhausted: "Jatah pemakaian kode redeem ini untuk akunmu sudah habis.",
  stacked: "Hanya satu kode redeem yang dapat digunakan per pesanan.",
  insertRejected: "Kode redeem tidak dapat digunakan. Muat ulang halaman lalu coba lagi.",
} as const;

// =========================================================================== 1) checkout

/** Ubah input mentah menjadi satu kode bersih. Lebih dari satu kode (array / dipisah spasi, koma, dst.) ditolak: tidak bisa ditumpuk. */
export function parseVoucherInput(v: unknown): { ok: true; code: string | null } | { ok: false; error: string } {
  if (v === undefined || v === null) return { ok: true, code: null };
  if (typeof v !== "string") return { ok: false, error: MSG.stacked };
  const s = v.trim().toUpperCase();
  if (!s) return { ok: true, code: null };
  if (/[\s,;+&/|]/.test(s)) return { ok: false, error: MSG.stacked };
  if (!CODE_RE.test(s)) return { ok: false, error: MSG.invalid };
  return { ok: true, code: s };
}

/** Potongan rupiah untuk harga dasar tertentu. Persen dibulatkan, dibatasi `max_discount`, dan total bayar tidak pernah di bawah MIN_PAYABLE. */
export function computeDiscount(rc: Pick<RedeemCodeRow, "discount_type" | "discount_value" | "max_discount">, basePrice: number): number {
  let d = rc.discount_type === "percent" ? Math.round((basePrice * rc.discount_value) / 100) : rc.discount_value;
  if (rc.discount_type === "percent" && rc.max_discount != null) d = Math.min(d, rc.max_discount);
  d = Math.min(d, basePrice - MIN_PAYABLE);
  return Math.max(0, d);
}

type Gate = { ok: true } | { ok: false; error: string };

/**
 * Apakah akun ini boleh memakai kode sekarang? `templateSlug`: pesanan "pending" milik akun untuk template yang sama
 * tidak dihitung sebagai pemakaian, karena akan digantikan/dibatalkan oleh pesanan baru ini (cegah user terkunci oleh pesanannya sendiri).
 */
async function checkEligibility(env: Env, rc: RedeemCodeRow | undefined, user: SbUser, templateSlug: string): Promise<Gate> {
  if (!rc || !rc.is_active) return { ok: false, error: MSG.invalid };
  const now = Date.now();
  if (rc.starts_at && now < Date.parse(rc.starts_at)) return { ok: false, error: MSG.notStarted };
  if (rc.expires_at && now >= Date.parse(rc.expires_at)) return { ok: false, error: MSG.expired };

  if (rc.audience === "selected") {
    const email = (user.email || "").trim().toLowerCase();
    const hit = email
      ? await dbSelect<{ email: string }>(env, "redeem_code_users", `code_id=eq.${enc(rc.id)}&email=eq.${enc(email)}&select=email&limit=1`)
      : [];
    if (!hit.length) return { ok: false, error: MSG.notEligible };
  }

  if (rc.usage_mode === "per_invitation") {
    const rows = await dbSelect<{ status: string; template_slug: string }>(
      env, "orders",
      `user_id=eq.${enc(user.id)}&discount_code=eq.${enc(rc.code)}&status=in.${LIVE_STATUSES}&select=status,template_slug&limit=1000`,
    );
    const used = rows.filter((r) => !(r.status === "pending" && r.template_slug === templateSlug)).length;
    if (used >= rc.max_invitations_per_user) return { ok: false, error: MSG.exhausted };
  }
  // time_based: tidak ada batas jumlah pesanan; cukup masa berlakunya (sudah dicek di atas).
  return { ok: true };
}

/** Harga template + (opsional) satu kode redeem. Satu-satunya jalan menghitung diskon; dipakai quote & buat pesanan. */
export async function quoteWithRedeem(env: Env, user: SbUser, slug: unknown, voucher: unknown): Promise<QuoteResult> {
  const base = computeQuote(slug);
  if (!base.ok) return base;
  const parsed = parseVoucherInput(voucher);
  if (!parsed.ok) return { ok: false, error: parsed.error, status: 400 };
  if (!parsed.code) return base;

  const [rc] = await dbSelect<RedeemCodeRow>(env, "redeem_codes", `code=eq.${enc(parsed.code)}&select=*&limit=1`);
  const gate = await checkEligibility(env, rc, user, base.quote.template.slug);
  if (!gate.ok) return { ok: false, error: gate.error, status: 400 };

  const { template, basePrice } = base.quote;
  const discountAmount = computeDiscount(rc, basePrice);
  const total = basePrice - discountAmount;
  if (discountAmount <= 0 || total <= 0) return { ok: false, error: MSG.invalid, status: 400 };
  return { ok: true, quote: { template, basePrice, discountCode: rc.code, discountAmount, total } };
}

// =========================================================================== 2) API admin

interface Stats { orders: number; paid: number; users: number; discountGiven: number }

const toView = (r: RedeemCodeRow, emails: string[], s: Stats) => ({
  id: r.id,
  code: r.code,
  description: r.description || "",
  discountType: r.discount_type,
  discountValue: r.discount_value,
  maxDiscount: r.max_discount,
  usageMode: r.usage_mode,
  maxInvitationsPerUser: r.max_invitations_per_user,
  startsAt: r.starts_at,
  expiresAt: r.expires_at,
  audience: r.audience,
  emails,
  isActive: r.is_active,
  createdAt: r.created_at,
  stats: s,
});

type Parsed =
  | { ok: true; row: Omit<RedeemCodeRow, "id" | "created_at" | "updated_at">; emails: string[] | null }
  | { ok: false; error: string };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

function intIn(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) && n >= min && n <= max ? n : null;
}

function readDate(v: unknown): { ok: true; value: string | null } | { ok: false } {
  if (v === null || v === "") return { ok: true, value: null };
  if (typeof v !== "string") return { ok: false };
  const t = Date.parse(v);
  return Number.isNaN(t) ? { ok: false } : { ok: true, value: new Date(t).toISOString() };
}

/**
 * Baca & validasi input admin. `cur` = baris yang sedang diedit (PATCH parsial: field yang tidak dikirim dipertahankan).
 * `curEmails` = daftar email yang sudah tersimpan. Validasi selalu atas hasil gabungan, mencerminkan constraint di database.
 */
export function parseRedeemInput(body: unknown, cur: RedeemCodeRow | null, curEmails: string[]): Parsed {
  if (!isObj(body)) return { ok: false, error: "Permintaan tidak valid." };
  const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);
  const creating = !cur;

  // Nama kode (hanya saat membuat; tidak bisa diubah sesudahnya).
  let code = cur?.code ?? "";
  if (creating) {
    const c = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
    if (!CODE_RE.test(c)) return { ok: false, error: "Kode harus 3–32 karakter: huruf A–Z, angka, tanda - atau _." };
    code = c;
  } else if (has("code") && String(body.code).trim().toUpperCase() !== cur.code) {
    return { ok: false, error: "Nama kode tidak bisa diubah. Buat kode baru jika perlu." };
  }

  let description = cur?.description ?? null;
  if (has("description")) {
    if (body.description === null || body.description === "") description = null;
    else if (typeof body.description === "string" && body.description.trim().length <= 120) description = body.description.trim() || null;
    else return { ok: false, error: "Keterangan maksimal 120 karakter." };
  }

  let discountType = cur?.discount_type ?? ("percent" as DiscountType);
  if (has("discountType")) {
    if (body.discountType !== "percent" && body.discountType !== "flat") return { ok: false, error: "Jenis potongan harus persen atau flat." };
    discountType = body.discountType;
  }

  let discountValue = cur?.discount_value ?? 0;
  if (has("discountValue") || creating) {
    const v = intIn(body.discountValue, 1, discountType === "percent" ? 100 : 10_000_000);
    if (v === null) {
      return { ok: false, error: discountType === "percent" ? "Persen potongan harus bilangan bulat 1–100." : "Nominal potongan harus bilangan bulat 1–10.000.000." };
    }
    discountValue = v;
  } else if (discountType === "percent" ? discountValue > 100 : discountValue > 10_000_000) {
    return { ok: false, error: "Nilai potongan tidak sesuai jenisnya." };
  }

  // Batas maksimal potongan hanya bermakna untuk persen.
  let maxDiscount = cur?.max_discount ?? null;
  if (has("maxDiscount")) {
    if (body.maxDiscount === null || body.maxDiscount === "") maxDiscount = null;
    else {
      const v = intIn(body.maxDiscount, 1, 10_000_000);
      if (v === null) return { ok: false, error: "Batas maksimal potongan harus bilangan bulat 1–10.000.000." };
      maxDiscount = v;
    }
  }
  if (discountType === "flat") maxDiscount = null;

  let usageMode = cur?.usage_mode ?? ("per_invitation" as UsageMode);
  if (has("usageMode")) {
    if (body.usageMode !== "per_invitation" && body.usageMode !== "time_based") return { ok: false, error: "Mode pemakaian tidak valid." };
    usageMode = body.usageMode;
  }

  let perUser = cur?.max_invitations_per_user ?? 1;
  if (has("maxInvitationsPerUser")) {
    const v = intIn(body.maxInvitationsPerUser, 1, 1000);
    if (v === null) return { ok: false, error: "Jatah undangan per akun harus bilangan bulat 1–1000." };
    perUser = v;
  }

  let startsAt = cur?.starts_at ?? null;
  if (has("startsAt")) {
    const d = readDate(body.startsAt);
    if (!d.ok) return { ok: false, error: "Tanggal mulai tidak valid." };
    startsAt = d.value;
  }
  let expiresAt = cur?.expires_at ?? null;
  if (has("expiresAt")) {
    const d = readDate(body.expiresAt);
    if (!d.ok) return { ok: false, error: "Tanggal berakhir tidak valid." };
    expiresAt = d.value;
  }
  if (usageMode === "time_based" && !expiresAt) return { ok: false, error: "Mode berdasarkan waktu wajib punya tanggal berakhir." };
  if (startsAt && expiresAt && Date.parse(expiresAt) <= Date.parse(startsAt)) return { ok: false, error: "Tanggal berakhir harus setelah tanggal mulai." };
  if (creating && expiresAt && Date.parse(expiresAt) <= Date.now()) return { ok: false, error: "Tanggal berakhir sudah lewat." };

  let audience = cur?.audience ?? ("all" as Audience);
  if (has("audience")) {
    if (body.audience !== "all" && body.audience !== "selected") return { ok: false, error: "Audiens tidak valid." };
    audience = body.audience;
  }

  let emails: string[] | null = null; // null = daftar email tidak diubah
  if (has("emails")) {
    if (!Array.isArray(body.emails)) return { ok: false, error: "Daftar email tidak valid." };
    const seen = new Set<string>();
    for (const e of body.emails) {
      const m = typeof e === "string" ? e.trim().toLowerCase() : "";
      if (!m) continue;
      if (m.length > 254 || !EMAIL_RE.test(m)) return { ok: false, error: `Email tidak valid: ${String(e).slice(0, 60)}` };
      seen.add(m);
    }
    if (seen.size > MAX_EMAILS) return { ok: false, error: `Maksimal ${MAX_EMAILS} email per kode.` };
    emails = [...seen];
  }
  if (audience === "selected" && (emails ?? curEmails).length === 0) {
    return { ok: false, error: "Pilih minimal satu email untuk kode yang hanya berlaku bagi pengguna tertentu." };
  }

  let isActive = cur?.is_active ?? true;
  if (has("isActive")) {
    if (typeof body.isActive !== "boolean") return { ok: false, error: "Status aktif tidak valid." };
    isActive = body.isActive;
  }

  return {
    ok: true,
    emails,
    row: {
      code, description, discount_type: discountType, discount_value: discountValue, max_discount: maxDiscount,
      usage_mode: usageMode, max_invitations_per_user: perUser, starts_at: startsAt, expires_at: expiresAt,
      audience, is_active: isActive,
    },
  };
}

function fail(e: unknown, cookies: string[]): Response {
  console.error("admin.redeem_error", { message: e instanceof Error ? e.message : String(e) });
  return json({ error: "Terjadi gangguan di server. Coba lagi sebentar lagi." }, 500, cookies);
}

const emailsOf = async (env: Env, id: string): Promise<string[]> =>
  (await dbSelect<{ email: string }>(env, "redeem_code_users", `code_id=eq.${enc(id)}&select=email&order=email.asc&limit=1000`)).map((r) => r.email);

/** Samakan daftar email di database dengan `want` (tambah yang baru, hapus yang tidak ada lagi). */
async function syncEmails(env: Env, id: string, want: string[], have: string[]): Promise<void> {
  const haveSet = new Set(have);
  const wantSet = new Set(want);
  await dbInsertManyIgnore(env, "redeem_code_users", want.filter((e) => !haveSet.has(e)).map((email) => ({ code_id: id, email })), "code_id,email");
  for (const email of have.filter((e) => !wantSet.has(e))) {
    await dbDelete(env, "redeem_code_users", `code_id=eq.${enc(id)}&email=eq.${enc(email)}`);
  }
}

// ---- GET /api/admin/redeem
export async function listRedeemCodes(env: Env, req: Request): Promise<Response> {
  const a = await requireAdmin(env, req);
  if (a instanceof Response) return a;
  try {
    const [codes, mails, orders] = await Promise.all([
      selectAll<RedeemCodeRow>(env, "redeem_codes", "select=*&order=created_at.desc,id.asc"),
      selectAll<{ code_id: string; email: string }>(env, "redeem_code_users", "select=code_id,email&order=code_id.asc,email.asc"),
      selectAll<{ discount_code: string; status: string; discount_amount: number; user_id: string | null }>(
        env, "orders", "discount_code=not.is.null&select=discount_code,status,discount_amount,user_id&order=created_at.desc,id.asc",
      ),
    ]);
    const emailsByCode = new Map<string, string[]>();
    for (const m of mails) (emailsByCode.get(m.code_id) ?? emailsByCode.set(m.code_id, []).get(m.code_id)!).push(m.email);

    const stats = new Map<string, Stats & { u: Set<string> }>();
    for (const o of orders) {
      if (!LIVE.has(o.status)) continue;
      const s = stats.get(o.discount_code) ?? stats.set(o.discount_code, { orders: 0, paid: 0, users: 0, discountGiven: 0, u: new Set() }).get(o.discount_code)!;
      s.orders++;
      if (o.user_id) s.u.add(o.user_id);
      if (o.status === "paid") { s.paid++; s.discountGiven += o.discount_amount; }
    }
    const out = codes.map((c) => {
      const s = stats.get(c.code);
      return toView(c, emailsByCode.get(c.id) ?? [], { orders: s?.orders ?? 0, paid: s?.paid ?? 0, users: s?.u.size ?? 0, discountGiven: s?.discountGiven ?? 0 });
    });
    return json({ codes: out }, 200, a.cookies);
  } catch (e) {
    return fail(e, a.cookies);
  }
}

// ---- POST /api/admin/redeem
export async function createRedeemCode(env: Env, req: Request, body: unknown): Promise<Response> {
  const a = await requireAdmin(env, req);
  if (a instanceof Response) return a;
  const p = parseRedeemInput(body, null, []);
  if (!p.ok) return json({ error: p.error }, 400, a.cookies);
  try {
    const ins = await dbInsert<RedeemCodeRow>(env, "redeem_codes", p.row);
    if (ins.status === 409 || !ins.rows[0]) return json({ error: "Kode redeem dengan nama ini sudah ada." }, 409, a.cookies);
    const created = ins.rows[0];
    const emails = p.emails ?? [];
    try {
      await syncEmails(env, created.id, emails, []);
    } catch (e) {
      // Jangan tinggalkan kode "untuk pengguna tertentu" tanpa daftar: batalkan pembuatannya.
      await dbDelete(env, "redeem_codes", `id=eq.${enc(created.id)}`).catch(() => null);
      throw e;
    }
    console.log(JSON.stringify({ evt: "redeem.created", code: created.code }));
    return json({ code: toView(created, emails, { orders: 0, paid: 0, users: 0, discountGiven: 0 }) }, 201, a.cookies);
  } catch (e) {
    return fail(e, a.cookies);
  }
}

// ---- PATCH /api/admin/redeem/:id
export async function updateRedeemCode(env: Env, req: Request, id: string, body: unknown): Promise<Response> {
  const a = await requireAdmin(env, req);
  if (a instanceof Response) return a;
  if (!UUID_RE.test(id)) return json({ error: "Kode redeem tidak ditemukan." }, 404, a.cookies);
  try {
    const [cur] = await dbSelect<RedeemCodeRow>(env, "redeem_codes", `id=eq.${enc(id)}&select=*&limit=1`);
    if (!cur) return json({ error: "Kode redeem tidak ditemukan." }, 404, a.cookies);
    const have = await emailsOf(env, id);
    const p = parseRedeemInput(body, cur, have);
    if (!p.ok) return json({ error: p.error }, 400, a.cookies);

    const { code: _code, ...patch } = p.row; // nama kode tidak pernah ikut diubah
    const [saved] = await dbPatch<RedeemCodeRow>(env, "redeem_codes", `id=eq.${enc(id)}`, patch);
    if (!saved) return json({ error: "Kode redeem tidak ditemukan." }, 404, a.cookies);
    let emails = have;
    if (p.emails) {
      await syncEmails(env, id, p.emails, have);
      emails = p.emails;
    }
    console.log(JSON.stringify({ evt: "redeem.updated", code: saved.code, active: saved.is_active }));
    return json({ code: toView(saved, emails, { orders: 0, paid: 0, users: 0, discountGiven: 0 }) }, 200, a.cookies);
  } catch (e) {
    return fail(e, a.cookies);
  }
}

// ---- DELETE /api/admin/redeem/:id
export async function deleteRedeemCode(env: Env, req: Request, id: string): Promise<Response> {
  const a = await requireAdmin(env, req);
  if (a instanceof Response) return a;
  if (!UUID_RE.test(id)) return json({ error: "Kode redeem tidak ditemukan." }, 404, a.cookies);
  try {
    const [cur] = await dbSelect<RedeemCodeRow>(env, "redeem_codes", `id=eq.${enc(id)}&select=id,code&limit=1`);
    if (!cur) return json({ error: "Kode redeem tidak ditemukan." }, 404, a.cookies);
    // Kode yang pernah dipakai tidak dihapus: riwayat pemakaian dihitung dari nama kodenya. Nonaktifkan saja.
    const used = await dbSelect<{ id: string }>(env, "orders", `discount_code=eq.${enc(cur.code)}&select=id&limit=1`);
    if (used.length) return json({ error: "Kode ini sudah pernah dipakai pada pesanan, jadi tidak bisa dihapus. Nonaktifkan saja." }, 409, a.cookies);
    await dbDelete(env, "redeem_codes", `id=eq.${enc(id)}`);
    console.log(JSON.stringify({ evt: "redeem.deleted", code: cur.code }));
    return json({ ok: true }, 200, a.cookies);
  } catch (e) {
    return fail(e, a.cookies);
  }
}
