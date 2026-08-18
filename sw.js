const CACHE_NAME = 'nacws-verify-v1';
const ASSETS = [
  './index.html',
  './verify.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
  'https://unpkg.com/html5-qrcode'
];

// Initialize and install system assets locally onto device storage
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// Network Interception Pipeline
self.addEventListener('fetch', event => {
  // SECURITY BYPASS GUARD: Force direct live network passthrough for Google Macro DB connections
  if (event.request.url.includes('script.google.com') || event.request.url.includes('script.googleusercontent.com')) {
    return; // Detach service worker caching completely for database interactions
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});