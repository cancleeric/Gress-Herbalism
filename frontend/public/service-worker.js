/**
 * Service Worker - 靜態資源快取策略
 *
 * Issue #7 - 效能優化：Service Worker 快取策略優化
 *
 * 快取策略：
 * - 靜態資源（JS/CSS/圖片）：Cache First（優先使用快取）
 * - API 請求：Network First（優先使用網路，備援使用快取）
 * - HTML 頁面：Stale While Revalidate（使用快取同時在背景更新）
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/js/main.chunk.js',
  '/static/js/vendors~main.chunk.js',
  '/static/css/main.chunk.css',
  '/manifest.json',
];

const CACHE_EXPIRY = {
  api: 5 * 60 * 1000,              // API 快取 5 分鐘
  images: 7 * 24 * 60 * 60 * 1000, // 圖片快取 7 天
};

// ==================== Install ====================

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        // 部分靜態資源可能不存在，忽略錯誤
        console.warn('[SW] 部分靜態資源快取失敗:', err.message);
      });
    })
  );
  self.skipWaiting();
});

// ==================== Activate ====================

self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, API_CACHE, IMAGE_CACHE];

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !currentCaches.includes(name))
          .map((name) => {
            console.log('[SW] 刪除舊快取:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// ==================== Fetch ====================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只攔截同源或已知 API 的請求
  if (request.method !== 'GET') return;

  // Socket.io 請求不快取
  if (url.pathname.startsWith('/socket.io')) return;

  // API 請求：Network First 策略
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, CACHE_EXPIRY.api));
    return;
  }

  // 圖片：Cache First 策略
  if (request.destination === 'image' || /\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // HTML 頁面：Stale While Revalidate
  if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // 靜態資源（JS/CSS）：Cache First 策略
  if (/\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }
});

// ==================== 快取策略函數 ====================

/**
 * Cache First：先讀快取，快取未命中再請求網路並快取
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    console.warn('[SW] 網路請求失敗（Cache First）:', request.url);
    return new Response('網路連線失敗', { status: 503 });
  }
}

/**
 * Network First：先請求網路並快取，失敗時使用快取
 */
async function networkFirstStrategy(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = networkResponse.clone();

      // 加入時間戳記以便後續清理過期快取
      const headers = new Headers(responseToCache.headers);
      headers.append('sw-fetched-at', Date.now().toString());

      cache.put(request, new Response(await responseToCache.blob(), {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers,
      }));
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const fetchedAt = cachedResponse.headers.get('sw-fetched-at');
      if (fetchedAt && maxAge && (Date.now() - parseInt(fetchedAt)) > maxAge) {
        // 快取已過期
        console.warn('[SW] 快取已過期:', request.url);
      }
      return cachedResponse;
    }
    return new Response(JSON.stringify({ error: '網路連線失敗', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Stale While Revalidate：立即使用快取，同時在背景更新快取
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const networkFetch = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  return cachedResponse || await networkFetch || new Response('網路連線失敗', { status: 503 });
}
