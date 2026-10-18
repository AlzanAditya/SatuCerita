import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
import { defineConfig } from "vite";
import type { Plugin } from "vite";

/**
 * Plugin ringan: serve src/templates/* sebagai /templates/* di dev server.
 * Tidak diperlukan saat production karena build.ts akan copy folder templates ke output.
 */
function serveTemplatesPlugin(): Plugin {
  const TEMPLATES_SRC = path.resolve(__dirname, "src/templates");
  return {
    name: "serve-templates",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const prefix = "/templates/";
        if (!req.url?.startsWith(prefix)) return next();

        let relPath = req.url.slice(prefix.length).split("?")[0];
        let filePath = path.join(TEMPLATES_SRC, relPath);

        // Jika request mengarah ke folder (misal /templates/aglaia atau /templates/aglaia/), cari index.html
        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
          filePath = path.join(filePath, "index.html");
        }

        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          return next();
        }

        const ext = path.extname(filePath).toLowerCase();
        const mimeMap: Record<string, string> = {
          ".html": "text/html; charset=utf-8",
          ".css": "text/css",
          ".js": "application/javascript",
          ".json": "application/json",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".jpg": "image/jpeg",
          ".jpeg": "image/jpeg",
          ".webp": "image/webp",
          ".woff": "font/woff",
          ".woff2": "font/woff2",
          ".ttf": "font/ttf",
          ".mp3": "audio/mpeg",
          ".ogg": "audio/ogg",
          ".wav": "audio/wav",
        };
        res.setHeader("Content-Type", mimeMap[ext] ?? "application/octet-stream");
        res.setHeader("Cache-Control", "no-cache");
        fs.createReadStream(filePath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), serveTemplatesPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    // Saat dev, /api diteruskan ke Worker lokal (cd worker && npm run dev)
    proxy: {
      "/api": { target: "http://127.0.0.1:8787", changeOrigin: false },
    },
  },
});

