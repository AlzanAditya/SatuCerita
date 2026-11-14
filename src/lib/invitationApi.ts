/**
 * Client API undangan (editor studio). Semua perubahan disimpan di Supabase lewat Worker; foto di R2.
 * Browser tidak pernah menulis langsung ke database/R2.
 */
import type { PublicManifest } from "../../shared/templates/types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

export interface InvitationSummary {
  id: string;
  slug: string;
  title: string | null;
  status: "draft" | "published" | "archived";
  progressStep: number;
  templateSlug: string;
  publishedAt: string | null;
  updatedAt: string;
  publicUrl: string;
  hasUnpublishedChanges: boolean;
}
export type Content = Record<string, unknown>;
export interface InvitationDetail extends InvitationSummary { content: Content }
export interface MediaItem { id: string; slot: string; sortOrder: number; url: string }

export interface ApiResult<T> { ok: boolean; status: number; data: T & { error?: string; missing?: string[] } }

async function call<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(BASE + path, { credentials: "include", ...init });
    const data = (await res.json().catch(() => ({}))) as ApiResult<T>["data"];
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Tidak dapat terhubung ke server." } as ApiResult<T>["data"] };
  }
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const listInvitations = () => call<{ invitations: InvitationSummary[] }>("/api/invitations");
export const getInvitation = (id: string) =>
  call<{ invitation: InvitationDetail; manifest: PublicManifest; media: MediaItem[] }>(`/api/invitations/${id}`);
export const saveInvitation = (id: string, patch: { content?: Content; progressStep?: number; slug?: string; title?: string }) =>
  call<{ invitation: InvitationSummary }>(`/api/invitations/${id}`, json("PUT", patch));
export const publishInvitation = (id: string) => call<{ invitation: InvitationSummary }>(`/api/invitations/${id}/publish`, { method: "POST" });
export const uploadMedia = (id: string, slot: string, blob: Blob) =>
  call<{ media: MediaItem }>(`/api/invitations/${id}/media?slot=${encodeURIComponent(slot)}`, { method: "POST", headers: { "Content-Type": blob.type }, body: blob });
export const deleteMedia = (id: string, mediaId: string) => call<{ ok: true }>(`/api/invitations/${id}/media/${mediaId}`, { method: "DELETE" });
export const previewUrl = (id: string) => `${BASE}/api/invitations/${id}/preview/`;

/** Kecilkan foto di browser (maks. sisi 1600px, WebP) agar unggahan cepat dan di bawah batas 5 MB. */
export async function compressImage(file: File, maxSide = 1600, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
  if (!blob) throw new Error("Gagal memproses foto.");
  return blob;
}
