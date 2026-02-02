/**
 * reconnectionHandler 測試
 */

import {
  ReconnectionHandler,
  createReconnectionHandler,
  RECONNECT_CONFIG,
  RECONNECT_STATUS,
} from '../reconnectionHandler';

describe('ReconnectionHandler', () => {
  let handler;
  let mockSocket;

  beforeEach(() => {
    jest.useFakeTimers();

    mockSocket = {
      connected: true,
      on: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
    };

    handler = new ReconnectionHandler(mockSocket);
  });

  afterEach(() => {
    handler.destroy();
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      const h = new ReconnectionHandler();
      expect(h.config.maxRetries).toBe(RECONNECT_CONFIG.maxRetries);
      expect(h.config.initialDelay).toBe(RECONNECT_CONFIG.initialDelay);
      expect(h.status).toBe(RECONNECT_STATUS.CONNECTED);
    });

    it('should accept custom config', () => {
      const h = new ReconnectionHandler(null, { maxRetries: 10 });
      expect(h.config.maxRetries).toBe(10);
    });
  });

  describe('setSocket', () => {
    it('should set socket and setup listeners', () => {
      const h = new ReconnectionHandler();
      h.setSocket(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('evo:reconnected', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('evo:reconnectFailed', expect.any(Function));
    });
  });

  describe('setGameInfo', () => {
    it('should set room and player info', () => {
      handler.setGameInfo('room-1', 'player-1');

      expect(handler.roomId).toBe('room-1');
      expect(handler.playerId).toBe('player-1');
    });
  });

  describe('handleDisconnect', () => {
    it('should update status and emit disconnect event', () => {
      const disconnectListener = jest.fn();
      const reconnectingListener = jest.fn();
      handler.on('disconnect', disconnectListener);
      handler.on('reconnecting', reconnectingListener);

      handler.handleDisconnect('transport close');

      // 斷線後會自動開始重連，所以狀態會變成 reconnecting
      expect(handler.status).toBe(RECONNECT_STATUS.RECONNECTING);
      expect(handler.disconnectedAt).not.toBeNull();
      expect(disconnectListener).toHaveBeenCalledWith({ reason: 'transport close' });
      expect(reconnectingListener).toHaveBeenCalled();
    });

    it('should not start reconnect for intentional disconnect', () => {
      const reconnectingListener = jest.fn();
      handler.on('reconnecting', reconnectingListener);

      handler.handleDisconnect('io client disconnect');

      expect(reconnectingListener).not.toHaveBeenCalled();
    });

    it('should start reconnect for unintentional disconnect', () => {
      const reconnectingListener = jest.fn();
      handler.on('reconnecting', reconnectingListener);

      handler.handleDisconnect('transport close');

      expect(reconnectingListener).toHaveBeenCalledWith({ attempt: 1 });
    });
  });

  describe('handleConnect', () => {
    it('should update status when connected normally', () => {
      handler.status = RECONNECT_STATUS.DISCONNECTED;
      const connectListener = jest.fn();
      handler.on('connect', connectListener);

      handler.handleConnect();

      expect(handler.status).toBe(RECONNECT_STATUS.CONNECTED);
      expect(connectListener).toHaveBeenCalled();
    });

    it('should attempt game reconnect when reconnecting', () => {
      handler.status = RECONNECT_STATUS.RECONNECTING;
      handler.setGameInfo('room-1', 'player-1');

      handler.handleConnect();

      expect(mockSocket.emit).toHaveBeenCalledWith('evo:reconnect', {
        roomId: 'room-1',
        playerId: 'player-1',
      });
    });
  });

  describe('startReconnect', () => {
    it('should not start if already reconnecting', () => {
      handler.status = RECONNECT_STATUS.RECONNECTING;
      const listener = jest.fn();
      handler.on('reconnecting', listener);

      handler.startReconnect();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should emit reconnecting event', () => {
      handler.status = RECONNECT_STATUS.DISCONNECTED;
      const listener = jest.fn();
      handler.on('reconnecting', listener);

      handler.startReconnect();

      expect(listener).toHaveBeenCalledWith({ attempt: 1 });
      expect(handler.status).toBe(RECONNECT_STATUS.RECONNECTING);
    });
  });

  describe('scheduleRetry', () => {
    it('should fail after max retries', () => {
      handler.retryCount = RECONNECT_CONFIG.maxRetries;
      const failedListener = jest.fn();
      handler.on('reconnectFailed', failedListener);

      handler.scheduleRetry();

      expect(failedListener).toHaveBeenCalledWith({ reason: 'Max retries reached' });
    });

    it('should use exponential backoff', () => {
      handler.status = RECONNECT_STATUS.RECONNECTING;
      mockSocket.connected = false;

      const retryingListener = jest.fn();
      handler.on('retrying', retryingListener);

      // 第一次重試
      handler.scheduleRetry();
      jest.advanceTimersByTime(RECONNECT_CONFIG.initialDelay);
      expect(retryingListener).toHaveBeenCalledWith(expect.objectContaining({
        attempt: 1,
        delay: RECONNECT_CONFIG.initialDelay,
      }));

      // 第二次重試
      handler.scheduleRetry();
      jest.advanceTimersByTime(RECONNECT_CONFIG.initialDelay * RECONNECT_CONFIG.backoffMultiplier);
      expect(retryingListener).toHaveBeenCalledWith(expect.objectContaining({
        attempt: 2,
      }));
    });

    it('should respect maxDelay', () => {
      handler.retryCount = 10; // 高重試次數
      handler.config.maxRetries = 20;
      handler.status = RECONNECT_STATUS.RECONNECTING;

      const retryingListener = jest.fn();
      handler.on('retrying', retryingListener);

      handler.scheduleRetry();
      jest.advanceTimersByTime(RECONNECT_CONFIG.maxDelay + 1000);

      expect(retryingListener).toHaveBeenCalledWith(expect.objectContaining({
        delay: RECONNECT_CONFIG.maxDelay,
      }));
    });
  });

  describe('handleReconnectSuccess', () => {
    it('should update status and emit event', () => {
      handler.status = RECONNECT_STATUS.RECONNECTING;
      handler.disconnectedAt = Date.now() - 5000;
      handler.retryCount = 3;

      const reconnectedListener = jest.fn();
      handler.on('reconnected', reconnectedListener);

      handler.handleReconnectSuccess({ gameState: {} });

      expect(handler.status).toBe(RECONNECT_STATUS.CONNECTED);
      expect(handler.retryCount).toBe(0);
      expect(handler.disconnectedAt).toBeNull();
      expect(reconnectedListener).toHaveBeenCalledWith(expect.objectContaining({
        gameState: {},
        disconnectedDuration: expect.any(Number),
      }));
    });
  });

  describe('handleReconnectFailed', () => {
    it('should update status and emit event', () => {
      handler.status = RECONNECT_STATUS.RECONNECTING;

      const failedListener = jest.fn();
      handler.on('reconnectFailed', failedListener);

      handler.handleReconnectFailed({ reason: 'Game ended' });

      expect(handler.status).toBe(RECONNECT_STATUS.FAILED);
      expect(failedListener).toHaveBeenCalledWith({ reason: 'Game ended' });
    });
  });

  describe('manualReconnect', () => {
    it('should return false if already connected', () => {
      handler.status = RECONNECT_STATUS.CONNECTED;
      const result = handler.manualReconnect();
      expect(result).toBe(false);
    });

    it('should start reconnect if disconnected', () => {
      handler.status = RECONNECT_STATUS.DISCONNECTED;
      mockSocket.connected = false;

      const result = handler.manualReconnect();

      expect(result).toBe(true);
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should attempt game reconnect if socket connected', () => {
      handler.status = RECONNECT_STATUS.DISCONNECTED;
      handler.setGameInfo('room-1', 'player-1');
      mockSocket.connected = true;

      handler.manualReconnect();

      expect(mockSocket.emit).toHaveBeenCalledWith('evo:reconnect', {
        roomId: 'room-1',
        playerId: 'player-1',
      });
    });
  });

  describe('getStatus', () => {
    it('should return current status', () => {
      handler.status = RECONNECT_STATUS.RECONNECTING;
      handler.retryCount = 2;
      handler.disconnectedAt = Date.now() - 10000;

      const status = handler.getStatus();

      expect(status.status).toBe(RECONNECT_STATUS.RECONNECTING);
      expect(status.retryCount).toBe(2);
      expect(status.maxRetries).toBe(RECONNECT_CONFIG.maxRetries);
      expect(status.remainingTime).toBeLessThanOrEqual(RECONNECT_CONFIG.timeout - 10000);
    });

    it('should return null remainingTime if not disconnected', () => {
      handler.disconnectedAt = null;
      const status = handler.getStatus();
      expect(status.remainingTime).toBeNull();
    });
  });

  describe('on / off / emit', () => {
    it('should subscribe and emit events', () => {
      const listener = jest.fn();
      handler.on('test', listener);

      handler.emit('test', { data: 123 });

      expect(listener).toHaveBeenCalledWith({ data: 123 });
    });

    it('should unsubscribe events', () => {
      const listener = jest.fn();
      handler.on('test', listener);
      handler.off('test', listener);

      handler.emit('test', {});

      expect(listener).not.toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsubscribe = handler.on('test', listener);

      unsubscribe();
      handler.emit('test', {});

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors', () => {
      const errorListener = jest.fn(() => {
        throw new Error('Test error');
      });
      const normalListener = jest.fn();

      handler.on('test', errorListener);
      handler.on('test', normalListener);

      expect(() => handler.emit('test', {})).not.toThrow();
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      handler.status = RECONNECT_STATUS.RECONNECTING;
      handler.retryCount = 3;
      handler.roomId = 'room-1';
      handler.playerId = 'player-1';
      handler.disconnectedAt = Date.now();

      handler.reset();

      expect(handler.status).toBe(RECONNECT_STATUS.CONNECTED);
      expect(handler.retryCount).toBe(0);
      expect(handler.roomId).toBeNull();
      expect(handler.playerId).toBeNull();
      expect(handler.disconnectedAt).toBeNull();
    });
  });

  describe('destroy', () => {
    it('should cleanup all resources', () => {
      const listener = jest.fn();
      handler.on('test', listener);

      handler.destroy();

      expect(handler.socket).toBeNull();
      handler.emit('test', {});
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('createReconnectionHandler', () => {
  it('should create new handler', () => {
    const handler = createReconnectionHandler();
    expect(handler).toBeInstanceOf(ReconnectionHandler);
  });

  it('should accept socket and config', () => {
    const socket = { on: jest.fn() };
    const handler = createReconnectionHandler(socket, { maxRetries: 10 });

    expect(handler.socket).toBe(socket);
    expect(handler.config.maxRetries).toBe(10);
  });
});

describe('Constants', () => {
  describe('RECONNECT_CONFIG', () => {
    it('should have required properties', () => {
      expect(RECONNECT_CONFIG.maxRetries).toBeDefined();
      expect(RECONNECT_CONFIG.initialDelay).toBeDefined();
      expect(RECONNECT_CONFIG.maxDelay).toBeDefined();
      expect(RECONNECT_CONFIG.backoffMultiplier).toBeDefined();
      expect(RECONNECT_CONFIG.timeout).toBeDefined();
    });
  });

  describe('RECONNECT_STATUS', () => {
    it('should have all status values', () => {
      expect(RECONNECT_STATUS.CONNECTED).toBe('connected');
      expect(RECONNECT_STATUS.DISCONNECTED).toBe('disconnected');
      expect(RECONNECT_STATUS.RECONNECTING).toBe('reconnecting');
      expect(RECONNECT_STATUS.FAILED).toBe('failed');
    });
  });
});
