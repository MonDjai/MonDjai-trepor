/*
 * MonDjai/Trépor — Service Worker
 * Permet le fonctionnement 100 % hors ligne après le premier chargement.
 * Aucune requête réseau n'est jamais faite par ce fichier autrement que
 * pour mettre en cache les fichiers de l'application elle-même.
 */

const CACHE_NAME = "trepor-cache-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-512.png"
];

// Installation : on met en cache les fichiers de l'application.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// Activation : on nettoie les anciennes versions du cache.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Récupération : cache d'abord, réseau en secours (utile seulement pour
// la toute première visite ou une mise à jour du dépôt GitHub Pages).
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
            });
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
