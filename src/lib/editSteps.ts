/**
 * Daftar langkah editor undangan. Satu sumber untuk halaman edit (/studio/edit) dan progres di Beranda,
 * supaya judul tiap langkah selalu sama di kedua tempat.
 *
 * `progressStep` di server = jumlah langkah yang sudah selesai (0–5). Nilai 5 = tahap "Selesai" sudah dicapai.
 */
export interface EditStep {
  /** Label singkat di stepper halaman edit. */
  label: string;
  /** Judul langkah (dipakai sebagai judul halaman edit dan di progres Beranda). */
  title: string;
  sub: string;
}

export const EDIT_STEPS: readonly EditStep[] = [
  { label: "Data", title: "Informasi Utama", sub: "Lengkapi data mempelai dan acara" },
  { label: "Foto", title: "Foto & Desain", sub: "Unggah foto utama undangan Anda" },
  { label: "Cerita", title: "Cerita & Detail", sub: "Atur kata-kata, hadiah, dan musik" },
  { label: "Galeri", title: "Galeri Foto", sub: "Tambahkan momen spesial Anda" },
  { label: "Selesai", title: "Selesai", sub: "Periksa lalu publikasikan undangan" },
];

/** Tahap "Selesai" sudah tercapai di editor. */
export const FINAL_PROGRESS = EDIT_STEPS.length;
export const isEditFinished = (progressStep: number | undefined | null): boolean => (progressStep ?? 0) >= FINAL_PROGRESS;
