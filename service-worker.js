// Service Worker para Ahorcado de Tablas - PWA
const CACHE_NAME = 'ahorcado-tablas-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
  'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
  'https://cdn.jsdelivr.net/npm/@babel/standalone@7.22.20/babel.min.js'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache abierto:', CACHE_NAME);
        // No cachear las URLs externas, solo las locales
        return cache.addAll([
          '/',
          '/index.html',
          '/manifest.json'
        ]).catch(err => {
          console.warn('⚠️ Algunas URLs no se pudieron cachear:', err);
        });
      })
  );
  self.skipWaiting();
});

// Activar Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Estrategia: Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Solo para GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Si es una URL externa (CDN), intentar red primero
  if (event.request.url.includes('cdn.jsdelivr.net') ||
      event.request.url.includes('fonts.googleapis') ||
      event.request.url.includes('fonts.gstatic')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // No cachear requests fallidas
          if (!response || response.status !== 200) {
            return response;
          }
          // Cachear si es exitoso
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(err => {
          console.log('⚠️ Error en fetch:', err);
          // Si falla, intentar caché
          return caches.match(event.request)
            .then(response => response || new Response('Offline'));
        })
    );
  } else {
    // Para URLs locales: cache first, network fallback
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
              return response;
            })
            .catch(err => {
              console.log('Error sin conexión:', err);
              return new Response('Offline - No data available');
            });
        })
    );
  }
});

// Background Sync (opcional)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  console.log('🔄 Sincronizando datos del juego...');
  // Aquí puedes agregar lógica para sincronizar datos cuando vuelva conexión
  return Promise.resolve();
}
