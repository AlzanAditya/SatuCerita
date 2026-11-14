import type { PublicManifest, TemplateManifest } from "./types";
import { antheia } from "./antheia";
import { aglaia } from "./aglaia";

/** Daftar template yang bisa diedit. Menambah template baru = tambah file manifest + daftarkan di sini. */
export const MANIFESTS: Record<string, TemplateManifest> = { antheia, aglaia };

export const getManifest = (slug: string): TemplateManifest | null => MANIFESTS[slug] ?? null;

export const publicManifest = (m: TemplateManifest): PublicManifest => ({
  slug: m.slug, title: m.title, version: m.version, groups: m.groups, slots: m.slots,
});

export * from "./types";
export * from "./format";
export * from "./path";
