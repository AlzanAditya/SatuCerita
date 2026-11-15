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
const SNAP = "https://app.sandbox.midtrans.com/snap/v1/transactions"; // endpoint Snap sesuai dokumentasi Midtrans
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
let snapCalls: { body: any; headers: Headers }[] = [];
let snapReply: ((body: any, n: number) => Response) | null = null;
let statusReply: (id: string) => any = () => ({ status_code: "404" });
let statusDown = false;
let currentUser = "user-1";
let failPatch = false;
let patchCount = 0;
let statusCalls = 0;
let activeEnv: Env = undefined as unknown as Env;
let redeemCodes: Row[] = [];
let redeemUsers: Row[] = [];
let rejectInsertWithCode = false; // meniru trigger DB yang menolak INSERT pesanan ber-kode (balapan / kode baru saja nonaktif)
const hemat10 = (): Row => ({ id: "00000000-0000-4000-8000-000000000001", code: "HEMAT10", description: null, discount_type: "percent", discount_value: 10, max_discount: null, usage_mode: "per_invitation", max_invitations_per_user: 1, starts_at: null, expires_at: null, audience: "all", is_active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" });

function matches(row: Row, params: URLSearchParams): boolean {
  for (const [k, v] of params) {
    if (["select", "limit", "offset", "order", "on_conflict"].includes(k)) continue;
    if (v.startsWith("eq.")) { if (String(row[k]) !== decodeURIComponent(v.slice(3))) return false; }
    else if (v === "is.null") { if (row[k] != null) return false; }
    else if (v === "not.is.null") { if (row[k] == null) return false; }
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

  if (url.origin === SB && url.pathname === "/auth/v1/user") {
    if (currentUser === "admin-1") return json({ id: "admin-1", email: "admin@x.id", email_confirmed_at: "2026-01-01T00:00:00Z", identities: [{ provider: "google" }], user_metadata: { full_name: "Admin" } });
    return json({ id: currentUser, email: `${currentUser}@mail.id`, user_metadata: { full_name: "Budi" } });
  }
  if (url.origin === SB && url.pathname === "/rest/v1/profiles") return json([{ full_name: "Budi", phone: "+628111" }]);

  if (url.origin === SB && url.pathname === "/rest/v1/orders") {
    if (method === "GET") return json(orders.filter((o) => matches(o, url.searchParams)));
    if (method === "POST") {
      const dupIdem = orders.some((o) => o.user_id === body.user_id && o.idempotency_key === body.idempotency_key);
      const dupPend = body.status === "pending" && orders.some((o) => o.user_id === body.user_id && o.template_slug === body.template_slug && o.status === "pending");
      if (dupIdem || dupPend) return json({ code: "23505" }, 409);
      if (body.discount_code && rejectInsertWithCode) return json({ message: "Jatah pemakaian kode redeem untuk akun ini sudah habis." }, 400); // trigger orders_enforce_redeem
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
  if (url.origin === SB && url.pathname === "/rest/v1/redeem_codes") {
    if (method === "GET") return json(redeemCodes.filter((r) => matches(r, url.searchParams)));
    if (method === "POST") {
      if (redeemCodes.some((r) => r.code === body.code)) return json({ code: "23505" }, 409);
      const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
      redeemCodes.push(row);
      return json([row], 201);
    }
    if (method === "PATCH") {
      const hit = redeemCodes.filter((r) => matches(r, url.searchParams));
      for (const r of hit) Object.assign(r, body);
      return json(hit);
    }
    if (method === "DELETE") {
      const hit = redeemCodes.filter((r) => matches(r, url.searchParams));
      redeemCodes = redeemCodes.filter((r) => !hit.includes(r));
      redeemUsers = redeemUsers.filter((u) => redeemCodes.some((r) => r.id === u.code_id));
      return json(hit);
    }
  }
  if (url.origin === SB && url.pathname === "/rest/v1/redeem_code_users") {
    if (method === "GET") return json(redeemUsers.filter((r) => matches(r, url.searchParams)));
    if (method === "POST") {
      for (const r of body as Row[]) if (!redeemUsers.some((u) => u.code_id === r.code_id && u.email === r.email)) redeemUsers.push(r);
      return new Response(null, { status: 201 });
    }
    if (method === "DELETE") {
      const hit = redeemUsers.filter((r) => matches(r, url.searchParams));
      redeemUsers = redeemUsers.filter((u) => !hit.includes(u));
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
  if (url.href === SNAP && method === "POST") {
    snapCalls.push({ body, headers: new Headers(init.headers) });
    if (snapReply) return snapReply(body, snapCalls.length);
    return json({ token: `snap-token-${snapCalls.length}`, redirect_url: `https://app.sandbox.midtrans.com/snap/v4/redirection/snap-token-${snapCalls.length}` }, 201);
  }
  if (url.origin === API && url.pathname.endsWith("/status")) {
    statusCalls++;
    if (statusDown) return new Response("down", { status: 503 });
    return json(statusReply(decodeURIComponent(url.pathname.split("/")[2])));
  }
  if (url.origin === API && url.pathname.endsWith("/cancel")) return json({ status_code: "200", transaction_status: "cancel" });
  throw new Error(`fetch tak terduga: ${method} ${url.href}`);
}) as typeof fetch;

beforeEach(() => { orders = []; events = []; chargeCalls = []; chargeReply = null; snapCalls = []; snapReply = null; failPatch = false; patchCount = 0; statusCalls = 0; activeEnv = env; hubs.clear(); hubBroken = false; statusReply = () => ({ status_code: "404" }); statusDown = false; currentUser = "user-1"; redeemCodes = [hemat10()]; redeemUsers = []; rejectInsertWithCode = false; });

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
  assert.equal(order.snapToken, undefined); // mode Core API: tidak ada token Snap
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

test("HEMAT10 (bawaan: 1 undangan per akun); kode ngawur ditolak", async () => {
  assert.equal((await create({ voucherCode: "HEMAT10" })).status, 201);
  const second = await create({ templateSlug: "aglaia", voucherCode: "HEMAT10" });
  assert.equal(second.status, 400);
  assert.match(((await second.json()) as any).error, /Jatah pemakaian/);
  assert.equal((await create({ templateSlug: "aglaia", voucherCode: "GRATIS100" })).status, 400);
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

test("Core API: respons ke browser tidak membawa Server Key, idempotency_key, charge_claimed_at, user_id, service_role, snapToken", async () => {
  const r = await create();
  const json = await r.json();
  const text = JSON.stringify(json);
  // Core API mode: snapToken TIDAK ada di response. Field sensitif lain juga dilarang.
  assert.doesNotMatch(text, /SB-Mid-server|idempotency_key|charge_claimed_at|user_id|service_role|snapToken/);
  assert.ok(!("snapToken" in json));
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
  await createAs("ub", "bri_va", "aglaia");
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


// ================================================================ MODE SNAP (popup Midtrans)
const snapEnv = { ...env, MIDTRANS_PAYMENT_MODE: "snap" } as unknown as Env;
const useSnap = () => { activeEnv = snapEnv; };
const itemSum = (b: any) => b.item_details.reduce((a: number, i: any) => a + i.price * i.quantity, 0);

test("Snap: config memberi mode + Client Key + URL snap.js sandbox, TANPA Server Key", async () => {
  useSnap();
  const c = (await (await call("/api/payments/config")).json()) as any;
  assert.equal(c.mode, "snap");
  assert.equal(c.clientKey, "SB-Mid-client-x");
  assert.equal(c.snapUrl, "https://app.sandbox.midtrans.com/snap/snap.js");
  assert.doesNotMatch(JSON.stringify(c), /server/i);
  activeEnv = env; // Core API: tidak ada kunci / URL Snap
  const core = (await (await call("/api/payments/config")).json()) as any;
  assert.equal(core.mode, "core_api");
  assert.ok(!("clientKey" in core) && !("snapUrl" in core));
});

test("Snap: pesanan memanggil /snap/v1/transactions (BUKAN /v2/charge atau /v2/token) dan token dikembalikan ke browser", async () => {
  useSnap();
  const r = await create();
  assert.equal(r.status, 201);
  const { order } = (await r.json()) as any;
  assert.equal(snapCalls.length, 1);
  assert.equal(chargeCalls.length, 0);
  assert.equal(order.snapToken, "snap-token-1");
  assert.equal(order.total, 99000);
  assert.equal(order.paymentReady, false); // instruksi (VA dst.) baru ada setelah pembeli memilih di popup + notifikasi
  assert.equal(orders[0].snap_token, "snap-token-1");
  assert.equal(orders[0].charge_claimed_at, null); // klaim charge hanya untuk Core API
  const c = snapCalls[0];
  assert.equal(c.headers.get("Authorization"), "Basic " + btoa(SK + ":"));
  assert.equal(c.headers.get("Content-Type"), "application/json");
  assert.equal(c.body.transaction_details.order_id, orders[0].invoice_no);
  assert.equal(c.body.transaction_details.gross_amount, 99000);
  assert.deepEqual(c.body.enabled_payments, ["bni_va"]);
  assert.equal(c.body.expiry.unit, "minutes");
  assert.equal(c.body.expiry.duration, 1440);
  assert.match(c.body.expiry.start_time, /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \+0700$/);
  assert.match(c.body.callbacks.finish, /^https:\/\/studio\.satucerita\.app\/order\/SC/);
  assert.equal(c.body.customer_details.first_name, "Budi");
  assert.equal(itemSum(c.body), 99000);
});

test("Snap: voucher -> item diskon negatif, jumlah item = gross_amount (syarat Midtrans)", async () => {
  useSnap();
  const r = await create({ voucherCode: "hemat10" });
  const { order } = (await r.json()) as any;
  assert.equal(order.total, 89100);
  assert.equal(snapCalls[0].body.transaction_details.gross_amount, 89100);
  assert.equal(itemSum(snapCalls[0].body), 89100);
});

test("Snap: kanal Midtrans per metode sesuai dokumentasi (echannel, other_qris, gopay + callback)", async () => {
  useSnap();
  const want: Record<string, string> = { bni_va: "bni_va", bri_va: "bri_va", permata_va: "permata_va", mandiri_bill: "echannel", qris: "other_qris", gopay: "gopay" };
  for (const [m, ch] of Object.entries(want)) {
    const r = await createAs(`u-${m}`, m);
    assert.equal(r.status, 201, m);
    assert.deepEqual(snapCalls.at(-1)!.body.enabled_payments, [ch], m);
  }
  const by = (ch: string) => snapCalls.find((c) => c.body.enabled_payments[0] === ch)!.body;
  assert.equal(by("gopay").gopay.enable_callback, true); // callback aplikasi GoPay hanya untuk kanal gopay
  assert.match(by("gopay").gopay.callback_url, /^https:\/\/studio\.satucerita\.app\/order\/SC/);
  assert.equal(by("other_qris").gopay, undefined);
  assert.equal(by("bni_va").gopay, undefined);
});

test("Snap: klik ganda paralel (kunci sama) -> hanya SATU token tersimpan, semua menerima token yang sama", async () => {
  useSnap();
  const k = key();
  const rs = await Promise.all(Array.from({ length: 6 }, () => create({ idempotencyKey: k })));
  const toks = await Promise.all(rs.map(async (r) => ((await r.json()) as any).order?.snapToken));
  assert.equal(orders.length, 1);
  assert.ok(toks.every((t) => t && t === orders[0].snap_token), JSON.stringify(toks));
});

test("Snap: kunci sama berurutan -> tidak membuat token baru", async () => {
  useSnap();
  const k = key();
  await create({ idempotencyKey: k });
  await create({ idempotencyKey: k });
  assert.equal(snapCalls.length, 1);
  assert.equal(orders.length, 1);
});

test("Snap: pilihan sama (tab lain, kunci baru) -> pesanan & token lama dipakai ulang, tidak dibatalkan", async () => {
  useSnap();
  await create();
  const r2 = await create();
  const { order, reused } = (await r2.json()) as any;
  assert.equal(orders.length, 1);
  assert.equal(snapCalls.length, 1);
  assert.equal(order.snapToken, "snap-token-1");
  assert.equal(reused, true);
});

test("Snap: ganti metode -> pesanan lama dibatalkan, pesanan baru dengan token baru", async () => {
  useSnap();
  await create();
  const r2 = await create({ method: "bri_va" });
  assert.equal(r2.status, 201);
  assert.equal(orders.length, 2);
  assert.equal(orders[0].status, "cancelled");
  assert.equal(orders[1].snap_token, "snap-token-2");
  assert.deepEqual(snapCalls[1].body.enabled_payments, ["bri_va"]);
});

test("Snap: Midtrans menolak (400) -> error ramah, token tidak tersimpan, tidak ada detail bocor; coba lagi berhasil", async () => {
  useSnap();
  snapReply = () => json({ error_messages: ["transaction_details.gross_amount is not equal to the sum of item_details"] }, 400);
  const k = key();
  const r = await create({ idempotencyKey: k });
  assert.equal(r.status, 422);
  const text = JSON.stringify(await r.json());
  assert.doesNotMatch(text, /gross_amount|item_details|SB-Mid-server/);
  assert.equal(orders[0].snap_token, null);
  assert.equal(orders[0].status, "pending");
  snapReply = null;
  const r2 = await create({ idempotencyKey: k }); // percobaan ulang dengan kunci sama
  assert.equal(r2.status, 200);
  assert.equal(((await r2.json()) as any).order.snapToken, "snap-token-2");
  assert.equal(orders.length, 1);
});

test("Snap: Midtrans down (500) / Server Key salah (401) -> error ramah, pesanan tetap pending tanpa token", async () => {
  useSnap();
  for (const status of [500, 401]) {
    orders = [];
    snapReply = () => json({ error_messages: ["Access denied due to unauthorized transaction, please check client or server key"] }, status);
    const r = await create();
    assert.ok([502, 503, 500].includes(r.status), String(r.status));
    assert.doesNotMatch(JSON.stringify(await r.json()), /unauthorized|server key/i);
    assert.equal(orders[0].snap_token, null);
  }
});

test("Snap: token tidak bocor ke pesanan yang sudah tidak pending, dan response tidak membawa field internal", async () => {
  useSnap();
  const r = await create();
  const json1 = (await r.json()) as any;
  assert.doesNotMatch(JSON.stringify(json1), /SB-Mid-server|idempotency_key|charge_claimed_at|user_id|service_role/);
  const inv = orders[0].invoice_no;
  orders[0].status = "cancelled";
  const g = (await (await call(`/api/orders/${inv}`)).json()) as any;
  assert.equal(g.order.snapToken, undefined);
  assert.doesNotMatch(JSON.stringify(await (await call("/api/orders")).json()), /snap-token-1/);
});

test("Snap: GET pesanan pending menyertakan token (untuk 'Lanjutkan pembayaran'); pesanan kedaluwarsa tidak", async () => {
  useSnap();
  await create();
  const inv = orders[0].invoice_no;
  assert.equal(((await (await call(`/api/orders/${inv}`)).json()) as any).order.snapToken, "snap-token-1");
  orders[0].expires_at = new Date(Date.now() - 3600_000).toISOString();
  statusReply = () => ({ status_code: "404" });
  assert.equal(((await (await call(`/api/orders/${inv}`)).json()) as any).order.snapToken, undefined);
});

test("Snap: pembeli memilih VA di popup -> notifikasi pending menyimpan nomor VA; settlement -> LUNAS (webhook tetap sumber kebenaran)", async () => {
  useSnap();
  await create();
  const inv = orders[0].invoice_no;
  statusReply = statusOk("pending", { payment_type: "bank_transfer", transaction_id: "snap-trx-1" });
  assert.equal((await notify({ transaction_status: "pending", status_code: "201", transaction_id: "snap-trx-1" })).status, 200);
  assert.equal(orders[0].status, "pending");
  assert.equal(orders[0].payment_info.vaNumber, "98812345");
  assert.equal(orders[0].midtrans_trx_id, "snap-trx-1");
  assert.equal(((await (await call(`/api/orders/${inv}`)).json()) as any).order.paymentReady, true);

  statusReply = statusOk("settlement", { transaction_id: "snap-trx-1" });
  assert.equal((await notify({ transaction_id: "snap-trx-1" })).status, 200);
  assert.equal(orders[0].status, "paid");
  assert.ok(orders[0].paid_at);
  const g = (await (await call(`/api/orders/${inv}`)).json()) as any;
  assert.equal(g.order.status, "paid");
  assert.equal(g.order.snapToken, undefined);
});

test("Snap: pembeli mengganti kanal di popup (transaction_id baru) setelah gagal -> tetap diterima & bisa lunas", async () => {
  useSnap();
  await create();
  statusReply = statusOk("pending", { transaction_id: "snap-trx-1" });
  await notify({ transaction_status: "pending", status_code: "201", transaction_id: "snap-trx-1" });
  // transaksi pertama diganti Snap dengan transaction_id baru (mis. pembeli pilih kanal lain) lalu dibayar
  statusReply = statusOk("settlement", { transaction_id: "snap-trx-2" });
  assert.equal((await notify({ transaction_id: "snap-trx-2" })).status, 200);
  assert.equal(orders[0].status, "paid");
});

test("Snap: nominal notifikasi tidak cocok -> needs_review (tidak pernah lunas)", async () => {
  useSnap();
  await create();
  assert.equal((await notify({ gross_amount: "1000.00" })).status, 200);
  assert.notEqual(orders[0].status, "paid");
});

test("Snap: expire dari Midtrans -> pesanan expired dan token tidak dikirim lagi", async () => {
  useSnap();
  await create();
  const inv = orders[0].invoice_no;
  statusReply = statusOk("expire");
  await notify({ transaction_status: "expire", status_code: "407" });
  assert.equal(orders[0].status, "expired");
  assert.equal(((await (await call(`/api/orders/${inv}`)).json()) as any).order.snapToken, undefined);
});

test("Snap: sync ('Cek status') memakai Status API; belum ada transaksi (404) -> tetap pending", async () => {
  useSnap();
  await create();
  const inv = orders[0].invoice_no;
  const r1 = (await (await call(`/api/orders/${inv}/sync`, { method: "POST" })).json()) as any;
  assert.equal(r1.order.status, "pending");
  assert.equal(r1.order.snapToken, "snap-token-1");
  orders[0].last_synced_at = null;
  statusReply = statusOk("settlement");
  const r2 = (await (await call(`/api/orders/${inv}/sync`, { method: "POST" })).json()) as any;
  assert.equal(r2.order.status, "paid");
});

test("Snap: konfigurasi salah (key production + mode sandbox) -> 503, tidak menghubungi Midtrans", async () => {
  activeEnv = { ...snapEnv, MIDTRANS_SERVER_KEY: "Mid-server-PROD" } as unknown as Env;
  const r = await create();
  assert.equal(r.status, 503);
  assert.equal(snapCalls.length, 0);
});

// ================================================================ Dev lokal: tidak boleh melompat ke produksi
const prodVars = { ...env, ENVIRONMENT: "production", COOKIE_DOMAIN: "satucerita.app", LOGIN_URL: "https://satucerita.app/login", STUDIO_HOME_URL: `${ORIGIN}/home`, DASH_LOGIN_URL: "https://dash.satucerita.app/login" } as unknown as Env;

test("lokal: login Google gagal kembali ke /login LOKAL (bukan satucerita.app); redirect_to Supabase = localhost", async () => {
  const bad = await worker.fetch(new Request("http://localhost:3000/api/auth/callback?next=studio"), prodVars);
  assert.equal(bad.status, 302);
  assert.equal(bad.headers.get("Location"), "http://localhost:3000/login?error=oauth_failed");
  const start = await worker.fetch(new Request("http://localhost:3000/api/auth/google?next=studio"), prodVars);
  const to = new URL(start.headers.get("Location")!).searchParams.get("redirect_to");
  assert.equal(to, "http://localhost:3000/api/auth/callback?next=studio");
  const cookie = start.headers.getSetCookie().join("\n");
  assert.doesNotMatch(cookie, /Domain=/); // cookie ber-Domain produksi ditolak browser di localhost
  assert.doesNotMatch(cookie, /Secure/);   // http://localhost
});

test("produksi: perilaku tidak berubah (callback gagal -> LOGIN_URL produksi, cookie ber-Domain)", async () => {
  const bad = await worker.fetch(new Request("https://satucerita.app/api/auth/callback?next=studio"), prodVars);
  assert.equal(bad.headers.get("Location"), "https://satucerita.app/login?error=oauth_failed");
  const start = await worker.fetch(new Request("https://satucerita.app/api/auth/google?next=studio"), prodVars);
  assert.equal(new URL(start.headers.get("Location")!).searchParams.get("redirect_to"), "https://satucerita.app/api/auth/callback?next=studio");
  assert.match(start.headers.getSetCookie().join("\n"), /Domain=\.satucerita\.app/);
});

// ================================================================ KODE REDEEM (diatur admin)
const addCode = (over: Row = {}): Row => {
  const r = { ...hemat10(), id: crypto.randomUUID(), code: "PROMO", ...over };
  redeemCodes.push(r);
  return r;
};
const errOf = async (r: Response) => ((await r.json()) as any).error as string;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
const ahead = (ms: number) => new Date(Date.now() + ms).toISOString();

test("redeem persen + batas maksimal: 50% dibatasi Rp30.000; total & item Midtrans konsisten", async () => {
  addCode({ code: "CAP30", discount_value: 50, max_discount: 30000 });
  const r = await create({ voucherCode: "cap30" });
  assert.equal(r.status, 201);
  const { order } = (await r.json()) as any;
  assert.equal(order.discountAmount, 30000);
  assert.equal(order.total, 69000);
  assert.equal(orders[0].discount_code, "CAP30");
  assert.equal(chargeCalls[0].body.item_details.reduce((a: number, i: any) => a + i.price * i.quantity, 0), 69000);
});

test("redeem flat: potongan nominal tetap", async () => {
  addCode({ code: "FLAT25", discount_type: "flat", discount_value: 25000 });
  const { order } = (await (await create({ voucherCode: "FLAT25" })).json()) as any;
  assert.equal(order.discountAmount, 25000);
  assert.equal(order.total, 74000);
});

test("redeem per undangan: jatah 2 undangan per akun -> pesanan ke-3 ditolak; akun lain tidak terpengaruh", async () => {
  addCode({ code: "DUA", max_invitations_per_user: 2 });
  assert.equal((await create({ templateSlug: "antheia", voucherCode: "DUA" })).status, 201);
  assert.equal((await create({ templateSlug: "aglaia", voucherCode: "DUA" })).status, 201);
  const third = await create({ templateSlug: "thaleia", voucherCode: "DUA" });
  assert.equal(third.status, 400);
  assert.match(await errOf(third), /Jatah pemakaian/);
  assert.equal(orders.length, 2);
  assert.equal((await call("/api/orders", { method: "POST", user: "user-2", body: { templateSlug: "antheia", method: "bni_va", idempotencyKey: key(), voucherCode: "DUA" } })).status, 201);
});

test("redeem per undangan: pesanan batal/kedaluwarsa mengembalikan jatah", async () => {
  addCode({ code: "SATU", max_invitations_per_user: 1 });
  assert.equal((await create({ templateSlug: "antheia", voucherCode: "SATU" })).status, 201);
  assert.equal((await create({ templateSlug: "aglaia", voucherCode: "SATU" })).status, 400);
  orders[0].status = "cancelled";
  assert.equal((await create({ templateSlug: "aglaia", voucherCode: "SATU" })).status, 201);
});

test("redeem berdasarkan waktu: tidak dibatasi jumlah pesanan selama masa berlaku", async () => {
  addCode({ code: "FLASH", usage_mode: "time_based", expires_at: ahead(3600_000), max_invitations_per_user: 1 });
  for (const slug of ["antheia", "aglaia", "thaleia"]) assert.equal((await create({ templateSlug: slug, voucherCode: "FLASH" })).status, 201, slug);
  assert.equal(orders.filter((o) => o.discount_code === "FLASH").length, 3);
});

test("redeem: belum berlaku / kedaluwarsa / dinonaktifkan / tidak ada -> ditolak dengan pesan jelas", async () => {
  addCode({ code: "NANTI", starts_at: ahead(3600_000) });
  addCode({ code: "LEWAT", expires_at: ago(1000) });
  addCode({ code: "MATI", is_active: false });
  const cases: [string, RegExp][] = [["NANTI", /belum berlaku/], ["LEWAT", /kedaluwarsa/], ["MATI", /tidak valid/], ["TIDAKADA", /tidak valid/]];
  for (const [code, re] of cases) {
    const r = await create({ voucherCode: code });
    assert.equal(r.status, 400, code);
    assert.match(await errOf(r), re, code);
  }
  assert.equal(orders.length, 0);
});

test("redeem audiens terpilih: hanya email yang terdaftar; audiens semua: siapa saja", async () => {
  const c = addCode({ code: "VIP", audience: "selected" });
  redeemUsers.push({ code_id: c.id, email: "user-1@mail.id" });
  assert.equal((await create({ voucherCode: "VIP" })).status, 201);
  const other = await call("/api/orders", { method: "POST", user: "user-2", body: { templateSlug: "antheia", method: "bni_va", idempotencyKey: key(), voucherCode: "VIP" } });
  assert.equal(other.status, 400);
  assert.match(await errOf(other), /tidak tersedia untuk akunmu/);
  addCode({ code: "SEMUA" });
  const anyone = await call("/api/orders", { method: "POST", user: "user-2", body: { templateSlug: "antheia", method: "bni_va", idempotencyKey: key(), voucherCode: "SEMUA" } });
  assert.equal(anyone.status, 201);
});

test("redeem tidak bisa ditumpuk: dua kode (string/array) ditolak dan tidak ada pesanan dibuat", async () => {
  addCode({ code: "FLAT25", discount_type: "flat", discount_value: 25000 });
  for (const voucherCode of ["HEMAT10,FLAT25", "HEMAT10 FLAT25", ["HEMAT10", "FLAT25"]]) {
    const r = await create({ voucherCode });
    assert.equal(r.status, 400);
    assert.match(await errOf(r), /Hanya satu kode redeem/);
  }
  assert.equal(orders.length, 0);
});

test("quote: pesanan pending milik sendiri untuk template yang sama tidak menghabiskan jatah (akan digantikan)", async () => {
  assert.equal((await create({ templateSlug: "antheia", voucherCode: "HEMAT10" })).status, 201); // pending
  const q = (slug: string) => call("/api/orders/quote", { method: "POST", body: { templateSlug: slug, voucherCode: "HEMAT10" } });
  const same = await q("antheia");
  assert.equal(same.status, 200);
  assert.equal(((await same.json()) as any).discountAmount, 9900);
  assert.equal((await q("aglaia")).status, 400); // template lain: jatah 1 undangan sudah terpakai
});

test("retry idempoten untuk pesanan ber-kode tetap mengembalikan pesanan yang sama (bukan error jatah habis)", async () => {
  const k = key();
  const a = await create({ idempotencyKey: k, voucherCode: "HEMAT10" });
  assert.equal(a.status, 201);
  const b = await create({ idempotencyKey: k, voucherCode: "HEMAT10" });
  assert.equal(b.status, 200);
  assert.equal(orders.length, 1);
});

test("redeem: penjaga DB menolak INSERT (balapan / kode baru nonaktif) -> 400 yang ramah, bukan 500", async () => {
  rejectInsertWithCode = true;
  const r = await create({ voucherCode: "HEMAT10" });
  assert.equal(r.status, 400);
  assert.match(await errOf(r), /Kode redeem tidak dapat digunakan/);
});

// ---------------------------------------------------------------- API admin kode redeem
const admin = (path: string, init: { method?: string; body?: unknown } = {}) => call(path, { ...init, user: "admin-1" });
const validCode = (over: Record<string, unknown> = {}) => ({ code: "natal", discountType: "percent", discountValue: 25, maxDiscount: 30000, usageMode: "per_invitation", maxInvitationsPerUser: 3, audience: "all", ...over });

test("admin redeem: hanya admin (401 tanpa login, 403 pengguna biasa)", async () => {
  assert.equal((await call("/api/admin/redeem")).status, 403);
  assert.equal((await call("/api/admin/redeem", { method: "POST", body: validCode() })).status, 403);
  assert.equal(redeemCodes.length, 1);
});

test("admin redeem: buat -> daftar (dengan statistik) -> ubah -> hapus", async () => {
  const created = await admin("/api/admin/redeem", { method: "POST", body: validCode({ expiresAt: ahead(86400_000), description: "Promo Natal" }) });
  assert.equal(created.status, 201);
  const { code } = (await created.json()) as any;
  assert.equal(code.code, "NATAL");
  assert.equal(code.maxDiscount, 30000);
  assert.equal(code.maxInvitationsPerUser, 3);

  assert.equal((await admin("/api/admin/redeem", { method: "POST", body: validCode() })).status, 409); // nama sama

  // dipakai oleh user -> muncul di statistik
  assert.equal((await create({ voucherCode: "NATAL" })).status, 201);
  orders[0].status = "paid";
  const list = (await (await admin("/api/admin/redeem")).json()) as any;
  const natal = list.codes.find((c: any) => c.code === "NATAL");
  assert.deepEqual(natal.stats, { orders: 1, paid: 1, users: 1, discountGiven: 24750 });
  assert.equal(list.codes.find((c: any) => c.code === "HEMAT10").stats.orders, 0);

  // ubah: nonaktifkan -> checkout menolak
  const off = await admin(`/api/admin/redeem/${code.id}`, { method: "PATCH", body: { isActive: false } });
  assert.equal(off.status, 200);
  assert.equal(redeemCodes.find((r) => r.code === "NATAL")!.is_active, false);
  assert.equal((await create({ templateSlug: "aglaia", voucherCode: "NATAL" })).status, 400);

  // nama kode tidak bisa diganti; kode yang sudah dipakai tidak bisa dihapus
  assert.equal((await admin(`/api/admin/redeem/${code.id}`, { method: "PATCH", body: { code: "LAIN" } })).status, 400);
  const del = await admin(`/api/admin/redeem/${code.id}`, { method: "DELETE" });
  assert.equal(del.status, 409);
  assert.match(await errOf(del), /Nonaktifkan/);

  // kode yang belum pernah dipakai boleh dihapus
  const fresh = (await (await admin("/api/admin/redeem", { method: "POST", body: validCode({ code: "BARU" }) })).json()) as any;
  assert.equal((await admin(`/api/admin/redeem/${fresh.code.id}`, { method: "DELETE" })).status, 200);
  assert.equal(redeemCodes.some((r) => r.code === "BARU"), false);
  assert.equal((await admin("/api/admin/redeem/bukan-uuid", { method: "DELETE" })).status, 404);
});

test("admin redeem: daftar email dikelola (tambah/hapus) dan validasi input mengembalikan 400", async () => {
  assert.equal((await admin("/api/admin/redeem", { method: "POST", body: validCode({ audience: "selected" }) })).status, 400); // tanpa email
  assert.equal((await admin("/api/admin/redeem", { method: "POST", body: validCode({ usageMode: "time_based" }) })).status, 400); // tanpa akhir
  assert.equal((await admin("/api/admin/redeem", { method: "POST", body: validCode({ discountValue: 150 }) })).status, 400);
  assert.equal(redeemCodes.length, 1);

  const c = (await (await admin("/api/admin/redeem", { method: "POST", body: validCode({ code: "TIM", audience: "selected", emails: ["A@x.id", "b@x.id"] }) })).json()) as any;
  assert.deepEqual(redeemUsers.map((u) => u.email).sort(), ["a@x.id", "b@x.id"]);
  const upd = await admin(`/api/admin/redeem/${c.code.id}`, { method: "PATCH", body: { emails: ["b@x.id", "c@x.id"] } });
  assert.equal(upd.status, 200);
  assert.deepEqual(redeemUsers.map((u) => u.email).sort(), ["b@x.id", "c@x.id"]);
});
