/**
 * scoreLogic 單元測試
 * 工單 0164
 */

const {
  GUESS_CORRECT_POINTS,
  FOLLOW_CORRECT_POINTS,
  FOLLOW_WRONG_POINTS,
  calculateGuessScore,
  calculateFollowGuessScore,
  applyScoreChange,
  calculateRoundScores
} = require('../../logic/herbalism/scoreLogic');

describe('scoreLogic', () => {
  describe('常數', () => {
    test('GUESS_CORRECT_POINTS 應為 3', () => {
      expect(GUESS_CORRECT_POINTS).toBe(3);
    });

    test('FOLLOW_CORRECT_POINTS 應為 1', () => {
      expect(FOLLOW_CORRECT_POINTS).toBe(1);
    });

    test('FOLLOW_WRONG_POINTS 應為 -1', () => {
      expect(FOLLOW_WRONG_POINTS).toBe(-1);
    });
  });

  describe('calculateGuessScore', () => {
    test('猜對應得 3 分', () => {
      expect(calculateGuessScore(true)).toBe(3);
    });

    test('猜錯應得 0 分', () => {
      expect(calculateGuessScore(false)).toBe(0);
    });
  });

  describe('calculateFollowGuessScore', () => {
    test('跟猜正確應得 1 分', () => {
      expect(calculateFollowGuessScore(true)).toBe(1);
    });

    test('跟猜錯誤應得 -1 分', () => {
      expect(calculateFollowGuessScore(false)).toBe(-1);
    });
  });

  describe('applyScoreChange', () => {
    test('正常加分', () => {
      expect(applyScoreChange(5, 3)).toBe(8);
    });

    test('正常扣分', () => {
      expect(applyScoreChange(5, -1)).toBe(4);
    });

    test('扣分不應低於 0', () => {
      expect(applyScoreChange(0, -1)).toBe(0);
    });

    test('從低分扣分應為 0', () => {
      expect(applyScoreChange(1, -5)).toBe(0);
    });

    test('0 分加 0 分應為 0', () => {
      expect(applyScoreChange(0, 0)).toBe(0);
    });
  });

  describe('calculateRoundScores', () => {
    test('猜對：猜牌者 +3，跟猜者各 +1', () => {
      const result = calculateRoundScores({
        guessingPlayerId: 'p1',
        isCorrect: true,
        followingPlayers: ['p2', 'p3']
      });
      expect(result).toEqual({
        p1: 3,
        p2: 1,
        p3: 1
      });
    });

    test('猜錯：猜牌者 0，跟猜者各 -1', () => {
      const result = calculateRoundScores({
        guessingPlayerId: 'p1',
        isCorrect: false,
        followingPlayers: ['p2']
      });
      expect(result).toEqual({
        p1: 0,
        p2: -1
      });
    });

    test('無跟猜者：只有猜牌者得分', () => {
      const result = calculateRoundScores({
        guessingPlayerId: 'p1',
        isCorrect: true,
        followingPlayers: []
      });
      expect(result).toEqual({ p1: 3 });
    });

    test('省略 followingPlayers 預設為空陣列', () => {
      const result = calculateRoundScores({
        guessingPlayerId: 'p1',
        isCorrect: true
      });
      expect(result).toEqual({ p1: 3 });
    });

    test('無猜牌者 ID 只計算跟猜者', () => {
      const result = calculateRoundScores({
        isCorrect: true,
        followingPlayers: ['p2']
      });
      expect(result).toEqual({ p2: 1 });
    });
  });
});
