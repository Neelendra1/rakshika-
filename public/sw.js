// Rakshika Service Worker for Offline Capabilities & PWA Asset Caching
const CACHE_NAME = "rakshika-v1-cache";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/hero_banner.png",
  "/tech_banner.png",
  "/speaker.jpg",
  "/reel_bg.png"
];

// Install Event - Pre-cache core shell resources
self.addEventListener("install", (event) => {
  console.log("[Rakshika SW] Installing Service Worker...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Rakshika SW] Pre-caching offline application shell");
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up obsolete caches
self.addEventListener("activate", (event) => {
  console.log("[Rakshika SW] Activating Service Worker...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Rakshika SW] Deleting legacy cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First strategy with fallback to Cache for seamless offline rendering
self.addEventListener("fetch", (event) => {
  // Ignore non-GET requests or WebSocket / extension requests
  if (event.request.method !== "GET" || !event.request.url.startsWith("http")) {
    return;
  }

  // API calls handle offline fallback in client application logic
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clone and update cache if valid response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.log("[Rakshika SW] Offline mode detected. Serving cached page for:", event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Network connection lost", { status: 503, statusText: "Offline" });
        });
      })
  );
});
