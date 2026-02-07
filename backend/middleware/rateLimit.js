/**
 * 速率限制中介軟體
 *
 * @module middleware/rateLimit
 * 工單 0373
 */

/**
 * 簡易記憶體速率限制器
 */
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 分鐘
    this.maxRequests = options.maxRequests || 100;
    this.message = options.message || '請求過於頻繁，請稍後再試';
    this.keyGenerator = options.keyGenerator || ((req) => req.ip);
    this.skip = options.skip || (() => false);
    this.onLimitReached = options.onLimitReached || (() => {});

    this.clients = new Map();

    // 定期清理
    setInterval(() => this.cleanup(), this.windowMs);
  }

  /**
   * 取得客戶端記錄
   */
  getClientRecord(key) {
    if (!this.clients.has(key)) {
      this.clients.set(key, {
        count: 0,
        resetTime: Date.now() + this.windowMs,
      });
    }

    const record = this.clients.get(key);

    // 檢查是否需要重置
    if (Date.now() > record.resetTime) {
      record.count = 0;
      record.resetTime = Date.now() + this.windowMs;
    }

    return record;
  }

  /**
   * 檢查是否超過限制
   */
  isLimited(key) {
    const record = this.getClientRecord(key);
    return record.count >= this.maxRequests;
  }

  /**
   * 記錄請求
   */
  recordRequest(key) {
    const record = this.getClientRecord(key);
    record.count++;
    return record;
  }

  /**
   * 取得剩餘請求數
   */
  getRemaining(key) {
    const record = this.getClientRecord(key);
    return Math.max(0, this.maxRequests - record.count);
  }

  /**
   * 取得重置時間
   */
  getResetTime(key) {
    const record = this.getClientRecord(key);
    return record.resetTime;
  }

  /**
   * 清理過期記錄
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.clients.entries()) {
      if (now > record.resetTime + this.windowMs) {
        this.clients.delete(key);
      }
    }
  }

  /**
   * Express 中介軟體
   */
  middleware() {
    return (req, res, next) => {
      // 跳過某些請求
      if (this.skip(req)) {
        return next();
      }

      const key = this.keyGenerator(req);

      if (this.isLimited(key)) {
        this.onLimitReached(req, res);

        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(this.getResetTime(key) / 1000));
        res.setHeader('Retry-After', Math.ceil((this.getResetTime(key) - Date.now()) / 1000));

        return res.status(429).json({ error: this.message });
      }

      this.recordRequest(key);

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.getRemaining(key));
      res.setHeader('X-RateLimit-Reset', Math.ceil(this.getResetTime(key) / 1000));

      next();
    };
  }
}

/**
 * Socket 動作速率限制器
 */
class SocketRateLimiter {
  constructor(options = {}) {
    this.limits = new Map();
    this.defaultLimit = options.defaultLimit || { windowMs: 1000, maxActions: 10 };
    this.clients = new Map();
  }

  /**
   * 設定特定事件的限制
   */
  setEventLimit(eventName, limit) {
    this.limits.set(eventName, limit);
  }

  /**
   * 取得事件限制
   */
  getEventLimit(eventName) {
    return this.limits.get(eventName) || this.defaultLimit;
  }

  /**
   * 檢查是否超過限制
   */
  isLimited(socketId, eventName) {
    const limit = this.getEventLimit(eventName);
    const key = `${socketId}:${eventName}`;

    if (!this.clients.has(key)) {
      this.clients.set(key, {
        count: 0,
        resetTime: Date.now() + limit.windowMs,
      });
    }

    const record = this.clients.get(key);

    // 檢查是否需要重置
    if (Date.now() > record.resetTime) {
      record.count = 0;
      record.resetTime = Date.now() + limit.windowMs;
    }

    if (record.count >= limit.maxActions) {
      return true;
    }

    record.count++;
    return false;
  }

  /**
   * 包裝 Socket 事件處理器
   */
  wrap(eventName, handler) {
    return (socket, ...args) => {
      if (this.isLimited(socket.id, eventName)) {
        socket.emit('error', { message: '操作過於頻繁，請稍後再試' });
        return;
      }
      handler(socket, ...args);
    };
  }

  /**
   * 清理斷線的 Socket
   */
  cleanup(socketId) {
    for (const key of this.clients.keys()) {
      if (key.startsWith(`${socketId}:`)) {
        this.clients.delete(key);
      }
    }
  }
}

/**
 * 建立通用速率限制器
 */
function createRateLimiter(options) {
  return new RateLimiter(options);
}

/**
 * 預設配置
 */
const defaultLimiters = {
  // API 請求限制
  api: new RateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    message: 'API 請求過於頻繁',
  }),

  // 登入嘗試限制
  login: new RateLimiter({
    windowMs: 300000, // 5 分鐘
    maxRequests: 5,
    message: '登入嘗試過多，請稍後再試',
  }),

  // 遊戲動作限制
  gameAction: new RateLimiter({
    windowMs: 1000,
    maxRequests: 20,
    message: '操作過於頻繁',
  }),
};

module.exports = {
  RateLimiter,
  SocketRateLimiter,
  createRateLimiter,
  defaultLimiters,
};
