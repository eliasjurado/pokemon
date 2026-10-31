/* Álbum del Mundial Pokémon — Service Worker (scope /pokemon/)
   HTML: network-first (nunca servir páginas viejas). Estáticos propios: stale-while-revalidate con lista de permitidos.
   PokeAPI (imágenes/gritos de raw.githubusercontent.com): cache-first en su propio caché.
   Nunca intercepta /admin /auth /api /login ni payloads RSC (?_rsc= / header RSC). Subir VERSION en cada release.
   v4: migración a Next.js (estáticos con hash en /_next/static/). */
var VERSION = 'pokemon-v4';
var POKEAPI_CACHE = 'pokeapi-v1';
var SCOPE = '/pokemon/';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) { return c.add(SCOPE); }).catch(function () {}).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION && k !== POKEAPI_CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // PokeAPI: cache-first
  if (url.hostname === 'raw.githubusercontent.com' && url.pathname.indexOf('/PokeAPI/') === 0) {
    if (req.headers.has('range')) return;
    e.respondWith(
      caches.open(POKEAPI_CACHE).then(function (cache) {
        return cache.match(req).then(function (cached) {
          if (cached) return cached;
          return fetch(req).then(function (res) {
            if (res && (res.status === 200 || res.type === 'opaque')) cache.put(req, res.clone());
            return res;
          });
        });
      })
    );
    return;
  }

  if (url.origin !== location.origin) return;

  // Rutas privadas / API y payloads RSC: directo a red, jamás cacheados (estándar stack-frontend.md)
  if (/^\/pokemon\/(api|admin|auth|login)(\/|$)/.test(url.pathname)) return;
  if (url.searchParams.has('_rsc') || req.headers.has('RSC') || req.headers.has('Next-Router-State-Tree')) return;
  if (req.headers.has('range')) return;

  // Navegaciones (HTML): red primero, caché como respaldo offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return caches.match(req).then(function (m) { return m || caches.match(SCOPE); }); })
    );
    return;
  }

  // Estáticos propios (lista de permitidos): caché primero, revalida en segundo plano
  if (/\.(css|js|svg|png|jpg|jpeg|webp|woff2?|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(function (cached) {
        var fetched = fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(VERSION).then(function (c) { c.put(req, copy); });
          }
          return res;
        }).catch(function () { return cached; });
        return cached || fetched;
      })
    );
  }
});
