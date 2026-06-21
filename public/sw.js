const CACHE_NAME = "nutripro-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/icon.svg",
  "/manifest.json"
];

// Installs the background lifecycle worker and caches critical launcher states
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("Pre-cache warning: ", err);
      });
    })
  );
  self.skipWaiting();
});

// Purges deprecated cached versions during upgrades
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Smooth fallback capability: fetch from the online network, fall back to cached copy if offline
self.addEventListener("fetch", (event) => {
  // Only intercept HTTP/HTTPS protocol requests (prevent chrome-extension etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful requests dynamically
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
