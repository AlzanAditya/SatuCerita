/**
 * Pengamat status order berbasis server-push SSE.
 * Tidak ada polling berkala & tidak ada cron: webhook Midtrans -> Worker memperbarui DB -> Durable Object -> SSE -> browser.
 *
 * Jaring pengaman (semuanya REAKTIF, bukan timer berkala):
 *  - Satu refetch DB per kegagalan koneksi (dibatasi: maks. 1x per 10 detik).
 *  - Jika EventSource MATI permanen (respons non-200, mis. 503/429 — browser tidak reconnect sendiri),
 *    koneksi dibuka ulang dengan backoff. Setiap buka-ulang dapat snapshot terbaru dari server.
 */
export interface OrderStreamEvent {
  invoiceNo: string; status: string; paidAt: string | null; paymentReady: boolean; updatedAt: string;
}
export const isFinalStatus = (s: string): boolean => s !== "pending";
/** EventSource.readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED (mati permanen, tidak reconnect sendiri). */
export interface EventSourceLike {
  readyState: number;
  addEventListener(type: string, cb: (e: { data?: string }) => void): void;
  onerror: ((e: unknown) => void) | null;
  close(): void;
}
export interface WatcherDeps {
  createEventSource: (url: string) => EventSourceLike;
  fetchOrder: () => Promise<void>;
}
export interface WatcherOptions {
  url: string; onEvent: (e: OrderStreamEvent) => void; onModeChange?: (m: WatcherMode) => void;
  /** Jeda dasar buka-ulang setelah koneksi mati permanen (ms). Default 5000, backoff berlipat, maks 30_000. */
  restartDelayMs?: number;
}
export type WatcherMode = "idle" | "sse" | "stopped";

const ERROR_REFETCH_MS = 10_000; // refetch DB maks. sekali per rentang ini, berapa pun error datang
const RESTART_CAP_MS = 30_000;

export function createOrderWatcher(deps: WatcherDeps, opts: WatcherOptions) {
  let mode: WatcherMode = "idle";
  let es: EventSourceLike | null = null;
  let paused = false;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;
  let restarts = 0; // beruntun koneksi mati; direset saat menerima event status (koneksi hidup & berfungsi)
  let lastErrorRefetch = 0;
  const setMode = (m: WatcherMode) => { if (mode !== m) { mode = m; opts.onModeChange?.(m); } };
  const close = () => { if (es) { try { es.close(); } catch {} es = null; } };

  function open() {
    if (mode !== "idle" || paused) return;
    try {
      es = deps.createEventSource(opts.url);
      setMode("sse");
      es.addEventListener("status", (e) => {
        if (mode === "stopped") return;
        let ev: OrderStreamEvent;
        try { ev = JSON.parse(e.data ?? "") as OrderStreamEvent; } catch { return; }
        if (!ev || typeof ev.status !== "string") return;
        restarts = 0; // stream berfungsi: reset backoff
        opts.onEvent(ev);
        if (isFinalStatus(ev.status)) stop();
      });
      // Browser melakukan reconnect OTOMatis untuk gangguan sementara (readyState CONNECTING).
      // readyState CLOSED = gagal permanen (mis. HTTP 503/429) -> ditangani di onerror di bawah.
      es.onerror = () => {
        if (paused || mode === "stopped") return;
        // Satu refetch DB per kegagalan, dibatasi ERROR_REFETCH_MS agar tidak membakar request.
        const now = Date.now();
        if (now - lastErrorRefetch >= ERROR_REFETCH_MS) {
          lastErrorRefetch = now;
          void deps.fetchOrder().catch(() => undefined);
        }
        if (es && es.readyState === 2) { // CLOSED: browser tidak akan reconnect -> buka ulang dengan backoff.
          close();
          setMode("idle"); // supaya open() di timer backoff bisa berjalan
          scheduleRestart();
        }
      };
    } catch { setMode("idle"); }
  }

  function scheduleRestart() {
    if (paused || mode === "stopped" || restartTimer !== null) return;
    const base = Math.max(0, opts.restartDelayMs ?? 5000);
    const delay = Math.min(base * Math.pow(2, Math.min(restarts, 4)), Math.max(RESTART_CAP_MS, base));
    restarts++;
    restartTimer = setTimeout(() => { restartTimer = null; if (!paused && mode === "idle") open(); }, delay);
    (restartTimer as unknown as { unref?: () => void }).unref?.();
  }

  function clearRestart() { if (restartTimer !== null) { clearTimeout(restartTimer); restartTimer = null; } }

  function start() {
    clearRestart();
    open();
  }
  function stop() { clearRestart(); close(); paused = false; restarts = 0; setMode("stopped"); }
  function pause() { if (mode === "stopped" || paused) return; paused = true; clearRestart(); close(); setMode("idle"); }
  function resume() {
    if (mode === "stopped" || !paused) return;
    paused = false;
    void deps.fetchOrder().catch(() => undefined); // snapshot DB sekali (bukan polling)
    open();
  }
  return { start, stop, pause, resume, get mode() { return mode; } };
}
