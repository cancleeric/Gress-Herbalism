/**
 * Redux Selectors 單元測試
 * 工單 0162
 */

import {
  selectGameRoomState,
  selectCurrentPlayer,
  selectActivePlayers,
  selectGameHistory,
  selectWinner
} from './selectors';

describe('Redux Selectors', () => {
  const mockState = {
    herbalism: {
      gameId: 'test-game',
      players: [
        { id: '1', name: 'P1', isActive: true },
        { id: '2', name: 'P2', isActive: false },
        { id: '3', name: 'P3', isActive: true }
      ],
      currentPlayerIndex: 0,
      gamePhase: 'playing',
      winner: null,
      hiddenCards: [
        { id: 'h1', color: 'red' },
        { id: 'h2', color: 'blue' }
      ],
      gameHistory: [{ type: 'question', round: 1 }],
      currentPlayerId: '1',
      maxPlayers: 4
    }
  };

  beforeEach(() => {
    // 重置記憶化 selector 的快取
    selectGameRoomState.clearCache();
    selectCurrentPlayer.clearCache();
    selectActivePlayers.clearCache();
  });

  describe('selectGameRoomState', () => {
    test('應返回正確的遊戲狀態', () => {
      const result = selectGameRoomState(mockState);
      expect(result.storeGameId).toBe('test-game');
      expect(result.players).toHaveLength(3);
      expect(result.currentPlayerIndex).toBe(0);
      expect(result.gamePhase).toBe('playing');
      expect(result.winner).toBeNull();
      expect(result.hiddenCards).toHaveLength(2);
      expect(result.gameHistory).toHaveLength(1);
      expect(result.currentPlayerId).toBe('1');
      expect(result.maxPlayers).toBe(4);
    });

    test('相同輸入應返回相同引用（記憶化）', () => {
      const result1 = selectGameRoomState(mockState);
      const result2 = selectGameRoomState(mockState);
      expect(result1).toBe(result2);
    });

    test('不同輸入應返回不同引用', () => {
      const result1 = selectGameRoomState(mockState);
      const newState = { herbalism: { ...mockState.herbalism, gamePhase: 'finished' } };
      const result2 = selectGameRoomState(newState);
      expect(result1).not.toBe(result2);
      expect(result2.gamePhase).toBe('finished');
    });
  });

  describe('selectCurrentPlayer', () => {
    test('應返回當前玩家', () => {
      const result = selectCurrentPlayer(mockState);
      expect(result.id).toBe('1');
      expect(result.name).toBe('P1');
    });

    test('players 為空時應返回 null', () => {
      const result = selectCurrentPlayer({ herbalism: { ...mockState.herbalism, players: [] } });
      expect(result).toBeNull();
    });

    test('currentPlayerIndex 超出範圍時應返回 null', () => {
      const result = selectCurrentPlayer({ herbalism: { ...mockState.herbalism, currentPlayerIndex: 99 } });
      expect(result).toBeNull();
    });

    test('players 為 undefined 時應返回 null', () => {
      const result = selectCurrentPlayer({ herbalism: { ...mockState.herbalism, players: undefined } });
      expect(result).toBeNull();
    });
  });

  describe('selectActivePlayers', () => {
    test('應只返回活躍玩家', () => {
      const result = selectActivePlayers(mockState);
      expect(result).toHaveLength(2);
      expect(result.every(p => p.isActive)).toBe(true);
    });

    test('players 為空時應返回空陣列', () => {
      const result = selectActivePlayers({ herbalism: { ...mockState.herbalism, players: [] } });
      expect(result).toEqual([]);
    });

    test('players 為 undefined 時應返回空陣列', () => {
      const result = selectActivePlayers({ herbalism: { ...mockState.herbalism, players: undefined } });
      expect(result).toEqual([]);
    });
  });

  describe('selectGameHistory', () => {
    test('應返回遊戲歷史', () => {
      const result = selectGameHistory(mockState);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('question');
    });

    test('gameHistory 為 undefined 時應返回空陣列', () => {
      const result = selectGameHistory({ herbalism: { ...mockState.herbalism, gameHistory: undefined } });
      expect(result).toEqual([]);
    });
  });

  describe('selectWinner', () => {
    test('無勝利者時應返回 null', () => {
      const result = selectWinner(mockState);
      expect(result).toBeNull();
    });

    test('有勝利者時應返回勝利者', () => {
      const result = selectWinner({ herbalism: { ...mockState.herbalism, winner: 'player-1' } });
      expect(result).toBe('player-1');
    });
  });
});
