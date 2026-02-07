/**
 * 結構化日誌系統
 *
 * @module utils/logger
 * 工單 0371
 */

const fs = require('fs');
const path = require('path');

/**
 * 日誌等級
 */
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

/**
 * 日誌等級顏色（console 用）
 */
const LEVEL_COLORS = {
  error: '\x1b[31m', // 紅
  warn: '\x1b[33m',  // 黃
  info: '\x1b[36m',  // 青
  http: '\x1b[35m',  // 紫
  debug: '\x1b[37m', // 白
};

const RESET_COLOR = '\x1b[0m';

/**
 * Logger 類別
 */
class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'info';
    this.format = options.format || 'json';
    this.filename = options.filename || null;
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.context = {};
    this.requestId = null;

    // 確保日誌目錄存在
    if (this.filename) {
      const dir = path.dirname(this.filename);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * 設置全域 Context
   */
  setContext(context) {
    this.context = { ...this.context, ...context };
  }

  /**
   * 設置請求追蹤 ID
   */
  setRequestId(requestId) {
    this.requestId = requestId;
  }

  /**
   * 清除請求 ID
   */
  clearRequestId() {
    this.requestId = null;
  }

  /**
   * 檢查是否應該記錄此等級
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= LOG_LEVELS[this.level];
  }

  /**
   * 格式化日誌訊息
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      message,
      ...this.context,
      ...meta,
    };

    if (this.requestId) {
      entry.requestId = this.requestId;
    }

    if (this.format === 'json') {
      return JSON.stringify(entry);
    }

    // 人類可讀格式
    const parts = [
      `[${timestamp}]`,
      `[${level.toUpperCase()}]`,
    ];

    if (this.requestId) {
      parts.push(`[${this.requestId.slice(0, 8)}]`);
    }

    parts.push(message);

    if (Object.keys(meta).length > 0) {
      parts.push(JSON.stringify(meta));
    }

    return parts.join(' ');
  }

  /**
   * 寫入日誌
   */
  write(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, meta);

    // Console 輸出（帶顏色）
    if (process.env.NODE_ENV !== 'test') {
      const color = LEVEL_COLORS[level] || '';
      console.log(`${color}${formatted}${RESET_COLOR}`);
    }

    // 檔案輸出
    if (this.filename) {
      this.writeToFile(formatted);
    }
  }

  /**
   * 寫入檔案（含輪替）
   */
  writeToFile(content) {
    try {
      // 檢查檔案大小
      if (fs.existsSync(this.filename)) {
        const stats = fs.statSync(this.filename);
        if (stats.size >= this.maxSize) {
          this.rotateFiles();
        }
      }

      fs.appendFileSync(this.filename, content + '\n');
    } catch (error) {
      console.error('寫入日誌檔案失敗:', error.message);
    }
  }

  /**
   * 日誌輪替
   */
  rotateFiles() {
    try {
      // 刪除最舊的檔案
      const oldestFile = `${this.filename}.${this.maxFiles}`;
      if (fs.existsSync(oldestFile)) {
        fs.unlinkSync(oldestFile);
      }

      // 重新命名現有檔案
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldPath = `${this.filename}.${i}`;
        const newPath = `${this.filename}.${i + 1}`;
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }

      // 將當前檔案重命名
      if (fs.existsSync(this.filename)) {
        fs.renameSync(this.filename, `${this.filename}.1`);
      }
    } catch (error) {
      console.error('日誌輪替失敗:', error.message);
    }
  }

  // 日誌方法
  error(message, meta) {
    this.write('error', message, meta);
  }

  warn(message, meta) {
    this.write('warn', message, meta);
  }

  info(message, meta) {
    this.write('info', message, meta);
  }

  http(message, meta) {
    this.write('http', message, meta);
  }

  debug(message, meta) {
    this.write('debug', message, meta);
  }

  /**
   * 建立子 Logger（帶額外 context）
   */
  child(context) {
    const childLogger = new Logger({
      level: this.level,
      format: this.format,
      filename: this.filename,
      maxSize: this.maxSize,
      maxFiles: this.maxFiles,
    });
    childLogger.setContext({ ...this.context, ...context });
    childLogger.requestId = this.requestId;
    return childLogger;
  }
}

/**
 * 遊戲事件 Logger
 */
class GameEventLogger extends Logger {
  constructor(options = {}) {
    super({
      ...options,
      filename: options.filename || './logs/game-events.log',
    });
    this.setContext({ type: 'game_event' });
  }

  /**
   * 記錄遊戲動作
   */
  action(roomId, playerId, action, result) {
    this.info(`Game action: ${action}`, {
      roomId,
      playerId,
      action,
      result,
      category: 'action',
    });
  }

  /**
   * 記錄階段轉換
   */
  phaseChange(roomId, fromPhase, toPhase) {
    this.info(`Phase change: ${fromPhase} -> ${toPhase}`, {
      roomId,
      fromPhase,
      toPhase,
      category: 'phase',
    });
  }

  /**
   * 記錄遊戲開始
   */
  gameStart(roomId, players) {
    this.info(`Game started`, {
      roomId,
      playerCount: players.length,
      players: players.map(p => p.id),
      category: 'lifecycle',
    });
  }

  /**
   * 記錄遊戲結束
   */
  gameEnd(roomId, scores, winner) {
    this.info(`Game ended`, {
      roomId,
      scores,
      winnerId: winner?.id,
      category: 'lifecycle',
    });
  }

  /**
   * 記錄錯誤
   */
  gameError(roomId, error, context) {
    this.error(`Game error: ${error.message}`, {
      roomId,
      error: error.message,
      stack: error.stack,
      ...context,
      category: 'error',
    });
  }
}

// 建立預設實例
const defaultLogger = new Logger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? 'json' : 'text',
  filename: process.env.LOG_FILE || null,
});

const gameEventLogger = new GameEventLogger();

module.exports = {
  Logger,
  GameEventLogger,
  logger: defaultLogger,
  gameLogger: gameEventLogger,
  LOG_LEVELS,
};
