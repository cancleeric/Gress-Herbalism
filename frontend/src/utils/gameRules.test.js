/**
 * 遊戲規則驗證函數單元測試
 * 工作單 0007
 */

import {
  validatePlayerCount,
  validateColorSelection,
  validateQuestionType
} from './gameRules';

import {
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL
} from '../../../shared/constants.js';

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
