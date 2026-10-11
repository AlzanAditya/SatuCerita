import fs from "fs";
import path from "path";
import { build } from "vite";
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

async function buildAll() {
  console.log("🚀 Memulai build mandiri untuk Cloudflare Pages...");
  console.log("   Output: dist/landing-page/, dist/app/, dist/dash/\n");

  // 1. Bersihkan dist
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });

  // 2. Build Landing Page -> dist/landing-page
  console.log("📦 [1/3] Building landing-page...");
  const landingOutDir = path.resolve(DIST, "landing-page");
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

  // 3. Build App -> dist/app
  console.log("\n📦 [2/3] Building app...");
  const appOutDir = path.resolve(DIST, "app");
  await build({
    configFile: path.resolve(ROOT, "vite.config.ts"),
    build: {
      outDir: appOutDir,
      emptyOutDir: true,
      rollupOptions: {
        input: path.resolve(ROOT, "src/entries/app/index.html"),
      },
    },
  });
  normalizeHtmlOutput(appOutDir, "src/entries/app/index.html");

  // 4. Build Dash -> dist/dash
  console.log("\n📦 [3/3] Building dash...");
  const dashOutDir = path.resolve(DIST, "dash");
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

  // 5. Jalankan SSG untuk Landing Page
  console.log("\n📄 Menjalankan SSG untuk landing-page...");
  runLandingSSG(landingOutDir);

  // 6. Buat fallback 404 & Cloudflare Pages _redirects untuk App & Dash
  console.log("\n⚙️  Menyiapkan Cloudflare Pages _redirects & fallbacks...");

  // App redirects (SPA rewrite)
  fs.writeFileSync(path.join(appOutDir, "_redirects"), "/*  /index.html  200\n", "utf-8");
  if (!fs.existsSync(path.join(appOutDir, "404.html"))) {
    fs.copyFileSync(path.join(appOutDir, "index.html"), path.join(appOutDir, "404.html"));
  }

  // Dash redirects (SPA rewrite)
  fs.writeFileSync(path.join(dashOutDir, "_redirects"), "/*  /index.html  200\n", "utf-8");
  if (!fs.existsSync(path.join(dashOutDir, "404.html"))) {
    fs.copyFileSync(path.join(dashOutDir, "index.html"), path.join(dashOutDir, "404.html"));
  }

  // Landing redirects
  fs.writeFileSync(
    path.join(landingOutDir, "_redirects"),
    "/login  /login.html  200\n/signup  /signup.html  200\n/*  /index.html  200\n",
    "utf-8"
  );

  // 7. Bersihkan file/folder tak perlu di root dist/
  const distEntries = fs.readdirSync(DIST);
  for (const entry of distEntries) {
    if (!["landing-page", "app", "dash"].includes(entry)) {
      const p = path.join(DIST, entry);
      fs.rmSync(p, { recursive: true, force: true });
    }
  }

  console.log("\n✅ Build Selesai!");
  console.log("   Daftar folder di dist/:");
  fs.readdirSync(DIST).forEach((d) => {
    console.log(`   - dist/${d}/ (Mandiri & Siap deploy ke Cloudflare Pages)`);
  });
}

buildAll().catch((err) => {
  console.error("❌ Build gagal:", err);
  process.exit(1);
});
