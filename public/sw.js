// Service Worker for FinanceGrowth PWA
const CACHE_NAME = 'financegrowth-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/transactions',
  '/invoices',
  '/clients',
  '/voice-assistant',
  '/settings'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Don't cache API requests - always fetch from network
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Don't cache requests with no-cache header
  if (event.request.headers.get('cache-control') === 'no-cache') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).catch((error) => {
          // Silently fail for non-critical resources (fonts, images, etc.)
          // Only log for navigation requests
          if (event.request.mode === 'navigate') {
            console.warn('Navigation fetch failed:', event.request.url);
          }
          // Return a basic error response instead of failing
          return new Response('Network error', { status: 408 });
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});


