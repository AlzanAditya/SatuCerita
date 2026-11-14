/**
 * Update HANYA tabel `templates` di Supabase untuk template thaleia.
 * Tidak perlu R2 credentials — hanya memperbarui manifest & default_content.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... pnpm tsx scripts/upsert-template-manifest.ts thaleia
 */
import { MANIFESTS } from "../shared/templates";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const slugs = args.length ? args : Object.keys(MANIFESTS);

const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Env ${k} belum di-set.`);
  return v;
};

async function sb(path: string, init: RequestInit): Promise<Response> {
  const key = need("SUPABASE_SERVICE_ROLE_KEY").trim();
  const h = new Headers({
    apikey: key,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  });
  if (key.startsWith("eyJ")) h.set("Authorization", `Bearer ${key}`);
  return fetch(`${need("SUPABASE_URL")}/rest/v1/${path}`, { ...init, headers: h });
}

for (const slug of slugs) {
  const m = MANIFESTS[slug];
  if (!m) throw new Error(`Template "${slug}" tidak ada di MANIFESTS.`);

  const prefix = `templates/${slug}/`;
  console.log(`\nUpsert Supabase: templates.${slug} (version=${m.version})`);

  const body = JSON.stringify({
    slug,
    title: m.title,
    version: m.version,
    storage_provider: "r2",
    asset_prefix: prefix,
    entry_path: "index.html",
    manifest: { groups: m.groups, slots: m.slots },
    default_content: m.defaultContent,
    is_active: true,
  });

  const r = await sb("templates?on_conflict=slug", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body,
  });

  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Upsert gagal: ${r.status} ${txt}`);
  }

  console.log(`  ✓ templates.${slug} berhasil diperbarui di Supabase.`);
}

console.log("\nSelesai.");

