/* MonDjai/Trépor — Service Worker minimal (Sprint 7A)
   But unique : permettre l'ouverture de l'application hors ligne une fois installée.
   Mise en cache de index.html (l'application entière) et des fichiers d'icône/manifest,
   stratégie "cache d'abord, réseau en secours" — pas de logique plus complexe, pas de
   bibliothèque externe, conforme au principe "aucun appel réseau" de l'application. */

var CACHE_NAME = "trepor-cache-v7a";
var FICHIERS_A_METTRE_EN_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-1024.png",
  "./apple-touch-icon.png",
  "./favicon.ico"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(
        FICHIERS_A_METTRE_EN_CACHE.map(function(url){
          return cache.add(url).catch(function(){ /* un fichier manquant ne doit pas bloquer l'installation */ });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(noms){
      return Promise.all(
        noms.filter(function(nom){ return nom !== CACHE_NAME; })
            .map(function(nom){ return caches.delete(nom); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(reponseEnCache){
      if(reponseEnCache) return reponseEnCache;
      return fetch(event.request).then(function(reponseReseau){
        // Mise à jour discrète du cache pour les prochaines ouvertures hors ligne.
        var copie = reponseReseau.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copie); });
        return reponseReseau;
      }).catch(function(){
        // Hors ligne et rien en cache pour cette requête : on retombe sur index.html
        // pour que l'application (single-page) continue de s'afficher.
        return caches.match("./index.html");
      });
    })
  );
});
