/**
 * Endpoint pesanan & pembayaran (Midtrans Core API, UI pembayaran milik sendiri).
 * Prinsip: browser hanya MEMINTA; harga, status, masa berlaku, nomor VA, dan kunci rahasia sepenuhnya dikendalikan server.
 */
import type { Env, SbUser } from "./types";
import { isDev, json } from "./http";
import { resolveSession, sb, toPublicUser } from "./session";
import { DbError, dbInsert, dbPatch, dbSelect } from "./db";
import {
  MidtransError, assertMidtransConfig, cancelTransaction, chargeTransaction, formatWib, getStatus,
  parseGrossAmount, parseMidtransTime, midtransMode, type MidtransStatus,
} from "./midtrans";
import { PAYMENT_METHODS, computeQuote, isPaymentMethod, type PaymentMethodId } from "./pricing";
import { extractPaymentInfo, hasPaymentInfo, mapMidtransStatus, nextStatus, type OrderStatus } from "./state";
import { allow } from "./ratelimit";
import { publishOrderEvent } from "./hub";

const EXPIRY_MINUTES = 24 * 60;
const EXPIRE_GRACE_MS = 5 * 60_000; // toleransi sebelum pesanan tanpa transaksi dianggap kedaluwarsa
const SYNC_COOLDOWN_MS = 8_000;
const CHARGE_INFLIGHT_MS = 30_000; // klaim charge yang lebih baru dari ini dianggap masih berjalan (jangan dibatalkan/diulang)
const INVOICE_RE = /^SC[0-9]{6}-[0-9A-Z]{8}$/;
const IDEM_RE = /^[A-Za-z0-9_-]{16,64}$/;
const LIVE_STATUSES = "(pending,paid,needs_review)";

export interface OrderRow {
  id: string;
  invoice_no: string;
  user_id: string | null;
  template_slug: string;
  template_title: string;
  template_category: string | null;
  template_cover: string | null;
  package_tier: string | null;
  base_price: number;
  discount_code: string | null;
  discount_amount: number;
  gross_amount: number;
  payment_method: PaymentMethodId;
  status: OrderStatus;
  snap_token: string | null;          // LEGACY (era Snap). Tidak lagi ditulis; tidak pernah dikirim ke browser.
  payment_info: Record<string, string>;
  midtrans_trx_id: string | null;
  idempotency_key: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  expires_at: string;
  paid_at: string | null;
  last_synced_at: string | null;
  charge_claimed_at: string | null;   // klaim hak memanggil /v2/charge (lihat migrasi 20261031000000)
  created_at: string;
  updated_at: string;
}

// ------------------------------------------------------------------ helpers
const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // 32 simbol -> tanpa bias modulo

function newInvoiceNo(now: Date): string {
  const w = new Date(now.getTime() + 7 * 3600_000); // tanggal WIB
  const p = (n: number) => String(n).padStart(2, "0");
  const date = `${p(w.getUTCFullYear() % 100)}${p(w.getUTCMonth() + 1)}${p(w.getUTCDate())}`;
  const rnd = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => CROCKFORD[b & 31]).join("");
  return `SC${date}-${rnd}`;
}

const isExpiredByTime = (o: OrderRow) => Date.now() > Date.parse(o.expires_at) + EXPIRE_GRACE_MS;
const isCharged = (o: OrderRow) => !!o.midtrans_trx_id || hasPaymentInfo(o.payment_info);
const chargeInFlight = (o: OrderRow) =>
  !isCharged(o) && !!o.charge_claimed_at && Date.now() - Date.parse(o.charge_claimed_at) < CHARGE_INFLIGHT_MS;
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function log(evt: string, data: Record<string, unknown> = {}) {
  // Hanya invoice/status/kode — TANPA nama, email, telepon, token, atau payload penuh.
  console.log(JSON.stringify({ evt, ...data }));
}

/** Bentuk data yang dikirim ke browser (tanpa kolom internal, tanpa token/kunci apa pun). */
export function toView(env: Env, o: OrderRow) {
  const info = o.payment_info || {};
  return {
    id: o.invoice_no,
    invoiceNo: o.invoice_no,
    date: o.created_at,
    dueDate: o.expires_at,
    paidAt: o.paid_at,
    status: o.status,
    templateName: o.template_title,
    templateCategory: o.template_category || "",
    templateCover: o.template_cover || "",
    packageTier: o.package_tier || "",
    basePrice: o.base_price,
    addons: [] as { id: string; name: string; price: number }[],
    discountCode: o.discount_code || undefined,
    discountAmount: o.discount_amount,
    uniqueCode: 0,
    total: o.gross_amount,
    paymentMethod: o.payment_method,
    paymentLabel: PAYMENT_METHODS[o.payment_method]?.label ?? o.payment_method,
    vaNumber: info.vaNumber,
    bank: info.bank,
    billerCode: info.billerCode,
    billKey: info.billKey,
    qrUrl: info.qrUrl,
    deeplinkUrl: info.deeplinkUrl,
    slug: o.template_slug,
    customerName: o.customer_name || "",
    customerPhone: o.customer_phone || "",
    customerEmail: o.customer_email || "",
    paymentReady: hasPaymentInfo(info),
    environment: midtransMode(env),
  };
}

export type Authed = { user: SbUser; token: string; cookies: string[] };

export async function requireUser(env: Env, req: Request): Promise<Authed | Response> {
  const s = await resolveSession(env, req);
  if (!s.user || !s.token) return json({ error: "Belum login." }, 401, s.setCookies);
  return { user: s.user, token: s.token, cookies: s.setCookies };
}

function configProblem(env: Env): Response | null {
  const problem = assertMidtransConfig(env);
  if (problem) {
    console.error("midtrans.config_error", { problem });
    return json({ error: "Pembayaran belum dikonfigurasi. Hubungi admin." }, 503);
  }
  return null;
}

export async function getOwnedOrder(env: Env, userId: string, invoice: string): Promise<OrderRow | null> {
  if (!INVOICE_RE.test(invoice)) return null;
  const rows = await dbSelect<OrderRow>(
    env, "orders", `invoice_no=eq.${invoice}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
  );
  return rows[0] ?? null;
}

// ------------------------------------------------------------------ inti: terapkan status Midtrans (idempoten, atomik)
/**
 * Satu-satunya pintu yang boleh mengubah status pembayaran dari data Midtrans (webhook, sync, reconcile).
 * Setiap UPDATE SELALU difilter `invoice_no` (tidak pernah mengubah banyak pesanan) dan memakai compare-and-swap pada `status`.
 */
export async function applyMidtransStatus(env: Env, order: OrderRow, st: MidtransStatus, source: string): Promise<OrderRow> {
  let current = order;

  if (st.order_id && st.order_id !== current.invoice_no) {
    log("order.status_ignored", { invoice: current.invoice_no, reason: "order_id_mismatch", source });
    return current;
  }
  // Pesanan era Core API terikat ke SATU transaksi Midtrans. Notifikasi/respons dengan transaction_id lain diabaikan.
  if (current.charge_claimed_at && current.midtrans_trx_id && st.transaction_id && st.transaction_id !== current.midtrans_trx_id) {
    log("order.status_ignored", { invoice: current.invoice_no, reason: "transaction_id_mismatch", source });
    return current;
  }

  let incoming = mapMidtransStatus(st);
  const nowIso = new Date().toISOString();

  if (!incoming) {
    const [row] = await dbPatch<OrderRow>(env, "orders", `invoice_no=eq.${current.invoice_no}`, { last_synced_at: nowIso });
    return row ?? current;
  }

  // Nominal dari Midtrans HARUS sama dengan yang kita simpan; kalau tidak, jangan pernah tandai lunas.
  if (incoming === "paid") {
    const amount = parseGrossAmount(st.gross_amount);
    if (amount !== current.gross_amount) {
      log("order.amount_mismatch", { invoice: current.invoice_no, expected: current.gross_amount, got: st.gross_amount ?? null, source });
      incoming = "needs_review";
    }
  }

  // Compare-and-swap: hanya update jika status di DB masih sama dengan yang kita baca (anti race).
  for (let attempt = 0; attempt < 3; attempt++) {
    const target = nextStatus(current.status, incoming);
    const mergedInfo = { ...(current.payment_info || {}), ...extractPaymentInfo(st) };
    const infoChanged = JSON.stringify(mergedInfo) !== JSON.stringify(current.payment_info || {});
    const trxChanged = !!st.transaction_id && st.transaction_id !== current.midtrans_trx_id;

    // Notifikasi ulang yang tidak mengubah apa pun (replay / telat): jangan menulis ke database sama sekali.
    if (source === "webhook" && target === current.status && !infoChanged && !trxChanged) return current;

    const patch: Record<string, unknown> = { status: target, last_synced_at: nowIso };
    if (infoChanged) patch.payment_info = mergedInfo;
    if (trxChanged && !current.midtrans_trx_id) patch.midtrans_trx_id = st.transaction_id;
    if (target === "paid" && current.status !== "paid") patch.paid_at = nowIso;

    const rows = await dbPatch<OrderRow>(env, "orders", `invoice_no=eq.${current.invoice_no}&status=eq.${current.status}`, patch);
    if (rows[0]) {
      if (rows[0].status !== current.status) {
        log("order.status_changed", { invoice: current.invoice_no, from: current.status, to: rows[0].status, source });
        await publishOrderEvent(env, rows[0]); // dorong ke halaman pembayaran (best-effort; DB sudah benar)
      }
      return rows[0];
    }
    // Ada yang mengubah lebih dulu -> baca ulang lalu coba lagi.
    const fresh = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${current.invoice_no}&select=*&limit=1`);
    if (!fresh[0]) return current;
    current = fresh[0];
  }
  return current;
}

/** Tanya Midtrans lalu sinkronkan. Transaksi belum ada di Midtrans (404) + lewat batas waktu -> kedaluwarsa. */
async function reconcile(env: Env, order: OrderRow, source: string): Promise<OrderRow> {
  const st = await getStatus(env, order.invoice_no);
  if (st.status_code === "404") {
    if (order.status === "pending" && isExpiredByTime(order)) {
      const rows = await dbPatch<OrderRow>(env, "orders", `invoice_no=eq.${order.invoice_no}&status=eq.pending`, {
        status: "expired", last_synced_at: new Date().toISOString(),
      });
      if (rows[0]) {
        log("order.status_changed", { invoice: order.invoice_no, from: "pending", to: "expired", source });
        await publishOrderEvent(env, rows[0]);
      }
      return rows[0] ?? order;
    }
    const rows = await dbPatch<OrderRow>(env, "orders", `invoice_no=eq.${order.invoice_no}`, { last_synced_at: new Date().toISOString() });
    return rows[0] ?? order;
  }
  return applyMidtransStatus(env, order, st, source);
}

function failResponse(e: unknown, cookies: string[] = []): Response {
  if (e instanceof MidtransError && e.httpStatus === 422) {
    return json({ error: "Metode pembayaran ini sedang tidak tersedia. Silakan pilih metode lain." }, 422, cookies);
  }
  if (e instanceof MidtransError) return json({ error: "Layanan pembayaran sedang sibuk. Coba lagi sebentar lagi." }, 502, cookies);
  if (e instanceof DbError) {
    console.error("db.error", { status: e.status, message: e.message });
    return json({ error: "Terjadi gangguan di server. Coba lagi sebentar lagi." }, 500, cookies);
  }
  console.error("orders.unexpected", { message: e instanceof Error ? e.message : String(e) });
  return json({ error: "Terjadi kesalahan. Coba lagi." }, 500, cookies);
}

// ------------------------------------------------------------------ GET /api/payments/config
/** Hanya info non-rahasia. Core API tidak membutuhkan Client Key di browser, jadi TIDAK dikirim. */
export function paymentsConfig(env: Env): Response {
  const problem = assertMidtransConfig(env);
  if (problem) return json({ error: "Pembayaran belum dikonfigurasi." }, 503);
  return json({ environment: midtransMode(env) });
}

// ------------------------------------------------------------------ POST /api/orders/quote
export async function quoteOrder(env: Env, req: Request, body: Record<string, unknown> | null): Promise<Response> {
  const a = await requireUser(env, req);
  if (a instanceof Response) return a;
  const q = computeQuote(body?.templateSlug, body?.voucherCode);
  if (!q.ok) return json({ error: q.error }, q.status, a.cookies);

  if (q.quote.discountCode) {
    const used = await dbSelect<{ id: string }>(
      env, "orders",
      `user_id=eq.${encodeURIComponent(a.user.id)}&discount_code=eq.${encodeURIComponent(q.quote.discountCode)}&status=in.${LIVE_STATUSES}&select=id&limit=1`,
    ).catch(() => []);
    if (used.length) return json({ error: "Voucher ini sudah pernah kamu pakai." }, 400, a.cookies);
  }
  const { basePrice, discountCode, discountAmount, total } = q.quote;
  return json({ basePrice, discountCode, discountAmount, total }, 200, a.cookies);
}

// ------------------------------------------------------------------ POST /api/orders
export async function createOrder(env: Env, req: Request, body: Record<string, unknown> | null): Promise<Response> {
  const bad = configProblem(env);
  if (bad) return bad;
  const a = await requireUser(env, req);
  if (a instanceof Response) return a;

  try {
    if (!(await allow(env.RL_ORDERS, a.user.id))) {
      return json({ error: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." }, 429, a.cookies);
    }

    const method = body?.method;
    const idemKey = body?.idempotencyKey;
    if (!isPaymentMethod(method)) return json({ error: "Metode pembayaran tidak valid." }, 400, a.cookies);
    if (typeof idemKey !== "string" || !IDEM_RE.test(idemKey)) return json({ error: "Permintaan tidak valid." }, 400, a.cookies);

    const q = computeQuote(body?.templateSlug, body?.voucherCode);
    if (!q.ok) return json({ error: q.error }, q.status, a.cookies);
    const { template, basePrice, discountCode, discountAmount, total } = q.quote;

    // 1) Idempotensi: kunci yang sama = permintaan yang sama -> kembalikan pesanan yang sudah ada.
    const same = await dbSelect<OrderRow>(
      env, "orders", `user_id=eq.${encodeURIComponent(a.user.id)}&idempotency_key=eq.${encodeURIComponent(idemKey)}&select=*&limit=1`,
    );
    if (same[0]) return respondWithPayment(env, a, same[0], 200);

    // 2) Sudah ada pesanan pending untuk template ini?
    const pend = await dbSelect<OrderRow>(
      env, "orders", `user_id=eq.${encodeURIComponent(a.user.id)}&template_slug=eq.${encodeURIComponent(template.slug)}&status=eq.pending&select=*&limit=1`,
    );
    if (pend[0]) {
      // Jangan menyentuh pesanan yang transaksinya sedang dibuat request lain (cegah batal-lalu-ter-charge).
      if (chargeInFlight(pend[0])) {
        const sameChoice = pend[0].payment_method === method && pend[0].discount_code === discountCode && pend[0].gross_amount === total;
        if (sameChoice) return respondWithPayment(env, a, pend[0], 200, true);
        return json({ error: "Pesanan sebelumnya sedang diproses. Coba lagi sebentar lagi." }, 409, a.cookies);
      }
      const old = await reconcile(env, pend[0], "create").catch(() => pend[0]);
      if (old.status === "paid") return json({ error: "Template ini sudah kamu bayar.", order: toView(env, old) }, 409, a.cookies);
      if (old.status === "pending") {
        const sameChoice = old.payment_method === method && old.discount_code === discountCode && old.gross_amount === total && isCharged(old);
        if (sameChoice && !isExpiredByTime(old)) return json({ order: toView(env, old), reused: true }, 200, a.cookies);
        const cancelled = await cancelPending(env, old);
        if (cancelled.status !== "cancelled" && cancelled.status !== "expired") {
          return json({ error: "Pesanan sebelumnya masih diproses. Coba lagi sebentar lagi.", order: toView(env, cancelled) }, 409, a.cookies);
        }
      }
    }

    // 3) Voucher sekali pakai per akun (dipaksa juga oleh unique index di DB).
    if (discountCode) {
      const used = await dbSelect<{ id: string }>(
        env, "orders",
        `user_id=eq.${encodeURIComponent(a.user.id)}&discount_code=eq.${encodeURIComponent(discountCode)}&status=in.${LIVE_STATUSES}&select=id&limit=1`,
      );
      if (used.length) return json({ error: "Voucher ini sudah pernah kamu pakai." }, 400, a.cookies);
    }

    // 4) Simpan pesanan (status pending) SEBELUM menghubungi Midtrans.
    const pub = await toPublicUser(env, a.user, a.token);
    const now = new Date();
    const invoiceNo = newInvoiceNo(now);
    const ins = await dbInsert<OrderRow>(env, "orders", {
      invoice_no: invoiceNo,
      user_id: a.user.id,
      template_slug: template.slug,
      template_title: template.title,
      template_category: template.category,
      template_cover: template.image,
      package_tier: template.badge,
      base_price: basePrice,
      discount_code: discountCode,
      discount_amount: discountAmount,
      gross_amount: total,
      payment_method: method,
      status: "pending",
      idempotency_key: idemKey,
      customer_name: pub.name,
      customer_email: pub.email,
      customer_phone: pub.phone || null,
      expires_at: new Date(now.getTime() + EXPIRY_MINUTES * 60_000).toISOString(),
    });
    if (ins.status === 409 || !ins.rows[0]) {
      // Balapan (tab lain / klik ganda): kembalikan yang sudah ada kalau kuncinya sama, selain itu minta ulang.
      const again = await dbSelect<OrderRow>(
        env, "orders", `user_id=eq.${encodeURIComponent(a.user.id)}&idempotency_key=eq.${encodeURIComponent(idemKey)}&select=*&limit=1`,
      );
      if (again[0]) return respondWithPayment(env, a, again[0], 200);
      return json({ error: "Pesanan sedang diproses. Muat ulang halaman lalu coba lagi." }, 409, a.cookies);
    }
    log("order.created", { invoice: invoiceNo, method, total });
    return respondWithPayment(env, a, ins.rows[0], 201);
  } catch (e) {
    return failResponse(e, a.cookies);
  }
}

/**
 * Pastikan pesanan punya instruksi bayar dari Midtrans (membuat transaksi jika belum), lalu kirim ke browser.
 *
 * Anti transaksi ganda (berlapis; debounce di browser BUKAN perlindungan):
 *  1. orders.idempotency_key unik per user  -> klik ganda dengan kunci sama = satu pesanan.
 *  2. Klaim atomik di DB (UPDATE ... WHERE charge_claimed_at IS NULL) -> hanya SATU request yang memanggil /v2/charge.
 *  3. order_id Midtrans = invoice unik -> charge kedua ditolak Midtrans (406) dan dipulihkan lewat Status API.
 *  4. Header Idempotency-Key ke Midtrans (tambahan; tidak semua metode mendukung).
 */
async function respondWithPayment(env: Env, a: Authed, order: OrderRow, okStatus: number, waitOnly = false): Promise<Response> {
  if (order.status !== "pending" || isCharged(order) || isExpiredByTime(order)) {
    return json({ order: toView(env, order) }, okStatus, a.cookies);
  }

  if (!waitOnly) {
    const [claimed] = await dbPatch<OrderRow>(
      env, "orders",
      `invoice_no=eq.${order.invoice_no}&status=eq.pending&charge_claimed_at=is.null&midtrans_trx_id=is.null`,
      { charge_claimed_at: new Date().toISOString() },
    );
    if (claimed) {
      try {
        const done = await chargeOrder(env, claimed);
        return json({ order: toView(env, done) }, okStatus, a.cookies);
      } catch (e) {
        return handleChargeFailure(env, a, claimed, e);
      }
    }
  }

  // Kalah balapan (klik ganda / tab lain): tunggu pemenang menyimpan hasil. Dibatasi ~6 detik, hanya membaca DB.
  for (let i = 0; i < 24; i++) {
    const [cur] = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${order.invoice_no}&select=*&limit=1`);
    if (cur && (cur.status !== "pending" || isCharged(cur))) return json({ order: toView(env, cur) }, okStatus, a.cookies);
    await sleep(250);
  }
  const [last] = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${order.invoice_no}&select=*&limit=1`);
  return json({ order: toView(env, last ?? order) }, okStatus, a.cookies);
}

/** Panggil Midtrans /v2/charge untuk pesanan yang sudah kita klaim, lalu simpan hasilnya. */
async function chargeOrder(env: Env, order: OrderRow): Promise<OrderRow> {
  const finishBase = new URL(env.STUDIO_HOME_URL || env.APP_HOME_URL).origin;
  const finishUrl = `${finishBase}${isDev(env) ? "/app" : ""}/order/${order.invoice_no}`;
  const items = [{ id: order.template_slug.slice(0, 50), price: order.base_price, quantity: 1, name: `Template ${order.template_title}`.slice(0, 50) }];
  if (order.discount_amount > 0) {
    items.push({ id: "DISCOUNT", price: -order.discount_amount, quantity: 1, name: `Voucher ${order.discount_code ?? ""}`.trim().slice(0, 50) });
  }

  const resp = await chargeTransaction(env, {
    orderId: order.invoice_no,
    grossAmount: order.gross_amount,
    method: order.payment_method,
    items,
    customer: {
      first_name: (order.customer_name || "Pelanggan").slice(0, 255),
      email: order.customer_email || "",
      ...(order.customer_phone ? { phone: order.customer_phone } : {}),
    },
    // Hitung kedaluwarsa dari pembuatan pesanan -> sama dengan expires_at kita.
    expiryStartWib: formatWib(new Date(order.created_at)),
    expiryMinutes: EXPIRY_MINUTES,
    gopayCallbackUrl: finishUrl.startsWith("https://") ? finishUrl : undefined,
    billLabel: `Template ${order.template_title}`,
  });

  const code = resp.status_code;
  if (code === "406") {
    // order_id sudah dipakai di Midtrans = transaksi sudah ada (mis. request sebelumnya terputus). Pulihkan, JANGAN charge ulang.
    log("order.charge_duplicate", { invoice: order.invoice_no });
    const existing = await getStatus(env, order.invoice_no);
    return saveCharge(env, order, existing, "charge_recover");
  }
  if (code !== "201" && code !== "200") {
    // 400/402 = permintaan/metode ditolak (mis. kanal belum diaktifkan di dashboard). Detail hanya ke log server.
    console.error("midtrans.charge_rejected", { invoice: order.invoice_no, method: order.payment_method, code, message: String(resp.status_message ?? "").slice(0, 120) });
    throw new MidtransError("Charge ditolak Midtrans.", code === "400" || code === "402" ? 422 : 502);
  }
  return saveCharge(env, order, resp, "charge");
}

/** Validasi respons Midtrans terhadap pesanan kita, lalu simpan instruksi bayar + id transaksi + masa berlaku. */
async function saveCharge(env: Env, order: OrderRow, st: MidtransStatus, source: string): Promise<OrderRow> {
  if (st.order_id !== order.invoice_no || parseGrossAmount(st.gross_amount) !== order.gross_amount || !st.transaction_id) {
    console.error("midtrans.charge_mismatch", { invoice: order.invoice_no, source });
    throw new MidtransError("Respons charge tidak cocok dengan pesanan.", 502);
  }
  const expiry = parseMidtransTime(st.expiry_time);
  const patch: Record<string, unknown> = {
    payment_info: { ...(order.payment_info || {}), ...extractPaymentInfo(st) },
    midtrans_trx_id: st.transaction_id,
    last_synced_at: new Date().toISOString(),
  };
  // Masa berlaku mengikuti Midtrans (sumber kebenaran), asal masuk akal.
  if (expiry && expiry.getTime() > Date.now() && expiry.getTime() < Date.now() + 8 * 24 * 3600_000) patch.expires_at = expiry.toISOString();

  const [saved] = await dbPatch<OrderRow>(env, "orders", `invoice_no=eq.${order.invoice_no}&midtrans_trx_id=is.null`, patch);
  let row = saved;
  if (!row) {
    // Sudah disimpan request lain (balapan): pakai yang tersimpan.
    const [cur] = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${order.invoice_no}&select=*&limit=1`);
    row = cur ?? order;
  }
  log("order.charged", { invoice: order.invoice_no, method: order.payment_method, source });

  // Respons charge biasanya "pending". Bila Midtrans langsung memberi status lain, terapkan lewat jalur yang sama dengan webhook.
  const incoming = mapMidtransStatus(st);
  // (Tidak ada publish ke hub di sini: halaman pesanan baru dibuka SETELAH respons ini, yang sudah memuat instruksi bayar.)
  if (incoming && incoming !== "pending") row = await applyMidtransStatus(env, row, st, source);
  return row;
}

async function handleChargeFailure(env: Env, a: Authed, order: OrderRow, e: unknown): Promise<Response> {
  // Transaksi mungkin sempat terbentuk (timeout SETELAH Midtrans memproses). Cek dulu supaya tidak ada transaksi yatim.
  let st: MidtransStatus | null = null;
  try { st = await getStatus(env, order.invoice_no); } catch { st = null; }

  if (st && st.status_code !== "404" && st.transaction_id) {
    try {
      const recovered = await saveCharge(env, order, st, "charge_recover");
      return json({ order: toView(env, recovered) }, 201, a.cookies);
    } catch (e2) {
      return failResponse(e2, a.cookies);
    }
  }
  if (st && st.status_code === "404") {
    // Pasti tidak ada transaksi di Midtrans -> tutup pesanan ini; user membuat pesanan baru (invoice baru).
    await dbPatch(env, "orders", `invoice_no=eq.${order.invoice_no}&status=eq.pending&midtrans_trx_id=is.null`, { status: "failed" }).catch(() => null);
    const [now] = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${order.invoice_no}&select=*&limit=1`).catch(() => [] as OrderRow[]);
    if (now) await publishOrderEvent(env, now);
    log("order.charge_failed", { invoice: order.invoice_no });
  } else {
    // Status Midtrans tidak diketahui: biarkan pending (klaim tetap), webhook / "Cek status" akan merekonsiliasi.
    log("order.charge_unknown", { invoice: order.invoice_no });
  }
  return failResponse(e, a.cookies);
}

// ------------------------------------------------------------------ GET /api/orders , GET /api/orders/:invoice
export async function listOrders(env: Env, req: Request): Promise<Response> {
  const a = await requireUser(env, req);
  if (a instanceof Response) return a;
  // Dibaca dengan token user -> RLS memastikan hanya miliknya.
  const r = await sb(env, `/rest/v1/orders?user_id=eq.${encodeURIComponent(a.user.id)}&select=*&order=created_at.desc&limit=50`, {}, a.token);
  if (!r.ok) return json({ error: "Gagal memuat pesanan." }, 500, a.cookies);
  const rows = (await r.json()) as OrderRow[];
  return json({ orders: rows.map((o) => toView(env, o)) }, 200, a.cookies);
}

export async function getOrder(env: Env, req: Request, invoice: string): Promise<Response> {
  const a = await requireUser(env, req);
  if (a instanceof Response) return a;
  try {
    let order = await getOwnedOrder(env, a.user.id, invoice);
    log("order.get", { invoice, found: !!order, userId: a.user.id.slice(0, 8) });
    if (!order) return json({ error: "Pesanan tidak ditemukan." }, 404, a.cookies);
    // Notifikasi bisa terlewat; pesanan pending yang sudah lewat batas waktu dicek ke Midtrans sekali-sekali.
    const stale = !order.last_synced_at || Date.now() - Date.parse(order.last_synced_at) > 60_000;
    if (order.status === "pending" && isExpiredByTime(order) && stale && !configProblem(env)) {
      order = await reconcile(env, order, "read").catch((e) => {
        log("order.reconcile_failed", { invoice, error: e instanceof Error ? e.message : String(e) });
        return order as OrderRow;
      });
    }
    return json({ order: toView(env, order) }, 200, a.cookies);
  } catch (e) {
    log("order.get_error", { invoice, error: e instanceof Error ? e.message : String(e) });
    return failResponse(e, a.cookies);
  }
}

// ------------------------------------------------------------------ POST /api/orders/:invoice/sync
export async function syncOrder(env: Env, req: Request, invoice: string): Promise<Response> {
  const bad = configProblem(env);
  if (bad) return bad;
  const a = await requireUser(env, req);
  if (a instanceof Response) return a;
  try {
    if (!(await allow(env.RL_SYNC, a.user.id))) return json({ error: "Terlalu sering memeriksa status. Coba lagi sebentar lagi." }, 429, a.cookies);
    const order = await getOwnedOrder(env, a.user.id, invoice);
    if (!order) return json({ error: "Pesanan tidak ditemukan." }, 404, a.cookies);
    if (order.status !== "pending") return json({ order: toView(env, order) }, 200, a.cookies);

    // Cooldown di database: berlaku walau rate limit binding tidak aktif.
    if (order.last_synced_at && Date.now() - Date.parse(order.last_synced_at) < SYNC_COOLDOWN_MS) {
      return json({ order: toView(env, order), throttled: true }, 200, a.cookies);
    }
    const updated = await reconcile(env, order, "sync");
    return json({ order: toView(env, updated) }, 200, a.cookies);
  } catch (e) {
    return failResponse(e, a.cookies);
  }
}

// ------------------------------------------------------------------ POST /api/orders/:invoice/cancel
async function cancelPending(env: Env, order: OrderRow): Promise<OrderRow> {
  // Pastikan belum dibayar: kalau sudah lunas di Midtrans, jangan dibatalkan.
  const fresh = await reconcile(env, order, "cancel");
  if (fresh.status !== "pending") return fresh;

  const res = await cancelTransaction(env, fresh.invoice_no);
  const code = res.status_code;
  // 200 = dibatalkan, 404 = belum ada transaksi di Midtrans, 412 = sudah tidak bisa diubah (cek ulang di bawah)
  if (code !== "200" && code !== "404" && code !== "412") throw new MidtransError("Pembatalan di Midtrans gagal.", 502);

  const rows = await dbPatch<OrderRow>(env, "orders", `invoice_no=eq.${fresh.invoice_no}&status=eq.pending`, {
    status: "cancelled", last_synced_at: new Date().toISOString(),
  });
  if (rows[0]) {
    log("order.status_changed", { invoice: fresh.invoice_no, from: "pending", to: "cancelled", source: "cancel" });
    await publishOrderEvent(env, rows[0]);
    return rows[0];
  }
  const [again] = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${fresh.invoice_no}&select=*&limit=1`);
  return again ?? fresh;
}

export async function cancelOrder(env: Env, req: Request, invoice: string): Promise<Response> {
  const bad = configProblem(env);
  if (bad) return bad;
  const a = await requireUser(env, req);
  if (a instanceof Response) return a;
  try {
    if (!(await allow(env.RL_ORDERS, a.user.id))) return json({ error: "Terlalu banyak percobaan. Coba lagi sebentar lagi." }, 429, a.cookies);
    const order = await getOwnedOrder(env, a.user.id, invoice);
    if (!order) return json({ error: "Pesanan tidak ditemukan." }, 404, a.cookies);
    if (order.status !== "pending") return json({ error: "Pesanan ini tidak bisa dibatalkan.", order: toView(env, order) }, 409, a.cookies);
    if (chargeInFlight(order)) return json({ error: "Pesanan sedang diproses. Coba lagi sebentar lagi.", order: toView(env, order) }, 409, a.cookies);
    const result = await cancelPending(env, order);
    if (result.status !== "cancelled" && result.status !== "expired") {
      return json({ error: "Pesanan tidak bisa dibatalkan karena statusnya sudah berubah.", order: toView(env, result) }, 409, a.cookies);
    }
    return json({ order: toView(env, result) }, 200, a.cookies);
  } catch (e) {
    return failResponse(e, a.cookies);
  }
}

