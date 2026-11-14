/** Akses & ubah nilai bersarang lewat path bertitik ("events.0.venue"). */
export function getPath(obj: unknown, path: string): unknown {
  let cur: unknown = obj;
  for (const k of path.split(".")) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[k];
  }
  return cur;
}

export function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const nextIsIndex = /^\d+$/.test(keys[i + 1]);
    if (cur[k] == null || typeof cur[k] !== "object") cur[k] = nextIsIndex ? [] : {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[keys[keys.length - 1]] = value;
}

export const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const isEmpty = (v: unknown): boolean =>
  v === undefined || v === null || v === false || (typeof v === "string" && v.trim() === "") || (typeof v === "number" && Number.isNaN(v));
