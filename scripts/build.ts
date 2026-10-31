import fs from "fs";
import path from "path";
import { build } from "vite";
import { build as esbuild } from "esbuild";
import { runLandingSSG } from "./generate-ssg";

const ROOT = process.cwd();
const DIST = path.resolve(ROOT, "dist");
const PUBLIC_DIR = path.resolve(ROOT, "public");

function copyDirRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function normalizeHtmlOutput(targetDir: string, nestedHtmlRelative: string) {
  const nestedPath = path.join(targetDir, nestedHtmlRelative);
  const targetHtml = path.join(targetDir, "index.html");

  if (fs.existsSync(nestedPath) && nestedPath !== targetHtml) {
    fs.copyFileSync(nestedPath, targetHtml);
    // Hapus file bersarang
    fs.unlinkSync(nestedPath);
  }

  // Bersihkan folder sisa seperti targetDir/src jika kosong
  const srcDir = path.join(targetDir, "src");
  if (fs.existsSync(srcDir)) {
    fs.rmSync(srcDir, { recursive: true, force: true });
  }

  // Pastikan public assets ter-copy jika belum ada
  copyDirRecursive(PUBLIC_DIR, targetDir);
}

async function buildLanding() {
  console.log("📦 Building landing -> dist/landing...");
  const landingOutDir = path.resolve(DIST, "landing");
  if (fs.existsSync(landingOutDir)) {
    fs.rmSync(landingOutDir, { recursive: true, force: true });
  }
  await build({
    configFile: path.resolve(ROOT, "vite.config.ts"),
    build: {
      outDir: landingOutDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(ROOT, "src/entries/landing/index.html"),
      },
    },
  });
  normalizeHtmlOutput(landingOutDir, "src/entries/landing/index.html");

  // Salin folder templates dari src/templates ke dist/landing/templates
  const templatesSrc = path.resolve(ROOT, "src/templates");
  if (fs.existsSync(templatesSrc)) {
    copyDirRecursive(templatesSrc, path.join(landingOutDir, "templates"));
    console.log("   ✓ Template statis disalin ke dist/landing/templates/");
  }

  // Jalankan SSG untuk Landing Page
  console.log("   📄 Menjalankan SSG untuk landing...");
  runLandingSSG(landingOutDir);

  // Landing redirects (SPA fallback)
  fs.writeFileSync(
    path.join(landingOutDir, "_redirects"),
    "/*  /index.html  200\n",
    "utf-8"
  );
  fs.rmSync(path.join(landingOutDir, "admin"), { recursive: true, force: true });
}

async function buildStudio() {
  console.log("\n📦 Building studio -> dist/studio...");
  const studioOutDir = path.resolve(DIST, "studio");
  if (fs.existsSync(studioOutDir)) {
    fs.rmSync(studioOutDir, { recursive: true, force: true });
  }
  await build({
    configFile: path.resolve(ROOT, "vite.config.ts"),
    build: {
      outDir: studioOutDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(ROOT, "src/entries/app/index.html"),
      },
    },
  });
  normalizeHtmlOutput(studioOutDir, "src/entries/app/index.html");

  // Studio redirects (SPA rewrite) & fallback 404
  fs.writeFileSync(path.join(studioOutDir, "_redirects"), "/*  /index.html  200\n", "utf-8");
  if (!fs.existsSync(path.join(studioOutDir, "404.html"))) {
    fs.copyFileSync(path.join(studioOutDir, "index.html"), path.join(studioOutDir, "404.html"));
  }
  fs.rmSync(path.join(studioOutDir, "admin"), { recursive: true, force: true });
  fs.rmSync(path.join(studioOutDir, "logos"), { recursive: true, force: true });
}

async function buildDash() {
  console.log("\n📦 Building dash -> dist/dash...");
  const dashOutDir = path.resolve(DIST, "dash");
  if (fs.existsSync(dashOutDir)) {
    fs.rmSync(dashOutDir, { recursive: true, force: true });
  }
  await build({
    configFile: path.resolve(ROOT, "vite.config.ts"),
    build: {
      outDir: dashOutDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(ROOT, "src/entries/dash/index.html"),
      },
    },
  });
  normalizeHtmlOutput(dashOutDir, "src/entries/dash/index.html");

  // Dash redirects (SPA rewrite) & fallback 404
  fs.writeFileSync(path.join(dashOutDir, "_redirects"), "/*  /index.html  200\n", "utf-8");
  if (!fs.existsSync(path.join(dashOutDir, "404.html"))) {
    fs.copyFileSync(path.join(dashOutDir, "index.html"), path.join(dashOutDir, "404.html"));
  }
  fs.rmSync(path.join(dashOutDir, "logos"), { recursive: true, force: true });
}

async function buildServer() {
  console.log("\n📦 Building server / worker -> dist/server...");
  const serverOutDir = path.resolve(DIST, "server");
  if (fs.existsSync(serverOutDir)) {
    fs.rmSync(serverOutDir, { recursive: true, force: true });
  }
  fs.mkdirSync(serverOutDir, { recursive: true });

  const workerEntry = path.resolve(ROOT, "worker/src/index.ts");
  if (!fs.existsSync(workerEntry)) {
    console.warn("⚠️ Worker entry point tidak ditemukan di", workerEntry);
    return;
  }

  await esbuild({
    entryPoints: [workerEntry],
    outfile: path.resolve(serverOutDir, "server.js"),
    bundle: true,
    platform: "neutral",
    target: "es2022",
    format: "esm",
    sourcemap: true,
  });

  // Buat index.js yang identik untuk fleksibilitas deploy Wrangler / Node
  fs.copyFileSync(
    path.resolve(serverOutDir, "server.js"),
    path.resolve(serverOutDir, "index.js")
  );
  if (fs.existsSync(path.resolve(serverOutDir, "server.js.map"))) {
    fs.copyFileSync(
      path.resolve(serverOutDir, "server.js.map"),
      path.resolve(serverOutDir, "index.js.map")
    );
  }

  console.log("   ✓ Server berhasil di-build ke dist/server/ (server.js & index.js)");
}

async function buildAll() {
  console.log("🚀 Memulai build mandiri untuk Cloudflare Pages & Workers...");
  console.log("   Output: dist/landing/, dist/studio/, dist/dash/, dist/server/\n");

  // 1. Bersihkan dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  // 2. Build Landing Page -> dist/landing
  await buildLanding();

  // 3. Build Studio -> dist/studio
  await buildStudio();

  // 4. Build Dash -> dist/dash
  await buildDash();

  // 5. Build Server Worker -> dist/server
  await buildServer();

  // 6. Bersihkan file/folder tak perlu di root dist/
  const distEntries = fs.readdirSync(DIST);
  for (const entry of distEntries) {
    if (!["landing", "studio", "dash", "server"].includes(entry)) {
      const p = path.join(DIST, entry);
      fs.rmSync(p, { recursive: true, force: true });
    }
  }

  console.log("\n✅ Build Selesai!");
  console.log("   Daftar folder di dist/:");
  fs.readdirSync(DIST).forEach((d) => {
    console.log(`   - dist/${d}/`);
  });
}

async function main() {
  const target = process.argv[2]?.toLowerCase();
  if (target === "landing") {
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
    await buildLanding();
  } else if (target === "studio" || target === "app") {
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
    await buildStudio();
  } else if (target === "dash") {
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
    await buildDash();
  } else if (target === "server" || target === "api" || target === "worker") {
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });
    await buildServer();
  } else {
    await buildAll();
  }
}

main().catch((err) => {
  console.error("❌ Build gagal:", err);
  process.exit(1);
});
