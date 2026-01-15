const CACHE_NAME = "digital-clock-v3";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./index.css",
  "./main.js",
  "./manifest.json",
  "./public/android-chrome-192x192.png",
  "./public/android-chrome-512x512.png",
  "./public/apple-touch-icon.png",
  "./public/favicon-16x16.png",
  "./public/favicon-32x32.png",
  "./public/favicon.ico",
  "./public/ss1.png",
];

// Install: Cache core assets and force immediate activation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-First for Navigations, Cache-First for others
self.addEventListener("fetch", (event) => {
  const { mode } = event.request;

  // For navigation requests (HTML), try network first, fallback to cache
  if (mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Update cache with the new version
          const copy = response.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For other assets, try cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).then((fetchResponse) => {
          // Cache local assets dynamically
          if (
            fetchResponse.status === 200 &&
            new URL(event.request.url).origin === location.origin
          ) {
            const copy = fetchResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, copy));
          }
          return fetchResponse;
        })
      );
    })
  );
});

// Keep existing message listener for manual skipWaiting if needed
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
