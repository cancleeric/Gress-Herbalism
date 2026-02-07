/**
 * 請求日誌中介軟體
 *
 * @module middleware/requestLogger
 * 工單 0371
 */

const { v4: uuidv4 } = require('uuid') || { v4: () => `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
const { logger } = require('../utils/logger');

/**
 * 生成請求 ID
 */
function generateRequestId() {
  // 如果沒有 uuid 模組，使用簡單的隨機 ID
  try {
    return uuidv4();
  } catch {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 請求日誌中介軟體
 */
function requestLogger(options = {}) {
  const {
    skip = () => false,
    logBody = false,
    logHeaders = false,
    sensitiveFields = ['password', 'token', 'authorization'],
  } = options;

  return (req, res, next) => {
    // 跳過某些請求
    if (skip(req)) {
      return next();
    }

    // 生成請求 ID
    const requestId = req.headers['x-request-id'] || generateRequestId();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    // 設置 logger 的請求 ID
    logger.setRequestId(requestId);

    // 記錄開始時間
    const startTime = process.hrtime.bigint();

    // 記錄請求
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent'],
    };

    // 可選記錄 headers
    if (logHeaders) {
      logData.headers = sanitizeObject(req.headers, sensitiveFields);
    }

    // 可選記錄 body
    if (logBody && req.body) {
      logData.body = sanitizeObject(req.body, sensitiveFields);
    }

    logger.http(`--> ${req.method} ${req.originalUrl}`, logData);

    // 攔截回應
    const originalSend = res.send;
    res.send = function (body) {
      res.body = body;
      return originalSend.call(this, body);
    };

    // 完成時記錄
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // 轉為毫秒

      const responseLog = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration.toFixed(2)}ms`,
        contentLength: res.get('Content-Length') || 0,
      };

      const level = res.statusCode >= 500 ? 'error' :
                    res.statusCode >= 400 ? 'warn' : 'http';

      logger[level](`<-- ${req.method} ${req.originalUrl} ${res.statusCode}`, responseLog);

      // 清除請求 ID
      logger.clearRequestId();
    });

    next();
  };
}

/**
 * 過濾敏感欄位
 */
function sanitizeObject(obj, sensitiveFields) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = { ...obj };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Socket.io 事件日誌
 */
function socketLogger(socket, eventName, data) {
  const logData = {
    socketId: socket.id,
    userId: socket.userId,
    event: eventName,
    data: typeof data === 'object' ? sanitizeObject(data, ['password', 'token']) : data,
  };

  logger.http(`[Socket] ${eventName}`, logData);
}

/**
 * Socket.io 連線日誌
 */
function socketConnectionLogger(io) {
  io.on('connection', (socket) => {
    logger.info(`[Socket] 連線`, {
      socketId: socket.id,
      address: socket.handshake.address,
      transport: socket.conn.transport.name,
    });

    socket.on('disconnect', (reason) => {
      logger.info(`[Socket] 斷線`, {
        socketId: socket.id,
        reason,
      });
    });

    socket.on('error', (error) => {
      logger.error(`[Socket] 錯誤`, {
        socketId: socket.id,
        error: error.message,
      });
    });
  });
}

/**
 * 錯誤日誌中介軟體
 */
function errorLogger(err, req, res, next) {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
    error: err.message,
    stack: err.stack,
  };

  logger.error(`請求錯誤: ${err.message}`, logData);

  next(err);
}

module.exports = {
  requestLogger,
  socketLogger,
  socketConnectionLogger,
  errorLogger,
  sanitizeObject,
  generateRequestId,
};
