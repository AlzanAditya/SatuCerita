/**
 * Rute publik /templates/{slug}: harus bisa dibuka (dengan atau tanpa slash akhir), memakai manifest sebagai daftar putih,
 * dan tidak membocorkan template yang tidak terdaftar. Jalankan: pnpm worker:test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { MANIFESTS } from "../../shared/templates";
import { handlePublicAsset } from "../src/public";
import type { Env } from "../src/types";

// Cache API tidak ada di Node: stub no-op.
(globalThis as unknown as { caches: { default: { match: () => Promise<undefined>; put: () => Promise<void> } } }).caches = {
  default: { match: async () => undefined, put: async () => {} },
};

const files = new Map<string, string>();
for (const slug of ["antheia", "aglaia", "thaleia", "hypatia"]) files.set(`templates/${slug}/index.html`, `<!doctype html><title>${slug}</title>`);
files.set("templates/aglaia/css/base.css", "body{}");

const env = {
  ASSETS_BUCKET: {
    get: async (key: string) => {
      const body = files.get(key);
      if (body === undefined) return null;
      return { body, size: body.length, httpEtag: `"${key}"`, httpMetadata: {}, text: async () => body };
    },
  },
} as unknown as Env;

const get = (path: string, method = "GET") => {
  const url = new URL(`https://satucerita.app${path}`);
  return handlePublicAsset(env, new Request(url, { method }), url);
};

test("katalog hanya berisi template yang punya folder & manifest: antheia, aglaia, thaleia", () => {
  assert.deepEqual(Object.keys(MANIFESTS).sort(), ["aglaia", "antheia", "thaleia"]);
});

for (const slug of ["antheia", "aglaia", "thaleia"]) {
  test(`/templates/${slug}/ menampilkan index.html template`, async () => {
    const r = await get(`/templates/${slug}/`);
    assert.equal(r?.status, 200);
    assert.match(r!.headers.get("Content-Type") ?? "", /text\/html/);
    assert.equal(await r!.text(), `<!doctype html><title>${slug}</title>`);
  });

  test(`/templates/${slug}/index.html tetap bisa dibuka (dipakai iframe pratinjau)`, async () => {
    assert.equal((await get(`/templates/${slug}/index.html`))?.status, 200);
  });

  test(`/templates/${slug} (tanpa slash) dialihkan ke versi ber-slash agar URL relatif benar`, async () => {
    const r = await get(`/templates/${slug}?x=1`);
    assert.equal(r?.status, 301);
    assert.equal(r!.headers.get("Location"), `/templates/${slug}/?x=1`);
  });
}

test("file di dalam template tetap dilayani", async () => {
  assert.equal((await get("/templates/aglaia/css/base.css"))?.status, 200);
  assert.equal((await get("/templates/aglaia/css/tidak-ada.css"))?.status, 404);
});

test("template tanpa manifest (hypatia) tidak dilayani walau filenya ada di R2", async () => {
  assert.equal(await get("/templates/hypatia"), null); // dibiarkan lewat -> SPA menampilkan 404
  assert.equal(await get("/templates/hypatia/"), null);
  assert.equal((await get("/templates/hypatia/index.html"))?.status, 404);
});

test("/templates (halaman admin SPA) dan path aneh tidak ditangani Worker", async () => {
  assert.equal(await get("/templates"), null);
  assert.equal(await get("/templates/"), null);
  // %2f tidak dinormalisasi oleh URL parser, jadi sampai ke safePath() yang menolak segmen "..".
  assert.equal((await get("/templates/aglaia/..%2f..%2fthaleia/index.html"))?.status, 404);
});

test("hanya GET/HEAD", async () => {
  assert.equal(await get("/templates/aglaia/", "POST"), null);
  assert.equal((await get("/templates/aglaia/", "HEAD"))?.status, 200);
});
