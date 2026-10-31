/**
 * Akses database Supabase dengan SERVICE ROLE (hanya di Worker, tidak pernah ke browser).
 * Dipakai untuk menulis pesanan & memproses webhook (yang tidak punya sesi user).
 * RLS membuat client biasa TIDAK bisa menulis tabel orders / payment_events.
 */
import type { Env } from "./types";

export class DbError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function svcHeaders(env: Env, extra: Record<string, string> = {}): Headers {
  const key = (env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!key) throw new DbError("SUPABASE_SERVICE_ROLE_KEY belum di-set.", 500);
  const h = new Headers({ apikey: key, "Content-Type": "application/json", ...extra });
  // Key lama berbentuk JWT (eyJ...) perlu Authorization; key baru (sb_secret_...) cukup header apikey.
  if (key.startsWith("eyJ")) h.set("Authorization", `Bearer ${key}`);
  return h;
}

const url = (env: Env, table: string, query = "") => `${env.SUPABASE_URL}/rest/v1/${table}${query ? "?" + query : ""}`;

export async function dbSelect<T>(env: Env, table: string, query: string): Promise<T[]> {
  const r = await fetch(url(env, table, query), { headers: svcHeaders(env), signal: AbortSignal.timeout(10_000) });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error("db.select_error", JSON.stringify({ table, status: r.status, body: body.slice(0, 300) }));
    throw new DbError(`select ${table} gagal`, r.status);
  }
  return (await r.json()) as T[];
}

/** Insert satu baris. Konflik unik (409) TIDAK melempar error: dikembalikan agar pemanggil bisa menangani. */
export async function dbInsert<T>(env: Env, table: string, row: Record<string, unknown>): Promise<{ status: number; rows: T[] }> {
  const r = await fetch(url(env, table), {
    method: "POST",
    headers: svcHeaders(env, { Prefer: "return=representation" }),
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(10_000),
  });
  if (r.status === 409) return { status: 409, rows: [] };
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error("db.insert_error", JSON.stringify({ table, status: r.status, body: body.slice(0, 300) }));
    throw new DbError(`insert ${table} gagal`, r.status);
  }
  return { status: r.status, rows: (await r.json()) as T[] };
}

/** Insert yang mengabaikan duplikat (untuk log event idempoten). */
export async function dbInsertIgnore(env: Env, table: string, row: Record<string, unknown>, onConflict: string): Promise<void> {
  const r = await fetch(url(env, table, `on_conflict=${encodeURIComponent(onConflict)}`), {
    method: "POST",
    headers: svcHeaders(env, { Prefer: "resolution=ignore-duplicates,return=minimal" }),
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new DbError(`insert ${table} gagal`, r.status);
}

/** PATCH dengan filter; mengembalikan baris yang benar-benar berubah (kosong = kondisi filter tidak terpenuhi). */
export async function dbPatch<T>(env: Env, table: string, filter: string, patch: Record<string, unknown>): Promise<T[]> {
  const r = await fetch(url(env, table, filter), {
    method: "PATCH",
    headers: svcHeaders(env, { Prefer: "return=representation" }),
    body: JSON.stringify(patch),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) {
    const body = await r.text().catch(() => "");
    console.error("db.patch_error", JSON.stringify({ table, filter: filter.slice(0, 100), status: r.status, body: body.slice(0, 300) }));
    throw new DbError(`patch ${table} gagal`, r.status);
  }
  return (await r.json()) as T[];
}

