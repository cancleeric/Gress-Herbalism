/**
 * Game Slice 測試
 *
 * @module store/evolution/__tests__/gameSlice.test
 */

import reducer, {
  setGameState,
  setPhase,
  setRound,
  setCurrentPlayer,
  setFoodPool,
  setIsRolling,
  setDeckCount,
  setGameEnd,
  addActionLog,
  clearActionLog,
  setLoading,
  setError,
  clearError,
  resetGame,
  joinGame,
} from '../gameSlice';

describe('gameSlice', () => {
  const initialState = {
    gameId: null,
    status: 'waiting',
    round: 0,
    currentPhase: null,
    currentPlayerIndex: 0,
    turnOrder: [],
    foodPool: 0,
    lastFoodRoll: null,
    isRolling: false,
    deckCount: 0,
    discardCount: 0,
    config: {
      expansions: ['base'],
      variants: {},
    },
    createdAt: null,
    startedAt: null,
    endedAt: null,
    winner: null,
    scores: {},
    loading: false,
    error: null,
    actionLog: [],
  };

  it('should return initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setGameState', () => {
    it('should set game state', () => {
      const state = reducer(initialState, setGameState({
        id: 'game-1',
        status: 'playing',
        round: 2,
        currentPhase: 'evolution',
        turnOrder: ['p1', 'p2'],
        foodPool: 5,
      }));

      expect(state.gameId).toBe('game-1');
      expect(state.status).toBe('playing');
      expect(state.round).toBe(2);
      expect(state.currentPhase).toBe('evolution');
      expect(state.foodPool).toBe(5);
    });

    it('should handle deck array', () => {
      const state = reducer(initialState, setGameState({
        deck: [1, 2, 3, 4, 5],
      }));

      expect(state.deckCount).toBe(5);
    });

    it('should handle deck number', () => {
      const state = reducer(initialState, setGameState({
        deck: 10,
      }));

      expect(state.deckCount).toBe(10);
    });
  });

  describe('setPhase', () => {
    it('should set current phase', () => {
      const state = reducer(initialState, setPhase('feeding'));
      expect(state.currentPhase).toBe('feeding');
    });
  });

  describe('setRound', () => {
    it('should set round', () => {
      const state = reducer(initialState, setRound(3));
      expect(state.round).toBe(3);
    });
  });

  describe('setCurrentPlayer', () => {
    it('should set current player index', () => {
      const state = reducer(initialState, setCurrentPlayer(2));
      expect(state.currentPlayerIndex).toBe(2);
    });
  });

  describe('setFoodPool', () => {
    it('should set food pool with number', () => {
      const state = reducer(initialState, setFoodPool(10));
      expect(state.foodPool).toBe(10);
    });

    it('should set food pool with object', () => {
      const state = reducer(initialState, setFoodPool({ amount: 8, roll: [3, 5] }));
      expect(state.foodPool).toBe(8);
      expect(state.lastFoodRoll).toEqual([3, 5]);
    });
  });

  describe('setIsRolling', () => {
    it('should set rolling state', () => {
      const state = reducer(initialState, setIsRolling(true));
      expect(state.isRolling).toBe(true);
    });
  });

  describe('setDeckCount', () => {
    it('should set deck count', () => {
      const state = reducer(initialState, setDeckCount(50));
      expect(state.deckCount).toBe(50);
    });
  });

  describe('setGameEnd', () => {
    it('should set game end state', () => {
      const state = reducer(initialState, setGameEnd({
        winner: 'player-1',
        scores: { 'player-1': 20, 'player-2': 15 },
      }));

      expect(state.status).toBe('finished');
      expect(state.winner).toBe('player-1');
      expect(state.scores).toEqual({ 'player-1': 20, 'player-2': 15 });
      expect(state.endedAt).toBeDefined();
    });
  });

  describe('addActionLog', () => {
    it('should add action log', () => {
      const state = reducer(initialState, addActionLog({
        type: 'play_card',
        playerId: 'p1',
      }));

      expect(state.actionLog.length).toBe(1);
      expect(state.actionLog[0].type).toBe('play_card');
      expect(state.actionLog[0].id).toBeDefined();
      expect(state.actionLog[0].timestamp).toBeDefined();
    });

    it('should limit log to 100 entries', () => {
      let state = initialState;
      for (let i = 0; i < 110; i++) {
        state = reducer(state, addActionLog({ type: 'test', index: i }));
      }

      expect(state.actionLog.length).toBe(100);
    });
  });

  describe('clearActionLog', () => {
    it('should clear action log', () => {
      let state = reducer(initialState, addActionLog({ type: 'test' }));
      state = reducer(state, clearActionLog());

      expect(state.actionLog.length).toBe(0);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      const state = reducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
    });
  });

  describe('setError', () => {
    it('should set error', () => {
      const state = reducer(initialState, setError('Something went wrong'));
      expect(state.error).toBe('Something went wrong');
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      let state = reducer(initialState, setError('error'));
      state = reducer(state, clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('resetGame', () => {
    it('should reset to initial state', () => {
      let state = reducer(initialState, setGameState({
        id: 'game-1',
        round: 5,
        foodPool: 10,
      }));
      state = reducer(state, resetGame());

      expect(state).toEqual(initialState);
    });
  });

  describe('joinGame async thunk', () => {
    it('should handle pending', () => {
      const state = reducer(initialState, { type: joinGame.pending.type });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle fulfilled', () => {
      const state = reducer(initialState, {
        type: joinGame.fulfilled.type,
        payload: { gameId: 'game-123' },
      });
      expect(state.loading).toBe(false);
      expect(state.gameId).toBe('game-123');
    });

    it('should handle rejected', () => {
      const state = reducer(initialState, {
        type: joinGame.rejected.type,
        payload: 'Failed to join',
      });
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to join');
    });
  });
});
