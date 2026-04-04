/**
 * useEvolutionSocket Hook 測試
 *
 * @module hooks/useEvolutionSocket.test
 */

import { renderHook, act } from '@testing-library/react';

// Mock evolutionSocket
jest.mock('../services/evolutionSocket', () => ({
  evolutionSocket: {
    isConnected: true,
    on: jest.fn(() => jest.fn()),
    createRoom: jest.fn().mockResolvedValue({ roomId: 'room-1' }),
    joinRoom: jest.fn().mockResolvedValue({ roomId: 'room-1' }),
    leaveRoom: jest.fn(),
    setReady: jest.fn(),
    startGame: jest.fn(),
    createCreature: jest.fn(),
    addTrait: jest.fn(),
    passEvolution: jest.fn(),
    feedCreature: jest.fn(),
    attack: jest.fn(),
    respondAttack: jest.fn(),
    useTrait: jest.fn(),
    requestRoomList: jest.fn(),
    onGameState: jest.fn(() => jest.fn()),
    onPlayerJoined: jest.fn(() => jest.fn()),
    onPlayerLeft: jest.fn(() => jest.fn()),
    onGameStarted: jest.fn(() => jest.fn()),
    onError: jest.fn(() => jest.fn()),
    onRoomListUpdated: jest.fn(() => jest.fn()),
  },
}));

// Mock socketService events - 每次調用都返回新的 unsub 函數
const createMockListener = () => jest.fn().mockReturnValue(jest.fn());

jest.mock('../services/socketService', () => ({
  onEvoGameState: createMockListener(),
  onEvoCreatureCreated: createMockListener(),
  onEvoTraitAdded: createMockListener(),
  onEvoPlayerPassed: createMockListener(),
  onEvoCreatureFed: createMockListener(),
  onEvoAttackPending: createMockListener(),
  onEvoAttackResolved: createMockListener(),
  onEvoError: createMockListener(),
  onEvoPlayerJoined: createMockListener(),
  onEvoPlayerLeft: createMockListener(),
  onEvoGameStarted: createMockListener(),
}));

// Mock react-redux
jest.mock('react-redux', () => ({
  useDispatch: () => jest.fn(),
  useSelector: () => null,
}));

const { useEvolutionSocket, useEvolutionGameState, useEvolutionGameEvents } = require('./useEvolutionSocket');
const { evolutionSocket } = require('../services/evolutionSocket');

describe('useEvolutionSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return connection status', () => {
    const { result } = renderHook(() => useEvolutionSocket('room-1'));

    expect(result.current.isConnected).toBe(true);
  });

  it('should initialize without error', () => {
    const { result } = renderHook(() => useEvolutionSocket('room-1'));

    expect(result.current.error).toBeNull();
  });

  it('should provide clearError function', () => {
    const { result } = renderHook(() => useEvolutionSocket('room-1'));

    expect(typeof result.current.clearError).toBe('function');
  });

  describe('房間操作', () => {
    it('should call createRoom', async () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      await act(async () => {
        await result.current.createRoom('Test Room', 4, { id: 'player-1', name: 'Player 1' });
      });

      expect(evolutionSocket.createRoom).toHaveBeenCalledWith(
        'Test Room',
        4,
        { id: 'player-1', name: 'Player 1' }
      );
    });

    it('should call joinRoom', async () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      await act(async () => {
        await result.current.joinRoom('room-2', { id: 'player-1', name: 'Player 1' });
      });

      expect(evolutionSocket.joinRoom).toHaveBeenCalledWith(
        'room-2',
        { id: 'player-1', name: 'Player 1' }
      );
    });

    it('should call leaveRoom', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.leaveRoom('room-1', 'player-1');
      });

      expect(evolutionSocket.leaveRoom).toHaveBeenCalledWith('room-1', 'player-1');
    });

    it('should call setReady', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.setReady('room-1', 'player-1', true);
      });

      expect(evolutionSocket.setReady).toHaveBeenCalledWith('room-1', 'player-1', true);
    });

    it('should call startGame', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.startGame('room-1', 'player-1');
      });

      expect(evolutionSocket.startGame).toHaveBeenCalledWith('room-1', 'player-1');
    });

    it('should call requestRoomList', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.requestRoomList();
      });

      expect(evolutionSocket.requestRoomList).toHaveBeenCalled();
    });
  });

  describe('遊戲動作', () => {
    it('should call createCreature with roomId', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.actions.createCreature('player-1', 'card-1');
      });

      expect(evolutionSocket.createCreature).toHaveBeenCalledWith('room-1', 'player-1', 'card-1');
    });

    it('should not call createCreature without roomId', () => {
      const { result } = renderHook(() => useEvolutionSocket(null));

      act(() => {
        result.current.actions.createCreature('player-1', 'card-1');
      });

      expect(evolutionSocket.createCreature).not.toHaveBeenCalled();
    });

    it('should call addTrait', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.actions.addTrait('player-1', 'card-1', 'creature-1', null);
      });

      expect(evolutionSocket.addTrait).toHaveBeenCalledWith('room-1', 'player-1', 'card-1', 'creature-1', null);
    });

    it('should call passEvolution', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.actions.passEvolution('player-1');
      });

      expect(evolutionSocket.passEvolution).toHaveBeenCalledWith('room-1', 'player-1');
    });

    it('should call feedCreature', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.actions.feedCreature('player-1', 'creature-1');
      });

      expect(evolutionSocket.feedCreature).toHaveBeenCalledWith('room-1', 'player-1', 'creature-1');
    });

    it('should call attack', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.actions.attack('player-1', 'attacker', 'defender');
      });

      expect(evolutionSocket.attack).toHaveBeenCalledWith('room-1', 'player-1', 'attacker', 'defender');
    });

    it('should call respondAttack', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));
      const response = { type: 'tailLoss' };

      act(() => {
        result.current.actions.respondAttack('player-1', response);
      });

      expect(evolutionSocket.respondAttack).toHaveBeenCalledWith('room-1', 'player-1', response);
    });

    it('should call useTrait', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      act(() => {
        result.current.actions.useTrait('player-1', 'creature-1', 'piracy', 'target-1');
      });

      expect(evolutionSocket.useTrait).toHaveBeenCalledWith('room-1', 'player-1', 'creature-1', 'piracy', 'target-1');
    });
  });

  describe('事件監聽方法', () => {
    it('should provide onGameState', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));
      expect(typeof result.current.onGameState).toBe('function');
    });

    it('should provide onPlayerJoined', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));
      expect(typeof result.current.onPlayerJoined).toBe('function');
    });

    it('should provide onError', () => {
      const { result } = renderHook(() => useEvolutionSocket('room-1'));
      expect(typeof result.current.onError).toBe('function');
    });
  });

  describe('錯誤處理', () => {
    it('should handle createRoom error', async () => {
      evolutionSocket.createRoom.mockRejectedValueOnce(new Error('Create failed'));

      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      await act(async () => {
        const response = await result.current.createRoom('Room', 4, { id: 'p1' });
        expect(response.success).toBe(false);
        expect(response.error).toBe('Create failed');
      });

      expect(result.current.error).toBe('Create failed');
    });

    it('should handle joinRoom error', async () => {
      evolutionSocket.joinRoom.mockRejectedValueOnce(new Error('Join failed'));

      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      await act(async () => {
        const response = await result.current.joinRoom('room-2', { id: 'p1' });
        expect(response.success).toBe(false);
      });

      expect(result.current.error).toBe('Join failed');
    });

    it('should clear error', async () => {
      evolutionSocket.createRoom.mockRejectedValueOnce(new Error('Error'));

      const { result } = renderHook(() => useEvolutionSocket('room-1'));

      await act(async () => {
        await result.current.createRoom('Room', 4, { id: 'p1' });
      });

      expect(result.current.error).toBe('Error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});

describe('useEvolutionGameState', () => {
  it('should setup game state listener', () => {
    const callback = jest.fn();
    const socketService = require('../services/socketService');
    const mockUnsub = jest.fn();
    socketService.onEvoGameState.mockReturnValue(mockUnsub);

    const { unmount } = renderHook(() => useEvolutionGameState(callback));

    expect(socketService.onEvoGameState).toHaveBeenCalledWith(callback);

    unmount();
    expect(mockUnsub).toHaveBeenCalled();
  });
});

describe('useEvolutionGameEvents', () => {
  it('should setup multiple event listeners', () => {
    const socketService = require('../services/socketService');
    const mockUnsub = jest.fn();

    socketService.onEvoGameState.mockReturnValue(mockUnsub);
    socketService.onEvoCreatureCreated.mockReturnValue(mockUnsub);
    socketService.onEvoError.mockReturnValue(mockUnsub);

    const handlers = {
      onGameState: jest.fn(),
      onCreatureCreated: jest.fn(),
      onError: jest.fn(),
    };

    const { unmount } = renderHook(() => useEvolutionGameEvents(handlers));

    // Issue #7: handlers are now wrapped in ref-based functions to prevent re-subscriptions
    // Verify that event listener setup functions were called (with any function argument)
    expect(socketService.onEvoGameState).toHaveBeenCalledWith(expect.any(Function));
    expect(socketService.onEvoCreatureCreated).toHaveBeenCalledWith(expect.any(Function));
    expect(socketService.onEvoError).toHaveBeenCalledWith(expect.any(Function));

    unmount();
  });

  it('should cleanup listeners on unmount', () => {
    const socketService = require('../services/socketService');
    const mockUnsub = jest.fn();
    socketService.onEvoGameState.mockReturnValue(mockUnsub);

    const { unmount } = renderHook(() =>
      useEvolutionGameEvents({ onGameState: jest.fn() })
    );

    unmount();

    expect(mockUnsub).toHaveBeenCalled();
  });
});
