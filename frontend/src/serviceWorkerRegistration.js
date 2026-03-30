/**
 * Service Worker 註冊模組
 *
 * 在生產環境中啟用 Service Worker 快取策略，
 * 提升靜態資源載入速度與離線支援。
 *
 * @module serviceWorkerRegistration
 */

/**
 * 註冊 Service Worker
 */
export function register() {
  if (process.env.NODE_ENV !== 'production') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

    navigator.serviceWorker
      .register(swUrl)
      .then((registration) => {
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // 新版本可用，通知使用者
                console.log('[SW] 新版本已準備好，重新整理頁面以更新。');
              } else {
                // 首次快取完成
                console.log('[SW] 已快取核心資源，支援離線使用。');
              }
            }
          };
        };
      })
      .catch((error) => {
        console.error('[SW] 註冊失敗:', error);
      });
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
