/**
 * Service Worker 註冊模組
 *
 * Issue #7：在生產環境中註冊 Service Worker 以啟用快取策略
 */

/**
 * 是否為本機環境
 */
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4]\d|[01]?\d\d?)){3}$/)
);

/**
 * 註冊 Service Worker
 *
 * @param {Object} [config] - 設定選項
 * @param {Function} [config.onSuccess] - 首次安裝成功回呼
 * @param {Function} [config.onUpdate] - 更新可用回呼
 */
export function register(config = {}) {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

  window.addEventListener('load', () => {
    if (isLocalhost) {
      checkValidServiceWorker(swUrl, config);
    } else {
      registerValidSW(swUrl, config);
    }
  });
}

function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.onstatechange = () => {
          if (installing.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[SW] 新版本可用，重新整理後生效。');
              if (config.onUpdate) config.onUpdate(registration);
            } else {
              console.log('[SW] 內容已快取，可離線使用。');
              if (config.onSuccess) config.onSuccess(registration);
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] 註冊失敗:', error);
    });
}

function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Service Worker 不存在，重新載入頁面
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => window.location.reload());
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] 無網路連線，使用離線模式。');
    });
}

/**
 * 取消註冊 Service Worker
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error(error.message));
  }
}
