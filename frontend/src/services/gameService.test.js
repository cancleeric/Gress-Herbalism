/**
 * 遊戲服務單元測試
 * 工作單 0009
 */

import {
  createGame,
  getGameState,
  updateGameState,
  deleteGame,
  clearAllGames
} from './gameService';

import {
  GAME_PHASE_PLAYING,
  TOTAL_CARDS,
  HIDDEN_CARDS_COUNT
} from '../../../shared/constants.js';

describe('gameService - 工作單 0009', () => {
  // 每個測試後清除所有遊戲
  afterEach(() => {
    clearAllGames();
  });

  describe('createGame', () => {
    const players = [
      { id: 'p1', name: '玩家1' },
      { id: 'p2', name: '玩家2' },
      { id: 'p3', name: '玩家3' }
    ];

    test('應正確建立 3 人遊戲', () => {
      const gameState = createGame(players);

      expect(gameState).toBeDefined();
      expect(gameState.gameId).toBeDefined();
      expect(gameState.players).toHaveLength(3);
      expect(gameState.hiddenCards).toHaveLength(HIDDEN_CARDS_COUNT);
      expect(gameState.currentPlayerIndex).toBe(0);
      expect(gameState.gamePhase).toBe(GAME_PHASE_PLAYING);
      expect(gameState.winner).toBeNull();
      expect(gameState.gameHistory).toEqual([]);
    });

    test('應正確建立 4 人遊戲', () => {
      const fourPlayers = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' },
        { id: 'p4', name: '玩家4' }
      ];
      const gameState = createGame(fourPlayers);

      expect(gameState.players).toHaveLength(4);
      // 4 人遊戲每人 3 張牌
      gameState.players.forEach(player => {
        expect(player.hand).toHaveLength(3);
      });
    });

    test('玩家應有正確的初始狀態', () => {
      const gameState = createGame(players);

      gameState.players.forEach((player, index) => {
        expect(player.id).toBeDefined();
        expect(player.name).toBeDefined();
        expect(player.hand).toBeDefined();
        expect(player.isActive).toBe(true);
        expect(player.isCurrentTurn).toBe(index === 0);
      });
    });

    test('蓋牌應有 isHidden: true', () => {
      const gameState = createGame(players);

      gameState.hiddenCards.forEach(card => {
        expect(card.isHidden).toBe(true);
      });
    });

    test('所有牌應被正確分配', () => {
      const gameState = createGame(players);

      const hiddenCount = gameState.hiddenCards.length;
      const handCount = gameState.players.reduce(
        (sum, player) => sum + player.hand.length,
        0
      );

      expect(hiddenCount + handCount).toBe(TOTAL_CARDS);
    });

    test('2 人遊戲應拋出錯誤', () => {
      const twoPlayers = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' }
      ];

      expect(() => createGame(twoPlayers)).toThrow();
    });

    test('5 人遊戲應拋出錯誤', () => {
      const fivePlayers = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' },
        { id: 'p4', name: '玩家4' },
        { id: 'p5', name: '玩家5' }
      ];

      expect(() => createGame(fivePlayers)).toThrow();
    });
  });

  describe('getGameState', () => {
    test('應返回已建立的遊戲狀態', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);
      const retrieved = getGameState(gameState.gameId);

      expect(retrieved).toEqual(gameState);
    });

    test('不存在的遊戲應返回 null', () => {
      const result = getGameState('non_existent_game');
      expect(result).toBeNull();
    });
  });

  describe('updateGameState', () => {
    test('應正確更新遊戲狀態', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const updated = updateGameState(gameState.gameId, {
        currentPlayerIndex: 1
      });

      expect(updated.currentPlayerIndex).toBe(1);
      expect(updated.gameId).toBe(gameState.gameId);
    });

    test('應可以更新多個屬性', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const updated = updateGameState(gameState.gameId, {
        currentPlayerIndex: 2,
        winner: 'p1'
      });

      expect(updated.currentPlayerIndex).toBe(2);
      expect(updated.winner).toBe('p1');
    });

    test('更新應持久化', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      updateGameState(gameState.gameId, { currentPlayerIndex: 1 });
      const retrieved = getGameState(gameState.gameId);

      expect(retrieved.currentPlayerIndex).toBe(1);
    });

    test('不存在的遊戲應返回 null', () => {
      const result = updateGameState('non_existent_game', { winner: 'p1' });
      expect(result).toBeNull();
    });
  });

  describe('deleteGame', () => {
    test('應成功刪除遊戲', () => {
      const players = [
        { id: 'p1', name: '玩家1' },
        { id: 'p2', name: '玩家2' },
        { id: 'p3', name: '玩家3' }
      ];
      const gameState = createGame(players);

      const deleted = deleteGame(gameState.gameId);
      expect(deleted).toBe(true);

      const retrieved = getGameState(gameState.gameId);
      expect(retrieved).toBeNull();
    });

    test('刪除不存在的遊戲應返回 false', () => {
      const result = deleteGame('non_existent_game');
      expect(result).toBe(false);
    });
  });
});
