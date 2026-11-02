/**
 * Pengamat status pesanan di browser (tanpa dependensi React/DOM -> mudah diuji).
 *
 *   Mode utama  : SSE ke /api/orders/:invoice/events (backend MENDORONG perubahan status).
 *   Fallback    : polling ke endpoint internal yang HANYA membaca database kita. TIDAK PERNAH memanggil Midtrans.
 *
 * Aturan:
 *  - Satu koneksi per watcher; start() berulang tidak membuat koneksi baru. Tidak membuat koneksi baru saat status berubah.
 *  - stop() menutup SSE dan menghentikan timer. Dipanggil saat status final / komponen di-unmount.
 *  - Reconnect SSE (otomatis oleh browser) dibatasi: > maxErrors kegagalan beruntun -> pindah ke polling.
 *  - Polling: interval wajar, dibatasi total waktu (pollMaxMs), berhenti saat final, dilewati saat tab tersembunyi.
 *  - pause()/resume() untuk tab tersembunyi/terlihat: koneksi ditutup saat tersembunyi, dibuka lagi (dengan satu pembacaan DB) saat terlihat.
 */
export interface OrderStreamEvent {
  invoiceNo: string;
  status: string;
  paidAt: string | null;
  paymentReady: boolean;
  updatedAt: string;
}

export const isFinalStatus = (s: string): boolean => s !== "pending";

export interface EventSourceLike {
  readyState: number;
  addEventListener(type: string, cb: (e: { data?: string }) => void): void;
  onerror: ((e: unknown) => void) | null;
  close(): void;
}

export interface WatcherDeps {
  createEventSource: (url: string) => EventSourceLike;
  /** Baca pesanan dari endpoint internal (database). Pemanggil menerapkan hasilnya dan memanggil stop() bila final. */
  fetchOrder: () => Promise<void>;
  setInterval: (fn: () => void, ms: number) => unknown;
  clearInterval: (h: unknown) => void;
  now: () => number;
  isVisible: () => boolean;
}

export interface WatcherOptions {
  url: string;
  onEvent: (e: OrderStreamEvent) => void;
  maxErrors?: number;   // kegagalan SSE beruntun sebelum fallback
  pollMs?: number;      // interval polling DB
  pollMaxMs?: number;   // batas total waktu polling
  onModeChange?: (m: WatcherMode) => void;
}

export type WatcherMode = "idle" | "sse" | "poll" | "stopped";

const ES_CLOSED = 2;

export function createOrderWatcher(deps: WatcherDeps, opts: WatcherOptions) {
  const maxErrors = opts.maxErrors ?? 4;
  const pollMs = opts.pollMs ?? 5000;
  const pollMaxMs = opts.pollMaxMs ?? 15 * 60_000;

  let mode: WatcherMode = "idle";
  let es: EventSourceLike | null = null;
  let timer: unknown = null;
  let pollStartedAt = 0;
  let errors = 0;
  let paused = false;
  let polling = false; // ada fetchOrder yang sedang berjalan (cegah tumpang tindih)

  const setMode = (m: WatcherMode) => { if (mode !== m) { mode = m; opts.onModeChange?.(m); } };

  const closeSse = () => { if (es) { try { es.close(); } catch { /* abaikan */ } es = null; } };
  const clearTimer = () => { if (timer !== null) { deps.clearInterval(timer); timer = null; } };

  function openSse() {
    if (es || mode === "stopped") return;
    let source: EventSourceLike;
    try { source = deps.createEventSource(opts.url); } catch { startPolling(); return; }
    es = source;
    setMode("sse");
    source.addEventListener("status", (e) => {
      if (mode === "stopped") return; // event yang terlanjur datang setelah stop() diabaikan
      errors = 0;
      let ev: OrderStreamEvent | null = null;
      try { ev = JSON.parse(e.data ?? "") as OrderStreamEvent; } catch { return; }
      if (!ev || typeof ev.status !== "string") return;
      opts.onEvent(ev);
      if (isFinalStatus(ev.status)) stop();
    });
    source.onerror = () => {
      if (mode === "stopped") return;
      errors++;
      // CLOSED = browser menyerah (mis. 401/404/503 dari server). Terlalu banyak error = jaringan bermasalah.
      if (source.readyState === ES_CLOSED || errors > maxErrors) {
        closeSse();
        startPolling();
      }
    };
  }

  async function tick() {
    if (mode !== "poll" || polling || !deps.isVisible()) return;
    if (deps.now() - pollStartedAt > pollMaxMs) { stop(); return; } // batas waktu: berhenti, jangan polling selamanya
    polling = true;
    try { await deps.fetchOrder(); } catch { /* jaringan: coba lagi di tick berikutnya */ } finally { polling = false; }
  }

  function startPolling() {
    if (mode === "stopped" || timer !== null) return;
    closeSse();
    pollStartedAt = deps.now();
    setMode("poll");
    timer = deps.setInterval(() => { void tick(); }, pollMs);
  }

  function start() {
    if (mode !== "idle" && !(mode === "poll" && paused)) return; // satu koneksi saja
    paused = false;
    openSse();
  }

  function stop() {
    closeSse();
    clearTimer();
    setMode("stopped");
  }

  /** Tab tersembunyi: lepas koneksi & timer (hemat sumber daya). */
  function pause() {
    if (mode === "stopped" || paused) return;
    paused = true;
    closeSse();
    clearTimer();
    setMode("idle");
    errors = 0;
  }

  /** Tab terlihat lagi: sinkron sekali dari DB lalu buka koneksi lagi. */
  function resume() {
    if (mode === "stopped" || !paused) return;
    paused = false;
    void deps.fetchOrder().catch(() => undefined);
    openSse();
  }

  return { start, stop, pause, resume, get mode() { return mode; } };
}
