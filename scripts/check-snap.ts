/**
 * Verifikasi pembuatan transaksi Snap ke Midtrans dari LUAR Worker (memakai builder yang sama dengan aplikasi).
 *
 *   MIDTRANS_SERVER_KEY=SB-Mid-server-xxxx npx tsx scripts/check-snap.ts [sandbox|production]
 *
 * Memanggil POST {app}/snap/v1/transactions (dokumentasi: docs.midtrans.com/docs/snap-snap-integration-guide) untuk
 * setiap metode yang dipakai aplikasi. Sukses = HTTP 201 + token. Tidak ada uang bergerak (transaksi baru dibuat saat pembeli memilih kanal).
 * 401 = Server Key salah/beda environment. 400 = parameter ditolak (lihat error_messages).
 * Server Key hanya dibaca dari environment lokal dan TIDAK dicetak penuh.
 */
import { buildSnapBody, formatWib } from "../worker/src/midtrans";
import { PAYMENT_METHODS, type PaymentMethodId } from "../worker/src/pricing";

const KEY = (process.env.MIDTRANS_SERVER_KEY || "").trim();
if (!KEY) { console.error("Set MIDTRANS_SERVER_KEY di environment lokal (jangan ditempel ke chat)."); process.exit(2); }
const mode = process.argv[2] === "production" ? "production" : "sandbox";
if (mode === "sandbox" && !KEY.startsWith("SB-")) { console.error("Mode sandbox tetapi Server Key bukan key Sandbox (SB-Mid-server-...)."); process.exit(2); }
const HOST = mode === "production" ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
console.log(`Server Key: panjang=${KEY.length}, awalan=${KEY.slice(0, 11)}...  Environment: ${mode} (${HOST})`);

let failed = 0;
for (const method of Object.keys(PAYMENT_METHODS) as PaymentMethodId[]) {
  const orderId = `SC000000-T${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  const body = buildSnapBody({
    orderId,
    grossAmount: 89100,
    items: [
      { id: "antheia", price: 99000, quantity: 1, name: "Template Antheia" },
      { id: "DISCOUNT", price: -9900, quantity: 1, name: "Voucher HEMAT10" },
    ],
    customer: { first_name: "Tes Snap", email: "tes@example.com" },
    enabledPayments: PAYMENT_METHODS[method].enabled,
    expiryStartWib: formatWib(new Date()),
    expiryMinutes: 60,
    finishUrl: "https://studio.satucerita.app/order/" + orderId,
  });
  const r = await fetch(`${HOST}/snap/v1/transactions`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(KEY + ":").toString("base64") },
    body: JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as { token?: string; error_messages?: string[] };
  const ok = r.status === 201 && !!j.token;
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "GAGAL"} ${method.padEnd(13)} http=${r.status} ${ok ? `token=${j.token!.slice(0, 8)}…` : (j.error_messages || []).join("; ")}`);
}
process.exit(failed ? 1 : 0);
