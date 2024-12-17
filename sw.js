const CACHE_NAME = "asset-tracker-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/assets/styles/main.css",
  "/src/js/app.js",
  "/src/js/constants.js",
  "/src/js/storage.js",
  "/src/js/utils.js",
  "/src/js/i18n.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
