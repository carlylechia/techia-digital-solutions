/* Admin-only service worker. Scope is /admin, so it never controls or caches
   public marketing routes. All caches are namespaced with an admin prefix. */
const ADMIN_CACHE = "techia-admin-v1";
const ADMIN_SCOPE = "/admin";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ADMIN_CACHE).then((cache) =>
      cache.addAll(["/admin", "/admin/manifest.json"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("techia-admin-") && key !== ADMIN_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Only cache requests made by admin clients. Public marketing pages are
  // never controlled by this worker because its scope is /admin.
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/admin") && !url.pathname.startsWith("/_next/static")) {
    return;
  }

  // Network-first for navigations so admin data stays fresh.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(ADMIN_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("/admin"))),
    );
    return;
  }

  // Cache-first for immutable static assets used by the admin portal.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(ADMIN_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
