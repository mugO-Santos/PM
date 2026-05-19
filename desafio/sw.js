// sw.js - Atualização resiliente para reduzir app desatualizado em PWA instalado
const CACHE_VERSION = '2026-05-19';
const CACHE_NAME = `missao-oficial-${CACHE_VERSION}`;
const toCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/docsData.js',
  '/docsDetalhados.js',
  '/profileData.js',
  '/documentLinks.js',
  '/levels.js',
  '/exportPDF.js',
  '/manifest.json',
  '/icon/icon-192.png',
  '/icon/icon-512.png',
  '/icon/icon-maskable-512.png'
];
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(toCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return cache.match('/index.html');
    }
    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isAppShellAsset = /\.(?:css|js|json)$/.test(url.pathname) ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html');

  event.respondWith(
    isAppShellAsset || event.request.mode === 'navigate'
      ? networkFirst(event.request)
      : cacheFirst(event.request)
  );
});
