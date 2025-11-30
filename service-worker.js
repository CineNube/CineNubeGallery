const CACHE_NAME = 'cine-nube-cache-v2';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './catalogo.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then((cache) => cache.addAll(urlsToCache))
        .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Strategy: try network first, fallback to cache
    event.respondWith(
        fetch(event.request).then(response => {
            // optionally put in cache for future
            if (event.request.method === 'GET') {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
            }
            return response;
        }).catch(() => caches.match(event.request).then(r => r || caches.match('./index.html')))
    );
});
