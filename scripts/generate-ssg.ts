/**
 * Static Site Generation (SSG) untuk Satu Cerita.
 *
 * Dijalankan SETELAH `vite build` (lihat script "build" di package.json).
 * Untuk setiap route di `src/routes.ts` script ini menulis HTML statis yang
 * sudah berisi <title>, meta description, canonical, Open Graph, Twitter Card,
 * robots, dan JSON-LD, sehingga crawler (Google, WhatsApp, Telegram, dsb.)
 * langsung melihat metadata yang benar tanpa menjalankan JavaScript.
 *
 * Output (di dalam dist/):
 *   - <route>/index.html + <route>.html   untuk setiap route
 *   - 404.html                            halaman not-found (noindex)
 *   - sitemap.xml & robots.txt
 */
import fs from "fs";
import path from "path";
import { SITE } from "../src/config/site";
import { NOT_FOUND_META, ROUTES, type RouteMeta } from "../src/routes";

const DIST_DIR = path.resolve(process.cwd(), "dist");
const TEMPLATE_PATH = path.join(DIST_DIR, "index.html");
const HEAD_PLACEHOLDER = "<!--ssg:head-->";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function absoluteUrl(urlOrPath: string): string {
  if (/^https?:\/\//.test(urlOrPath)) return encodeURI(urlOrPath);
  const p = urlOrPath.startsWith("/") ? urlOrPath : `/${urlOrPath}`;
  return encodeURI(`${SITE.url}${p}`);
}

function imageMimeType(url: string): string {
  if (url.endsWith(".png")) return "image/png";
  if (url.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/** Data terstruktur untuk halaman beranda (Organization + WebSite). */
function homeJsonLd(): object[] {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
      logo: absoluteUrl(SITE.ogImage.path),
      sameAs: [SITE.contact.instagram, SITE.contact.tiktok],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          telephone: `+${SITE.contact.whatsapp}`,
          email: SITE.contact.email,
          areaServed: "ID",
          availableLanguage: ["id"],
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE.name,
      url: SITE.url,
      inLanguage: "id-ID",
    },
  ];
}

interface PageHead {
  path: string;
  title: string;
  description: string;
  indexable: boolean;
  jsonLd?: object[];
}

/** Bangun blok <head> SEO untuk satu halaman. */
function buildSeoHead(page: PageHead): { title: string; block: string } {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description.replace(/\s+/g, " ").trim());
  const canonical = `${SITE.url}${page.path}`;
  const image = absoluteUrl(SITE.ogImage.path);
  const imageAlt = escapeHtml(SITE.ogImage.alt);
  const isSquare = SITE.ogImage.width === SITE.ogImage.height;
  const robots = page.indexable ? "index, follow" : "noindex, nofollow";

  const jsonLd = page.jsonLd
    ? `\n    <script type="application/ld+json">\n${JSON.stringify(page.jsonLd, null, 2)}\n    </script>`
    : "";

  const block = `<meta name="description" content="${description}" />
    <meta name="author" content="${escapeHtml(SITE.name)}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    <link rel="image_src" href="${image}" />

    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="${escapeHtml(SITE.name)}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:locale" content="${SITE.locale}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:secure_url" content="${image}" />
    <meta property="og:image:type" content="${imageMimeType(image)}" />
    <meta property="og:image:width" content="${SITE.ogImage.width}" />
    <meta property="og:image:height" content="${SITE.ogImage.height}" />
    <meta property="og:image:alt" content="${imageAlt}" />

    <!-- Twitter / X -->
    <meta name="twitter:card" content="${isSquare ? "summary" : "summary_large_image"}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
    <meta name="twitter:image:alt" content="${imageAlt}" />${jsonLd}`;

  return { title, block };
}

/** Sisipkan blok SEO ke template hasil `vite build`. */
function renderHtml(template: string, page: PageHead): string {
  const { title, block } = buildSeoHead(page);
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(HEAD_PLACEHOLDER, block);
}

function writeFile(relativePath: string, content: string) {
  const full = path.join(DIST_DIR, relativePath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf-8");
}

/** "/" -> ["index.html"], "/katalog" -> ["katalog/index.html", "katalog.html"] */
function outputFilesFor(routePath: string): string[] {
  if (routePath === "/") return ["index.html"];
  const clean = routePath.replace(/^\//, "");
  return [`${clean}/index.html`, `${clean}.html`];
}

/* ------------------------------------------------------------------ */
/* Sitemap & robots                                                    */
/* ------------------------------------------------------------------ */

function generateSitemap(routes: RouteMeta[]) {
  const today = new Date().toISOString().split("T")[0];
  const urls = routes
    .filter((r) => r.indexable)
    .map(
      (r) => `  <url>
    <loc>${SITE.url}${r.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${r.changefreq ?? "monthly"}</changefreq>
    <priority>${(r.priority ?? 0.5).toFixed(1)}</priority>
  </url>`
    )
    .join("\n");

  writeFile(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
  );
}

function generateRobotsTxt() {
  writeFile("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}/sitemap.xml\n`);
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export function runSSG() {
  console.log("⚡ Generating static pages for Satu Cerita...");

  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error("❌ dist/index.html tidak ditemukan. Jalankan `vite build` dulu (atau `npm run build`).");
    process.exit(1);
  }

  const template = fs.readFileSync(TEMPLATE_PATH, "utf-8");
  if (!template.includes(HEAD_PLACEHOLDER)) {
    console.error(
      `❌ Placeholder ${HEAD_PLACEHOLDER} tidak ada di dist/index.html.\n` +
        "   Kemungkinan SSG sudah pernah dijalankan pada folder dist ini. Jalankan `npm run build` ulang."
    );
    process.exit(1);
  }

  for (const route of ROUTES) {
    const page: PageHead = {
      path: route.path,
      title: route.title,
      description: route.description,
      indexable: route.indexable,
      jsonLd: route.id === "home" ? homeJsonLd() : undefined,
    };
    const html = renderHtml(template, page);

    // Hanya route kanonik yang dibuat. Alias (mis. /carapesan, /app) tidak perlu
    // file sendiri: router client akan mengarahkannya ke path kanonik.
    for (const file of outputFilesFor(route.path)) writeFile(file, html);
    console.log(`  ✓ ${route.path}${route.indexable ? "" : "  (noindex)"}`);
  }

  // 404.html — dipakai host statis untuk URL yang tidak dikenal.
  writeFile(
    "404.html",
    renderHtml(template, {
      path: "/404",
      title: NOT_FOUND_META.title,
      description: NOT_FOUND_META.description,
      indexable: false,
    })
  );
  console.log("  ✓ 404.html (noindex)");

  generateSitemap(ROUTES);
  generateRobotsTxt();
  console.log("  ✓ sitemap.xml, robots.txt");

  console.log("\n🎉 SSG selesai.");
}

runSSG();
