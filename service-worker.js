const CACHE_NAME = "diario-sportivo-igor-v4";
const APP_BASE   = "/diario-sportivo-igor/";

const FILES_TO_CACHE = [
  APP_BASE,
  APP_BASE + "index.html",
  APP_BASE + "offline.html",
  APP_BASE + "manifest.webmanifest",
  APP_BASE + "assets/css/main.css",
  APP_BASE + "assets/js/app.js",
  APP_BASE + "assets/js/db.js",
  APP_BASE + "assets/js/activities.js",
  APP_BASE + "assets/js/home.js",
  APP_BASE + "assets/js/register.js",
  APP_BASE + "assets/js/stats.js",
  APP_BASE + "assets/js/log.js",
  APP_BASE + "assets/js/settings.js",
  APP_BASE + "assets/js/utils.js",
  APP_BASE + "icons/icon-192.png",
  APP_BASE + "icons/icon-512.png",
  APP_BASE + "icons/icon-maskable-192.png",
  APP_BASE + "icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(APP_BASE + "offline.html"));
    })
  );
});
