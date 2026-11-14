/**
 * Turunan data undangan (tanggal Indonesia, waktu, URL Maps, Instagram, ...), interpolasi template `{path}`,
 * dan sanitasi konten sesuai manifest. Murni (tanpa API browser/Node) agar dipakai Worker, editor, dan test.
 */
import type { FieldDef, TemplateManifest } from "./types";
import { clone, getPath, isEmpty, setPath } from "./path";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const TZ_OFFSET: Record<string, string> = { WIB: "+07:00", WITA: "+08:00", WIT: "+09:00" };
const NB = "\u00a0";

type Json = Record<string, unknown>;
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));

export const safeHttps = (u: unknown): string => {
  const s = str(u).trim();
  if (!/^https:\/\/[^\s<>"']+$/i.test(s) || s.length > 400) return "";
  return s;
};

export function cleanInstagram(v: unknown): string {
  let s = str(v).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
  s = s.trim();
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : "";
}

/** Terima URL YouTube (watch, youtu.be, embed, shorts) atau ID 11 karakter. */
export function parseYoutubeId(v: unknown): string {
  const s = str(v).trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  const m = /(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/.exec(s);
  return m ? m[1] : "";
}

interface DateParts { y: number; m: number; d: number }
function parseDate(s: unknown): DateParts | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(s));
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return { y, m: mo, d };
}
const dot = (t: string) => t.replace(":", ".");

export interface EventView {
  day: string; weekday: string; month: string; year: string; monthYear: string; monthShortYear: string;
  long: string; longComma: string; dots: string; time: string; start: string; startIso: string; endIso: string; maps: string;
}

function eventView(e: Json): EventView {
  const dp = parseDate(e.date);
  const tz = TZ_OFFSET[str(e.tz)] ? str(e.tz) : "WIB";
  const off = TZ_OFFSET[tz];
  const start = /^\d{2}:\d{2}$/.test(str(e.start)) ? str(e.start) : "08:00";
  const end = /^\d{2}:\d{2}$/.test(str(e.end)) ? str(e.end) : "";
  const venue = str(e.venue), address = str(e.address);
  const custom = safeHttps(e.maps_url);
  const maps = custom || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([venue, address].filter(Boolean).join(", "))}`;
  if (!dp) {
    return { day: "", weekday: "", month: "", year: "", monthYear: "", monthShortYear: "", long: "", longComma: "", dots: "", time: "", start: "", startIso: "", endIso: "", maps };
  }
  const wd = DAYS[new Date(Date.UTC(dp.y, dp.m - 1, dp.d)).getUTCDay()];
  const month = MONTHS[dp.m - 1];
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateIso = `${dp.y}-${pad(dp.m)}-${pad(dp.d)}`;
  return {
    day: String(dp.d), weekday: wd, month, year: String(dp.y), monthYear: `${month} ${dp.y}`, monthShortYear: `${MONTHS_SHORT[dp.m - 1]} ${dp.y}`,
    long: `${dp.d} ${month} ${dp.y}`, longComma: `${wd}, ${dp.d} ${month} ${dp.y}`, dots: `${pad(dp.d)} · ${pad(dp.m)} · ${dp.y}`,
    time: end ? `${dot(start)}${NB}–${NB}${dot(end)}${NB}${tz}` : `${dot(start)}${NB}${tz}`,
    start: `${dot(start)} ${tz}`,
    startIso: `${dateIso}T${start}:00${off}`,
    endIso: `${dateIso}T${end || start}:00${off}`,
    maps,
  };
}

export interface Derived {
  names: string; initials: string; title: string; desc: string;
  e: EventView[];
  ig: { groom: string; bride: string; groomAt: string; brideAt: string };
  liveUrl: string; youtubeId: string; eventLabel: string; eventLocation: string;
}

export function derive(content: Json, manifest: Pick<TemplateManifest, "titlePrefix">): Derived {
  const g = (content.groom ?? {}) as Json, b = (content.bride ?? {}) as Json;
  const gn = str(g.nick).trim(), bn = str(b.nick).trim();
  const names = [gn, bn].filter(Boolean).join(" & ");
  const events = Array.isArray(content.events) ? (content.events as Json[]) : [];
  const e = [0, 1, 2].map((i) => eventView(events[i] ?? {}));
  const first = (events[0] ?? {}) as Json;
  const igG = cleanInstagram(g.instagram), igB = cleanInstagram(b.instagram);
  const live = (content.live ?? {}) as Json;
  const music = (content.music ?? {}) as Json;
  const site = (content.site ?? {}) as Json;
  return {
    names,
    initials: [gn[0], bn[0]].filter(Boolean).join(" & ").toUpperCase(),
    title: str(site.title).trim() || `${manifest.titlePrefix} ${names}`.trim(),
    desc: str(site.description).trim() || `Undangan pernikahan ${names}${e[0].long ? `, ${e[0].longComma}` : ""}.`,
    e,
    ig: { groom: igG ? `https://instagram.com/${igG}` : "", bride: igB ? `https://instagram.com/${igB}` : "", groomAt: igG ? `@${igG}` : "", brideAt: igB ? `@${igB}` : "" },
    liveUrl: safeHttps(live.url),
    youtubeId: parseYoutubeId(music.youtube),
    eventLabel: e[0].long ? `${e[0].long}, hari pernikahan` : "",
    eventLocation: [str(first.venue), str(first.address)].filter(Boolean).join(", "),
  };
}

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Konteks pencarian path untuk binding: konten + `x` (turunan). */
export const makeCtx = (content: Json, d: Derived): Json => ({ ...content, x: d });

export function lookup(ctx: Json, expr: string): string {
  for (const alt of expr.split("||")) {
    const v = getPath(ctx, alt.trim());
    if (!isEmpty(v)) return String(v);
  }
  return "";
}

/**
 * Interpolasi `{path}`, `{a||b}` (nilai pertama yang terisi), dan filter `{path:br}` (newline -> <br>, hanya mode html).
 * Mode "html": nilai di-escape. Mode "text"/"attr": nilai apa adanya (peng-escape-an dilakukan HTMLRewriter).
 */
export function interp(tpl: string, ctx: Json, mode: "text" | "html" | "attr"): string {
  return tpl.replace(/\{([^{}]+)\}/g, (_, raw: string) => {
    const [expr, filter] = raw.split(":");
    let v = lookup(ctx, expr);
    if (mode === "html") {
      v = escapeHtml(v);
      if (filter === "br") v = v.replace(/\r?\n/g, "<br>");
    }
    return v;
  });
}

// ---------------------------------------------------------------- sanitasi
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function coerce(f: FieldDef, raw: unknown, fallback: unknown): unknown {
  switch (f.type) {
    case "toggle":
      return raw === true || raw === "true" || raw === 1;
    case "number": {
      const n = Number(raw);
      if (!Number.isFinite(n)) return fallback;
      return Math.min(f.maxNum ?? 999, Math.max(f.min ?? 0, Math.round(n)));
    }
    case "date":
      return raw === "" ? "" : parseDate(raw) ? String(raw) : fallback;
    case "time":
      return raw === "" ? "" : /^([01]\d|2[0-3]):[0-5]\d$/.test(str(raw)) ? String(raw) : fallback;
    case "url":
      return raw === "" ? "" : safeHttps(raw);
    case "color":
      return /^#[0-9a-fA-F]{6}$/.test(str(raw)) ? str(raw) : fallback;
    case "select":
      return (f.options ?? []).some((o) => o.value === raw) ? raw : fallback;
    case "textarea":
      return str(raw).replace(CTRL, "").replace(/\r\n/g, "\n").trim().slice(0, f.max ?? 1000);
    default: {
      let s = str(raw).replace(CTRL, "").replace(/[\r\n]+/g, " ").trim().slice(0, f.max ?? 120);
      if (f.path.endsWith(".instagram")) s = cleanInstagram(s);
      return s;
    }
  }
}

/**
 * Bentuk konten baru: default template < konten tersimpan < input user, hanya untuk path yang ada di manifest.
 * Kunci `media` (dikelola server) selalu diambil dari konten tersimpan.
 */
export function sanitizeContent(manifest: TemplateManifest, existing: Json | null, input: Json): Json {
  const out: Json = clone(manifest.defaultContent as Json);
  if (existing) {
    for (const g of manifest.groups) for (const f of g.fields) {
      const v = getPath(existing, f.path);
      if (v !== undefined) setPath(out, f.path, v);
    }
    if (existing.media) out.media = existing.media;
  }
  for (const g of manifest.groups) {
    const flds = g.toggle ? [{ path: g.toggle, label: "", type: "toggle" } as FieldDef, ...g.fields] : g.fields;
    for (const f of flds) {
      const raw = getPath(input, f.path);
      if (raw === undefined) continue;
      setPath(out, f.path, coerce(f, raw, getPath(out, f.path)));
    }
  }
  return out;
}

/** Daftar field wajib yang masih kosong (label), untuk validasi publikasi. */
export function missingRequired(manifest: TemplateManifest, content: Json): string[] {
  const miss: string[] = [];
  for (const g of manifest.groups) {
    if (g.toggle && !getPath(content, g.toggle)) continue;
    for (const f of g.fields) if (f.required && isEmpty(getPath(content, f.path))) miss.push(f.label);
  }
  return miss;
}

// ---------------------------------------------------------------- slug
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const RESERVED_SLUGS = ["admin", "api", "app", "dash", "studio", "login", "signup", "katalog", "preview", "templates", "t", "i", "m", "kontak", "kebijakan", "cara-pesan"];
export const validSlug = (s: string): boolean => SLUG_RE.test(s) && s.length >= 3 && s.length <= 48 && !RESERVED_SLUGS.includes(s);
