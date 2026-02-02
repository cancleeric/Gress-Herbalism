/**
 * reconnectionService 測試
 */

const {
  GameStateSnapshotManager,
  ReconnectionHandler,
  getClientGameState,
} = require('../reconnectionService');

describe('GameStateSnapshotManager', () => {
  let manager;

  beforeEach(() => {
    manager = new GameStateSnapshotManager();
  });

  afterEach(() => {
    manager.clear();
  });

  describe('save', () => {
    it('should save game state snapshot', () => {
      const gameState = {
        phase: 'evolution',
        round: 1,
        currentPlayerIndex: 0,
        isLastRound: false,
        foodPool: { red: 5, blue: 3 },
        deck: [],
        discardPile: [],
        players: [
          { id: 'p1', name: 'Player 1', hand: [], creatures: [], score: 0, hasPassed: false },
        ],
        pendingAttack: null,
        actionLog: [],
      };

      const snapshot = manager.save('room-1', gameState);

      expect(snapshot).not.toBeNull();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.state.phase).toBe('evolution');
      expect(snapshot.version).toBe(1);
    });

    it('should return null for invalid parameters', () => {
      expect(manager.save(null, {})).toBeNull();
      expect(manager.save('room-1', null)).toBeNull();
    });

    it('should overwrite existing snapshot', () => {
      const state1 = { phase: 'evolution', round: 1, players: [] };
      const state2 = { phase: 'feeding', round: 2, players: [] };

      manager.save('room-1', state1);
      manager.save('room-1', state2);

      const loaded = manager.load('room-1');
      expect(loaded.phase).toBe('feeding');
      expect(loaded.round).toBe(2);
    });
  });

  describe('load', () => {
    it('should load saved snapshot', () => {
      const gameState = {
        phase: 'feeding',
        round: 2,
        currentPlayerIndex: 1,
        players: [],
      };

      manager.save('room-1', gameState);
      const loaded = manager.load('room-1');

      expect(loaded).not.toBeNull();
      expect(loaded.phase).toBe('feeding');
      expect(loaded.round).toBe(2);
    });

    it('should return null for non-existent room', () => {
      const loaded = manager.load('non-existent');
      expect(loaded).toBeNull();
    });

    it('should return null for expired snapshot', () => {
      const gameState = { phase: 'evolution', players: [] };
      manager.save('room-1', gameState);

      // 模擬過期
      const snapshot = manager.snapshots.get('room-1');
      snapshot.timestamp = Date.now() - 31 * 60 * 1000; // 31 分鐘前

      const loaded = manager.load('room-1');
      expect(loaded).toBeNull();
      expect(manager.has('room-1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete snapshot', () => {
      manager.save('room-1', { phase: 'evolution', players: [] });
      expect(manager.has('room-1')).toBe(true);

      manager.delete('room-1');
      expect(manager.has('room-1')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing snapshot', () => {
      manager.save('room-1', { phase: 'evolution', players: [] });
      expect(manager.has('room-1')).toBe(true);
    });

    it('should return false for non-existent snapshot', () => {
      expect(manager.has('non-existent')).toBe(false);
    });

    it('should return false for expired snapshot', () => {
      manager.save('room-1', { phase: 'evolution', players: [] });
      const snapshot = manager.snapshots.get('room-1');
      snapshot.timestamp = Date.now() - 31 * 60 * 1000;

      expect(manager.has('room-1')).toBe(false);
    });
  });

  describe('serialize', () => {
    it('should serialize game state correctly', () => {
      const gameState = {
        phase: 'evolution',
        round: 1,
        currentPlayerIndex: 0,
        isLastRound: false,
        foodPool: { red: 5 },
        deck: [1, 2, 3],
        discardPile: [],
        players: [
          { id: 'p1', name: 'A', hand: [1], creatures: [], score: 10, hasPassed: false, extra: 'ignore' },
        ],
        pendingAttack: null,
        actionLog: Array(100).fill({ type: 'test' }),
        extraField: 'should not be included',
      };

      const serialized = manager.serialize(gameState);

      expect(serialized.phase).toBe('evolution');
      expect(serialized.round).toBe(1);
      expect(serialized.actionLog.length).toBe(50); // 只保留最近 50 條
      expect(serialized.extraField).toBeUndefined();
      expect(serialized.players[0].extra).toBeUndefined();
    });

    it('should handle missing players array', () => {
      const gameState = { phase: 'evolution' };
      const serialized = manager.serialize(gameState);
      expect(serialized.players).toEqual([]);
    });

    it('should handle missing actionLog', () => {
      const gameState = { phase: 'evolution', players: [] };
      const serialized = manager.serialize(gameState);
      expect(serialized.actionLog).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return correct count', () => {
      expect(manager.size()).toBe(0);

      manager.save('room-1', { phase: 'evolution', players: [] });
      expect(manager.size()).toBe(1);

      manager.save('room-2', { phase: 'feeding', players: [] });
      expect(manager.size()).toBe(2);

      manager.delete('room-1');
      expect(manager.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all snapshots', () => {
      manager.save('room-1', { phase: 'evolution', players: [] });
      manager.save('room-2', { phase: 'feeding', players: [] });
      expect(manager.size()).toBe(2);

      manager.clear();
      expect(manager.size()).toBe(0);
    });
  });
});

describe('ReconnectionHandler', () => {
  let handler;
  let snapshotManager;

  beforeEach(() => {
    jest.useFakeTimers();
    snapshotManager = new GameStateSnapshotManager();
    handler = new ReconnectionHandler(snapshotManager);
  });

  afterEach(() => {
    handler.clear();
    jest.useRealTimers();
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect and save snapshot', () => {
      const gameState = { phase: 'evolution', players: [] };
      const result = handler.handleDisconnect('room-1', 'player-1', gameState);

      expect(result.success).toBe(true);
      expect(result.playerId).toBe('player-1');
      expect(result.roomId).toBe('room-1');
      expect(result.timeout).toBe(30000);
      expect(handler.hasPendingReconnection('player-1')).toBe(true);
    });

    it('should return error for invalid parameters', () => {
      const result1 = handler.handleDisconnect(null, 'player-1', {});
      expect(result1.success).toBe(false);

      const result2 = handler.handleDisconnect('room-1', null, {});
      expect(result2.success).toBe(false);
    });

    it('should call onTimeout callback after timeout', () => {
      const onTimeout = jest.fn();
      handler.handleDisconnect('room-1', 'player-1', {}, onTimeout);

      jest.advanceTimersByTime(30000);

      expect(onTimeout).toHaveBeenCalledWith('room-1', 'player-1');
      expect(handler.hasPendingReconnection('player-1')).toBe(false);
    });

    it('should work without gameState', () => {
      const result = handler.handleDisconnect('room-1', 'player-1', null);
      expect(result.success).toBe(true);
    });
  });

  describe('handleReconnect', () => {
    it('should handle successful reconnection', () => {
      const gameState = { phase: 'evolution', players: [] };
      handler.handleDisconnect('room-1', 'player-1', gameState);

      jest.advanceTimersByTime(5000);

      const result = handler.handleReconnect('player-1');

      expect(result.success).toBe(true);
      expect(result.roomId).toBe('room-1');
      expect(result.gameState).not.toBeNull();
      expect(result.disconnectedDuration).toBeGreaterThanOrEqual(5000);
      expect(handler.hasPendingReconnection('player-1')).toBe(false);
    });

    it('should return error for non-existent pending reconnection', () => {
      const result = handler.handleReconnect('unknown-player');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No pending reconnection');
    });

    it('should clear timeout on reconnect', () => {
      const onTimeout = jest.fn();
      handler.handleDisconnect('room-1', 'player-1', {}, onTimeout);

      handler.handleReconnect('player-1');

      jest.advanceTimersByTime(30000);

      expect(onTimeout).not.toHaveBeenCalled();
    });
  });

  describe('handleTimeout', () => {
    it('should handle timeout correctly', () => {
      handler.handleDisconnect('room-1', 'player-1', {});

      const result = handler.handleTimeout('player-1');

      expect(result).not.toBeNull();
      expect(result.playerId).toBe('player-1');
      expect(result.roomId).toBe('room-1');
      expect(handler.hasPendingReconnection('player-1')).toBe(false);
    });

    it('should return null for non-existent player', () => {
      const result = handler.handleTimeout('unknown');
      expect(result).toBeNull();
    });
  });

  describe('getPendingReconnection', () => {
    it('should return pending reconnection info', () => {
      handler.handleDisconnect('room-1', 'player-1', {});

      jest.advanceTimersByTime(10000);

      const info = handler.getPendingReconnection('player-1');

      expect(info).not.toBeNull();
      expect(info.roomId).toBe('room-1');
      expect(info.remainingTime).toBeLessThanOrEqual(20000);
    });

    it('should return null for non-existent player', () => {
      const info = handler.getPendingReconnection('unknown');
      expect(info).toBeNull();
    });
  });

  describe('cancelPendingReconnection', () => {
    it('should cancel pending reconnection', () => {
      const onTimeout = jest.fn();
      handler.handleDisconnect('room-1', 'player-1', {}, onTimeout);

      handler.cancelPendingReconnection('player-1');

      expect(handler.hasPendingReconnection('player-1')).toBe(false);

      jest.advanceTimersByTime(30000);
      expect(onTimeout).not.toHaveBeenCalled();
    });

    it('should handle non-existent player', () => {
      expect(() => handler.cancelPendingReconnection('unknown')).not.toThrow();
    });
  });

  describe('clearRoomReconnections', () => {
    it('should clear all reconnections for a room', () => {
      handler.handleDisconnect('room-1', 'player-1', {});
      handler.handleDisconnect('room-1', 'player-2', {});
      handler.handleDisconnect('room-2', 'player-3', {});

      handler.clearRoomReconnections('room-1');

      expect(handler.hasPendingReconnection('player-1')).toBe(false);
      expect(handler.hasPendingReconnection('player-2')).toBe(false);
      expect(handler.hasPendingReconnection('player-3')).toBe(true);
    });
  });

  describe('getPendingCount', () => {
    it('should return correct count', () => {
      expect(handler.getPendingCount()).toBe(0);

      handler.handleDisconnect('room-1', 'player-1', {});
      expect(handler.getPendingCount()).toBe(1);

      handler.handleDisconnect('room-1', 'player-2', {});
      expect(handler.getPendingCount()).toBe(2);

      handler.cancelPendingReconnection('player-1');
      expect(handler.getPendingCount()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear all state', () => {
      handler.handleDisconnect('room-1', 'player-1', { phase: 'evolution', players: [] });
      handler.handleDisconnect('room-2', 'player-2', { phase: 'feeding', players: [] });

      handler.clear();

      expect(handler.getPendingCount()).toBe(0);
      expect(snapshotManager.size()).toBe(0);
    });
  });
});

describe('getClientGameState', () => {
  it('should hide other players hands', () => {
    const gameState = {
      phase: 'evolution',
      players: [
        { id: 'p1', name: 'A', hand: [{ id: 1 }, { id: 2 }] },
        { id: 'p2', name: 'B', hand: [{ id: 3 }, { id: 4 }, { id: 5 }] },
      ],
    };

    const clientState = getClientGameState(gameState, 'p1');

    expect(clientState.players[0].hand).toEqual([{ id: 1 }, { id: 2 }]);
    expect(clientState.players[1].hand).toEqual([
      { hidden: true },
      { hidden: true },
      { hidden: true },
    ]);
  });

  it('should return null for null gameState', () => {
    expect(getClientGameState(null, 'p1')).toBeNull();
  });

  it('should handle missing players', () => {
    const gameState = { phase: 'evolution' };
    const clientState = getClientGameState(gameState, 'p1');
    expect(clientState.players).toEqual([]);
  });

  it('should handle player without hand', () => {
    const gameState = {
      phase: 'evolution',
      players: [
        { id: 'p1', name: 'A' },
        { id: 'p2', name: 'B' },
      ],
    };

    const clientState = getClientGameState(gameState, 'p1');

    expect(clientState.players[0].hand).toEqual([]);
    expect(clientState.players[1].hand).toEqual([]);
  });
});
