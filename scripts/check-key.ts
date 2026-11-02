/**
 * Membedakan penyebab 402 "Payment channel is not activated" dengan membandingkan Snap vs Core API
 * memakai Server Key YANG SAMA dari environment lokal.
 *
 *   MIDTRANS_SERVER_KEY=$(grep '^MIDTRANS_SERVER_KEY=' worker/.dev.vars | cut -d= -f2- | tr -d '"') npx tsx scripts/check-key.ts
 *
 * Server Key tidak dicetak; yang dicetak hanya sidik jari (8 hex pertama SHA-256) agar bisa dibandingkan antar-lingkungan.
 * Transaksi uji (jika terbentuk) dibatalkan.
 */
import { createHash } from "node:crypto";

const KEY = (process.env.MIDTRANS_SERVER_KEY || "").trim();
if (!KEY) { console.error("Set MIDTRANS_SERVER_KEY di environment lokal."); process.exit(2); }
const AUTH = "Basic " + Buffer.from(KEY + ":").toString("base64");
const API = "https://api.sandbox.midtrans.com";
const SNAP = "https://app.sandbox.midtrans.com/snap/v1/transactions";
const rid = () => `SC000000-K${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

console.log(`Sidik jari key: ${createHash("sha256").update(KEY).digest("hex").slice(0, 8)}  panjang=${KEY.length}  4 karakter terakhir=${KEY.slice(-4)}`);
console.log("(bandingkan 4 karakter terakhir dengan Settings > Access Keys di dashboard Sandbox yang dipakai Snap)\n");

async function req(url: string, body?: unknown) {
  const r = await fetch(url, { method: body ? "POST" : "GET", headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: AUTH }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text(); let j: any = {}; try { j = JSON.parse(t); } catch { /* */ }
  return { http: r.status, j, raw: t.slice(0, 250) };
}

// 1) Apakah key valid sama sekali? (404 di body = key valid, order memang tidak ada; 401 = key salah)
const a = await req(`${API}/v2/SC000000-NOTEXIST/status`);
console.log(`[1] Auth key         : HTTP ${a.http} status_code=${a.j.status_code ?? "-"}  -> ${a.http === 401 || a.j.status_code === "401" ? "KEY DITOLAK (salah/bukan Sandbox)" : "key diterima Midtrans"}`);

// 2) Snap dengan key yang sama, hanya BNI VA (persis seperti kode lama)
const s1 = await req(SNAP, { transaction_details: { order_id: rid(), gross_amount: 44000 }, enabled_payments: ["bni_va"] });
console.log(`[2] Snap enabled=bni_va : HTTP ${s1.http} ${s1.j.token ? "TOKEN DIBUAT" : s1.j.error_messages ? JSON.stringify(s1.j.error_messages) : s1.raw}`);

// 3) Snap tanpa pembatasan kanal: kanal apa yang benar-benar aktif?
const s2 = await req(SNAP, { transaction_details: { order_id: rid(), gross_amount: 44000 } });
console.log(`[3] Snap semua kanal    : HTTP ${s2.http} ${s2.j.token ? "TOKEN DIBUAT" : s2.j.error_messages ? JSON.stringify(s2.j.error_messages) : s2.raw}`);
if (s2.j.token) {
  const r = await fetch(`https://app.sandbox.midtrans.com/snap/v1/transactions/${s2.j.token}`, { headers: { Accept: "application/json" } });
  const t: any = await r.json().catch(() => ({}));
  const names = (t.enabled_payments ?? t.merchant?.enabled_payments ?? []).map((p: any) => p.type ?? p).join(", ");
  console.log(`    kanal aktif menurut Snap: ${names || "(tidak terbaca)"}`);
}

// 4) Core API minimal (bandingan langsung)
const c = await req(`${API}/v2/charge`, { payment_type: "bank_transfer", transaction_details: { order_id: rid(), gross_amount: 44000 }, bank_transfer: { bank: "bni" } });
console.log(`[4] Core API bni minimal: HTTP ${c.http} status_code=${c.j.status_code ?? "-"} ${c.j.status_message ?? ""}`);
if (c.j.status_code === "201") await req(`${API}/v2/${c.j.order_id}/cancel`, {});

console.log("\n=== Cara membaca ===");
console.log("[1] ditolak                      -> key salah / bukan Sandbox. Perbaiki key.");
console.log("[2] TOKEN + [4] 402              -> akun yang sama: Snap diizinkan, Core API belum. Aktifkan Core API / hubungi Midtrans (FAQ resmi: 402 = kanal belum diaktifkan).");
console.log("[2] gagal + [3] token + [4] 402  -> kanal BNI memang belum aktif; Snap lama Anda memakai kanal lain (lihat daftar kanal di [3]).");
console.log("[2][3] token + [4] 201           -> Core API OK untuk key ini; berarti key di .dev.vars BEDA dengan yang dipakai Worker/akun lain.");
