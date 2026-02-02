/**
 * 演化論 Socket 服務測試
 *
 * @module services/evolutionSocket.test
 */

// Mock socketService
jest.mock('./socketService', () => ({
  getSocket: jest.fn(() => ({ connected: true })),
  evoCreateRoom: jest.fn(),
  evoJoinRoom: jest.fn(),
  evoLeaveRoom: jest.fn(),
  evoSetReady: jest.fn(),
  evoStartGame: jest.fn(),
  evoCreateCreature: jest.fn(),
  evoAddTrait: jest.fn(),
  evoPassEvolution: jest.fn(),
  evoFeedCreature: jest.fn(),
  evoAttack: jest.fn(),
  evoRespondAttack: jest.fn(),
  evoUseTrait: jest.fn(),
  evoRequestRoomList: jest.fn(),
  onEvoRoomCreated: jest.fn((cb) => {
    // 模擬立即回調
    setTimeout(() => cb({ roomId: 'room-1' }), 0);
    return jest.fn();
  }),
  onEvoJoinedRoom: jest.fn((cb) => {
    setTimeout(() => cb({ roomId: 'room-1' }), 0);
    return jest.fn();
  }),
  onEvoPlayerJoined: jest.fn(() => jest.fn()),
  onEvoPlayerLeft: jest.fn(() => jest.fn()),
  onEvoPlayerReady: jest.fn(() => jest.fn()),
  onEvoGameStarted: jest.fn(() => jest.fn()),
  onEvoGameState: jest.fn(() => jest.fn()),
  onEvoCreatureCreated: jest.fn(() => jest.fn()),
  onEvoTraitAdded: jest.fn(() => jest.fn()),
  onEvoPlayerPassed: jest.fn(() => jest.fn()),
  onEvoCreatureFed: jest.fn(() => jest.fn()),
  onEvoChainTriggered: jest.fn(() => jest.fn()),
  onEvoAttackPending: jest.fn(() => jest.fn()),
  onEvoAttackResolved: jest.fn(() => jest.fn()),
  onEvoTraitUsed: jest.fn(() => jest.fn()),
  onEvoRoomListUpdated: jest.fn(() => jest.fn()),
  onEvoError: jest.fn(() => jest.fn()),
}));

const socketService = require('./socketService');
const { evolutionSocket } = require('./evolutionSocket');

describe('evolutionSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isConnected', () => {
    it('should return true when socket connected', () => {
      socketService.getSocket.mockReturnValue({ connected: true });
      expect(evolutionSocket.isConnected).toBe(true);
    });

    it('should return false when socket not connected', () => {
      socketService.getSocket.mockReturnValue({ connected: false });
      expect(evolutionSocket.isConnected).toBe(false);
    });

    it('should return false when no socket', () => {
      socketService.getSocket.mockReturnValue(null);
      expect(evolutionSocket.isConnected).toBe(false);
    });
  });

  describe('房間操作', () => {
    it('should call evoLeaveRoom', () => {
      evolutionSocket.leaveRoom('room-1', 'player-1');
      expect(socketService.evoLeaveRoom).toHaveBeenCalledWith('room-1', 'player-1');
    });

    it('should call evoSetReady', () => {
      evolutionSocket.setReady('room-1', 'player-1', true);
      expect(socketService.evoSetReady).toHaveBeenCalledWith('room-1', 'player-1', true);
    });

    it('should call evoStartGame', () => {
      evolutionSocket.startGame('room-1', 'player-1');
      expect(socketService.evoStartGame).toHaveBeenCalledWith('room-1', 'player-1');
    });

    it('should call evoRequestRoomList', () => {
      evolutionSocket.requestRoomList();
      expect(socketService.evoRequestRoomList).toHaveBeenCalled();
    });
  });

  describe('遊戲動作', () => {
    it('should call evoCreateCreature', () => {
      evolutionSocket.createCreature('room-1', 'player-1', 'card-1');
      expect(socketService.evoCreateCreature).toHaveBeenCalledWith('room-1', 'player-1', 'card-1');
    });

    it('should call evoAddTrait', () => {
      evolutionSocket.addTrait('room-1', 'player-1', 'card-1', 'creature-1', null);
      expect(socketService.evoAddTrait).toHaveBeenCalledWith('room-1', 'player-1', 'card-1', 'creature-1', null);
    });

    it('should call evoAddTrait with target', () => {
      evolutionSocket.addTrait('room-1', 'player-1', 'card-1', 'creature-1', 'creature-2');
      expect(socketService.evoAddTrait).toHaveBeenCalledWith('room-1', 'player-1', 'card-1', 'creature-1', 'creature-2');
    });

    it('should call evoPassEvolution', () => {
      evolutionSocket.passEvolution('room-1', 'player-1');
      expect(socketService.evoPassEvolution).toHaveBeenCalledWith('room-1', 'player-1');
    });

    it('should call evoFeedCreature', () => {
      evolutionSocket.feedCreature('room-1', 'player-1', 'creature-1');
      expect(socketService.evoFeedCreature).toHaveBeenCalledWith('room-1', 'player-1', 'creature-1');
    });

    it('should call evoAttack', () => {
      evolutionSocket.attack('room-1', 'player-1', 'attacker', 'defender');
      expect(socketService.evoAttack).toHaveBeenCalledWith('room-1', 'player-1', 'attacker', 'defender');
    });

    it('should call evoRespondAttack', () => {
      const response = { type: 'tailLoss', traitId: 'trait-1' };
      evolutionSocket.respondAttack('room-1', 'player-1', response);
      expect(socketService.evoRespondAttack).toHaveBeenCalledWith('room-1', 'player-1', response);
    });

    it('should call evoUseTrait', () => {
      evolutionSocket.useTrait('room-1', 'player-1', 'creature-1', 'piracy', 'target-1');
      expect(socketService.evoUseTrait).toHaveBeenCalledWith('room-1', 'player-1', 'creature-1', 'piracy', 'target-1');
    });
  });

  describe('事件監聽', () => {
    it('should register room list listener', () => {
      const callback = jest.fn();
      evolutionSocket.onRoomListUpdated(callback);
      expect(socketService.onEvoRoomListUpdated).toHaveBeenCalledWith(callback);
    });

    it('should register player joined listener', () => {
      const callback = jest.fn();
      evolutionSocket.onPlayerJoined(callback);
      expect(socketService.onEvoPlayerJoined).toHaveBeenCalledWith(callback);
    });

    it('should register player left listener', () => {
      const callback = jest.fn();
      evolutionSocket.onPlayerLeft(callback);
      expect(socketService.onEvoPlayerLeft).toHaveBeenCalledWith(callback);
    });

    it('should register game started listener', () => {
      const callback = jest.fn();
      evolutionSocket.onGameStarted(callback);
      expect(socketService.onEvoGameStarted).toHaveBeenCalledWith(callback);
    });

    it('should register game state listener', () => {
      const callback = jest.fn();
      evolutionSocket.onGameState(callback);
      expect(socketService.onEvoGameState).toHaveBeenCalledWith(callback);
    });

    it('should register error listener', () => {
      const callback = jest.fn();
      evolutionSocket.onError(callback);
      expect(socketService.onEvoError).toHaveBeenCalledWith(callback);
    });
  });

  describe('內部事件系統', () => {
    it('should register and call custom event listener', () => {
      const callback = jest.fn();
      evolutionSocket.on('customEvent', callback);

      evolutionSocket._notifyListeners('customEvent', { test: 'data' });

      expect(callback).toHaveBeenCalledWith({ test: 'data' });
    });

    it('should unregister event listener', () => {
      const callback = jest.fn();
      const unsub = evolutionSocket.on('testEvent', callback);

      unsub();
      evolutionSocket._notifyListeners('testEvent', {});

      expect(callback).not.toHaveBeenCalled();
    });

    it('should handle off for non-existent event', () => {
      expect(() => {
        evolutionSocket.off('nonExistent', () => {});
      }).not.toThrow();
    });
  });

  describe('Store 同步', () => {
    it('should setup store sync and return cleanup function', () => {
      // 確保所有監聽器都返回正確的 unsubscribe 函數
      const mockUnsub = jest.fn();
      socketService.onEvoGameState.mockReturnValue(mockUnsub);
      socketService.onEvoCreatureCreated.mockReturnValue(mockUnsub);
      socketService.onEvoTraitAdded.mockReturnValue(mockUnsub);
      socketService.onEvoPlayerPassed.mockReturnValue(mockUnsub);
      socketService.onEvoCreatureFed.mockReturnValue(mockUnsub);
      socketService.onEvoAttackPending.mockReturnValue(mockUnsub);
      socketService.onEvoAttackResolved.mockReturnValue(mockUnsub);
      socketService.onEvoError.mockReturnValue(mockUnsub);

      const mockDispatch = jest.fn();
      const mockActions = {
        setGameState: jest.fn((data) => ({ type: 'SET_GAME_STATE', payload: data })),
        setPlayers: jest.fn((data) => ({ type: 'SET_PLAYERS', payload: data })),
      };

      const cleanup = evolutionSocket.setupStoreSync(mockDispatch, mockActions);

      expect(typeof cleanup).toBe('function');
      cleanup();
      expect(mockUnsub).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should cleanup all unsubscribers', () => {
      const mockUnsub = jest.fn();
      evolutionSocket.unsubscribers = [mockUnsub, mockUnsub];

      evolutionSocket.cleanup();

      expect(mockUnsub).toHaveBeenCalledTimes(2);
      expect(evolutionSocket.unsubscribers).toEqual([]);
    });
  });
});
