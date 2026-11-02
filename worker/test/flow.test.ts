// Tes alur end-to-end TANPA jaringan: Supabase (REST+Auth) dan Midtrans dipalsukan di memori.
// Membuktikan logika server: harga tidak bisa dimanipulasi, idempoten, webhook aman, status tidak mundur.
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import worker from "../src/index";
import { PaymentHub } from "../src/hub";
import { computeSignature } from "../src/midtrans";
import type { Env } from "../src/types";

const SK = "SB-Mid-server-TESTKEY";
const SB = "https://fake.supabase.co";
const API = "https://api.sandbox.midtrans.com";
const CHARGE = `${API}/v2/charge`;
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
let chargeCalls: { body: any; headers: Headers }[] = [];
let chargeReply: ((body: any, n: number) => Response) | null = null;
let statusReply: (id: string) => any = () => ({ status_code: "404" });
let statusDown = false;
let currentUser = "user-1";
let failPatch = false;
let patchCount = 0;
let statusCalls = 0;
let activeEnv: Env = undefined as unknown as Env;

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
      const row = { id: crypto.randomUUID(), snap_token: null, payment_info: {}, midtrans_trx_id: null, charge_claimed_at: null, paid_at: null, last_synced_at: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
      orders.push(row);
      return json([row], 201);
    }
    if (method === "PATCH") {
      const hit = orders.filter((o) => matches(o, url.searchParams));
      patchCount++;
      for (const o of hit) {
        if (o.status === "paid" && body.status && !["paid", "needs_review"].includes(body.status)) return json({ message: "trigger" }, 400); // meniru trigger DB
        if (o.charge_claimed_at && o.midtrans_trx_id && ((body.midtrans_trx_id && body.midtrans_trx_id !== o.midtrans_trx_id) || (body.expires_at && body.expires_at !== o.expires_at))) return json({ message: "trigger" }, 400);
        if (failPatch) return json({ message: "db down" }, 500);
        Object.assign(o, body);
      }
      return json(hit);
    }
  }
  if (url.origin === SB && url.pathname === "/rest/v1/payment_events" && method === "POST") {
    if (!events.some((e) => e.dedupe_key === body.dedupe_key)) events.push(body);
    return new Response(null, { status: 201 });
  }

  if (url.href === CHARGE && method === "POST") {
    chargeCalls.push({ body, headers: new Headers(init.headers) });
    if (chargeReply) return chargeReply(body, chargeCalls.length);
    return json(fakeCharge(body, chargeCalls.length), 200); // Midtrans: HTTP 200 + status_code di body
  }
  if (url.origin === API && url.pathname.endsWith("/status")) {
    statusCalls++;
    if (statusDown) return new Response("down", { status: 503 });
    return json(statusReply(decodeURIComponent(url.pathname.split("/")[2])));
  }
  if (url.origin === API && url.pathname.endsWith("/cancel")) return json({ status_code: "200", transaction_status: "cancel" });
  throw new Error(`fetch tak terduga: ${method} ${url.href}`);
}) as typeof fetch;

beforeEach(() => { orders = []; events = []; chargeCalls = []; chargeReply = null; failPatch = false; patchCount = 0; statusCalls = 0; activeEnv = env; hubs.clear(); hubBroken = false; statusReply = () => ({ status_code: "404" }); statusDown = false; currentUser = "user-1"; });

// ---------------------------------------------------------------- hub realtime palsu (memakai kelas PaymentHub ASLI)
const hubs = new Map<string, PaymentHub>();
let hubBroken = false;
const hubNs = {
  idFromName: (name: string) => ({ name }),
  get: (id: { name: string }) => ({
    fetch: async (u: string, init?: RequestInit) => {
      if (hubBroken) throw new Error("hub down");
      let h = hubs.get(id.name);
      if (!h) { h = new PaymentHub(); hubs.set(id.name, h); }
      return h.fetch(new Request(u, init));
    },
  }),
} as unknown as DurableObjectNamespace;
const envHub = { ...env, PAYMENT_HUB: hubNs } as unknown as Env;

// ---------------------------------------------------------------- respons charge palsu (bentuk mengikuti dokumentasi Midtrans)
function fakeCharge(body: any, n: number): Record<string, unknown> {
  const exp = new Date(Date.now() + 24 * 3600_000 + 7 * 3600_000).toISOString().slice(0, 19).replace("T", " ");
  const base: Record<string, unknown> = {
    status_code: "201", status_message: "Success", transaction_id: `chg-${n}`, order_id: body.transaction_details.order_id,
    gross_amount: `${body.transaction_details.gross_amount}.00`, payment_type: body.payment_type, transaction_status: "pending",
    fraud_status: "accept", expiry_time: exp,
  };
  if (body.payment_type === "bank_transfer") {
    const bank = body.bank_transfer.bank;
    if (bank === "permata") base.permata_va_number = "8562000087926752";
    else base.va_numbers = [{ bank, va_number: bank === "bni" ? "9888500212345678" : "8578000000111111" }];
  } else if (body.payment_type === "echannel") { base.bill_key = "778347787706"; base.biller_code = "70012"; }
  else if (body.payment_type === "gopay") base.actions = [
    { name: "generate-qr-code", method: "GET", url: "https://api.sandbox.midtrans.com/v2/gopay/x/qr-code" },
    { name: "deeplink-redirect", method: "GET", url: "https://simulator.sandbox.midtrans.com/gopay/partner/app/payment-pin?id=x" },
  ];
  else if (body.payment_type === "qris") { base.acquirer = "gopay"; base.actions = [{ name: "generate-qr-code", method: "GET", url: "https://api.sandbox.midtrans.com/v2/qris/x/qr-code" }]; }
  return base;
}

// ---------------------------------------------------------------- helpers
const key = () => crypto.randomUUID().replace(/-/g, "");
const call = (path: string, init: { method?: string; body?: unknown; origin?: string | null; user?: string } = {}) => {
  const headers: Record<string, string> = { "Content-Type": "application/json", Cookie: "sc_at=token" };
  if (init.origin !== null) headers.Origin = init.origin ?? ORIGIN;
  if (init.user) currentUser = init.user;
  return worker.fetch(new Request("https://studio.satucerita.app" + path, {
    method: init.method ?? "GET", headers, body: init.body === undefined ? undefined : JSON.stringify(init.body),
  }), activeEnv);
};
const create = (extra: Record<string, unknown> = {}) => call("/api/orders", { method: "POST", body: { templateSlug: "antheia", method: "bni_va", idempotencyKey: key(), ...extra } });

async function notify(over: Record<string, string> = {}, opts: { sign?: boolean; order?: Row } = {}) {
  const o = opts.order ?? orders[0];
  const n: Record<string, string> = {
    order_id: o.invoice_no, status_code: "200", gross_amount: `${o.gross_amount}.00`, transaction_status: "settlement",
    transaction_id: o.midtrans_trx_id ?? "trx-1", transaction_time: "2026-10-30 10:00:00", payment_type: "bank_transfer", ...over,
  };
  n.signature_key = opts.sign === false ? "0".repeat(128) : await computeSignature(n.order_id, n.status_code, n.gross_amount, SK);
  return worker.fetch(new Request("https://satucerita.app/api/payments/midtrans/webhook", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(n) }), activeEnv);
}
const statusOk = (txn = "settlement", extra: Record<string, unknown> = {}) => (id: string) => {
  const o = orders.find((x) => x.invoice_no === id)!;
  return { status_code: "200", order_id: id, transaction_status: txn, gross_amount: `${o.gross_amount}.00`, transaction_id: o.midtrans_trx_id ?? "trx-1", va_numbers: [{ bank: "bni", va_number: "98812345" }], ...extra };
};

// ---------------------------------------------------------------- pembuatan pesanan
test("harga dari browser DIABAIKAN: total & item Midtrans dihitung server", async () => {
  const r = await create({ price: 1, total: 1, gross_amount: 1, basePrice: 1 });
  assert.equal(r.status, 201);
  const { order } = (await r.json()) as any;
  assert.equal(order.total, 99000);
  assert.equal(order.vaNumber, "9888500212345678");
  assert.equal(order.paymentReady, true);
  assert.equal("snapToken" in order, false);
  assert.equal(orders[0].gross_amount, 99000);
  assert.equal(chargeCalls.length, 1);
  const s = chargeCalls[0].body;
  assert.equal(s.payment_type, "bank_transfer");
  assert.deepEqual(s.bank_transfer, { bank: "bni" });
  assert.equal(s.transaction_details.gross_amount, 99000);
  assert.equal(s.transaction_details.order_id, orders[0].invoice_no);
  assert.equal(s.item_details.reduce((a: number, i: any) => a + i.price * i.quantity, 0), s.transaction_details.gross_amount);
  assert.equal(s.custom_expiry.expiry_duration, 1440);
  assert.equal(s.custom_expiry.unit, "minute");
  assert.match(chargeCalls[0].headers.get("Idempotency-Key") ?? "", /^SC\d{6}-[0-9A-Z]{8}-charge$/);
  assert.equal(orders[0].midtrans_trx_id, "chg-1");
  assert.ok(orders[0].charge_claimed_at);
  assert.match(orders[0].invoice_no, /^SC[0-9]{6}-[0-9A-Z]{8}$/);
});

test("voucher HEMAT10 dihitung server, item diskon negatif, jumlah item = total", async () => {
  const r = await create({ voucherCode: "hemat10" });
  const { order } = (await r.json()) as any;
  assert.equal(order.discountAmount, 9900);
  assert.equal(order.total, 89100);
  assert.equal(chargeCalls[0].body.item_details.reduce((a: number, i: any) => a + i.price * i.quantity, 0), 89100);
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
  assert.equal(oa.vaNumber, ob.vaNumber);         // yang kalah balapan menerima hasil pemenang
  assert.ok(oa.vaNumber);
  assert.equal(chargeCalls.length, 1);            // SATU transaksi Midtrans saja
  assert.equal(orders[0].status, "pending");       // dan pesanan TIDAK ditandai gagal
});

test("kunci sama dikirim berurutan -> tidak membuat pesanan / token baru", async () => {
  const k = key();
  await create({ idempotencyKey: k });
  const again = await create({ idempotencyKey: k });
  assert.equal(again.status, 200);
  assert.equal(orders.length, 1);
  assert.equal(chargeCalls.length, 1);
});

test("Midtrans gagal membuat transaksi -> pesanan ditutup (failed) dan user dapat error ramah", async () => {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init: any) => {
    const u = typeof input === "string" ? input : input.url;
    if (u === CHARGE) return new Response(JSON.stringify({ error_messages: ["boom"] }), { status: 500 });
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
  assert.equal(chargeCalls.length, 1);
});

test("ganti metode: pesanan lama dibatalkan, pesanan baru dibuat", async () => {
  await create();
  statusReply = () => ({ status_code: "404" });
  const r = await create({ method: "gopay" });
  assert.equal(r.status, 201);
  assert.equal(orders.length, 2);
  assert.equal(orders[0].status, "cancelled");
  assert.equal(orders[1].status, "pending");
  assert.equal(chargeCalls[1].body.payment_type, "gopay");
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
  assert.equal(chargeCalls.length, 0);
});

// ================================================================ Core API: transaksi dibuat server, UI milik sendiri
const createAs = (user: string, method: string, templateSlug = "antheia") =>
  call("/api/orders", { method: "POST", user, body: { templateSlug, method, idempotencyKey: key() } });

test("Core API: tiap metode membuat transaksi yang benar & menghasilkan instruksi bayar dari Midtrans", async () => {
  const expect: Record<string, (b: any) => void> = {
    bni_va: (b) => { assert.equal(b.payment_type, "bank_transfer"); assert.deepEqual(b.bank_transfer, { bank: "bni" }); },
    bri_va: (b) => { assert.equal(b.payment_type, "bank_transfer"); assert.deepEqual(b.bank_transfer, { bank: "bri" }); },
    permata_va: (b) => { assert.equal(b.payment_type, "bank_transfer"); assert.deepEqual(b.bank_transfer, { bank: "permata" }); },
    mandiri_bill: (b) => { assert.equal(b.payment_type, "echannel"); assert.ok(b.echannel.bill_info1.length <= 10 && b.echannel.bill_info2.length <= 30); },
    gopay: (b) => { assert.equal(b.payment_type, "gopay"); assert.equal(b.gopay.enable_callback, true); assert.match(b.gopay.callback_url, /^https:\/\/studio\.satucerita\.app\/order\/SC/); },
    qris: (b) => { assert.equal(b.payment_type, "qris"); assert.deepEqual(b.qris, { acquirer: "gopay" }); },
  };
  const views: Record<string, any> = {};
  for (const m of Object.keys(expect)) {
    const r = await createAs(`u-${m}`, m);
    assert.equal(r.status, 201, m);
    views[m] = ((await r.json()) as any).order;
    expect[m](chargeCalls.at(-1)!.body);
  }
  assert.equal(views.bni_va.vaNumber, "9888500212345678");
  assert.equal(views.bri_va.vaNumber, "8578000000111111");
  assert.equal(views.permata_va.vaNumber, "8562000087926752");
  assert.equal(views.permata_va.bank, "permata");
  assert.equal(views.mandiri_bill.billKey, "778347787706");
  assert.equal(views.mandiri_bill.billerCode, "70012");
  assert.match(views.gopay.qrUrl, /^https:\/\/api\.sandbox\.midtrans\.com\//);
  assert.match(views.gopay.deeplinkUrl, /^https:\/\//);
  assert.match(views.qris.qrUrl, /qr-code$/);
  for (const v of Object.values(views)) assert.equal(v.paymentReady, true);
});

test("Core API: respons ke browser tidak membawa Server Key, token Snap, atau field internal", async () => {
  const r = await create();
  const text = JSON.stringify(await r.json());
  assert.doesNotMatch(text, /SB-Mid-server|snap_token|snapToken|idempotency_key|charge_claimed_at|user_id|service_role/);
});

test("Core API: masa berlaku mengikuti expiry_time dari Midtrans (bukan dari browser)", async () => {
  await create({ expiresAt: "2000-01-01", dueDate: "2000-01-01" });
  const ms = Date.parse(orders[0].expires_at) - Date.now();
  assert.ok(ms > 23 * 3600_000 && ms < 25 * 3600_000, `expires_at ${ms}`);
});

test("duplikasi: 6 request paralel dengan kunci BERBEDA untuk template yang sama -> 1 pesanan, 1 transaksi Midtrans", async () => {
  const rs = await Promise.all(Array.from({ length: 6 }, () => create()));
  assert.equal(orders.length, 1);
  assert.equal(chargeCalls.length, 1);
  for (const r of rs) assert.ok([200, 201, 409].includes(r.status), String(r.status));
});

test("duplikasi: klik ganda kunci SAMA paralel (8x) -> tepat 1 charge, semua menerima VA yang sama", async () => {
  const k = key();
  const rs = await Promise.all(Array.from({ length: 8 }, () => create({ idempotencyKey: k })));
  assert.equal(chargeCalls.length, 1);
  const vas = new Set(await Promise.all(rs.map(async (r) => ((await r.json()) as any).order.vaNumber)));
  assert.equal(vas.size, 1);
  assert.ok([...vas][0]);
});

test("Midtrans menjawab 406 (order_id sudah dipakai) -> dipulihkan lewat Status API, tidak ada transaksi ganda", async () => {
  chargeReply = () => json({ status_code: "406", status_message: "Order ID already used" });
  statusReply = (id) => ({ status_code: "201", order_id: id, transaction_id: "chg-existing", transaction_status: "pending",
    gross_amount: `${orders.find((o) => o.invoice_no === id)!.gross_amount}.00`, va_numbers: [{ bank: "bni", va_number: "9888000011112222" }] });
  const r = await create();
  assert.equal(r.status, 201);
  assert.equal(((await r.json()) as any).order.vaNumber, "9888000011112222");
  assert.equal(orders[0].midtrans_trx_id, "chg-existing");
  assert.equal(chargeCalls.length, 1);
});

test("charge error/timeout tetapi transaksi ternyata terbentuk di Midtrans -> dipulihkan, bukan ditandai gagal", async () => {
  chargeReply = () => new Response("gateway timeout", { status: 504 });
  statusReply = (id) => ({ status_code: "201", order_id: id, transaction_id: "chg-late", transaction_status: "pending",
    gross_amount: `${orders.find((o) => o.invoice_no === id)!.gross_amount}.00`, va_numbers: [{ bank: "bni", va_number: "9888000033334444" }] });
  const r = await create();
  assert.equal(r.status, 201);
  assert.equal(orders[0].status, "pending");
  assert.equal(orders[0].payment_info.vaNumber, "9888000033334444");
});

test("kanal belum aktif di Midtrans (402) -> 422 ramah, pesanan ditutup, detail internal tidak bocor", async () => {
  chargeReply = () => json({ status_code: "402", status_message: "Payment channel is not activated." });
  const r = await create();
  assert.equal(r.status, 422);
  assert.equal(orders[0].status, "failed");
  assert.doesNotMatch(JSON.stringify(await r.json()), /activated|402|SB-Mid/);
});

test("respons charge dengan nominal/order_id tidak cocok ditolak: tidak disimpan sebagai instruksi bayar", async () => {
  chargeReply = (b, n) => json({ ...fakeCharge(b, n), gross_amount: "1.00" });
  const r = await create();
  assert.ok(r.status >= 500);
  assert.deepEqual(orders[0].payment_info, {});
  assert.notEqual(orders[0].status, "paid");
});

test("pesanan yang transaksinya sedang dibuat TIDAK dibatalkan oleh permintaan ganti metode (cegah batal-lalu-ter-charge)", async () => {
  await create();
  orders[0].midtrans_trx_id = null; orders[0].payment_info = {}; orders[0].charge_claimed_at = new Date().toISOString(); // simulasi charge sedang berjalan
  const before = chargeCalls.length;
  const r = await create({ method: "gopay" });
  assert.equal(r.status, 409);
  assert.equal(orders[0].status, "pending");
  assert.equal(chargeCalls.length, before);
  assert.equal((await call(`/api/orders/${orders[0].invoice_no}/cancel`, { method: "POST" })).status, 409);
});

// ================================================================ Webhook: hardening
test("webhook: metode selain POST -> 405 (bukan 404/200)", async () => {
  for (const m of ["GET", "PUT", "DELETE"]) {
    const r = await worker.fetch(new Request("https://satucerita.app/api/payments/midtrans/webhook", { method: m }), env);
    assert.equal(r.status, 405, m);
    assert.equal(r.headers.get("Allow"), "POST");
  }
});

test("webhook: order_id tak dikenal / format asing -> 200 diabaikan, TIDAK membuat pesanan baru", async () => {
  await create();
  const n = orders.length;
  statusReply = statusOk("settlement");
  for (const id of ["SC000000-UNKNOWN1", "order-biasa-123", "SC261030-abcdefgh"]) {
    const r = await notify({ order_id: id });
    assert.equal(r.status, 200);
    assert.equal(((await r.json()) as any).result, "unknown_order");
  }
  assert.equal(orders.length, n);
  assert.equal(orders[0].status, "pending");
});

test("webhook transaksi A tidak mengubah transaksi B (dan tidak ada UPDATE tanpa filter order)", async () => {
  await createAs("ua", "bni_va", "antheia");
  await createAs("ub", "bri_va", "hypatia");
  assert.equal(orders.length, 2);
  statusReply = statusOk("settlement");
  assert.equal((await notify({}, { order: orders[0] })).status, 200);
  assert.equal(orders[0].status, "paid");
  assert.equal(orders[1].status, "pending");
  assert.equal(orders[1].paid_at, null);
});

test("webhook valid memperbarui database (settlement -> paid) dan replay identik TIDAK menulis ulang database", async () => {
  await create();
  statusReply = statusOk("settlement");
  await notify();
  assert.equal(orders[0].status, "paid");
  const writes = patchCount;
  for (let i = 0; i < 3; i++) assert.equal((await notify()).status, 200);
  assert.equal(patchCount, writes);
  assert.equal(orders[0].status, "paid");
});

test("kegagalan database saat update -> webhook 503 (Midtrans mengirim ulang) dan pesanan TIDAK dianggap lunas", async () => {
  await create();
  statusReply = statusOk("settlement");
  failPatch = true;
  const r = await notify();
  assert.equal(r.status, 503);
  assert.equal(orders[0].status, "pending");
  assert.equal(orders[0].paid_at, null);
  failPatch = false;
  assert.equal((await notify()).status, 200); // retry berikutnya berhasil
  assert.equal(orders[0].status, "paid");
});

test("nominal pada notifikasi (bertanda tangan valid) berbeda dari yang tersimpan -> tidak pernah lunas", async () => {
  await create();
  statusReply = statusOk("settlement"); // Status API 'benar', notifikasi 'aneh'
  const r = await notify({ gross_amount: "1000.00" });
  assert.equal(r.status, 200);
  assert.notEqual(orders[0].status, "paid");
});

test("notifikasi dengan transaction_id berbeda dari transaksi yang kita buat -> diabaikan", async () => {
  await create();
  statusReply = (id) => ({ ...statusOk("settlement")(id), transaction_id: "trx-orang-lain" });
  await notify();
  assert.equal(orders[0].status, "pending");
});

test("semantik status Midtrans: capture(accept)=lunas, capture(challenge)=ditinjau, deny=gagal, cancel=batal, expire=kedaluwarsa", async () => {
  const cases: [string, Record<string, unknown>, string][] = [
    ["capture", { fraud_status: "accept" }, "paid"],
    ["capture", { fraud_status: "challenge" }, "needs_review"],
    ["deny", {}, "failed"],
    ["cancel", {}, "cancelled"],
    ["expire", {}, "expired"],
    ["pending", {}, "pending"],
  ];
  for (const [txn, extra, want] of cases) {
    orders = []; await create();
    statusReply = statusOk(txn, extra);
    await notify({ transaction_status: txn });
    assert.equal(orders[0].status, want, `${txn}/${JSON.stringify(extra)}`);
  }
});

test("status lama tidak menurunkan pesanan lunas: pending/cancel/deny/expire sesudah settlement diabaikan; refund -> ditinjau", async () => {
  await create();
  statusReply = statusOk("settlement"); await notify();
  for (const t of ["pending", "cancel", "deny", "expire"]) {
    statusReply = statusOk(t); await notify({ transaction_status: t });
    assert.equal(orders[0].status, "paid", t);
  }
  statusReply = statusOk("refund"); await notify({ transaction_status: "refund" });
  assert.equal(orders[0].status, "needs_review"); // keputusan manusia, bukan diturunkan diam-diam
});

test("log webhook tidak memuat Server Key maupun signature", async () => {
  await create();
  statusReply = statusOk("settlement");
  const lines: string[] = [];
  const o = { log: console.log, warn: console.warn, error: console.error };
  console.log = console.warn = console.error = (...a: unknown[]) => lines.push(a.map(String).join(" "));
  try { await notify(); await notify({}, { sign: false }); } finally { Object.assign(console, o); }
  const all = lines.join("\n");
  assert.ok(all.includes("midtrans.webhook"));
  assert.doesNotMatch(all, /SB-Mid-server|TESTKEY|[0-9a-f]{128}/);
});

// ================================================================ Polling internal tidak membebani Midtrans
test("polling internal: 30x GET pesanan pending (seperti fallback 5 detik) -> 0 panggilan ke Midtrans", async () => {
  await create();
  const inv = orders[0].invoice_no;
  for (let i = 0; i < 30; i++) assert.equal((await call(`/api/orders/${inv}`)).status, 200);
  assert.equal(statusCalls, 0);
});

test("pesanan lewat batas waktu: banyak GET beruntun -> paling banyak 1 panggilan Midtrans per 60 detik", async () => {
  await create();
  const inv = orders[0].invoice_no;
  orders[0].expires_at = new Date(Date.now() - 3600_000).toISOString();
  orders[0].last_synced_at = null; // belum pernah disinkronkan -> "stale"
  statusReply = statusOk("pending");
  for (let i = 0; i < 20; i++) await call(`/api/orders/${inv}`);
  assert.equal(statusCalls, 1);
});

// ================================================================ SSE (backend -> browser)
async function openStream(path: string, user?: string) {
  const res = await call(path, { user });
  const frames: any[] = [];
  const reader = res.body?.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let ended = false;
  const pump = (async () => {
    if (!reader) return;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) { ended = true; break; }
        buf += dec.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf("\n\n")) >= 0) {
          const block = buf.slice(0, i); buf = buf.slice(i + 2);
          const data = /^data: (.*)$/m.exec(block);
          if (/^event: status$/m.test(block) && data) frames.push(JSON.parse(data[1]));
        }
      }
    } catch { ended = true; }
  })();
  const waitFor = async (n: number, ms = 1000) => {
    const t0 = Date.now();
    while (frames.length < n && !ended && Date.now() - t0 < ms) await new Promise((r) => setTimeout(r, 10));
  };
  return { res, frames, waitFor, isEnded: () => ended, cancel: () => reader?.cancel(), pump };
}

test("SSE: customer menerima snapshot lalu 'paid' otomatis saat webhook diproses — tanpa refresh — dan stream ditutup server", async () => {
  activeEnv = envHub;
  await create();
  const inv = orders[0].invoice_no;
  const s = await openStream(`/api/orders/${inv}/events`);
  assert.equal(s.res.status, 200);
  assert.match(s.res.headers.get("Content-Type") ?? "", /text\/event-stream/);
  await s.waitFor(1);
  assert.equal(s.frames[0].status, "pending");
  assert.equal(s.frames[0].paymentReady, true);

  statusReply = statusOk("settlement");
  assert.equal((await notify()).status, 200); // satu-satunya "aksi": Midtrans mengirim webhook
  await s.waitFor(2);
  assert.equal(s.frames.at(-1).status, "paid");
  assert.ok(s.frames.at(-1).paidAt);
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(s.isEnded(), true, "stream harus ditutup server ketika status final");
  assert.equal(hubs.get(inv)!.size, 0, "tidak ada pelanggan tersisa di hub");
  assert.equal(statusCalls, 1, "hanya Status API sekali untuk webhook; SSE sendiri tidak memanggil Midtrans");
});

test("SSE: event tidak membawa data sensitif (VA, nominal, nama, email, token)", async () => {
  activeEnv = envHub;
  await create();
  const s = await openStream(`/api/orders/${orders[0].invoice_no}/events`);
  await s.waitFor(1);
  statusReply = statusOk("settlement"); await notify();
  await s.waitFor(2);
  assert.deepEqual(Object.keys(s.frames[1]).sort(), ["invoiceNo", "paidAt", "paymentReady", "status", "updatedAt"]);
  assert.doesNotMatch(JSON.stringify(s.frames), /98812345|9888500212345678|99000|Budi|@mail|SB-Mid|snap/);
});

test("SSE: pesanan orang lain -> 404 (tidak bisa berlangganan); input path aneh -> 404", async () => {
  activeEnv = envHub;
  await create();
  const inv = orders[0].invoice_no;
  assert.equal((await call(`/api/orders/${inv}/events`, { user: "user-2" })).status, 404);
  assert.equal((await call(`/api/orders/..%2Fx/events`, { user: "user-1" })).status, 404);
  assert.equal(hubs.size, 0, "tidak ada hub dibuat untuk request yang ditolak");
});

test("SSE: pesanan yang sudah final -> satu snapshot lalu langsung ditutup (tanpa koneksi panjang)", async () => {
  activeEnv = envHub;
  await create();
  orders[0].status = "paid";
  const s = await openStream(`/api/orders/${orders[0].invoice_no}/events`);
  await s.waitFor(1);
  assert.equal(s.frames[0].status, "paid");
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(s.isEnded(), true);
  assert.equal(hubs.size, 0);
});

test("SSE: tanpa Durable Object -> 503 (klien beralih ke fallback polling database)", async () => {
  await create();
  assert.equal((await call(`/api/orders/${orders[0].invoice_no}/events`)).status, 503);
});

test("SSE: klien menutup halaman -> pelanggan dilepas dari hub (tidak ada kebocoran koneksi)", async () => {
  activeEnv = envHub;
  await create();
  const s = await openStream(`/api/orders/${orders[0].invoice_no}/events`);
  await s.waitFor(1);
  assert.equal(hubs.get(orders[0].invoice_no)!.size, 1);
  await s.cancel();
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(hubs.get(orders[0].invoice_no)!.size, 0);
});

test("SSE: batas pelanggan per pesanan (tab berlebihan ditolak 429)", async () => {
  activeEnv = envHub;
  await create();
  const open: Awaited<ReturnType<typeof openStream>>[] = [];
  for (let i = 0; i < 8; i++) { const s = await openStream(`/api/orders/${orders[0].invoice_no}/events`); await s.waitFor(1); open.push(s); }
  assert.equal((await call(`/api/orders/${orders[0].invoice_no}/events`)).status, 429);
  for (const s of open) await s.cancel();
});

test("hub gagal saat publish -> webhook tetap 200 dan database tetap lunas (hub hanya lonceng)", async () => {
  activeEnv = envHub;
  await create();
  hubBroken = true;
  statusReply = statusOk("settlement");
  assert.equal((await notify()).status, 200);
  assert.equal(orders[0].status, "paid");
});

test("publish hanya terjadi bila status benar-benar berubah (replay tidak memicu event)", async () => {
  activeEnv = envHub;
  await create();
  const s = await openStream(`/api/orders/${orders[0].invoice_no}/events`);
  await s.waitFor(1);
  statusReply = statusOk("pending");
  await notify({ transaction_status: "pending", status_code: "201" }); // tidak mengubah apa pun
  await new Promise((r) => setTimeout(r, 30));
  assert.equal(s.frames.length, 1);
  await s.cancel();
});
