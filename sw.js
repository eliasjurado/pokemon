const CACHE = 'pokemon-v3';
const POKEAPI_CACHE = 'pokeapi-v1';
const STATIC = [
  '.',
  'index.html',
  'manifest.json',
  'pokemon.json',
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== POKEAPI_CACHE).map(k => caches.delete(k))))
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (url.includes('raw.githubusercontent.com/PokeAPI/')) {
    e.respondWith(
      caches.open(POKEAPI_CACHE).then(cache =>
        cache.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            cache.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
  } else {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
