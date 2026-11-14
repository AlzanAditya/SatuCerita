/**
 * Sinkronkan src/templates/{slug}/ -> R2 (struktur SAMA PERSIS, tanpa hash) dan catat ke Supabase
 * (tabel `templates` + `template_files`).
 *
 *   pnpm tsx scripts/sync-templates.ts                 # semua template di shared/templates/index.ts
 *   pnpm tsx scripts/sync-templates.ts antheia         # satu template
 *   pnpm tsx scripts/sync-templates.ts --dry-run       # hanya tampilkan rencana
 *   pnpm tsx scripts/sync-templates.ts --prune         # hapus file di R2 yang sudah tidak ada di lokal
 *
 * Env (R2 lewat S3 API; buat token di Cloudflare > R2 > Manage API Tokens, izin Object Read & Write):
 *   R2_ACCOUNT_ID  R2_ACCESS_KEY_ID  R2_SECRET_ACCESS_KEY  [R2_BUCKET=satucerita-assets]
 *   SUPABASE_URL   SUPABASE_SERVICE_ROLE_KEY
 *
 * Butuh: pnpm add -D @aws-sdk/client-s3
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { MANIFESTS } from "../shared/templates";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const PRUNE = args.includes("--prune");
const only = args.filter((a) => !a.startsWith("--"));
const need = (k: string) => {
  const v = process.env[k];
  if (!v && !DRY) throw new Error(`Env ${k} belum di-set.`);
  return v ?? "";
};

const CT: Record<string, string> = {
  html: "text/html; charset=utf-8", css: "text/css; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json; charset=utf-8",
  svg: "image/svg+xml", webp: "image/webp", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", ico: "image/x-icon",
  woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", mp3: "audio/mpeg", m4a: "audio/mp4", txt: "text/plain; charset=utf-8",
};
const ctype = (f: string) => CT[f.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";

const bucket = process.env.R2_BUCKET || "satucerita-assets";
const s3 = DRY
  ? null
  : new S3Client({
      region: "auto",
      endpoint: `https://${need("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: need("R2_ACCESS_KEY_ID"), secretAccessKey: need("R2_SECRET_ACCESS_KEY") },
    });

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    if (n.startsWith(".") || n === "node_modules") return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function sb(path: string, init: RequestInit): Promise<Response> {
  const key = need("SUPABASE_SERVICE_ROLE_KEY").trim();
  const h = new Headers({ apikey: key, "Content-Type": "application/json", ...(init.headers as Record<string, string>) });
  if (key.startsWith("eyJ")) h.set("Authorization", `Bearer ${key}`);
  return fetch(`${need("SUPABASE_URL")}/rest/v1/${path}`, { ...init, headers: h });
}

async function syncOne(slug: string) {
  const dir = join("src", "templates", slug);
  const prefix = `templates/${slug}/`;
  const files = walk(dir);
  console.log(`\n== ${slug}: ${files.length} file -> r2://${bucket}/${prefix}`);
  const records: Record<string, unknown>[] = [];
  let up = 0, skip = 0;

  for (const f of files) {
    const rel = relative(dir, f).split(sep).join("/");
    const body = readFileSync(f);
    const md5 = createHash("md5").update(body).digest("hex");
    const key = prefix + rel;
    let etag: string | undefined;
    if (s3) {
      try {
        etag = (await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))).ETag?.replace(/"/g, "");
      } catch {
        /* belum ada */
      }
    }
    if (etag === md5) skip++;
    else {
      up++;
      console.log(`  ↑ ${rel} (${(body.length / 1024).toFixed(1)} KB)`);
      if (s3) await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: ctype(rel) }));
    }
    records.push({ template_slug: slug, path: rel, content_type: ctype(rel), size_bytes: body.length, etag: md5, updated_at: new Date().toISOString() });
  }
  console.log(`  ${up} diunggah, ${skip} dilewati (ETag sama)`);

  if (PRUNE && s3) {
    const local = new Set(files.map((f) => prefix + relative(dir, f).split(sep).join("/")));
    let token: string | undefined;
    do {
      const r = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
      for (const o of r.Contents ?? []) if (o.Key && !local.has(o.Key)) { console.log(`  ✗ hapus ${o.Key}`); await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: o.Key })); }
      token = r.NextContinuationToken;
    } while (token);
  }

  if (DRY) return;
  const m = MANIFESTS[slug];
  const t = await sb("templates?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ slug, title: m.title, version: m.version, storage_provider: "r2", asset_prefix: prefix, entry_path: "index.html", manifest: { groups: m.groups, slots: m.slots }, default_content: m.defaultContent, is_active: true }),
  });
  if (!t.ok) throw new Error(`upsert templates gagal: ${t.status} ${await t.text()}`);
  // Ganti inventaris file: hapus yang lama lalu masukkan yang baru (tabel ini hanya catatan, bukan sumber kebenaran).
  await sb(`template_files?template_slug=eq.${slug}`, { method: "DELETE" });
  for (let i = 0; i < records.length; i += 200) {
    const r = await sb("template_files", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(records.slice(i, i + 200)) });
    if (!r.ok) throw new Error(`insert template_files gagal: ${r.status} ${await r.text()}`);
  }
  console.log("  tercatat di Supabase (templates + template_files)");
}

const slugs = only.length ? only : Object.keys(MANIFESTS);
for (const s of slugs) {
  if (!MANIFESTS[s]) throw new Error(`Template "${s}" belum punya manifest di shared/templates/.`);
  await syncOne(s);
}
console.log("\nSelesai.");
