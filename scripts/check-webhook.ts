/**
 * Diagnosis webhook Midtrans dari LUAR (meniru Midtrans memanggil URL publik Anda).
 *
 *   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx npx tsx scripts/check-webhook.ts [https://satucerita.app/api/payments/midtrans/webhook]
 *
 * Server Key hanya dibaca dari environment lokal Anda, dipakai menghitung signature, dan TIDAK dicetak / dikirim.
 * Tes 2 menulis satu baris log "unknown_order" ke tabel payment_events; tidak membuat/mengubah pesanan.
 *
 * Cara membaca hasil:
 *   Tes 1 = 401 + JSON   -> permintaan SAMPAI ke Worker. (Jika 403/HTML/cf-mitigated: diblokir Cloudflare SEBELUM Worker.)
 *   Tes 2 = 200 + {ok}   -> signature valid dengan Server Key di Worker. (401: Server Key Worker != akun Midtrans pengirim.)
 *   Tes 3 = 405          -> routing webhook benar.
 */
import { createHash } from "node:crypto";

const URL_ = process.argv[2] || "https://satucerita.app/api/payments/midtrans/webhook";
const KEY = (process.env.MIDTRANS_SERVER_KEY || "").trim();
if (!KEY) { console.error("Set MIDTRANS_SERVER_KEY di environment lokal (jangan di-commit / ditempel ke chat)."); process.exit(2); }

const sig = (o: string, s: string, g: string) => createHash("sha512").update(o + s + g + KEY).digest("hex");

async function hit(name: string, init: RequestInit) {
  const r = await fetch(URL_, init);
  const ct = r.headers.get("content-type") || "";
  const text = (await r.text()).slice(0, 200).replace(/\s+/g, " ");
  const edge = r.headers.get("cf-mitigated") ? ` cf-mitigated=${r.headers.get("cf-mitigated")}` : "";
  console.log(`\n[${name}] HTTP ${r.status} content-type=${ct} cf-ray=${r.headers.get("cf-ray") ?? "-"}${edge}`);
  console.log(`  body: ${text}`);
  if (!ct.includes("json") && r.status >= 400) console.log("  >>> BUKAN JSON dari Worker: kemungkinan diblokir/ditantang Cloudflare (WAF / Bot Fight Mode / Security Level).");
  return r.status;
}

const body = (o: Record<string, string>) => JSON.stringify(o);
const headers = { "Content-Type": "application/json", "User-Agent": "midtrans-webhook-check/1.0" };
const base = { order_id: "SC000000-CHECK000", status_code: "200", gross_amount: "10000.00", transaction_status: "settlement", transaction_id: "check", transaction_time: "2026-01-01 00:00:00", payment_type: "bank_transfer" };

const a = await hit("1 signature SALAH (harus 401)", { method: "POST", headers, body: body({ ...base, signature_key: "0".repeat(128) }) });
const b = await hit("2 signature BENAR, order tak dikenal (harus 200 ok)", { method: "POST", headers, body: body({ ...base, signature_key: sig(base.order_id, base.status_code, base.gross_amount) }) });
const c = await hit("3 GET (harus 405)", { method: "GET", headers });
console.log(`\nRingkasan: ${a === 401 ? "OK" : "GAGAL"} / ${b === 200 ? "OK" : "GAGAL"} / ${c === 405 ? "OK" : "GAGAL"}`);
process.exit(a === 401 && b === 200 && c === 405 ? 0 : 1);
