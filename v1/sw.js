const CACHE_NAME = "my-app-v1";
const urlsToCache = [
  "/v1/",
  "/v1/index.html",
  "/v1/styles.css",
  "/v1/assets/icons/icon-192x192.png",
  // ... 其他需要缓存的资源
];

// 注册 service worker 时设置 scope
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/v1/sw.js", { scope: "/v1/" })
    .then((registration) => {
      console.log("ServiceWorker registered with scope:", registration.scope);
    })
    .catch((err) => {
      console.error("ServiceWorker registration failed:", err);
    });
}

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
