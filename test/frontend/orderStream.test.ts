// Tes logika realtime di browser TANPA browser: EventSource, timer, dan visibilitas dipalsukan.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createOrderWatcher, type EventSourceLike, type OrderStreamEvent, type WatcherDeps } from "../../src/lib/orderStream";

class FakeES implements EventSourceLike {
  static all: FakeES[] = [];
  readyState = 1;
  onerror: ((e: unknown) => void) | null = null;
  closed = false;
  private l: Record<string, ((e: { data?: string }) => void)[]> = {};
  constructor(public url: string) { FakeES.all.push(this); }
  addEventListener(t: string, cb: (e: { data?: string }) => void) { (this.l[t] ||= []).push(cb); }
  close() { this.closed = true; this.readyState = 2; }
  emit(ev: Partial<OrderStreamEvent>) { for (const cb of this.l.status ?? []) cb({ data: JSON.stringify({ invoiceNo: "SC1", paidAt: null, paymentReady: true, updatedAt: "", ...ev }) }); }
  fail(closed = false) { if (closed) this.readyState = 2; this.onerror?.({}); }
}

function setup(over: { visible?: () => boolean } = {}) {
  FakeES.all = [];
  let t = 0;
  const timers = new Map<number, { fn: () => void; ms: number; next: number }>();
  let id = 0;
  const fetches: number[] = [];
  const events: OrderStreamEvent[] = [];
  const deps: WatcherDeps = {
    createEventSource: (u) => new FakeES(u),
    fetchOrder: async () => { fetches.push(t); },
    setInterval: (fn, ms) => { timers.set(++id, { fn, ms, next: t + ms }); return id; },
    clearInterval: (h) => { timers.delete(h as number); },
    now: () => t,
    isVisible: over.visible ?? (() => true),
  };
  const advance = async (ms: number) => {
    const end = t + ms;
    for (;;) {
      const due = [...timers.values()].filter((x) => x.next <= end).sort((a, b) => a.next - b.next)[0];
      if (!due) break;
      t = due.next; due.next += due.ms; due.fn();
      await Promise.resolve(); await Promise.resolve();
    }
    t = end;
  };
  const w = createOrderWatcher(deps, { url: "/api/orders/SC1/events", onEvent: (e) => events.push(e), pollMs: 5000, pollMaxMs: 15 * 60_000, maxErrors: 3 });
  return { w, timers, fetches, events, advance };
}

test("UI menerima perubahan status tanpa refresh: event 'paid' diteruskan, lalu koneksi & timer berhenti", () => {
  const { w, events, timers } = setup();
  w.start();
  assert.equal(FakeES.all.length, 1);
  FakeES.all[0].emit({ status: "pending" });
  FakeES.all[0].emit({ status: "paid", paidAt: "2026-11-02T10:00:00Z" });
  assert.deepEqual(events.map((e) => e.status), ["pending", "paid"]);
  assert.equal(w.mode, "stopped");
  assert.equal(FakeES.all[0].closed, true);
  assert.equal(timers.size, 0);
});

test("setiap status final (expired/cancelled/failed/needs_review) menghentikan stream; event sesudahnya diabaikan", () => {
  for (const st of ["expired", "cancelled", "failed", "needs_review", "paid"]) {
    const { w, events } = setup();
    w.start();
    FakeES.all[0].emit({ status: st });
    FakeES.all[0].emit({ status: "pending" });
    assert.equal(w.mode, "stopped", st);
    assert.equal(events.length, 1, st);
    assert.equal(FakeES.all[0].closed, true, st);
  }
});

test("hanya satu koneksi: start() berulang & banyak event tidak membuat EventSource baru", () => {
  const { w } = setup();
  w.start(); w.start(); w.start();
  for (let i = 0; i < 5; i++) FakeES.all[0].emit({ status: "pending" });
  assert.equal(FakeES.all.length, 1);
});

test("stop() (unmount) menutup SSE & timer dan tidak bisa dihidupkan lagi", () => {
  const { w, timers } = setup();
  w.start();
  w.stop();
  w.start();
  assert.equal(FakeES.all.length, 1);
  assert.equal(FakeES.all[0].closed, true);
  assert.equal(timers.size, 0);
  assert.equal(w.mode, "stopped");
});

test("SSE gagal beruntun (> maxErrors) -> fallback polling DB; error tunggal tidak memicu fallback", () => {
  const { w, timers } = setup();
  w.start();
  FakeES.all[0].fail();
  assert.equal(w.mode, "sse");
  FakeES.all[0].emit({ status: "pending" }); // sukses mereset hitungan
  for (let i = 0; i < 3; i++) FakeES.all[0].fail();
  assert.equal(w.mode, "sse");
  FakeES.all[0].fail();
  assert.equal(w.mode, "poll");
  assert.equal(timers.size, 1);
  assert.equal(FakeES.all[0].closed, true);
});

test("server menolak (readyState CLOSED, mis. 401/404/503) -> langsung fallback polling", () => {
  const { w } = setup();
  w.start();
  FakeES.all[0].fail(true);
  assert.equal(w.mode, "poll");
});

test("polling fallback BERBATAS WAKTU: berhenti setelah pollMaxMs dan jumlah request terbatas", async () => {
  const { w, timers, fetches, advance } = setup();
  w.start();
  FakeES.all[0].fail(true);
  await advance(60 * 60_000); // satu jam simulasi
  assert.equal(w.mode, "stopped");
  assert.equal(timers.size, 0);
  assert.ok(fetches.length <= 15 * 60 / 5 + 1, `fetch=${fetches.length}`);
  assert.ok(fetches.length >= 100);
  const n = fetches.length;
  await advance(60 * 60_000);
  assert.equal(fetches.length, n, "tidak ada request lagi setelah berhenti");
});

test("polling dihentikan begitu stop() dipanggil karena status final dari pembacaan DB", async () => {
  const { w, fetches, advance } = setup();
  w.start();
  FakeES.all[0].fail(true);
  await advance(12_000);
  const n = fetches.length;
  assert.ok(n >= 2);
  w.stop();
  await advance(60_000);
  assert.equal(fetches.length, n);
});

test("polling dilewati saat tab tersembunyi", async () => {
  let visible = false;
  const { w, fetches, advance } = setup({ visible: () => visible });
  w.start();
  FakeES.all[0].fail(true);
  await advance(60_000);
  assert.equal(fetches.length, 0);
  visible = true;
  await advance(10_000);
  assert.ok(fetches.length > 0);
});

test("pause() menutup koneksi saat tab tersembunyi; resume() sinkron sekali dari DB lalu membuka satu koneksi baru", () => {
  const { w, fetches } = setup();
  w.start();
  w.pause();
  assert.equal(FakeES.all[0].closed, true);
  assert.equal(w.mode, "idle");
  w.resume();
  assert.equal(fetches.length, 1);
  assert.equal(FakeES.all.length, 2);
  assert.equal(FakeES.all.filter((e) => !e.closed).length, 1);
});

// ---------------------------------------------------------------- pemindaian statis
const ROOT = path.resolve(import.meta.dirname, "../..");
function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "templates") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (/\.(tsx?|html|css)$/.test(e.name)) out.push(p);
  }
  return out;
}
const frontendFiles = walk(path.join(ROOT, "src"));

test("tidak ada Server Key / service key / referensi Snap di kode frontend", () => {
  assert.ok(frontendFiles.length > 20);
  const bad = /MIDTRANS_SERVER_KEY|SB-Mid-server|Mid-server-|SERVICE_ROLE|service_role|snap\.js|window\.snap|snapToken|app\.(sandbox\.)?midtrans\.com/;
  const hits = frontendFiles.filter((f) => bad.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(ROOT, f));
  assert.deepEqual(hits, []);
});

test("frontend tidak pernah memanggil API Midtrans langsung (hanya endpoint website sendiri)", () => {
  const hits = frontendFiles.filter((f) => /api(\.sandbox)?\.midtrans\.com\/v[0-9]/.test(fs.readFileSync(f, "utf8"))).map((f) => path.relative(ROOT, f));
  assert.deepEqual(hits, []);
  const stream = fs.readFileSync(path.join(ROOT, "src/lib/orderStream.ts"), "utf8");
  assert.doesNotMatch(stream.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""), /midtrans/i);
});

test("tidak ada setInterval/EventSource di luar watcher (halaman order memakai createOrderWatcher)", () => {
  const offenders = frontendFiles
    .filter((f) => !/orderStream\.ts$/.test(f))
    .filter((f) => /setInterval\(|new EventSource\(/.test(fs.readFileSync(f, "utf8")))
    .map((f) => path.relative(ROOT, f));
  // OrderDetailPage: satu setInterval = countdown 1 detik (dihentikan saat bukan pending) + EventSource lewat injeksi watcher.
  assert.deepEqual(offenders.sort(), ["src/pages/app/OrderDetailPage.tsx"]);
  const od = fs.readFileSync(path.join(ROOT, "src/pages/app/OrderDetailPage.tsx"), "utf8");
  assert.equal((od.match(/setInterval\(/g) ?? []).length, 2); // countdown + injeksi watcher
  assert.equal((od.match(/new EventSource\(/g) ?? []).length, 1);
  assert.match(od, /watcher\.stop\(\)/);
});
