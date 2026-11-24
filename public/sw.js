/**
 * Service Worker for Accessories Exclusif PWA
 * Version: ae-cache-v2
 * 
 * Rules:
 * 1. NEVER pre-cache dynamic HTML pages (like '/') to prevent stale chunk mismatches after deployments.
 * 2. NEVER return HTML for failed JavaScript (.js), CSS (.css), or API requests.
 * 3. Only cache truly static assets (icons, manifest).
 * 4. Network-only for Next.js build chunks (/_next/*) and API endpoints.
 */

const CACHE_NAME = 'ae-cache-v2';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192x192.jpeg',
  '/icons/icon-512x512.jpeg',
  '/favicon-16x16.png',
];

// Install: pre-cache ONLY immutable static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up ALL old caches (e.g. ae-cache-v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

// Allow client to trigger immediate activation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch handler
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Skip all external requests (Django backend, CDNs, Firebase, Analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // 2. Skip all API routes completely
  if (url.pathname.startsWith('/api/')) return;

  // 3. Skip Next.js chunks, RSC payloads and internal assets
  // Next.js handles chunk hashing and caching natively; intercepting them with HTML fallback causes syntax errors.
  if (url.pathname.startsWith('/_next/')) return;

  // 4. Handle HTML page navigation (network-first, with dedicated offline fallback)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;

        return new Response(
          '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hors ligne - Accessoires Exclusifs</title><style>body{margin:0;padding:2rem;font-family:system-ui,-apple-system,sans-serif;background:#050505;color:#f3f3f3;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;text-align:center;}h1{color:#C5A059;margin-bottom:1rem;font-size:1.5rem;}p{max-width:400px;line-height:1.6;color:#aaa;font-size:0.95rem;}button{margin-top:1.5rem;padding:0.75rem 1.5rem;background:#C5A059;color:#050505;border:none;border-radius:6px;font-weight:600;font-size:1rem;cursor:pointer;}</style></head><body><h1>Connexion perdue</h1><p>Vous êtes actuellement hors ligne. Vérifiez votre connexion Internet puis réessayez.</p><button onclick="window.location.reload()">Réessayer</button></body></html>',
          {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          }
        );
      })
    );
    return;
  }

  // 5. Static assets (icons, manifest): cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});

// Note: Push notifications are handled exclusively by public/firebase-messaging-sw.js to prevent double notifications.
