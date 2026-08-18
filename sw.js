// Service Worker for NACWS Verify PWA
const CACHE_NAME = 'nacws-verify-v1';
const urlsToCache = [
    'verify.html',
    'manifest.json'
];

// Install event – cache assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => cache.addAll(urlsToCache))
        .then(() => self.skipWaiting())
    );
});

// Activate event – clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    if (name !== CACHE_NAME) {
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event – serve from cache, fallback to network
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).catch(() => {
                // Optional: return offline fallback
                return new Response('Offline – please connect to the internet.', {
                    status: 503,
                    statusText: 'Service Unavailable'
                });
            });
        })
    );
});