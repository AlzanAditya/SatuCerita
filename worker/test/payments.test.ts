// Jalankan: npm run worker:test   (node:test via tsx, tanpa dependensi tambahan)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeSignature, verifyNotificationSignature, timingSafeEqualStr, parseGrossAmount, formatWib,
  assertMidtransConfig,
} from "../src/midtrans";
import { mapMidtransStatus, nextStatus, extractPaymentInfo } from "../src/state";
import { computeQuote, isPaymentMethod, PAYMENT_METHODS } from "../src/pricing";
import { MSG, computeDiscount, parseRedeemInput, parseVoucherInput, type RedeemCodeRow } from "../src/redeem";
import type { Env } from "../src/types";

const KEY = "SB-Mid-server-TESTKEY";

// ---------------------------------------------------------------- signature
test("signature = SHA512(order_id + status_code + gross_amount + server_key)", async () => {
  // Contoh dari dokumentasi Midtrans (PHP): 1111 + 200 + 100000.00 + serverkey
  const sig = await computeSignature("1111", "200", "100000.00", "askvnoibnosifnboseofinbofinfgbiufglnbfg");
  assert.equal(sig.length, 128);
  assert.match(sig, /^[0-9a-f]+$/);
});

test("notifikasi dengan signature benar diterima, yang salah/diubah ditolak", async () => {
  const base = { order_id: "SC261030-ABCDEFGH", status_code: "200", gross_amount: "99000.00" };
  const signature_key = await computeSignature(base.order_id, base.status_code, base.gross_amount, KEY);
  assert.equal(await verifyNotificationSignature({ ...base, signature_key }, KEY), true);
  // nominal dimanipulasi
  assert.equal(await verifyNotificationSignature({ ...base, gross_amount: "1.00", signature_key }, KEY), false);
  // order lain
  assert.equal(await verifyNotificationSignature({ ...base, order_id: "SC261030-ZZZZZZZZ", signature_key }, KEY), false);
  // server key salah
  assert.equal(await verifyNotificationSignature({ ...base, signature_key }, "SB-Mid-server-OTHER"), false);
  // field hilang / tipe salah
  assert.equal(await verifyNotificationSignature({ order_id: base.order_id, signature_key }, KEY), false);
  assert.equal(await verifyNotificationSignature({ ...base, gross_amount: 99000 as unknown as string, signature_key }, KEY), false);
  assert.equal(await verifyNotificationSignature({ ...base, signature_key: "" }, KEY), false);
});

test("timingSafeEqualStr", () => {
  assert.equal(timingSafeEqualStr("abc", "abc"), true);
  assert.equal(timingSafeEqualStr("abc", "abd"), false);
  assert.equal(timingSafeEqualStr("abc", "abcd"), false);
});

// ---------------------------------------------------------------- util
test("parseGrossAmount hanya menerima rupiah valid", () => {
  assert.equal(parseGrossAmount("99000.00"), 99000);
  assert.equal(parseGrossAmount("99000"), 99000);
  assert.equal(parseGrossAmount(99000), 99000);
  assert.equal(parseGrossAmount("99000.50"), null); // bukan rupiah bulat
  assert.equal(parseGrossAmount("-1"), null);
  assert.equal(parseGrossAmount("1e5"), null);
  assert.equal(parseGrossAmount(""), null);
  assert.equal(parseGrossAmount(undefined), null);
});

test("formatWib", () => {
  assert.equal(formatWib(new Date("2026-10-30T00:05:09Z")), "2026-10-30 07:05:09 +0700");
  assert.equal(formatWib(new Date("2026-12-31T20:00:00Z")), "2027-01-01 03:00:00 +0700");
});

test("assertMidtransConfig menolak salah-environment", () => {
  const e = (o: Partial<Env>) => ({ MIDTRANS_ENV: "sandbox", MIDTRANS_CLIENT_KEY: "SB-Mid-client-x", MIDTRANS_SERVER_KEY: KEY, ...o }) as Env;
  assert.equal(assertMidtransConfig(e({})), null);
  assert.ok(assertMidtransConfig(e({ MIDTRANS_SERVER_KEY: "" })));
  assert.ok(assertMidtransConfig(e({ MIDTRANS_CLIENT_KEY: "" })));
  assert.ok(assertMidtransConfig(e({ MIDTRANS_SERVER_KEY: "Mid-server-prod" }))); // sandbox + key production
  assert.ok(assertMidtransConfig(e({ MIDTRANS_ENV: "production" })));            // production + key sandbox
  assert.equal(assertMidtransConfig(e({ MIDTRANS_ENV: "production", MIDTRANS_SERVER_KEY: "Mid-server-prod" })), null);
});

// ---------------------------------------------------------------- mesin status
test("mapMidtransStatus", () => {
  assert.equal(mapMidtransStatus({ transaction_status: "settlement" }), "paid");
  assert.equal(mapMidtransStatus({ transaction_status: "capture", fraud_status: "accept" }), "paid");
  assert.equal(mapMidtransStatus({ transaction_status: "capture", fraud_status: "challenge" }), "needs_review");
  assert.equal(mapMidtransStatus({ transaction_status: "pending" }), "pending");
  assert.equal(mapMidtransStatus({ transaction_status: "expire" }), "expired");
  assert.equal(mapMidtransStatus({ transaction_status: "cancel" }), "cancelled");
  assert.equal(mapMidtransStatus({ transaction_status: "deny" }), "failed");
  assert.equal(mapMidtransStatus({ transaction_status: "refund" }), "needs_review");
  assert.equal(mapMidtransStatus({ transaction_status: "authorize" }), null);
  assert.equal(mapMidtransStatus({}), null);
});

test("nextStatus: lunas tidak boleh mundur; uang masuk setelah ditutup -> needs_review", () => {
  assert.equal(nextStatus("pending", "paid"), "paid");
  assert.equal(nextStatus("pending", "expired"), "expired");
  assert.equal(nextStatus("pending", "pending"), "pending");
  // notifikasi terlambat / urutan terbalik
  assert.equal(nextStatus("paid", "pending"), "paid");
  assert.equal(nextStatus("paid", "expired"), "paid");
  assert.equal(nextStatus("paid", "cancelled"), "paid");
  assert.equal(nextStatus("paid", "failed"), "paid");
  assert.equal(nextStatus("paid", "needs_review"), "needs_review"); // refund / sengketa
  // uang masuk setelah pesanan ditutup
  assert.equal(nextStatus("cancelled", "paid"), "needs_review");
  assert.equal(nextStatus("expired", "paid"), "needs_review");
  assert.equal(nextStatus("failed", "paid"), "needs_review");
  // status akhir lain tidak berubah
  assert.equal(nextStatus("expired", "pending"), "expired");
  assert.equal(nextStatus("cancelled", "expired"), "cancelled");
  assert.equal(nextStatus("needs_review", "paid"), "needs_review");
});

test("extractPaymentInfo: VA, Permata, Mandiri Bill, QR/deeplink", () => {
  assert.deepEqual(extractPaymentInfo({ va_numbers: [{ bank: "bni", va_number: "9881234" }] }), { bank: "bni", vaNumber: "9881234" });
  assert.deepEqual(extractPaymentInfo({ permata_va_number: "8777" }), { bank: "permata", vaNumber: "8777" });
  assert.deepEqual(extractPaymentInfo({ biller_code: "70012", bill_key: "123456" }), { billerCode: "70012", billKey: "123456" });
  const q = extractPaymentInfo({ actions: [
    { name: "generate-qr-code", url: "https://api.sandbox.midtrans.com/qr.png" },
    { name: "deeplink-redirect", url: "javascript:alert(1)" }, // bukan https -> dibuang
  ] });
  assert.equal(q.qrUrl, "https://api.sandbox.midtrans.com/qr.png");
  assert.equal(q.deeplinkUrl, undefined);
});

// ---------------------------------------------------------------- harga & voucher (server-side)
test("harga dasar dihitung server dari katalog; input aneh ditolak", () => {
  const ok = computeQuote("antheia");
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.quote.total, ok.quote.template.discountPrice);
    assert.equal(ok.quote.discountAmount, 0);
    assert.equal(ok.quote.discountCode, null);
  }
  assert.equal(computeQuote("tidak-ada").ok, false);
  assert.equal(computeQuote({ $ne: 1 }).ok, false);
});

// ---------------------------------------------------------------- kode redeem (fungsi murni)
test("parseVoucherInput: satu kode bersih; lebih dari satu kode ditolak (tidak bisa ditumpuk)", () => {
  assert.deepEqual(parseVoucherInput(" hemat10 "), { ok: true, code: "HEMAT10" });
  for (const empty of [undefined, null, "", "   "]) assert.deepEqual(parseVoucherInput(empty), { ok: true, code: null });
  for (const stacked of ["HEMAT10 PROMO20", "HEMAT10,PROMO20", "A1;B2", "A1+B2", ["HEMAT10", "PROMO20"], { a: 1 }, 5]) {
    const r = parseVoucherInput(stacked);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.error, MSG.stacked);
  }
  const bad = parseVoucherInput("ab"); // terlalu pendek
  assert.equal(bad.ok, false);
  if (!bad.ok) assert.equal(bad.error, MSG.invalid);
});

test("computeDiscount: persen dibulatkan, dibatasi maksimal; flat; total tidak pernah di bawah Rp1.000", () => {
  assert.equal(computeDiscount({ discount_type: "percent", discount_value: 10, max_discount: null }, 99000), 9900);
  assert.equal(computeDiscount({ discount_type: "percent", discount_value: 10, max_discount: 30000 }, 99000), 9900);   // di bawah batas
  assert.equal(computeDiscount({ discount_type: "percent", discount_value: 50, max_discount: 30000 }, 99000), 30000);  // kena batas
  assert.equal(computeDiscount({ discount_type: "percent", discount_value: 15, max_discount: null }, 99999), 15000);   // pembulatan
  assert.equal(computeDiscount({ discount_type: "flat", discount_value: 25000, max_discount: null }, 99000), 25000);
  assert.equal(computeDiscount({ discount_type: "flat", discount_value: 500000, max_discount: null }, 99000), 98000);  // sisa Rp1.000
  assert.equal(computeDiscount({ discount_type: "percent", discount_value: 100, max_discount: null }, 99000), 98000);
});

const baseBody = { code: "promo-1", discountType: "percent", discountValue: 10, usageMode: "per_invitation", maxInvitationsPerUser: 1, audience: "all" };
const future = () => new Date(Date.now() + 7 * 86400_000).toISOString();

test("parseRedeemInput: membuat kode valid & menolak aturan yang melanggar", () => {
  const ok = parseRedeemInput({ ...baseBody, maxDiscount: 30000, expiresAt: future(), description: "  Promo  " }, null, []);
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.row.code, "PROMO-1");
    assert.equal(ok.row.max_discount, 30000);
    assert.equal(ok.row.description, "Promo");
    assert.equal(ok.row.is_active, true);
  }
  const err = (b: Record<string, unknown>, cur = null as null | RedeemCodeRow, emails: string[] = []) => {
    const r = parseRedeemInput(b, cur, emails);
    assert.equal(r.ok, false, JSON.stringify(b));
    return r.ok ? "" : r.error;
  };
  err({ ...baseBody, code: "a b" });
  err({ ...baseBody, discountValue: 0 });
  err({ ...baseBody, discountValue: 101 });
  err({ ...baseBody, discountValue: 10.5 });
  err({ ...baseBody, discountType: "flat", discountValue: 10_000_001 });
  err({ ...baseBody, discountType: "bonus" });
  err({ ...baseBody, maxDiscount: -5 });
  err({ ...baseBody, maxInvitationsPerUser: 0 });
  err({ ...baseBody, usageMode: "forever" });
  assert.match(err({ ...baseBody, usageMode: "time_based" }), /tanggal berakhir/i);                 // mode waktu wajib punya akhir
  err({ ...baseBody, startsAt: future(), expiresAt: new Date(Date.now() + 86400_000).toISOString() }); // akhir < mulai
  assert.match(err({ ...baseBody, expiresAt: new Date(Date.now() - 1000).toISOString() }), /lewat/);  // sudah lewat saat dibuat
  err({ ...baseBody, expiresAt: "bukan-tanggal" });
  assert.match(err({ ...baseBody, audience: "selected" }), /minimal satu email/);
  assert.match(err({ ...baseBody, audience: "selected", emails: ["bukan-email"] }), /Email tidak valid/);
  err({ ...baseBody, audience: "everyone" });
});

test("parseRedeemInput: persen+flat; email dinormalkan; edit parsial & nama kode tidak bisa diubah", () => {
  const flat = parseRedeemInput({ ...baseBody, discountType: "flat", discountValue: 20000, maxDiscount: 5000 }, null, []);
  assert.ok(flat.ok);
  if (flat.ok) assert.equal(flat.row.max_discount, null); // batas maksimal tidak bermakna untuk flat
  const sel = parseRedeemInput({ ...baseBody, audience: "selected", emails: [" A@Mail.ID ", "a@mail.id", "b@mail.id"] }, null, []);
  assert.ok(sel.ok);
  if (sel.ok) assert.deepEqual(sel.emails, ["a@mail.id", "b@mail.id"]);

  const cur = { id: "x", code: "PROMO-1", description: null, discount_type: "percent", discount_value: 10, max_discount: null, usage_mode: "per_invitation", max_invitations_per_user: 2, starts_at: null, expires_at: null, audience: "all", is_active: true, created_at: "", updated_at: "" } as RedeemCodeRow;
  const off = parseRedeemInput({ isActive: false }, cur, []);
  assert.ok(off.ok);
  if (off.ok) { assert.equal(off.row.is_active, false); assert.equal(off.row.max_invitations_per_user, 2); assert.equal(off.emails, null); }
  assert.equal(parseRedeemInput({ code: "LAIN" }, cur, []).ok, false);
  assert.equal(parseRedeemInput({ discountType: "flat" }, { ...cur, discount_value: 99999999 } as RedeemCodeRow, []).ok, false);
});

test("metode pembayaran: hanya yang ada di whitelist; Mandiri = echannel", () => {
  for (const m of ["bni_va", "bri_va", "permata_va", "mandiri_bill", "qris", "gopay"]) assert.ok(isPaymentMethod(m));
  for (const m of ["credit_card", "mandiri_va", "__proto__", "constructor", "", 1, null]) assert.equal(isPaymentMethod(m), false);
  assert.deepEqual(PAYMENT_METHODS.mandiri_bill.enabled, ["echannel"]);
  assert.deepEqual(PAYMENT_METHODS.qris.enabled, ["other_qris"]);
});
