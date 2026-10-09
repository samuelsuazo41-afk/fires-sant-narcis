// sw.js - Fires Sant Narcís - Laia Offline v2
const CACHE = 'fires-laia-v3';
const FILES = [
  './',
  './index.html',
  './app.js',
  './manifest.json',
  './laia.png',
  './icon-192.png',
  './icon-512.png',
  './data/capitols.json',
  './data/capitol_01_mosques_1285.json',
  './data/capitol_02_lleona.json',
  './data/capitol_03_geganst.json',
  './data/capitol_04_davesa_fires.json',
  './data/capitol_05_correfoc.json',
  './data/capitol_06_vol_mosca.json',
  './data/llegenda_01_mosques.json',
  './data/llegenda_02_lleona.json',
  './data/llegenda_03_devesa.json',
  './data/ruta_secreta_nit_fires.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        // Guarda nous arxius al cache
        return caches.open(CACHE).then(cache => {
          cache.put(e.request, resp.clone());
          return resp;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});
