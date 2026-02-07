/**
 * Sentry 錯誤監控服務 - 前端
 *
 * @module services/sentry
 * 工單 0370
 */

/**
 * Sentry 配置
 * 注意：實際使用時需要安裝 @sentry/react
 */

// 模擬 Sentry SDK（實際使用時替換為真實 SDK）
const MockSentry = {
  init: () => {},
  captureException: (error, context) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry Mock] Exception:', error, context);
    }
  },
  captureMessage: (message, level) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry Mock] ${level}:`, message);
    }
  },
  setUser: (user) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry Mock] User:', user);
    }
  },
  setContext: (name, context) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry Mock] Context ${name}:`, context);
    }
  },
  setTag: (key, value) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry Mock] Tag ${key}:`, value);
    }
  },
  addBreadcrumb: (breadcrumb) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry Mock] Breadcrumb:', breadcrumb);
    }
  },
};

// 使用真實 Sentry 或 Mock
let Sentry = MockSentry;

try {
  // 嘗試載入真實 Sentry SDK
  // const RealSentry = require('@sentry/react');
  // Sentry = RealSentry;
} catch (e) {
  // 使用 Mock
}

/**
 * 初始化 Sentry
 */
export function initSentry() {
  const dsn = process.env.REACT_APP_SENTRY_DSN;

  if (!dsn && process.env.NODE_ENV === 'production') {
    console.warn('[Sentry] DSN 未設置，錯誤監控未啟用');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.REACT_APP_VERSION || '1.0.0',

    // 效能監控取樣率
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 忽略某些錯誤
    ignoreErrors: [
      'ResizeObserver loop',
      'Non-Error exception captured',
      'Network Error',
    ],

    beforeSend(event, hint) {
      // 過濾敏感資料
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }
      return event;
    },
  });

  console.log('[Sentry] 初始化完成');
}

/**
 * 設置使用者資訊
 * @param {Object} user - 使用者資訊
 */
export function setUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    username: user.name,
    // 不包含敏感資訊
  });
}

/**
 * 設置遊戲 Context
 * @param {Object} gameState - 遊戲狀態
 */
export function setGameContext(gameState) {
  if (!gameState) return;

  Sentry.setContext('game', {
    roomId: gameState.roomId,
    phase: gameState.phase,
    round: gameState.round,
    playerCount: Object.keys(gameState.players || {}).length,
  });
}

/**
 * 捕捉錯誤
 * @param {Error} error - 錯誤物件
 * @param {Object} context - 額外 context
 */
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * 捕捉訊息
 * @param {string} message - 訊息
 * @param {string} level - 等級 (info, warning, error)
 */
export function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * 添加標籤
 * @param {string} key - 標籤鍵
 * @param {string} value - 標籤值
 */
export function setTag(key, value) {
  Sentry.setTag(key, value);
}

/**
 * 添加 Breadcrumb
 * @param {Object} breadcrumb - Breadcrumb 物件
 */
export function addBreadcrumb(breadcrumb) {
  Sentry.addBreadcrumb({
    timestamp: Date.now() / 1000,
    ...breadcrumb,
  });
}

/**
 * 遊戲動作 Breadcrumb
 * @param {string} action - 動作類型
 * @param {Object} data - 動作資料
 */
export function addGameActionBreadcrumb(action, data = {}) {
  addBreadcrumb({
    category: 'game.action',
    message: action,
    data,
    level: 'info',
  });
}

/**
 * 網路請求 Breadcrumb
 * @param {string} url - 請求 URL
 * @param {string} method - 請求方法
 * @param {number} status - 回應狀態
 */
export function addNetworkBreadcrumb(url, method, status) {
  addBreadcrumb({
    category: 'network',
    message: `${method} ${url}`,
    data: { status },
    level: status >= 400 ? 'error' : 'info',
  });
}

/**
 * Error Boundary 用的錯誤處理器
 * @param {Error} error - 錯誤
 * @param {Object} errorInfo - React 錯誤資訊
 */
export function handleComponentError(error, errorInfo) {
  captureError(error, {
    componentStack: errorInfo?.componentStack,
  });
}

export default {
  init: initSentry,
  setUser,
  setGameContext,
  captureError,
  captureMessage,
  setTag,
  addBreadcrumb,
  addGameActionBreadcrumb,
  addNetworkBreadcrumb,
  handleComponentError,
};
