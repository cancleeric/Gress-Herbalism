/**
 * gameLogic 單元測試
 * 工單 0164
 */

const {
  MIN_PLAYERS,
  MAX_PLAYERS,
  WINNING_SCORE,
  canStartGame,
  isGuessCorrect,
  getNextPlayerIndex,
  isOnlyOnePlayerLeft,
  checkWinCondition,
  validateQuestionAction
} = require('../../logic/herbalism/gameLogic');

describe('gameLogic', () => {
  describe('常數', () => {
    test('MIN_PLAYERS 應為 3', () => {
      expect(MIN_PLAYERS).toBe(3);
    });

    test('MAX_PLAYERS 應為 4', () => {
      expect(MAX_PLAYERS).toBe(4);
    });

    test('WINNING_SCORE 應為 7', () => {
      expect(WINNING_SCORE).toBe(7);
    });
  });

  describe('canStartGame', () => {
    test('3 人應可以開始', () => {
      const players = [{}, {}, {}];
      expect(canStartGame(players)).toEqual({ canStart: true });
    });

    test('4 人應可以開始', () => {
      const players = [{}, {}, {}, {}];
      expect(canStartGame(players)).toEqual({ canStart: true });
    });

    test('2 人不應開始', () => {
      const players = [{}, {}];
      const result = canStartGame(players);
      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('3');
    });

    test('5 人不應開始', () => {
      const players = [{}, {}, {}, {}, {}];
      const result = canStartGame(players);
      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('4');
    });

    test('null 不應開始', () => {
      expect(canStartGame(null).canStart).toBe(false);
    });

    test('空陣列不應開始', () => {
      expect(canStartGame([]).canStart).toBe(false);
    });
  });

  describe('isGuessCorrect', () => {
    test('猜對應返回 true', () => {
      const guessed = ['red', 'blue'];
      const hidden = [{ color: 'red' }, { color: 'blue' }];
      expect(isGuessCorrect(guessed, hidden)).toBe(true);
    });

    test('順序不同也算猜對', () => {
      const guessed = ['blue', 'red'];
      const hidden = [{ color: 'red' }, { color: 'blue' }];
      expect(isGuessCorrect(guessed, hidden)).toBe(true);
    });

    test('猜錯應返回 false', () => {
      const guessed = ['red', 'green'];
      const hidden = [{ color: 'red' }, { color: 'blue' }];
      expect(isGuessCorrect(guessed, hidden)).toBe(false);
    });

    test('完全猜錯應返回 false', () => {
      const guessed = ['yellow', 'green'];
      const hidden = [{ color: 'red' }, { color: 'blue' }];
      expect(isGuessCorrect(guessed, hidden)).toBe(false);
    });

    test('null 輸入應返回 false', () => {
      expect(isGuessCorrect(null, [{ color: 'red' }])).toBe(false);
      expect(isGuessCorrect(['red'], null)).toBe(false);
    });

    test('長度不對應返回 false', () => {
      expect(isGuessCorrect(['red'], [{ color: 'red' }, { color: 'blue' }])).toBe(false);
      expect(isGuessCorrect(['red', 'blue'], [{ color: 'red' }])).toBe(false);
    });
  });

  describe('getNextPlayerIndex', () => {
    const players = [
      { id: '1', isActive: true },
      { id: '2', isActive: true },
      { id: '3', isActive: true }
    ];

    test('應返回下一個索引', () => {
      expect(getNextPlayerIndex(0, players)).toBe(1);
      expect(getNextPlayerIndex(1, players)).toBe(2);
    });

    test('最後一個玩家的下一個應是第一個', () => {
      expect(getNextPlayerIndex(2, players)).toBe(0);
    });

    test('應跳過不活躍玩家', () => {
      const playersWithInactive = [
        { id: '1', isActive: true },
        { id: '2', isActive: false },
        { id: '3', isActive: true }
      ];
      expect(getNextPlayerIndex(0, playersWithInactive)).toBe(2);
    });

    test('空陣列應返回 0', () => {
      expect(getNextPlayerIndex(0, [])).toBe(0);
      expect(getNextPlayerIndex(0, null)).toBe(0);
    });
  });

  describe('isOnlyOnePlayerLeft', () => {
    test('1 個活躍玩家應返回 true', () => {
      const players = [
        { isActive: true },
        { isActive: false },
        { isActive: false }
      ];
      expect(isOnlyOnePlayerLeft(players)).toBe(true);
    });

    test('0 個活躍玩家應返回 true', () => {
      const players = [
        { isActive: false },
        { isActive: false }
      ];
      expect(isOnlyOnePlayerLeft(players)).toBe(true);
    });

    test('2 個活躍玩家應返回 false', () => {
      const players = [
        { isActive: true },
        { isActive: true },
        { isActive: false }
      ];
      expect(isOnlyOnePlayerLeft(players)).toBe(false);
    });

    test('null 應返回 false', () => {
      expect(isOnlyOnePlayerLeft(null)).toBe(false);
    });
  });

  describe('checkWinCondition', () => {
    test('分數達到 7 分應返回玩家 ID', () => {
      const scores = { p1: 5, p2: 7, p3: 3 };
      expect(checkWinCondition(scores)).toBe('p2');
    });

    test('分數超過 7 分也應返回玩家 ID', () => {
      const scores = { p1: 10, p2: 3 };
      expect(checkWinCondition(scores)).toBe('p1');
    });

    test('無人達到應返回 null', () => {
      const scores = { p1: 5, p2: 6, p3: 3 };
      expect(checkWinCondition(scores)).toBeNull();
    });

    test('自訂勝利分數', () => {
      const scores = { p1: 5, p2: 3 };
      expect(checkWinCondition(scores, 5)).toBe('p1');
      expect(checkWinCondition(scores, 6)).toBeNull();
    });

    test('null 應返回 null', () => {
      expect(checkWinCondition(null)).toBeNull();
    });
  });

  describe('validateQuestionAction', () => {
    const gameState = {
      players: [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: true },
        { id: 'p3', isActive: false }
      ]
    };

    test('有效的問牌動作', () => {
      const action = { targetPlayerId: 'p2', colors: ['red', 'blue'], questionType: 1 };
      expect(validateQuestionAction(action, gameState)).toEqual({ valid: true });
    });

    test('缺少目標玩家', () => {
      const action = { colors: ['red', 'blue'], questionType: 1 };
      const result = validateQuestionAction(action, gameState);
      expect(result.valid).toBe(false);
    });

    test('缺少顏色', () => {
      const action = { targetPlayerId: 'p2', questionType: 1 };
      const result = validateQuestionAction(action, gameState);
      expect(result.valid).toBe(false);
    });

    test('顏色數量錯誤', () => {
      const action = { targetPlayerId: 'p2', colors: ['red'], questionType: 1 };
      const result = validateQuestionAction(action, gameState);
      expect(result.valid).toBe(false);
    });

    test('無效的問牌類型', () => {
      const action = { targetPlayerId: 'p2', colors: ['red', 'blue'], questionType: 4 };
      const result = validateQuestionAction(action, gameState);
      expect(result.valid).toBe(false);
    });

    test('目標玩家不活躍', () => {
      const action = { targetPlayerId: 'p3', colors: ['red', 'blue'], questionType: 1 };
      const result = validateQuestionAction(action, gameState);
      expect(result.valid).toBe(false);
    });

    test('目標玩家不存在', () => {
      const action = { targetPlayerId: 'p999', colors: ['red', 'blue'], questionType: 1 };
      const result = validateQuestionAction(action, gameState);
      expect(result.valid).toBe(false);
    });

    test('所有問牌類型 (1, 2, 3) 都有效', () => {
      [1, 2, 3].forEach(type => {
        const action = { targetPlayerId: 'p2', colors: ['red', 'blue'], questionType: type };
        expect(validateQuestionAction(action, gameState).valid).toBe(true);
      });
    });
  });
});
