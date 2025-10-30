// Service Worker for Caching Strategy
const CACHE_NAME = 'caffee-pairing-v1';
const RUNTIME_CACHE = 'caffee-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache-first for assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions and other origins
  if (!url.origin.includes(self.location.origin) && 
      !url.origin.includes('supabase.co') &&
      !url.origin.includes('googleapis.com')) {
    return;
  }

  // Network-first for API calls
  if (url.pathname.includes('/rest/') || 
      url.pathname.includes('/auth/') ||
      url.pathname.includes('/storage/') ||
      url.origin.includes('googleapis.com')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first for assets (JS, CSS, images)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff2|woff)$/)) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Update cache in background
            fetch(request).then(networkResponse => {
              if (networkResponse.status === 200) {
                cache.put(request, networkResponse);
              }
            }).catch(() => {});
            return response;
          }
          // Not in cache, fetch from network
          return fetch(request).then(networkResponse => {
            if (networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Network-first for HTML/navigation
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then(response => {
          return response || caches.match('/');
        });
      })
  );
});

