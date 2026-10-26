/*
 * Retired service worker.
 *
 * Versions before 2.0 registered a cache-first worker that could pin an old
 * app shell indefinitely. This file stays at the same URL so browsers perform
 * an update: it clears the old caches, releases clients, and unregisters
 * itself. The app itself no longer registers a service worker.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith('recipe-discovery'))
          .map((key) => caches.delete(key)),
      );
      await self.registration.unregister();
      await self.clients.claim();
    })(),
  );
});
