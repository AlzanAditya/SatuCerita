/**
 * Diagnosis charge Midtrans dari LUAR Worker.
 *
 *   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx npx tsx scripts/check-charge.ts [sandbox|production]
 *
 * Bagian 1: permintaan MINIMAL persis seperti contoh di dokumentasi Midtrans
 *           (docs.midtrans.com/docs/coreapi-core-api-bank-transfer-integration) untuk tiap metode.
 *           Kalau di sini sudah 402 -> masalahnya di AKUN / KUNCI (bukan kode kita).
 * Bagian 2: payload aplikasi (buildChargeBody) ditambah SATU elemen per langkah (bisect) untuk BNI VA:
 *           minimal -> +item/customer -> +custom_expiry -> +header Idempotency-Key.
 *           Langkah pertama yang berubah dari 201 ke 402/400 = penyebabnya.
 * Server Key hanya dibaca dari environment lokal dan TIDAK dicetak penuh. Transaksi uji dibatalkan.
 */
import { buildChargeBody, formatWib, type ChargeMethod } from "../worker/src/midtrans";

const KEY = (process.env.MIDTRANS_SERVER_KEY || "").trim();
if (!KEY) { console.error("Set MIDTRANS_SERVER_KEY di environment lokal (jangan ditempel ke chat)."); process.exit(2); }
console.log(`Server Key: panjang=${KEY.length}, awalan=${KEY.slice(0, 11)}...`);
const mode = process.argv[2] === "production" ? "production" : "sandbox";
if (mode === "sandbox" && !KEY.startsWith("SB-")) { console.error("Mode sandbox tetapi Server Key bukan key Sandbox (SB-Mid-server-...)."); process.exit(2); }
const API = mode === "production" ? "https://api.midtrans.com" : "https://api.sandbox.midtrans.com";
const AUTH = "Basic " + Buffer.from(KEY + ":").toString("base64");
console.log(`Environment: ${mode} (${API})`);

async function call(path: string, body?: unknown, extraHeaders: Record<string, string> = {}) {
  const r = await fetch(API + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: AUTH, ...extraHeaders },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await r.text();
  let json: Record<string, any> = {};
  try { json = JSON.parse(raw); } catch { /* bukan JSON */ }
  return { http: r.status, raw, json };
}

const rid = () => `SC000000-T${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function run(label: string, body: any, headers: Record<string, string> = {}) {
  const orderId = body.transaction_details.order_id;
  const { http, raw, json: res } = await call("/v2/charge", body, headers);
  console.log(`  ${label.padEnd(34)} HTTP ${http} status_code=${res.status_code ?? "-"} ${res.status_message ?? ""}`);
  if (res.validation_messages) console.log("    validation:", res.validation_messages);
  if (res.status_code === undefined) console.log("    raw:", raw.slice(0, 300) || "(kosong)");
  if (res.status_code === "201") await call(`/v2/${orderId}/cancel`, {});
  await sleep(350);
  return res.status_code as string | undefined;
}

// ---- Bagian 1: contoh minimal dari dokumentasi
console.log("\n=== 1) Permintaan MINIMAL (contoh dokumentasi) ===");
const minimal: Record<string, (id: string) => any> = {
  bni_va: (id) => ({ payment_type: "bank_transfer", transaction_details: { order_id: id, gross_amount: 44000 }, bank_transfer: { bank: "bni" } }),
  bri_va: (id) => ({ payment_type: "bank_transfer", transaction_details: { order_id: id, gross_amount: 44000 }, bank_transfer: { bank: "bri" } }),
  permata_va: (id) => ({ payment_type: "permata", transaction_details: { order_id: id, gross_amount: 44000 } }),
  mandiri_bill: (id) => ({ payment_type: "echannel", transaction_details: { order_id: id, gross_amount: 44000 }, echannel: { bill_info1: "Payment:", bill_info2: "Online purchase" } }),
  qris: (id) => ({ payment_type: "qris", transaction_details: { order_id: id, gross_amount: 44000 }, qris: { acquirer: "gopay" } }),
  gopay: (id) => ({ payment_type: "gopay", transaction_details: { order_id: id, gross_amount: 44000 } }),
};
const results: Record<string, string | undefined> = {};
for (const [m, mk] of Object.entries(minimal)) { console.log(`[${m}]`); results[m] = await run("minimal", mk(rid())); }

// ---- Bagian 2: bisect payload aplikasi (BNI VA)
console.log("\n=== 2) Bisect payload aplikasi (BNI VA) ===");
const id = () => rid();
const app = (oid: string) => buildChargeBody({
  orderId: oid, grossAmount: 99000, method: "bni_va" as ChargeMethod,
  items: [{ id: "diagnosis", price: 99000, quantity: 1, name: "Template Diagnosis" }],
  customer: { first_name: "Tes Diagnosis", email: "tes@example.com" },
  expiryStartWib: formatWib(new Date()), expiryMinutes: 24 * 60,
}) as any;
{
  const a = app(id()); await run("1. minimal (nominal 99000)", { payment_type: a.payment_type, transaction_details: a.transaction_details, bank_transfer: a.bank_transfer });
  const b = app(id()); await run("2. + item_details + customer_details", { payment_type: b.payment_type, transaction_details: b.transaction_details, bank_transfer: b.bank_transfer, item_details: b.item_details, customer_details: b.customer_details });
  const c = app(id()); await run("3. + custom_expiry (payload penuh)", c);
  const d = app(id()); await run("4. payload penuh + Idempotency-Key", d, { "Idempotency-Key": `${d.transaction_details.order_id}-charge`.slice(0, 46) });
}

console.log("\n=== Cara membaca ===");
if (Object.values(results).every((c) => c === "402")) {
  console.log("Permintaan MINIMAL pun 402 untuk semua metode -> bukan payload kita. Server Key ini milik merchant/akun yang belum punya kanal aktif,\nATAU kunci bukan dari akun Sandbox yang kamu maksud. Cek: dashboard.sandbox.midtrans.com -> Settings -> Access Keys (merchant & environment benar)\ndan Settings -> Payment / Payment Settings; bila tetap 402, hubungi Midtrans (error 402 'Merchant doesn't have access for this payment type').");
} else {
  console.log("Ada metode yang lolos pada permintaan minimal -> bandingkan dengan bagian 2 untuk menemukan elemen payload yang memicu penolakan.");
}
