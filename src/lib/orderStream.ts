/**
 * Pengamat status order berbasis server-push SSE.
 * Tidak ada polling browser/Worker untuk mengecek status pembayaran.
 * Midtrans webhook -> Worker memperbarui DB -> Durable Object -> SSE -> browser.
 */
export interface OrderStreamEvent {
  invoiceNo: string; status: string; paidAt: string | null; paymentReady: boolean; updatedAt: string;
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
  fetchOrder: () => Promise<void>;
}
export interface WatcherOptions {
  url: string; onEvent: (e: OrderStreamEvent) => void; onModeChange?: (m: WatcherMode) => void;
}
export type WatcherMode = "idle" | "sse" | "stopped";
export function createOrderWatcher(deps: WatcherDeps, opts: WatcherOptions) {
  let mode: WatcherMode = "idle";
  let es: EventSourceLike | null = null;
  let paused = false;
  const setMode = (m: WatcherMode) => { if (mode !== m) { mode = m; opts.onModeChange?.(m); } };
  const close = () => { if (es) { try { es.close(); } catch {} es = null; } };
  function start() {
    if (mode !== "idle" || paused) return;
    try {
      es = deps.createEventSource(opts.url);
      setMode("sse");
      es.addEventListener("status", (e) => {
        if (mode === "stopped") return;
        let ev: OrderStreamEvent;
        try { ev = JSON.parse(e.data ?? "") as OrderStreamEvent; } catch { return; }
        if (!ev || typeof ev.status !== "string") return;
        opts.onEvent(ev);
        if (isFinalStatus(ev.status)) stop();
      });
      // EventSource melakukan reconnect otomatis saat koneksi terputus sementara.
      // Tidak ada fallback polling agar tidak membakar request Worker.
      es.onerror = () => { /* browser mengatur reconnect; snapshot berikutnya didapat saat halaman dibuka kembali */ };
    } catch { setMode("idle"); }
  }
  function stop() { close(); paused = false; setMode("stopped"); }
  function pause() { if (mode === "stopped" || paused) return; paused = true; close(); setMode("idle"); }
  function resume() { if (mode === "stopped" || !paused) return; paused = false; void deps.fetchOrder().catch(() => undefined); start(); }
  return { start, stop, pause, resume, get mode() { return mode; } };
}
