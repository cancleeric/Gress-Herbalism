/**
 * Service Worker 註冊模組
 *
 * Issue #7 - 效能優化：Service Worker 快取策略優化
 *
 * @module serviceWorkerRegistration
 */

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

/**
 * 註冊 Service Worker
 *
 * @param {Object} config - 設定選項
 * @param {Function} [config.onSuccess] - 成功回調
 * @param {Function} [config.onUpdate] - 更新回調
 */
export function register(config = {}) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);

    // Service Worker 只適用於同源，不適用於 CDN
    if (publicUrl.origin !== window.location.origin) return;

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log('[SW] Service Worker 已就緒（localhost）');
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * 實際執行 Service Worker 註冊
 */
function registerValidSW(swUrl, config) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // 新版本已可用
              console.log('[SW] 新版本的 Service Worker 已可用，下次重整後生效');
              if (config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // 首次安裝
              console.log('[SW] 靜態資源已快取供離線使用');
              if (config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] Service Worker 註冊失敗:', error);
    });
}

/**
 * 驗證 Service Worker 檔案是否有效（開發環境用）
 */
function checkValidServiceWorker(swUrl, config) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // Service Worker 不存在，重新整理頁面
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('[SW] 無法連線，應用程式以離線模式運行');
    });
}

/**
 * 取消 Service Worker 註冊
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error('[SW] 取消 Service Worker 失敗:', error.message);
      });
  }
}
