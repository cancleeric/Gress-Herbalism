/**
 * Logger 測試
 *
 * @file utils/logger.test.js
 * 工單 0371
 */

const fs = require('fs');
const path = require('path');
const { Logger, GameEventLogger, LOG_LEVELS } = require('./logger');

// 測試用臨時目錄
const TEST_LOG_DIR = './test-logs';
const TEST_LOG_FILE = path.join(TEST_LOG_DIR, 'test.log');

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger({ level: 'debug', format: 'json' });
  });

  describe('日誌等級', () => {
    it('應該定義正確的日誌等級', () => {
      expect(LOG_LEVELS.error).toBe(0);
      expect(LOG_LEVELS.warn).toBe(1);
      expect(LOG_LEVELS.info).toBe(2);
      expect(LOG_LEVELS.http).toBe(3);
      expect(LOG_LEVELS.debug).toBe(4);
    });

    it('應該根據等級過濾日誌', () => {
      const infoLogger = new Logger({ level: 'info' });

      expect(infoLogger.shouldLog('error')).toBe(true);
      expect(infoLogger.shouldLog('info')).toBe(true);
      expect(infoLogger.shouldLog('debug')).toBe(false);
    });
  });

  describe('格式化', () => {
    it('JSON 格式應該正確', () => {
      const formatted = logger.formatMessage('info', 'test message', { key: 'value' });
      const parsed = JSON.parse(formatted);

      expect(parsed.level).toBe('info');
      expect(parsed.message).toBe('test message');
      expect(parsed.key).toBe('value');
      expect(parsed.timestamp).toBeDefined();
    });

    it('應該包含請求 ID', () => {
      logger.setRequestId('req-123');
      const formatted = logger.formatMessage('info', 'test');
      const parsed = JSON.parse(formatted);

      expect(parsed.requestId).toBe('req-123');
    });

    it('應該包含 context', () => {
      logger.setContext({ service: 'evolution' });
      const formatted = logger.formatMessage('info', 'test');
      const parsed = JSON.parse(formatted);

      expect(parsed.service).toBe('evolution');
    });

    it('文字格式應該可讀', () => {
      const textLogger = new Logger({ level: 'debug', format: 'text' });
      const formatted = textLogger.formatMessage('info', 'test message');

      expect(formatted).toContain('[INFO]');
      expect(formatted).toContain('test message');
    });
  });

  describe('Context', () => {
    it('應該能設置 context', () => {
      logger.setContext({ roomId: 'room-1' });
      expect(logger.context.roomId).toBe('room-1');
    });

    it('應該能合併 context', () => {
      logger.setContext({ a: 1 });
      logger.setContext({ b: 2 });

      expect(logger.context.a).toBe(1);
      expect(logger.context.b).toBe(2);
    });
  });

  describe('子 Logger', () => {
    it('應該建立帶額外 context 的子 logger', () => {
      logger.setContext({ service: 'main' });
      const child = logger.child({ component: 'game' });

      expect(child.context.service).toBe('main');
      expect(child.context.component).toBe('game');
    });

    it('子 logger 不應影響父 logger', () => {
      const child = logger.child({ extra: true });

      expect(logger.context.extra).toBeUndefined();
      expect(child.context.extra).toBe(true);
    });
  });

  describe('日誌方法', () => {
    it('應該有 error 方法', () => {
      expect(() => logger.error('error message')).not.toThrow();
    });

    it('應該有 warn 方法', () => {
      expect(() => logger.warn('warn message')).not.toThrow();
    });

    it('應該有 info 方法', () => {
      expect(() => logger.info('info message')).not.toThrow();
    });

    it('應該有 http 方法', () => {
      expect(() => logger.http('http message')).not.toThrow();
    });

    it('應該有 debug 方法', () => {
      expect(() => logger.debug('debug message')).not.toThrow();
    });
  });
});

describe('GameEventLogger', () => {
  let gameLogger;

  beforeEach(() => {
    gameLogger = new GameEventLogger({ level: 'debug', format: 'json' });
  });

  it('應該有遊戲事件 context', () => {
    expect(gameLogger.context.type).toBe('game_event');
  });

  it('應該記錄遊戲動作', () => {
    expect(() => {
      gameLogger.action('room-1', 'player-1', 'playCard', 'success');
    }).not.toThrow();
  });

  it('應該記錄階段轉換', () => {
    expect(() => {
      gameLogger.phaseChange('room-1', 'evolution', 'feeding');
    }).not.toThrow();
  });

  it('應該記錄遊戲開始', () => {
    expect(() => {
      gameLogger.gameStart('room-1', [{ id: 'p1' }, { id: 'p2' }]);
    }).not.toThrow();
  });

  it('應該記錄遊戲結束', () => {
    expect(() => {
      gameLogger.gameEnd('room-1', { p1: 10, p2: 8 }, { id: 'p1' });
    }).not.toThrow();
  });

  it('應該記錄遊戲錯誤', () => {
    expect(() => {
      gameLogger.gameError('room-1', new Error('test error'), {});
    }).not.toThrow();
  });
});

describe('檔案日誌', () => {
  afterAll(() => {
    // 清理測試目錄
    if (fs.existsSync(TEST_LOG_DIR)) {
      fs.rmSync(TEST_LOG_DIR, { recursive: true });
    }
  });

  it('應該寫入檔案', () => {
    const fileLogger = new Logger({
      level: 'info',
      format: 'json',
      filename: TEST_LOG_FILE,
    });

    fileLogger.info('test log entry');

    expect(fs.existsSync(TEST_LOG_FILE)).toBe(true);
    const content = fs.readFileSync(TEST_LOG_FILE, 'utf8');
    expect(content).toContain('test log entry');
  });
});
