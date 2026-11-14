/**
 * Memastikan SETIAP selector binding manifest benar-benar menemukan elemen di index.html template aslinya,
 * dan fungsi turunan/sanitasi menghasilkan nilai yang benar. Jalankan: pnpm worker:test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseHTML } from "linkedom";
import { MANIFESTS, derive, interp, makeCtx, missingRequired, sanitizeContent, parseYoutubeId, cleanInstagram, validSlug } from "../../shared/templates";

for (const [slug, m] of Object.entries(MANIFESTS)) {
  test(`${slug}: semua selector binding menemukan elemen`, () => {
    const { document } = parseHTML(readFileSync(`src/templates/${slug}/index.html`, "utf8"));
    const dead: string[] = [];
    for (const b of m.bindings) if (document.querySelectorAll(b.sel).length === 0) dead.push(b.sel);
    assert.deepEqual(dead, [], `selector tanpa elemen:\n${dead.join("\n")}`);
  });

  test(`${slug}: path field & slot unik, default content memuat semua field`, () => {
    const paths = m.groups.flatMap((g) => g.fields.map((f) => f.path));
    assert.equal(new Set(paths).size, paths.length);
    const slots = m.slots.map((s) => s.slot);
    assert.equal(new Set(slots).size, slots.length);
    const out = sanitizeContent(m, null, {});
    assert.deepEqual(missingRequired(m, out), []);
  });
}

test("derive: tanggal Indonesia & waktu", () => {
  const d = derive(MANIFESTS.aglaia.defaultContent, MANIFESTS.aglaia);
  assert.equal(d.e[0].longComma, "Minggu, 20 Desember 2026");
  assert.equal(d.e[0].dots, "20 · 12 · 2026");
  assert.equal(d.e[0].monthShortYear, "Des 2026");
  assert.equal(d.e[0].startIso, "2026-12-20T08:00:00+07:00");
  assert.equal(d.e[0].time.replace(/\u00a0/g, " "), "08.00 – 10.00 WIB");
  assert.equal(d.names, "John & Jane");
  assert.equal(d.initials, "J & J");
});

test("interp: escape di mode html, fallback ||, filter :br", () => {
  const ctx = { a: "<b>&", n: "", x: "baris1\nbaris2" };
  assert.equal(interp("{a}", ctx, "html"), "&lt;b&gt;&amp;");
  assert.equal(interp("{a}", ctx, "text"), "<b>&");
  assert.equal(interp("{n||a}", ctx, "text"), "<b>&");
  assert.equal(interp("{x:br}", ctx, "html"), "baris1<br>baris2");
});

test("sanitizeContent: tolak URL non-https, batasi panjang, pertahankan media", () => {
  const m = MANIFESTS.antheia;
  const existing = { media: { cover: "/m/abc/cover.webp" } };
  const out = sanitizeContent(m, existing, {
    live: { url: "javascript:alert(1)", platform: "x".repeat(99) },
    groom: { nick: "  Budi\n", instagram: "https://instagram.com/budi.s?x=1" },
    events: [{ date: "2027-02-30", tz: "XXX" }],
    rsvp: { max_guests: 99 },
  } as Record<string, unknown>);
  assert.equal((out.live as Record<string, unknown>).url, "");
  assert.equal(((out.live as Record<string, unknown>).platform as string).length, 20);
  assert.equal((out.groom as Record<string, unknown>).nick, "Budi");
  assert.equal((out.groom as Record<string, unknown>).instagram, "budi.s");
  assert.equal(((out.events as Record<string, unknown>[])[0]).date, "2027-09-18"); // tanggal tidak valid ditolak
  assert.equal(((out.events as Record<string, unknown>[])[0]).tz, "WIB");
  assert.equal((out.rsvp as Record<string, unknown>).max_guests, 10);
  assert.deepEqual(out.media, existing.media);
});

test("helper: youtube id, instagram, slug", () => {
  assert.equal(parseYoutubeId("https://youtu.be/e1mOmdykmwI?t=2"), "e1mOmdykmwI");
  assert.equal(parseYoutubeId("https://www.youtube.com/watch?v=NZGHXy1IAHM"), "NZGHXy1IAHM");
  assert.equal(parseYoutubeId("bukan-id"), "");
  assert.equal(cleanInstagram("@john.h"), "john.h");
  assert.equal(validSlug("john-jane"), true);
  assert.equal(validSlug("api"), false);
  assert.equal(validSlug("Jo"), false);
});
