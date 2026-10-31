// Tes alur end-to-end TANPA jaringan: Supabase (REST+Auth) dan Midtrans dipalsukan di memori.
// Membuktikan logika server: harga tidak bisa dimanipulasi, idempoten, webhook aman, status tidak mundur.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index";
import { computeSignature } from "../src/midtrans";
import type { Env } from "../src/types";

const SK = "SB-Mid-server-TESTKEY";
const SB = "https://fake.supabase.co";
const SNAP = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const API = "https://api.sandbox.midtrans.com";
const ORIGIN = "https://studio.satucerita.app";

const env = {
  ENVIRONMENT: "production", SUPABASE_URL: SB, SUPABASE_ANON_KEY: "sb_publishable_x", SUPABASE_SERVICE_ROLE_KEY: "sb_secret_x",
  ADMIN_EMAIL: "admin@x.id", ALLOWED_ORIGINS: `https://satucerita.app,${ORIGIN}`,
  LOGIN_URL: "https://satucerita.app/login", APP_HOME_URL: `${ORIGIN}/home`, STUDIO_HOME_URL: `${ORIGIN}/home`,
  DASH_LOGIN_URL: "https://dash.satucerita.app/login", DASH_HOME_URL: "https://dash.satucerita.app/overview",
  MIDTRANS_ENV: "sandbox", MIDTRANS_CLIENT_KEY: "SB-Mid-client-x", MIDTRANS_SERVER_KEY: SK,
} as unknown as Env;

// ---------------------------------------------------------------- fake backend
type Row = Record<string, any>;
let orders: Row[] = [];
let events: Row[] = [];
let snapCalls: any[] = [];
let statusReply: (id: string) => any = () => ({ status_code: "404" });
let statusDown = false;
let currentUser = "user-1";

function matches(row: Row, params: URLSearchParams): boolean {
  for (const [k, v] of params) {
    if (["select", "limit", "order", "on_conflict"].includes(k)) continue;
    if (v.startsWith("eq.")) { if (String(row[k]) !== decodeURIComponent(v.slice(3))) return false; }
    else if (v === "is.null") { if (row[k] != null) return false; }
    else if (v.startsWith("in.(")) { if (!v.slice(4, -1).split(",").includes(String(row[k]))) return false; }
    else return false;
  }
  return true;
}
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { "Content-Type": "application/json" } });

globalThis.fetch = (async (input: any, init: RequestInit = {}) => {
  const url = new URL(typeof input === "string" ? input : input.url);
  const method = (init.method || "GET").toUpperCase();
  const body = init.body ? JSON.parse(String(init.body)) : undefined;

  if (url.origin === SB && url.pathname === "/auth/v1/user") return json({ id: currentUser, email: `${currentUser}@mail.id`, user_metadata: { full_name: "Budi" } });
  if (url.origin === SB && url.pathname === "/rest/v1/profiles") return json([{ full_name: "Budi", phone: "+628111" }]);

  if (url.origin === SB && url.pathname === "/rest/v1/orders") {
    if (method === "GET") return json(orders.filter((o) => matches(o, url.searchParams)));
    if (method === "POST") {
      const dupIdem = orders.some((o) => o.user_id === body.user_id && o.idempotency_key === body.idempotency_key);
      const dupPend = body.status === "pending" && orders.some((o) => o.user_id === body.user_id && o.template_slug === body.template_slug && o.status === "pending");
      const dupVoucher = body.discount_code && orders.some((o) => o.user_id === body.user_id && o.discount_code === body.discount_code && ["pending", "paid", "needs_review"].includes(o.status));
      if (dupIdem || dupPend || dupVoucher) return json({ code: "23505" }, 409);
      if (body.gross_amount !== body.base_price - body.discount_amount) return json({ code: "23514" }, 400);
      const row = { id: crypto.randomUUID(), snap_token: null, payment_info: {}, midtrans_trx_id: null, paid_at: null, last_synced_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
      orders.push(row);
      return json([row], 201);
    }
    if (method === "PATCH") {
      const hit = orders.filter((o) => matches(o, url.searchParams));
      for (const o of hit) {
        if (o.status === "paid" && body.status && !["paid", "needs_review"].includes(body.status)) return json({ message: "trigger" }, 400); // meniru trigger DB
        Object.assign(o, body);
      }
      return json(hit);
    }
  }
  if (url.origin === SB && url.pathname === "/rest/v1/payment_events" && method === "POST") {
    if (!events.some((e) => e.dedupe_key === body.dedupe_key)) events.push(body);
    return new Response(null, { status: 201 });
  }

  if (url.href === SNAP && method === "POST") { snapCalls.push(body); return json({ token: `snap-${snapCalls.length}`, redirect_url: "https://x" }, 201); }
  if (url.origin === API && url.pathname.endsWith("/status")) {
    if (statusDown) return new Response("down", { status: 503 });
    return json(statusReply(decodeURIComponent(url.pathname.split("/")[2])));
  }
  if (url.origin === API && url.pathname.endsWith("/cancel")) return json({ status_code: "200", transaction_status: "cancel" });
  throw new Error(`fetch tak terduga: ${method} ${url.href}`);
}) as typeof fetch;

beforeEach(() => { orders = []; events = []; snapCalls = []; statusReply = () => ({ status_code: "404" }); statusDown = false; currentUser = "user-1"; });

// ---------------------------------------------------------------- helpers
const key = () => crypto.randomUUID().replace(/-/g, "");
const call = (path: string, init: { method?: string; body?: unknown; origin?: string | null; user?: string } = {}) => {
  const headers: Record<string, string> = { "Content-Type": "application/json", Cookie: "sc_at=token" };
  if (init.origin !== null) headers.Origin = init.origin ?? ORIGIN;
  if (init.user) currentUser = init.user;
  return worker.fetch(new Request("https://studio.satucerita.app" + path, {
    method: init.method ?? "GET", headers, body: init.body === undefined ? undefined : JSON.stringify(init.body),
  }), env);
};
const create = (extra: Record<string, unknown> = {}) => call("/api/orders", { method: "POST", body: { templateSlug: "antheia", method: "bni_va", idempotencyKey: key(), ...extra } });

async function notify(over: Record<string, string> = {}, opts: { sign?: boolean } = {}) {
  const o = orders[0];
  const n: Record<string, string> = {
    order_id: o.invoice_no, status_code: "200", gross_amount: `${o.gross_amount}.00`, transaction_status: "settlement",
    transaction_id: "trx-1", transaction_time: "2026-10-30 10:00:00", payment_type: "bank_transfer", ...over,
  };
  n.signature_key = opts.sign === false ? "0".repeat(128) : await computeSignature(n.order_id, n.status_code, n.gross_amount, SK);
  return worker.fetch(new Request("https://satucerita.app/api/payments/midtrans/webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) }), env);
}
const statusOk = (txn = "settlement", extra: Record<string, unknown> = {}) => (id: string) => {
  const o = orders.find((x) => x.invoice_no === id)!;
  return { status_code: "200", order_id: id, transaction_status: txn, gross_amount: `${o.gross_amount}.00`, transaction_id: "trx-1", va_numbers: [{ bank: "bni", va_number: "98812345" }], ...extra };
};

// ---------------------------------------------------------------- pembuatan pesanan
test("harga dari browser DIABAIKAN: total & item Midtrans dihitung server", async () => {
  const r = await create({ price: 1, total: 1, gross_amount: 1, basePrice: 1 });
  assert.equal(r.status, 201);
  const { order } = (await r.json()) as any;
  assert.equal(order.total, 99000);
  assert.equal(order.snapToken, "snap-1");
  assert.equal(orders[0].gross_amount, 99000);
  const s = snapCalls[0];
  assert.equal(s.transaction_details.gross_amount, 99000);
  assert.equal(s.transaction_details.order_id, orders[0].invoice_no);
  assert.equal(s.item_details.reduce((a: number, i: any) => a + i.price * i.quantity, 0), s.transaction_details.gross_amount);
  assert.deepEqual(s.enabled_payments, ["bni_va"]);
  assert.match(orders[0].invoice_no, /^SC[0-9]{6}-[0-9A-Z]{8}$/);
});

test("voucher HEMAT10 dihitung server, item diskon negatif, jumlah item = total", async () => {
  const r = await create({ voucherCode: "hemat10" });
  const { order } = (await r.json()) as any;
  assert.equal(order.discountAmount, 9900);
  assert.equal(order.total, 89100);
  assert.equal(snapCalls[0].item_details.reduce((a: number, i: any) => a + i.price * i.quantity, 0), 89100);
});

test("voucher sekali pakai per akun; voucher ngawur ditolak", async () => {
  assert.equal((await create({ voucherCode: "HEMAT10" })).status, 201);
  const second = await create({ templateSlug: "hypatia", voucherCode: "HEMAT10" });
  assert.equal(second.status, 400);
  assert.equal((await create({ templateSlug: "hypatia", voucherCode: "GRATIS100" })).status, 400);
});

test("idempotensi: kunci sama dikirim bersamaan (klik ganda) -> satu pesanan, satu token yang sama", async () => {
  const k = key();
  const [a, b] = await Promise.all([create({ idempotencyKey: k }), create({ idempotencyKey: k })]);
  assert.ok([200, 201].includes(a.status) && [200, 201].includes(b.status));
  assert.equal(orders.length, 1);
  const oa = ((await a.json()) as any).order, ob = ((await b.json()) as any).order;
  assert.equal(oa.invoiceNo, ob.invoiceNo);
  assert.equal(oa.snapToken, ob.snapToken);       // yang kalah balapan memakai token pemenang
  assert.equal(orders[0].status, "pending");       // dan pesanan TIDAK ditandai gagal
});

test("kunci sama dikirim berurutan -> tidak membuat pesanan / token baru", async () => {
  const k = key();
  await create({ idempotencyKey: k });
  const again = await create({ idempotencyKey: k });
  assert.equal(again.status, 200);
  assert.equal(orders.length, 1);
  assert.equal(snapCalls.length, 1);
});

test("Midtrans gagal membuat token -> pesanan ditutup (failed) dan user dapat error ramah", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init: any) => {
    const u = typeof input === "string" ? input : input.url;
    if (u.startsWith(SNAP)) return new Response(JSON.stringify({ error_messages: ["boom"] }), { status: 500 });
    return realFetch(input, init);
  }) as typeof fetch;
  try {
    const r = await create();
    assert.equal(r.status, 502);
    assert.equal(orders[0].status, "failed");
    assert.doesNotMatch(JSON.stringify(await r.json()), /boom|SB-Mid/);
  } finally { globalThis.fetch = realFetch; }
});

test("pilihan sama dengan kunci baru (tab lain) -> pesanan pending dipakai ulang", async () => {
  await create();
  const r = await create();
  assert.equal(r.status, 200);
  assert.equal(((await r.json()) as any).reused, true);
  assert.equal(orders.length, 1);
  assert.equal(snapCalls.length, 1);
});

test("ganti metode: pesanan lama dibatalkan, pesanan baru dibuat", async () => {
  await create();
  statusReply = () => ({ status_code: "404" });
  const r = await create({ method: "gopay" });
  assert.equal(r.status, 201);
  assert.equal(orders.length, 2);
  assert.equal(orders[0].status, "cancelled");
  assert.equal(orders[1].status, "pending");
  assert.deepEqual(snapCalls[1].enabled_payments, ["gopay"]);
});

test("input tidak valid ditolak: metode, template, kunci idempoten", async () => {
  assert.equal((await create({ method: "credit_card" })).status, 400);
  assert.equal((await create({ method: "__proto__" })).status, 400);
  assert.equal((await create({ templateSlug: "tidak-ada" })).status, 404);
  assert.equal((await create({ idempotencyKey: "pendek" })).status, 400);
});

test("anti-CSRF: POST tanpa/dengan Origin asing ditolak; webhook tidak butuh Origin", async () => {
  assert.equal((await call("/api/orders", { method: "POST", origin: null, body: {} })).status, 403);
  assert.equal((await call("/api/orders", { method: "POST", origin: "https://evil.example", body: {} })).status, 403);
  await create();
  statusReply = statusOk("settlement");
  assert.equal((await notify()).status, 200); // tanpa Origin tetap diproses (dilindungi signature)
});

test("pesanan milik orang lain tidak bisa dibaca / disinkron / dibatalkan (IDOR)", async () => {
  await create();
  const inv = orders[0].invoice_no;
  assert.equal((await call(`/api/orders/${inv}`, { user: "user-2" })).status, 404);
  assert.equal((await call(`/api/orders/${inv}/sync`, { method: "POST", user: "user-2" })).status, 404);
  assert.equal((await call(`/api/orders/${inv}/cancel`, { method: "POST", user: "user-2" })).status, 404);
  assert.equal((await call(`/api/orders/${inv}`, { user: "user-1" })).status, 200);
  assert.equal((await call(`/api/orders/..%2F..%2Fx`, { user: "user-1" })).status, 404);
});

// ---------------------------------------------------------------- webhook
test("webhook: signature salah -> 401 dan tidak mengubah apa pun", async () => {
  await create();
  statusReply = statusOk("settlement");
  assert.equal((await notify({}, { sign: false })).status, 401);
  assert.equal(orders[0].status, "pending");
  assert.equal(events.length, 0);
});

test("webhook: settlement valid -> LUNAS; kirim ulang tidak merusak; notifikasi telat tidak memundurkan", async () => {
  await create();
  statusReply = statusOk("settlement");
  assert.equal((await notify()).status, 200);
  assert.equal(orders[0].status, "paid");
  assert.ok(orders[0].paid_at);
  assert.equal(orders[0].payment_info.vaNumber, "98812345");
  const paidAt = orders[0].paid_at;

  assert.equal((await notify()).status, 200); // replay persis sama
  assert.equal(events.length, 1);             // dedupe
  assert.equal(orders[0].status, "paid");
  assert.equal(orders[0].paid_at, paidAt);

  statusReply = statusOk("pending");          // notifikasi "pending" yang datang terlambat
  assert.equal((await notify({ transaction_status: "pending", status_code: "201", transaction_id: "trx-0" })).status, 200);
  assert.equal(orders[0].status, "paid");
  statusReply = statusOk("expire");
  assert.equal((await notify({ transaction_status: "expire", status_code: "202", transaction_id: "trx-9" })).status, 200);
  assert.equal(orders[0].status, "paid");
});

test("webhook: body bilang settlement tapi Status API bilang pending -> TIDAK lunas", async () => {
  await create();
  statusReply = statusOk("pending");
  assert.equal((await notify({ transaction_status: "settlement" })).status, 200);
  assert.equal(orders[0].status, "pending");
});

test("webhook: nominal tidak cocok -> needs_review, bukan lunas", async () => {
  await create();
  statusReply = (id) => ({ ...statusOk("settlement")(id), gross_amount: "1000.00" });
  assert.equal((await notify({ gross_amount: "1000.00" })).status, 200);
  assert.equal(orders[0].status, "needs_review");
});

test("webhook: uang masuk setelah pesanan dibatalkan -> needs_review (tidak diam-diam lunas)", async () => {
  await create();
  orders[0].status = "cancelled";
  statusReply = statusOk("settlement");
  await notify();
  assert.equal(orders[0].status, "needs_review");
});

test("webhook: expire pada pesanan pending -> expired; order tak dikenal -> 200 diabaikan", async () => {
  await create();
  statusReply = statusOk("expire");
  await notify({ transaction_status: "expire", status_code: "202" });
  assert.equal(orders[0].status, "expired");
  const res = await notify({ order_id: "SC000000-UNKNOWN1" });
  assert.equal(res.status, 200);
});

test("webhook: Status API Midtrans bermasalah -> 503 agar Midtrans mengirim ulang", async () => {
  await create();
  statusDown = true;
  assert.equal((await notify()).status, 503);
  assert.equal(orders[0].status, "pending");
});

// ---------------------------------------------------------------- sync (tombol Cek status)
test("sync: status hanya berubah jika Midtrans memang bilang lunas; ada cooldown", async () => {
  await create();
  const inv = orders[0].invoice_no;
  statusReply = statusOk("pending");
  let r = await call(`/api/orders/${inv}/sync`, { method: "POST" });
  assert.equal(((await r.json()) as any).order.status, "pending");
  r = await call(`/api/orders/${inv}/sync`, { method: "POST" });
  assert.equal(((await r.json()) as any).throttled, true); // cooldown
  orders[0].last_synced_at = null;
  statusReply = statusOk("settlement");
  r = await call(`/api/orders/${inv}/sync`, { method: "POST" });
  assert.equal(((await r.json()) as any).order.status, "paid");
});

test("cancel: pesanan yang ternyata sudah dibayar tidak bisa dibatalkan", async () => {
  await create();
  const inv = orders[0].invoice_no;
  statusReply = statusOk("settlement");
  const r = await call(`/api/orders/${inv}/cancel`, { method: "POST" });
  assert.equal(r.status, 409);
  assert.equal(orders[0].status, "paid");
});

test("konfigurasi salah (key production dengan mode sandbox) -> 503, tidak menghubungi Midtrans", async () => {
  const bad = { ...env, MIDTRANS_SERVER_KEY: "Mid-server-PROD" } as Env;
  const r = await worker.fetch(new Request("https://studio.satucerita.app/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN, Cookie: "sc_at=t" },
    body: JSON.stringify({ templateSlug: "antheia", method: "bni_va", idempotencyKey: key() }),
  }), bad);
  assert.equal(r.status, 503);
  assert.equal(snapCalls.length, 0);
});
