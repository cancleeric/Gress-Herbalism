/**
 * Service Worker - 靜態資源快取策略
 *
 * 快取策略：
 * - 靜態資源（JS/CSS/圖片）：Cache First（快取優先）
 * - API 請求：Network First（網路優先，快取作備用）
 * - 導航請求：Network First（回退到 index.html）
 *
 * @version 1.0.0
 */

const CACHE_NAME = 'nicholas-game-v1';
const STATIC_CACHE = 'nicholas-game-static-v1';
const API_CACHE = 'nicholas-game-api-v1';

// 預快取的核心靜態資源
const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// 安裝：預快取核心資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// 啟動：清除舊版快取
self.addEventListener('activate', (event) => {
  const validCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 攔截 fetch 請求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== 'GET') return;

  // 跳過 Chrome 擴充功能請求
  if (url.protocol === 'chrome-extension:') return;

  // 跳過 Socket.io 請求（保持即時性）
  if (url.pathname.startsWith('/socket.io')) return;

  // 跳過 Supabase API 請求（保持即時性）
  if (url.hostname.includes('supabase')) return;

  // 靜態資源：快取優先策略
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 導航請求：網路優先，失敗時回退到快取的 index.html
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // 其他請求：網路優先策略
  event.respondWith(networkFirst(request, API_CACHE));
});

/**
 * 判斷是否為靜態資源
 */
function isStaticAsset(url) {
  return (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|webp|svg|woff|woff2|ttf|eot|ico)$/)
  );
}

/**
 * 快取優先策略：先從快取讀取，快取未命中再發網路請求並更新快取
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response('靜態資源載入失敗', { status: 503 });
  }
}

/**
 * 網路優先策略：先發網路請求，成功時更新快取，失敗時回退到快取
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    return new Response('網路請求失敗', { status: 503 });
  }
}

/**
 * 導航請求：網路優先，失敗時回退到快取的 index.html（SPA 支援）
 */
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch {
    const cachedIndex = await caches.match('/index.html');
    if (cachedIndex) return cachedIndex;
    return new Response('應用程式離線', { status: 503 });
  }
}
