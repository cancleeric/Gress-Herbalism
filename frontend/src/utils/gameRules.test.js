/**
 * 遊戲規則驗證函數單元測試
 * 工作單 0007, 0008
 */

import {
  validatePlayerCount,
  validateColorSelection,
  validateQuestionType,
  validateGuess,
  checkGameEnd,
  mustGuess,
  getNextPlayerIndex
} from './gameRules';

import {
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED
} from '../shared/constants';

describe('validatePlayerCount - 工作單 0007', () => {
  test('3 人應返回 true', () => {
    expect(validatePlayerCount(3)).toBe(true);
  });

  test('4 人應返回 true', () => {
    expect(validatePlayerCount(4)).toBe(true);
  });

  test('2 人應返回 false', () => {
    expect(validatePlayerCount(2)).toBe(false);
  });

  test('5 人應返回 false', () => {
    expect(validatePlayerCount(5)).toBe(false);
  });

  test('0 人應返回 false', () => {
    expect(validatePlayerCount(0)).toBe(false);
  });

  test('負數應返回 false', () => {
    expect(validatePlayerCount(-1)).toBe(false);
  });
});

describe('validateColorSelection - 工作單 0007', () => {
  test('兩個不同有效顏色應返回 true', () => {
    expect(validateColorSelection(['red', 'blue'])).toBe(true);
    expect(validateColorSelection(['yellow', 'green'])).toBe(true);
    expect(validateColorSelection(['red', 'yellow'])).toBe(true);
  });

  test('相同顏色應返回 false', () => {
    expect(validateColorSelection(['red', 'red'])).toBe(false);
    expect(validateColorSelection(['blue', 'blue'])).toBe(false);
  });

  test('只有一個顏色應返回 false', () => {
    expect(validateColorSelection(['red'])).toBe(false);
  });

  test('超過兩個顏色應返回 false', () => {
    expect(validateColorSelection(['red', 'blue', 'green'])).toBe(false);
  });

  test('空陣列應返回 false', () => {
    expect(validateColorSelection([])).toBe(false);
  });

  test('無效顏色應返回 false', () => {
    expect(validateColorSelection(['red', 'purple'])).toBe(false);
    expect(validateColorSelection(['orange', 'blue'])).toBe(false);
  });

  test('非陣列應返回 false', () => {
    expect(validateColorSelection('red')).toBe(false);
    expect(validateColorSelection(null)).toBe(false);
    expect(validateColorSelection(undefined)).toBe(false);
  });
});

describe('validateQuestionType - 工作單 0007', () => {
  const playerHand = [
    { id: 'red-1', color: 'red', isHidden: false },
    { id: 'blue-1', color: 'blue', isHidden: false }
  ];

  const emptyHand = [];

  const targetHand = [
    { id: 'yellow-1', color: 'yellow', isHidden: false },
    { id: 'green-1', color: 'green', isHidden: false }
  ];

  describe('無效問牌類型', () => {
    test('無效類型應返回錯誤', () => {
      const result = validateQuestionType(0, ['red', 'blue'], playerHand, targetHand);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('無效的問牌類型');
    });

    test('類型 4 應返回錯誤', () => {
      const result = validateQuestionType(4, ['red', 'blue'], playerHand, targetHand);
      expect(result.isValid).toBe(false);
    });
  });

  describe('無效顏色選擇', () => {
    test('相同顏色應返回錯誤', () => {
      const result = validateQuestionType(1, ['red', 'red'], playerHand, targetHand);
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('顏色選擇無效');
    });

    test('無效顏色應返回錯誤', () => {
      const result = validateQuestionType(1, ['red', 'purple'], playerHand, targetHand);
      expect(result.isValid).toBe(false);
    });
  });

  describe('類型1 - 兩個顏色各一張', () => {
    test('有效選擇應返回成功', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_ONE_EACH,
        ['red', 'blue'],
        playerHand,
        targetHand
      );
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    test('空手牌也可以執行', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_ONE_EACH,
        ['red', 'blue'],
        emptyHand,
        targetHand
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('類型2 - 其中一種顏色全部', () => {
    test('有效選擇應返回成功', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_ALL_ONE_COLOR,
        ['red', 'blue'],
        playerHand,
        targetHand
      );
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('');
    });

    test('空手牌也可以執行', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_ALL_ONE_COLOR,
        ['yellow', 'green'],
        emptyHand,
        targetHand
      );
      expect(result.isValid).toBe(true);
    });
  });

  describe('類型3 - 給一張要全部', () => {
    test('有其中一個顏色的牌應返回成功', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_GIVE_ONE_GET_ALL,
        ['red', 'yellow'],
        playerHand,
        targetHand
      );
      expect(result.isValid).toBe(true);
    });

    test('有兩個顏色的牌都有應返回成功', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_GIVE_ONE_GET_ALL,
        ['red', 'blue'],
        playerHand,
        targetHand
      );
      expect(result.isValid).toBe(true);
    });

    test('沒有任何選定顏色的牌應返回錯誤', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_GIVE_ONE_GET_ALL,
        ['yellow', 'green'],
        playerHand,
        targetHand
      );
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('沒有');
    });

    test('空手牌應返回錯誤', () => {
      const result = validateQuestionType(
        QUESTION_TYPE_GIVE_ONE_GET_ALL,
        ['red', 'blue'],
        emptyHand,
        targetHand
      );
      expect(result.isValid).toBe(false);
    });
  });
});

// ==================== 工作單 0008 測試 ====================

describe('validateGuess - 工作單 0008', () => {
  const hiddenCards = [
    { id: 'red-1', color: 'red', isHidden: true },
    { id: 'blue-1', color: 'blue', isHidden: true }
  ];

  test('猜對應返回 isCorrect: true', () => {
    const result = validateGuess(['red', 'blue'], hiddenCards);
    expect(result.isCorrect).toBe(true);
    expect(result.message).toContain('猜對');
  });

  test('猜對（順序不同）應返回 isCorrect: true', () => {
    const result = validateGuess(['blue', 'red'], hiddenCards);
    expect(result.isCorrect).toBe(true);
  });

  test('猜錯應返回 isCorrect: false', () => {
    const result = validateGuess(['red', 'yellow'], hiddenCards);
    expect(result.isCorrect).toBe(false);
    expect(result.message).toContain('猜錯');
  });

  test('重複顏色猜測應正確處理', () => {
    const sameColorHidden = [
      { id: 'red-1', color: 'red', isHidden: true },
      { id: 'red-2', color: 'red', isHidden: true }
    ];
    const result = validateGuess(['red', 'red'], sameColorHidden);
    expect(result.isCorrect).toBe(true);
  });

  test('猜測數量不對應返回錯誤', () => {
    const result = validateGuess(['red'], hiddenCards);
    expect(result.isCorrect).toBe(false);
    expect(result.message).toContain('2 個顏色');
  });

  test('無效顏色應返回錯誤', () => {
    const result = validateGuess(['red', 'purple'], hiddenCards);
    expect(result.isCorrect).toBe(false);
    expect(result.message).toContain('無效');
  });

  test('非陣列應返回錯誤', () => {
    const result = validateGuess('red', hiddenCards);
    expect(result.isCorrect).toBe(false);
  });
});

describe('checkGameEnd - 工作單 0008', () => {
  test('有獲勝者應返回 true', () => {
    const gameState = {
      winner: 'player1',
      gamePhase: GAME_PHASE_FINISHED
    };
    expect(checkGameEnd(gameState)).toBe(true);
  });

  test('遊戲階段為結束（無獲勝者）應返回 true', () => {
    const gameState = {
      winner: null,
      gamePhase: GAME_PHASE_FINISHED
    };
    expect(checkGameEnd(gameState)).toBe(true);
  });

  test('遊戲進行中應返回 false', () => {
    const gameState = {
      winner: null,
      gamePhase: GAME_PHASE_PLAYING
    };
    expect(checkGameEnd(gameState)).toBe(false);
  });
});

describe('mustGuess - 工作單 0008', () => {
  test('只剩一個玩家應返回 true', () => {
    const gameState = {
      players: [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: false },
        { id: 'p3', isActive: false }
      ]
    };
    expect(mustGuess(gameState)).toBe(true);
  });

  test('還有多個玩家應返回 false', () => {
    const gameState = {
      players: [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: true },
        { id: 'p3', isActive: false }
      ]
    };
    expect(mustGuess(gameState)).toBe(false);
  });

  test('所有玩家都在應返回 false', () => {
    const gameState = {
      players: [
        { id: 'p1', isActive: true },
        { id: 'p2', isActive: true },
        { id: 'p3', isActive: true }
      ]
    };
    expect(mustGuess(gameState)).toBe(false);
  });

  test('無效的 players 應返回 false', () => {
    expect(mustGuess({})).toBe(false);
    expect(mustGuess({ players: null })).toBe(false);
    expect(mustGuess({ players: 'invalid' })).toBe(false);
  });
});

describe('getNextPlayerIndex - 工作單 0008', () => {
  test('應返回下一個活躍玩家的索引', () => {
    const players = [
      { id: 'p1', isActive: true },
      { id: 'p2', isActive: true },
      { id: 'p3', isActive: true }
    ];
    expect(getNextPlayerIndex(0, players)).toBe(1);
    expect(getNextPlayerIndex(1, players)).toBe(2);
    expect(getNextPlayerIndex(2, players)).toBe(0);
  });

  test('應跳過已退出的玩家', () => {
    const players = [
      { id: 'p1', isActive: true },
      { id: 'p2', isActive: false },
      { id: 'p3', isActive: true }
    ];
    expect(getNextPlayerIndex(0, players)).toBe(2);
    expect(getNextPlayerIndex(2, players)).toBe(0);
  });

  test('只有一個活躍玩家應返回該玩家索引', () => {
    const players = [
      { id: 'p1', isActive: false },
      { id: 'p2', isActive: true },
      { id: 'p3', isActive: false }
    ];
    expect(getNextPlayerIndex(0, players)).toBe(1);
    expect(getNextPlayerIndex(1, players)).toBe(1);
  });

  test('沒有活躍玩家應返回 -1', () => {
    const players = [
      { id: 'p1', isActive: false },
      { id: 'p2', isActive: false }
    ];
    expect(getNextPlayerIndex(0, players)).toBe(-1);
  });

  test('空陣列應返回 -1', () => {
    expect(getNextPlayerIndex(0, [])).toBe(-1);
  });

  test('無效參數應返回 -1', () => {
    expect(getNextPlayerIndex(0, null)).toBe(-1);
    expect(getNextPlayerIndex(0, undefined)).toBe(-1);
  });
});
