/**
 * Cache data Studio (in-memory, stale-while-revalidate).
 *
 * Tujuan: saat user pindah menu lalu kembali, halaman langsung menampilkan data terakhir
 * (tanpa layar "memuat" / refresh), sementara data baru diambil diam-diam di latar belakang
 * hanya bila cache sudah lebih tua dari `maxAgeMs`. Mutasi (simpan, publikasi, hapus) menandai
 * cache basi supaya kunjungan berikutnya mengambil data terbaru.
 *
 * Disimpan di memori saja (bukan storage) agar data pribadi tidak tertinggal di perangkat.
 * File ini TIDAK boleh meng-import modul lain (dipakai auth.ts saat logout).
 */
export const STUDIO_KEYS = {
  invitations: "invitations",
  wishes: "wishes",
} as const;

interface Entry {
  data: unknown;
  at: number;
}

const store = new Map<string, Entry>();

export function peekStudio<T>(key: string): T | undefined {
  return store.get(key)?.data as T | undefined;
}

export function setStudio<T>(key: string, data: T): void {
  store.set(key, { data, at: Date.now() });
}

/** true bila ada cache dan umurnya < maxAgeMs. */
export function isStudioFresh(key: string, maxAgeMs = 30_000): boolean {
  const e = store.get(key);
  return !!e && Date.now() - e.at < maxAgeMs;
}

/** Tandai basi (data tetap dipakai untuk tampilan awal, tapi akan diambil ulang). */
export function markStudioStale(key: string): void {
  const e = store.get(key);
  if (e) e.at = 0;
}

export function clearStudioCache(): void {
  store.clear();
}
