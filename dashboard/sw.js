// Maydeni AI Dashboard — Service Worker
const CACHE_NAME = 'maydeni-dashboard-v6';
const ASSETS_TO_CACHE = [
  '/Mega-Supervision/dashboard/',
  '/Mega-Supervision/dashboard/index.html',
  '/Mega-Supervision/dashboard/css/dashboard.css',
  '/Mega-Supervision/dashboard/js/dashboard.js',
  '/Mega-Supervision/dashboard/js/formations.js',
  '/Mega-Supervision/dashboard/manifest.json',
  '/Mega-Supervision/img/logo-icon.png',
  '/Mega-Supervision/img/logo-icon-48.png'
];

// Install — cache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // If some assets fail to cache, continue anyway
        console.log('[SW] Some assets could not be cached');
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first strategy (dashboard needs live data)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API calls
  if (url.pathname.includes('/api/') || url.hostname.includes('onrender.com')) {
    return;
  }

  // For navigation and static assets: network-first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
