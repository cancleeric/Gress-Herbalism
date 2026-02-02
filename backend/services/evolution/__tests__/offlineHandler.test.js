/**
 * offlineHandler 測試
 */

const {
  OfflineHandler,
  PlayerOfflineInfo,
  OFFLINE_STATUS,
  OFFLINE_CONFIG,
} = require('../offlineHandler');

describe('PlayerOfflineInfo', () => {
  let info;

  beforeEach(() => {
    info = new PlayerOfflineInfo('player-1', 'room-1');
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(info.playerId).toBe('player-1');
      expect(info.roomId).toBe('room-1');
      expect(info.status).toBe(OFFLINE_STATUS.ONLINE);
      expect(info.disconnectedAt).toBeNull();
      expect(info.missedTurns).toBe(0);
    });
  });

  describe('markOffline', () => {
    it('should mark player as offline', () => {
      info.markOffline();

      expect(info.status).toBe(OFFLINE_STATUS.TEMPORARILY_OFFLINE);
      expect(info.disconnectedAt).not.toBeNull();
    });
  });

  describe('markOnline', () => {
    it('should mark player as online', () => {
      info.markOffline();
      info.markOnline();

      expect(info.status).toBe(OFFLINE_STATUS.ONLINE);
      expect(info.disconnectedAt).toBeNull();
    });
  });

  describe('markForfeited', () => {
    it('should mark player as forfeited', () => {
      info.markForfeited();

      expect(info.status).toBe(OFFLINE_STATUS.FORFEITED);
    });
  });

  describe('recordActivity', () => {
    it('should update lastActivityAt', () => {
      const before = info.lastActivityAt;
      jest.advanceTimersByTime(1000);
      info.recordActivity();

      expect(info.lastActivityAt).toBeGreaterThanOrEqual(before);
    });
  });

  describe('incrementMissedTurns', () => {
    it('should increment missed turns count', () => {
      expect(info.incrementMissedTurns()).toBe(1);
      expect(info.incrementMissedTurns()).toBe(2);
      expect(info.missedTurns).toBe(2);
    });
  });

  describe('resetMissedTurns', () => {
    it('should reset missed turns to zero', () => {
      info.incrementMissedTurns();
      info.incrementMissedTurns();
      info.resetMissedTurns();

      expect(info.missedTurns).toBe(0);
    });
  });

  describe('getOfflineDuration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return 0 if not offline', () => {
      expect(info.getOfflineDuration()).toBe(0);
    });

    it('should return duration since disconnect', () => {
      info.markOffline();
      jest.advanceTimersByTime(5000);

      expect(info.getOfflineDuration()).toBe(5000);
    });
  });

  describe('isOnline / isForfeited', () => {
    it('should return correct status', () => {
      expect(info.isOnline()).toBe(true);
      expect(info.isForfeited()).toBe(false);

      info.markOffline();
      expect(info.isOnline()).toBe(false);
      expect(info.isForfeited()).toBe(false);

      info.markForfeited();
      expect(info.isOnline()).toBe(false);
      expect(info.isForfeited()).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('should return JSON representation', () => {
      const json = info.toJSON();

      expect(json.playerId).toBe('player-1');
      expect(json.roomId).toBe('room-1');
      expect(json.status).toBe(OFFLINE_STATUS.ONLINE);
      expect(json.missedTurns).toBe(0);
      expect(json.offlineDuration).toBe(0);
    });
  });
});

describe('OfflineHandler', () => {
  let handler;

  beforeEach(() => {
    jest.useFakeTimers();
    handler = new OfflineHandler();
  });

  afterEach(() => {
    handler.clear();
    jest.useRealTimers();
  });

  describe('registerPlayer', () => {
    it('should register player', () => {
      const info = handler.registerPlayer('player-1', 'room-1');

      expect(info).not.toBeNull();
      expect(info.playerId).toBe('player-1');
      expect(handler.getPlayerInfo('player-1')).not.toBeNull();
    });

    it('should return null for invalid parameters', () => {
      expect(handler.registerPlayer(null, 'room-1')).toBeNull();
      expect(handler.registerPlayer('player-1', null)).toBeNull();
    });

    it('should add player to room list', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.registerPlayer('player-2', 'room-1');

      const statuses = handler.getRoomPlayersStatus('room-1');
      expect(statuses.length).toBe(2);
    });
  });

  describe('unregisterPlayer', () => {
    it('should unregister player', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.unregisterPlayer('player-1');

      expect(handler.getPlayerInfo('player-1')).toBeNull();
    });

    it('should clear timeouts on unregister', () => {
      const onForfeit = jest.fn();
      handler.registerPlayer('player-1', 'room-1');
      handler.handleOffline('player-1', onForfeit);
      handler.unregisterPlayer('player-1');

      jest.advanceTimersByTime(OFFLINE_CONFIG.forfeitTimeout);
      expect(onForfeit).not.toHaveBeenCalled();
    });

    it('should handle non-existent player', () => {
      expect(() => handler.unregisterPlayer('unknown')).not.toThrow();
    });
  });

  describe('handleOffline', () => {
    it('should mark player as offline', () => {
      handler.registerPlayer('player-1', 'room-1');
      const result = handler.handleOffline('player-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe(OFFLINE_STATUS.TEMPORARILY_OFFLINE);
    });

    it('should return error for unknown player', () => {
      const result = handler.handleOffline('unknown');
      expect(result.success).toBe(false);
    });

    it('should return error for forfeited player', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.handleForfeit('player-1');

      const result = handler.handleOffline('player-1');
      expect(result.success).toBe(false);
    });

    it('should call onForfeit after timeout', () => {
      const onForfeit = jest.fn();
      handler.registerPlayer('player-1', 'room-1');
      handler.handleOffline('player-1', onForfeit);

      jest.advanceTimersByTime(OFFLINE_CONFIG.forfeitTimeout);

      expect(onForfeit).toHaveBeenCalledWith('player-1', 'room-1');
    });
  });

  describe('handleOnline', () => {
    it('should mark player as online', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.handleOffline('player-1');
      const result = handler.handleOnline('player-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe(OFFLINE_STATUS.ONLINE);
    });

    it('should return error for unknown player', () => {
      const result = handler.handleOnline('unknown');
      expect(result.success).toBe(false);
    });

    it('should return error for forfeited player', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.handleForfeit('player-1');

      const result = handler.handleOnline('player-1');
      expect(result.success).toBe(false);
    });

    it('should clear forfeit timeout', () => {
      const onForfeit = jest.fn();
      handler.registerPlayer('player-1', 'room-1');
      handler.handleOffline('player-1', onForfeit);
      handler.handleOnline('player-1');

      jest.advanceTimersByTime(OFFLINE_CONFIG.forfeitTimeout);
      expect(onForfeit).not.toHaveBeenCalled();
    });
  });

  describe('handleForfeit', () => {
    it('should mark player as forfeited', () => {
      handler.registerPlayer('player-1', 'room-1');
      const result = handler.handleForfeit('player-1');

      expect(result.success).toBe(true);
      expect(result.status).toBe(OFFLINE_STATUS.FORFEITED);
    });

    it('should return error for unknown player', () => {
      const result = handler.handleForfeit('unknown');
      expect(result.success).toBe(false);
    });
  });

  describe('setTurnTimeout', () => {
    it('should set turn timeout', () => {
      const onTimeout = jest.fn();
      handler.registerPlayer('player-1', 'room-1');
      handler.setTurnTimeout('player-1', onTimeout);

      jest.advanceTimersByTime(OFFLINE_CONFIG.turnTimeout);

      expect(onTimeout).toHaveBeenCalledWith('player-1', 'room-1');
    });

    it('should immediately trigger for offline player', () => {
      const onTimeout = jest.fn();
      handler.registerPlayer('player-1', 'room-1');
      handler.handleOffline('player-1');
      handler.setTurnTimeout('player-1', onTimeout);

      expect(onTimeout).toHaveBeenCalled();
    });

    it('should not set timeout if autoPass disabled', () => {
      const h = new OfflineHandler({ autoPassEnabled: false });
      const onTimeout = jest.fn();
      h.registerPlayer('player-1', 'room-1');
      h.setTurnTimeout('player-1', onTimeout);

      jest.advanceTimersByTime(OFFLINE_CONFIG.turnTimeout);

      expect(onTimeout).not.toHaveBeenCalled();
      h.clear();
    });
  });

  describe('clearTurnTimeout', () => {
    it('should clear turn timeout', () => {
      const onTimeout = jest.fn();
      handler.registerPlayer('player-1', 'room-1');
      handler.setTurnTimeout('player-1', onTimeout);
      handler.clearTurnTimeout('player-1');

      jest.advanceTimersByTime(OFFLINE_CONFIG.turnTimeout);

      expect(onTimeout).not.toHaveBeenCalled();
    });
  });

  describe('recordActivity', () => {
    it('should record activity and reset missed turns', () => {
      handler.registerPlayer('player-1', 'room-1');
      const info = handler.getPlayerInfo('player-1');
      info.incrementMissedTurns();

      handler.recordActivity('player-1');

      expect(info.missedTurns).toBe(0);
    });
  });

  describe('shouldAutoPass', () => {
    it('should return true for offline player', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.handleOffline('player-1');

      expect(handler.shouldAutoPass('player-1')).toBe(true);
    });

    it('should return true for forfeited player', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.handleForfeit('player-1');

      expect(handler.shouldAutoPass('player-1')).toBe(true);
    });

    it('should return false for online player', () => {
      handler.registerPlayer('player-1', 'room-1');

      expect(handler.shouldAutoPass('player-1')).toBe(false);
    });

    it('should return false for unknown player', () => {
      expect(handler.shouldAutoPass('unknown')).toBe(false);
    });

    it('should return false if autoPass disabled', () => {
      const h = new OfflineHandler({ autoPassEnabled: false });
      h.registerPlayer('player-1', 'room-1');
      h.handleOffline('player-1');

      expect(h.shouldAutoPass('player-1')).toBe(false);
      h.clear();
    });
  });

  describe('getPlayerStatus', () => {
    it('should return player status as JSON', () => {
      handler.registerPlayer('player-1', 'room-1');
      const status = handler.getPlayerStatus('player-1');

      expect(status).not.toBeNull();
      expect(status.playerId).toBe('player-1');
    });

    it('should return null for unknown player', () => {
      expect(handler.getPlayerStatus('unknown')).toBeNull();
    });
  });

  describe('getRoomPlayersStatus', () => {
    it('should return all players in room', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.registerPlayer('player-2', 'room-1');

      const statuses = handler.getRoomPlayersStatus('room-1');

      expect(statuses.length).toBe(2);
    });

    it('should return empty array for unknown room', () => {
      expect(handler.getRoomPlayersStatus('unknown')).toEqual([]);
    });
  });

  describe('getOnlineCount', () => {
    it('should return count of online players', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.registerPlayer('player-2', 'room-1');
      handler.handleOffline('player-1');

      expect(handler.getOnlineCount('room-1')).toBe(1);
    });

    it('should return 0 for unknown room', () => {
      expect(handler.getOnlineCount('unknown')).toBe(0);
    });
  });

  describe('getActiveCount', () => {
    it('should return count of non-forfeited players', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.registerPlayer('player-2', 'room-1');
      handler.handleForfeit('player-1');

      expect(handler.getActiveCount('room-1')).toBe(1);
    });

    it('should include offline but not forfeited players', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.registerPlayer('player-2', 'room-1');
      handler.handleOffline('player-1');

      expect(handler.getActiveCount('room-1')).toBe(2);
    });
  });

  describe('clearRoom', () => {
    it('should clear all players in room', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.registerPlayer('player-2', 'room-1');
      handler.clearRoom('room-1');

      expect(handler.getPlayerInfo('player-1')).toBeNull();
      expect(handler.getPlayerInfo('player-2')).toBeNull();
    });

    it('should clear timeouts', () => {
      const onForfeit = jest.fn();
      handler.registerPlayer('player-1', 'room-1');
      handler.handleOffline('player-1', onForfeit);
      handler.clearRoom('room-1');

      jest.advanceTimersByTime(OFFLINE_CONFIG.forfeitTimeout);
      expect(onForfeit).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      handler.registerPlayer('player-1', 'room-1');
      handler.registerPlayer('player-2', 'room-2');
      handler.clear();

      expect(handler.getPlayerInfo('player-1')).toBeNull();
      expect(handler.getPlayerInfo('player-2')).toBeNull();
    });
  });
});

describe('Constants', () => {
  describe('OFFLINE_STATUS', () => {
    it('should have all statuses', () => {
      expect(OFFLINE_STATUS.ONLINE).toBe('online');
      expect(OFFLINE_STATUS.TEMPORARILY_OFFLINE).toBe('temporarily_offline');
      expect(OFFLINE_STATUS.FORFEITED).toBe('forfeited');
    });
  });

  describe('OFFLINE_CONFIG', () => {
    it('should have required config', () => {
      expect(OFFLINE_CONFIG.temporaryOfflineTimeout).toBeDefined();
      expect(OFFLINE_CONFIG.forfeitTimeout).toBeDefined();
      expect(OFFLINE_CONFIG.turnTimeout).toBeDefined();
      expect(OFFLINE_CONFIG.autoPassEnabled).toBeDefined();
    });
  });
});
