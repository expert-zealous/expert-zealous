// ============================================================
// EXPERT ZEALOUS SERVICE WORKER
// V2 - FIX CACHE AGAR HTML TERBARU MUNCUL DI SEMUA HP
// ============================================================

const CACHE_NAME = "expert-zealous-v2";

const CORE_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./images/icon-192.png",
  "./images/icon-512.png"
];

// ============================================================
// INSTALL
// ============================================================
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

// ============================================================
// ACTIVATE
// HAPUS SEMUA CACHE LAMA
// ============================================================
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH
// HTML = NETWORK FIRST
// ASSET = CACHE FIRST
// ============================================================
self.addEventListener("fetch", event => {

  const request = event.request;

  // Hanya GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Jangan ganggu Google, CDN, dll.
  if (url.origin !== self.location.origin) {
    return;
  }

  // ==========================================================
  // HTML / HALAMAN
  // SELALU COBA SERVER TERLEBIH DAHULU
  // ==========================================================
  if (
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.endsWith(".html") ||
    url.pathname === "/" ||
    url.pathname.endsWith("/")
  ) {

    event.respondWith(

      fetch(request, {
        cache: "no-store"
      })

      .then(response => {

        if (response && response.ok) {

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(request, copy);
            });
        }

        return response;
      })

      .catch(() => {

        return caches.match(request)
          .then(cached => {

            if (cached) {
              return cached;
            }

            return caches.match("./index.html");

          });

      })
    );

    return;
  }

  // ==========================================================
  // FILE LAIN:
  // CACHE FIRST
  // ==========================================================
  event.respondWith(

    caches.match(request)

      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {

            if (response && response.ok) {

              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, copy);
                });
            }

            return response;

          });

      })

  );

});

// ============================================================
// PESAN DARI INDEX.HTML
// MEMAKSA SERVICE WORKER BARU AKTIF
// ============================================================
self.addEventListener("message", event => {

  if (
    event.data &&
    event.data.type === "SKIP_WAITING"
  ) {

    self.skipWaiting();

  }

});