/**
 * Service Worker 註冊
 *
 * Issue #7：在生產環境註冊 Service Worker 以啟用快取策略。
 */

/**
 * 在生產環境中註冊 Service Worker
 */
export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
    registerValidSW(swUrl);
  });
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('[SW] 新內容可用，下次訪問時生效。');
            } else {
              console.log('[SW] 內容已快取，可離線使用。');
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('[SW] 註冊失敗:', error);
    });
}

/**
 * 取消 Service Worker 註冊
 */
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => registration.unregister())
      .catch((error) => console.error(error.message));
  }
}
