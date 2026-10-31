// Jalankan: npm run worker:test   (node:test via tsx, tanpa dependensi tambahan)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeSignature, verifyNotificationSignature, timingSafeEqualStr, parseGrossAmount, formatWib,
  assertMidtransConfig,
} from "../src/midtrans";
import { mapMidtransStatus, nextStatus, extractPaymentInfo } from "../src/state";
import { computeQuote, isPaymentMethod, PAYMENT_METHODS } from "../src/pricing";
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
test("harga dihitung server dari katalog; input aneh ditolak", () => {
  const ok = computeQuote("antheia", undefined);
  assert.ok(ok.ok);
  if (ok.ok) {
    assert.equal(ok.quote.total, ok.quote.template.discountPrice);
    assert.equal(ok.quote.discountAmount, 0);
  }
  const v = computeQuote("antheia", " hemat10 ");
  assert.ok(v.ok);
  if (v.ok) {
    assert.equal(v.quote.discountCode, "HEMAT10");
    assert.equal(v.quote.discountAmount, Math.round(v.quote.basePrice * 0.1));
    assert.equal(v.quote.total, v.quote.basePrice - v.quote.discountAmount);
  }
  assert.equal(computeQuote("tidak-ada", undefined).ok, false);
  assert.equal(computeQuote({ $ne: 1 }, undefined).ok, false);
  assert.equal(computeQuote("antheia", "PROMO-NGAWUR").ok, false);
});

test("metode pembayaran: hanya yang ada di whitelist; Mandiri = echannel", () => {
  for (const m of ["bni_va", "bri_va", "permata_va", "mandiri_bill", "qris", "gopay"]) assert.ok(isPaymentMethod(m));
  for (const m of ["credit_card", "mandiri_va", "__proto__", "constructor", "", 1, null]) assert.equal(isPaymentMethod(m), false);
  assert.deepEqual(PAYMENT_METHODS.mandiri_bill.enabled, ["echannel"]);
  assert.deepEqual(PAYMENT_METHODS.qris.enabled, ["other_qris"]);
});
