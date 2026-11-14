/**
 * Render undangan: ambil index.html template dari R2, lalu terapkan `bindings` manifest memakai HTMLRewriter
 * (nama, tanggal, foto, acara, rekening, ...) dan suntikkan konfigurasi runtime ke INVITATION / MUSIC.
 */
import type { Env } from "./types";
import { getManifest, derive, makeCtx, interp, lookup, type Binding, type TemplateManifest } from "../../shared/templates";
import { getTemplateHtml } from "./storage";

export interface RenderArgs {
  tpl: string;
  content: Record<string, unknown>;
  mode: "public" | "preview";
  origin: string;
  slug?: string;
  guest?: { name: string; code: string; maxPax: number } | null;
}

const jsonForScript = (v: unknown): string =>
  JSON.stringify(v).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");

function registerBindings(rw: HTMLRewriter, m: TemplateManifest, ctx: Record<string, unknown>) {
  const empty = (path: string) => lookup(ctx, path) === "";
  for (const bd of m.bindings as Binding[]) {
    if ("removeUnless" in bd) {
      if (empty(bd.removeUnless)) rw.on(bd.sel, { element(el) { el.remove(); } });
      continue;
    }
    if ("hideUnless" in bd) {
      if (empty(bd.hideUnless)) {
        rw.on(bd.sel, {
          element(el) {
            el.setAttribute("hidden", "");
            el.setAttribute("style", `${el.getAttribute("style") || ""};display:none !important`);
          },
        });
      }
      continue;
    }
    if (bd.when && empty(bd.when)) continue;
    if ("text" in bd) {
      const v = interp(bd.text, ctx, "text");
      rw.on(bd.sel, { element: (el) => void el.setInnerContent(v) });
    } else if ("html" in bd) {
      const v = interp(bd.html, ctx, "html");
      rw.on(bd.sel, { element: (el) => void el.setInnerContent(v, { html: true }) });
    } else if ("attrs" in bd) {
      const pairs = Object.entries(bd.attrs).map(([k, t]) => [k, interp(t, ctx, "attr")] as const);
      rw.on(bd.sel, { element: (el) => pairs.forEach(([k, v]) => el.setAttribute(k, v)) });
    } else if ("tx" in bd) {
      // Ganti HANYA node teks pertama yang tidak kosong (elemen anak seperti <svg> tetap ada).
      const v = interp(bd.tx, ctx, "text");
      let done = false;
      let inNode = false;
      rw.on(bd.sel, {
        element() {
          done = false;
          inNode = false;
        },
        text(t) {
          if (inNode) {
            t.remove();
          } else if (!done && t.text.trim() !== "") {
            t.replace(v);
            inNode = true;
          } else if (done && t.text.trim() !== "") {
            t.remove();
            return;
          } else return;
          if (t.lastInTextNode) {
            inNode = false;
            done = true;
          }
        },
      });
    }
  }
}

export async function renderInvitation(env: Env, a: RenderArgs): Promise<Response> {
  const m = getManifest(a.tpl);
  const src = m ? await getTemplateHtml(env, a.tpl) : null;
  if (!m || !src) return new Response("Template tidak ditemukan.", { status: 404, headers: { "Cache-Control": "no-store" } });

  const d = derive(a.content, m);
  const ctx = makeCtx(a.content, d);
  const rsvp = (a.content.rsvp ?? {}) as Record<string, unknown>;
  const music = (a.content.music ?? {}) as Record<string, unknown>;
  const media = (a.content.media ?? {}) as Record<string, unknown>;

  const cfg: Record<string, unknown> = {
    eventTitle: `Pernikahan ${d.names}`.trim(),
    rsvpEndpoint: a.mode === "public" && a.slug ? `/api/public/${a.slug}/rsvp` : "",
    wishesEndpoint: a.mode === "public" && a.slug ? `/api/public/${a.slug}/wishes` : "",
    maxGuests: a.guest?.maxPax ?? (Number(rsvp.max_guests) || 2),
    guestCode: a.guest?.code ?? "",
    guestName: a.guest?.name ?? "",
  };
  if (d.e[0].startIso) {
    cfg.eventStart = d.e[0].startIso;
    cfg.eventEnd = d.e[0].endIso;
    cfg.eventLocation = d.eventLocation;
    cfg.calendarEventLabel = d.eventLabel;
  }
  const mus: Record<string, unknown> = { videoId: d.youtubeId, start: Math.max(0, Number(music.start) || 0) };

  const cover = typeof media.cover === "string" ? media.cover : "";
  const head = [
    '<meta name="robots" content="noindex, nofollow">',
    a.mode === "public" && a.slug ? `<meta property="og:url" content="${a.origin}/i/${a.slug}/">` : "",
    cover ? `<meta property="og:image" content="${a.origin}${cover}">` : "",
  ].join("");

  const rw = new HTMLRewriter();
  registerBindings(rw, m, ctx);
  rw.on("head", { element: (el) => void el.append(head, { html: true }) });
  rw.on('script[src="js/config.js"]', {
    element: (el) => void el.after(`<script>Object.assign(INVITATION,${jsonForScript(cfg)});Object.assign(MUSIC,${jsonForScript(mus)});</script>`, { html: true }),
  });
  if (a.guest?.name) rw.on("#guestName", { element: (el) => void el.setInnerContent(a.guest!.name) });

  const headers = new Headers({
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": a.mode === "public" ? "public, max-age=0, must-revalidate" : "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  if (a.mode === "preview") headers.set("X-Frame-Options", "SAMEORIGIN");
  return rw.transform(new Response(src, { headers }));
}

export type { TemplateManifest };
