/**
 * 安全性中介軟體
 *
 * @module middleware/security
 * 工單 0373
 */

/**
 * 安全性 Headers
 */
function securityHeaders() {
  return (req, res, next) => {
    // 防止點擊劫持
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    // 防止 MIME 類型嗅探
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // XSS 保護
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // 嚴格傳輸安全
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Content Security Policy
    res.setHeader('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' ws: wss:",
      "frame-ancestors 'self'",
    ].join('; '));

    // 推薦政策
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 權限政策
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    next();
  };
}

/**
 * CORS 配置
 */
function corsMiddleware(options = {}) {
  const allowedOrigins = options.allowedOrigins || [
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  return (req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

/**
 * Socket 訊息驗證器
 */
class SocketMessageValidator {
  constructor(schemas = {}) {
    this.schemas = schemas;
  }

  /**
   * 添加驗證 schema
   */
  addSchema(eventName, schema) {
    this.schemas[eventName] = schema;
  }

  /**
   * 驗證訊息
   */
  validate(eventName, data) {
    const schema = this.schemas[eventName];
    if (!schema) return { valid: true };

    const errors = [];

    // 必填欄位
    if (schema.required) {
      for (const field of schema.required) {
        if (data[field] === undefined || data[field] === null) {
          errors.push(`缺少必填欄位: ${field}`);
        }
      }
    }

    // 類型檢查
    if (schema.properties) {
      for (const [field, config] of Object.entries(schema.properties)) {
        if (data[field] !== undefined) {
          const value = data[field];
          const expectedType = config.type;

          if (expectedType === 'string' && typeof value !== 'string') {
            errors.push(`${field} 必須是字串`);
          } else if (expectedType === 'number' && typeof value !== 'number') {
            errors.push(`${field} 必須是數字`);
          } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
            errors.push(`${field} 必須是布林值`);
          } else if (expectedType === 'array' && !Array.isArray(value)) {
            errors.push(`${field} 必須是陣列`);
          } else if (expectedType === 'object' && typeof value !== 'object') {
            errors.push(`${field} 必須是物件`);
          }

          // 字串長度限制
          if (config.maxLength && typeof value === 'string' && value.length > config.maxLength) {
            errors.push(`${field} 超過最大長度 ${config.maxLength}`);
          }

          // 數字範圍
          if (config.minimum !== undefined && value < config.minimum) {
            errors.push(`${field} 不能小於 ${config.minimum}`);
          }
          if (config.maximum !== undefined && value > config.maximum) {
            errors.push(`${field} 不能大於 ${config.maximum}`);
          }

          // 枚舉值
          if (config.enum && !config.enum.includes(value)) {
            errors.push(`${field} 必須是以下值之一: ${config.enum.join(', ')}`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 建立驗證中介軟體
   */
  middleware(eventName) {
    return (socket, data, next) => {
      const result = this.validate(eventName, data);
      if (!result.valid) {
        return next(new Error(`驗證失敗: ${result.errors.join(', ')}`));
      }
      next();
    };
  }
}

/**
 * 動作防重複
 */
class ActionDeduplicator {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 1000; // 1 秒內不允許重複
    this.actions = new Map();
  }

  /**
   * 檢查是否為重複動作
   */
  isDuplicate(userId, action) {
    const key = `${userId}:${JSON.stringify(action)}`;
    const now = Date.now();

    if (this.actions.has(key)) {
      const lastTime = this.actions.get(key);
      if (now - lastTime < this.windowMs) {
        return true;
      }
    }

    this.actions.set(key, now);

    // 清理過期記錄
    this.cleanup();

    return false;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, time] of this.actions.entries()) {
      if (now - time > this.windowMs * 2) {
        this.actions.delete(key);
      }
    }
  }
}

/**
 * 敏感資料過濾
 */
function sanitizeData(data, sensitiveFields = ['password', 'token', 'secret', 'key']) {
  if (!data || typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeData(sanitized[key], sensitiveFields);
    }
  }

  return sanitized;
}

/**
 * HTML 編碼（防 XSS）
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return text;

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, char => map[char]);
}

/**
 * 驗證使用者輸入
 */
function validateInput(input, options = {}) {
  const {
    maxLength = 1000,
    allowHtml = false,
    allowedChars = null,
  } = options;

  if (typeof input !== 'string') {
    return { valid: false, error: '輸入必須是字串' };
  }

  if (input.length > maxLength) {
    return { valid: false, error: `輸入超過最大長度 ${maxLength}` };
  }

  if (!allowHtml && /<[^>]*>/.test(input)) {
    return { valid: false, error: '輸入不能包含 HTML 標籤' };
  }

  if (allowedChars && !new RegExp(`^[${allowedChars}]*$`).test(input)) {
    return { valid: false, error: '輸入包含不允許的字元' };
  }

  return { valid: true };
}

module.exports = {
  securityHeaders,
  corsMiddleware,
  SocketMessageValidator,
  ActionDeduplicator,
  sanitizeData,
  escapeHtml,
  validateInput,
};
