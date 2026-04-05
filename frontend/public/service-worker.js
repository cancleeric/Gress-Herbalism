/**
 * Service Worker — 快取策略
 *
 * Issue #7：實作 Cache-First（靜態資源）+ Network-First（API）快取策略，
 * 提升重複載入速度並支援離線瀏覽。
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `herbalism-static-${CACHE_VERSION}`;
const API_CACHE = `herbalism-api-${CACHE_VERSION}`;

// 需預先快取的靜態資源
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// ==================== Install ====================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS)
    ).then(() => self.skipWaiting())
  );
});

// ==================== Activate ====================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ==================== Fetch ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過 Chrome 擴充功能和非 HTTP 請求
  if (!request.url.startsWith('http')) return;

  // Socket.io 相關請求不快取
  if (url.pathname.startsWith('/socket.io')) return;

  // API 請求：Network-First，失敗時回落快取
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // 靜態資源（JS/CSS/圖片）：Cache-First
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML 頁面：Network-First（確保取得最新版本）
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
});

/**
 * Cache-First 策略：先查快取，找不到才請求網路並儲存
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Service Unavailable', { status: 503 });
  }
}

/**
 * Network-First 策略：先請求網路，失敗時回落快取
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Service Unavailable', { status: 503 });
  }
}
