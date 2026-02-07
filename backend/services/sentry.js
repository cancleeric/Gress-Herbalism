/**
 * Sentry 錯誤監控服務 - 後端
 *
 * @module services/sentry
 * 工單 0370
 */

/**
 * 模擬 Sentry SDK（實際使用時替換為 @sentry/node）
 */
const MockSentry = {
  init: () => {},
  captureException: (error, context) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Sentry Mock] Exception:', error.message, context);
    }
  },
  captureMessage: (message, level) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Sentry Mock] ${level}:`, message);
    }
  },
  setUser: (user) => {},
  setContext: (name, context) => {},
  setTag: (key, value) => {},
  addBreadcrumb: (breadcrumb) => {},
  Handlers: {
    requestHandler: () => (req, res, next) => next(),
    errorHandler: () => (err, req, res, next) => next(err),
  },
};

// 使用真實 Sentry 或 Mock
let Sentry = MockSentry;

try {
  // 嘗試載入真實 Sentry SDK
  // const RealSentry = require('@sentry/node');
  // Sentry = RealSentry;
} catch (e) {
  // 使用 Mock
}

/**
 * 初始化 Sentry
 * @param {Object} app - Express app (可選)
 */
function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn && process.env.NODE_ENV === 'production') {
    console.warn('[Sentry] DSN 未設置，錯誤監控未啟用');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.APP_VERSION || '1.0.0',

    // 效能監控取樣率
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // 忽略某些錯誤
    ignoreErrors: [
      'ECONNRESET',
      'ETIMEDOUT',
    ],

    beforeSend(event, hint) {
      // 過濾敏感資料
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // 過濾請求 body 中的敏感資料
      if (event.request?.data) {
        const data = JSON.parse(event.request.data);
        delete data.password;
        delete data.token;
        event.request.data = JSON.stringify(data);
      }

      return event;
    },
  });

  // 如果有 Express app，添加中介軟體
  if (app) {
    app.use(Sentry.Handlers.requestHandler());
  }

  console.log('[Sentry] 後端初始化完成');
}

/**
 * Express 錯誤處理中介軟體
 */
function errorHandler() {
  return Sentry.Handlers.errorHandler();
}

/**
 * 捕捉錯誤
 * @param {Error} error - 錯誤物件
 * @param {Object} context - 額外 context
 */
function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * 捕捉訊息
 * @param {string} message - 訊息
 * @param {string} level - 等級
 */
function captureMessage(message, level = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * 設置使用者資訊
 * @param {Object} user - 使用者資訊
 */
function setUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    username: user.name,
  });
}

/**
 * 設置遊戲 Context
 * @param {Object} gameInfo - 遊戲資訊
 */
function setGameContext(gameInfo) {
  Sentry.setContext('game', gameInfo);
}

/**
 * 添加標籤
 * @param {string} key - 標籤鍵
 * @param {string} value - 標籤值
 */
function setTag(key, value) {
  Sentry.setTag(key, value);
}

/**
 * 添加 Breadcrumb
 * @param {Object} breadcrumb - Breadcrumb 物件
 */
function addBreadcrumb(breadcrumb) {
  Sentry.addBreadcrumb({
    timestamp: Date.now() / 1000,
    ...breadcrumb,
  });
}

/**
 * Socket.io 錯誤包裝器
 * @param {function} handler - Socket 事件處理器
 * @returns {function} 包裝後的處理器
 */
function wrapSocketHandler(handler) {
  return async (socket, ...args) => {
    try {
      await handler(socket, ...args);
    } catch (error) {
      captureException(error, {
        socketId: socket.id,
        userId: socket.userId,
        event: args[0],
      });
      throw error;
    }
  };
}

/**
 * 遊戲邏輯錯誤捕捉
 * @param {string} roomId - 房間 ID
 * @param {string} action - 動作類型
 * @param {Error} error - 錯誤
 */
function captureGameError(roomId, action, error) {
  captureException(error, {
    roomId,
    action,
    category: 'game_logic',
  });
}

module.exports = {
  init: initSentry,
  errorHandler,
  captureException,
  captureMessage,
  setUser,
  setGameContext,
  setTag,
  addBreadcrumb,
  wrapSocketHandler,
  captureGameError,
};
