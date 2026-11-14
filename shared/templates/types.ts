/**
 * Tipe manifest template. Dipakai bersama oleh Worker (render + validasi), editor studio (form) & script seed.
 * JANGAN impor API khusus browser / Node di folder ini.
 */
export type FieldType = "text" | "textarea" | "date" | "time" | "url" | "select" | "toggle" | "color" | "number";

export interface FieldDef {
  /** Path di `content`, mis. "groom.nick" atau "events.0.venue". */
  path: string;
  label: string;
  type: FieldType;
  max?: number;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  min?: number;
  /** Batas atas untuk type "number". */
  maxNum?: number;
  /** Beberapa field boleh berbagi baris (grid 2 kolom) di editor. */
  half?: boolean;
}

export interface GroupDef {
  id: string;
  title: string;
  /** Langkah editor: 0 Data, 2 Cerita. (Langkah 1 & 3 = foto, 4 = selesai.) */
  step: 0 | 2;
  icon: "users" | "calendar" | "quote" | "heart" | "file" | "palette" | "video" | "gift" | "music" | "map";
  /** Path boolean yang menyalakan/mematikan seluruh bagian (mis. "live.enabled"). */
  toggle?: string;
  fields: FieldDef[];
  /** Subjudul pendek di bawah judul kartu. */
  hint?: string;
}

export interface SlotDef {
  slot: string;
  label: string;
  /** Langkah editor tempat slot tampil: 1 = Foto & Desain, 3 = Galeri. */
  step: 1 | 3;
  /** Jumlah file maksimum (1 = foto tunggal, >1 = daftar berurutan). */
  max: number;
  required?: boolean;
  hint?: string;
  round?: boolean;
  /** Jika kosong, bagian ini memakai foto lain (hanya info untuk user). */
  fallback?: string;
}

export type Binding =
  | { sel: string; text: string; when?: string }
  | { sel: string; tx: string; when?: string }
  | { sel: string; html: string; when?: string }
  | { sel: string; attrs: Record<string, string>; when?: string }
  /** Elemen DIHAPUS bila nilai di path kosong (aman untuk elemen yang dihitung JS dari DOM, mis. frame galeri). */
  | { sel: string; removeUnless: string }
  /** Elemen DISEMBUNYIKAN (display:none) bila nilai di path kosong (aman untuk bagian yang dicari JS via id). */
  | { sel: string; hideUnless: string };

export interface TemplateManifest {
  slug: string;
  title: string;
  version: number;
  /** Awalan <title>, mis. "Pawiwahan". */
  titlePrefix: string;
  groups: GroupDef[];
  slots: SlotDef[];
  bindings: Binding[];
  defaultContent: Record<string, unknown>;
  /** Isi `INVITATION.maxGuests` default bila tidak diatur. */
  musicDefault?: { start: number };
}

/** Bagian yang aman dikirim ke browser editor (tanpa bindings). */
export type PublicManifest = Pick<TemplateManifest, "slug" | "title" | "version" | "groups" | "slots">;
