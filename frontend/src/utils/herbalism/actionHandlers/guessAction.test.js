/**
 * 猜牌動作處理器單元測試
 * 工作單 0025
 */

import {
  handleGuessAction,
  hasOnlyOneActivePlayer,
  getActivePlayerCount,
  mustGuess,
  getHiddenCardsForPlayer
} from './guessAction';
import {
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  ACTION_TYPE_GUESS
} from '../../../shared/constants';

describe('guessAction - 工作單 0025', () => {
  // 建立測試用遊戲狀態
  const createGameState = (options = {}) => ({
    gameId: 'test_game',
    players: [
      {
        id: 'p1',
        name: '玩家1',
        hand: [],
        isActive: true,
        isCurrentTurn: true
      },
      {
        id: 'p2',
        name: '玩家2',
        hand: [],
        isActive: true,
        isCurrentTurn: false
      },
      {
        id: 'p3',
        name: '玩家3',
        hand: [],
        isActive: true,
        isCurrentTurn: false
      }
    ],
    hiddenCards: [
      { id: 'h1', color: 'red' },
      { id: 'h2', color: 'blue' }
    ],
    currentPlayerIndex: 0,
    gamePhase: GAME_PHASE_PLAYING,
    winner: null,
    gameHistory: [],
    ...options
  });

  describe('hasOnlyOneActivePlayer', () => {
    test('三個活躍玩家時應返回 false', () => {
      const players = [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: true },
        { id: 'p3', isActive: true }
      ];
      expect(hasOnlyOneActivePlayer(players)).toBe(false);
    });

    test('一個活躍玩家時應返回 true', () => {
      const players = [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: false },
        { id: 'p3', isActive: false }
      ];
      expect(hasOnlyOneActivePlayer(players)).toBe(true);
    });

    test('沒有活躍玩家時應返回 true', () => {
      const players = [
        { id: 'p1', isActive: false },
        { id: 'p2', isActive: false }
      ];
      expect(hasOnlyOneActivePlayer(players)).toBe(true);
    });
  });

  describe('getActivePlayerCount', () => {
    test('應返回正確的活躍玩家數量', () => {
      const players = [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: false },
        { id: 'p3', isActive: true }
      ];
      expect(getActivePlayerCount(players)).toBe(2);
    });
  });

  describe('mustGuess', () => {
    test('只剩一個活躍玩家時必須猜牌', () => {
      const players = [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: false }
      ];
      expect(mustGuess(players)).toBe(true);
    });

    test('多個活躍玩家時不必須猜牌', () => {
      const players = [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: true }
      ];
      expect(mustGuess(players)).toBe(false);
    });
  });

  describe('handleGuessAction - 猜對處理', () => {
    test('猜對時應該獲勝', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(true);
      expect(result.gameState.winner).toBe('p1');
      expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
      expect(result.message).toContain('恭喜猜對了');
    });

    test('猜對時應該公布正確答案', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.revealedCards).toBeDefined();
      expect(result.revealedCards.length).toBe(2);
      expect(result.revealedCards[0].isHidden).toBe(false);
      expect(result.revealedCards[1].isHidden).toBe(false);
    });

    test('猜對時顏色順序可以不同', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['blue', 'red'] // 順序相反
      };

      const result = handleGuessAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(true);
    });
  });

  describe('handleGuessAction - 猜錯處理', () => {
    test('猜錯時玩家應該退出遊戲', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['green', 'yellow'] // 錯誤的顏色
      };

      const result = handleGuessAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(false);
      const player1 = result.gameState.players.find(p => p.id === 'p1');
      expect(player1.isActive).toBe(false);
    });

    test('猜錯時蓋牌應該保持隱藏', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['green', 'yellow']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.revealedCards).toBeNull();
      // hiddenCards 應該沒有 isHidden: false
      expect(result.gameState.hiddenCards[0].isHidden).toBeUndefined();
    });

    test('猜錯時應該切換到下一個玩家', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['green', 'yellow']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.gameState.currentPlayerIndex).toBe(1);
      const player2 = result.gameState.players.find(p => p.id === 'p2');
      expect(player2.isCurrentTurn).toBe(true);
    });

    test('猜錯且只剩一個玩家時，遊戲結束沒有獲勝者', () => {
      const gameState = createGameState({
        players: [
          { id: 'p1', name: '玩家1', isActive: true, isCurrentTurn: true },
          { id: 'p2', name: '玩家2', isActive: false, isCurrentTurn: false },
          { id: 'p3', name: '玩家3', isActive: false, isCurrentTurn: false }
        ]
      });
      const action = {
        playerId: 'p1',
        guessedColors: ['green', 'yellow']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(false);
      expect(result.gameState.gamePhase).toBe(GAME_PHASE_FINISHED);
      expect(result.gameState.winner).toBeNull();
      expect(result.message).toContain('沒有獲勝者');
    });
  });

  describe('handleGuessAction - 驗證', () => {
    test('不是自己的回合時應該失敗', () => {
      const gameState = createGameState({ currentPlayerIndex: 1 });
      const action = {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('不是你的回合');
    });

    test('玩家不存在時應該失敗', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'unknown',
        guessedColors: ['red', 'blue']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('玩家不存在');
    });

    test('玩家已退出遊戲時應該失敗', () => {
      const gameState = createGameState({
        players: [
          { id: 'p1', name: '玩家1', isActive: false, isCurrentTurn: true },
          { id: 'p2', name: '玩家2', isActive: true, isCurrentTurn: false }
        ],
        currentPlayerIndex: 0
      });
      const action = {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.success).toBe(false);
      expect(result.message).toBe('你已經退出遊戲');
    });
  });

  describe('handleGuessAction - 歷史記錄', () => {
    test('應該正確記錄猜對的歷史', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['red', 'blue']
      };

      const result = handleGuessAction(gameState, action);

      expect(result.gameState.gameHistory.length).toBe(1);
      const historyEntry = result.gameState.gameHistory[0];
      expect(historyEntry.type).toBe(ACTION_TYPE_GUESS);
      expect(historyEntry.playerId).toBe('p1');
      expect(historyEntry.guessedColors).toEqual(['red', 'blue']);
      expect(historyEntry.isCorrect).toBe(true);
      expect(historyEntry.timestamp).toBeDefined();
    });

    test('應該正確記錄猜錯的歷史', () => {
      const gameState = createGameState();
      const action = {
        playerId: 'p1',
        guessedColors: ['green', 'yellow']
      };

      const result = handleGuessAction(gameState, action);

      const historyEntry = result.gameState.gameHistory[0];
      expect(historyEntry.isCorrect).toBe(false);
    });
  });

  describe('getHiddenCardsForPlayer', () => {
    test('當前玩家可以查看蓋牌', () => {
      const gameState = createGameState();

      const result = getHiddenCardsForPlayer(gameState, 'p1');

      expect(result.success).toBe(true);
      expect(result.cards.length).toBe(2);
      expect(result.cards[0].color).toBe('red');
      expect(result.cards[1].color).toBe('blue');
    });

    test('不是自己回合時無法查看蓋牌', () => {
      const gameState = createGameState({ currentPlayerIndex: 1 });

      const result = getHiddenCardsForPlayer(gameState, 'p1');

      expect(result.success).toBe(false);
      expect(result.message).toBe('不是你的回合');
    });

    test('玩家不存在時無法查看蓋牌', () => {
      const gameState = createGameState();

      const result = getHiddenCardsForPlayer(gameState, 'unknown');

      expect(result.success).toBe(false);
      expect(result.message).toBe('玩家不存在');
    });
  });
});
