// Service Worker PWA - Satu Cerita
const CACHE_NAME = 'satucerita-cache-v2';
const CORE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/public/favicon.ico',
  '/public/favicon-16x16.png',
  '/public/favicon-32x32.png',
  '/public/apple-touch-icon.png',
  '/public/android-chrome-192x192.png',
  '/public/android-chrome-512x512.png',
  '/admin/favicon.ico',
  '/admin/favicon-16x16.png',
  '/admin/favicon-32x32.png',
  '/admin/apple-touch-icon.png',
  '/admin/android-chrome-192x192.png',
  '/admin/android-chrome-512x512.png',
  '/logos/satucerita.png',
  '/logos/whatsapp.webp',
  '/logos/instagram.webp',
  '/logos/tiktok.webp',
  '/logos/gmail.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('[PWA] Cache pre-fill partial failure:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Lewati request cross-origin
  if (url.origin !== location.origin) return;

  // Jangan pernah cache API/auth maupun halaman terproteksi (app.* & dash.*)
  if (url.pathname.startsWith('/api/')) return;
  if (url.hostname.startsWith('app.') || url.hostname.startsWith('dash.')) {
    if (event.request.mode === 'navigate') return;
  }

  // Navigasi HTML: network-first, fallback ke cache saat offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // Aset statis (JS, CSS, gambar): cache-first, fallback ke network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Gagal total (offline & tidak ada di cache): biarkan browser menangani
      });
    })
  );
});
