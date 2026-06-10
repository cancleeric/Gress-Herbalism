/**
 * AI 相關常數測試
 *
 * 工單 0199：修正測試以匹配實際 shared/constants.js 的 API
 */

import {
  AI_DIFFICULTY,
  ALL_AI_DIFFICULTIES,
  AI_PLAYER_NAMES,
  AI_THINK_DELAY,
  PLAYER_TYPE,
  isValidAIDifficulty,
  getAIDifficultyDescription,
  getAIPlayerName
} from '../../../shared/constants';

describe('AI Constants', () => {
  describe('AI_DIFFICULTY', () => {
    test('should have three difficulty levels', () => {
      expect(AI_DIFFICULTY.EASY).toBe('easy');
      expect(AI_DIFFICULTY.MEDIUM).toBe('medium');
      expect(AI_DIFFICULTY.HARD).toBe('hard');
    });

    test('ALL_AI_DIFFICULTIES should contain all difficulties', () => {
      expect(ALL_AI_DIFFICULTIES).toContain('easy');
      expect(ALL_AI_DIFFICULTIES).toContain('medium');
      expect(ALL_AI_DIFFICULTIES).toContain('hard');
      expect(ALL_AI_DIFFICULTIES).toHaveLength(3);
    });
  });

  describe('AI_PLAYER_NAMES', () => {
    test('should have at least 3 names', () => {
      expect(AI_PLAYER_NAMES.length).toBeGreaterThanOrEqual(3);
    });

    test('should contain expected names', () => {
      expect(AI_PLAYER_NAMES).toContain('小草');
      expect(AI_PLAYER_NAMES).toContain('小花');
      expect(AI_PLAYER_NAMES).toContain('小樹');
    });
  });

  describe('AI_THINK_DELAY', () => {
    test('should have delay values for each difficulty', () => {
      expect(AI_THINK_DELAY[AI_DIFFICULTY.EASY]).toBeGreaterThan(0);
      expect(AI_THINK_DELAY[AI_DIFFICULTY.MEDIUM]).toBeGreaterThan(0);
      expect(AI_THINK_DELAY[AI_DIFFICULTY.HARD]).toBeGreaterThan(0);
    });

    test('harder difficulties should have longer delays', () => {
      expect(AI_THINK_DELAY[AI_DIFFICULTY.HARD]).toBeGreaterThanOrEqual(AI_THINK_DELAY[AI_DIFFICULTY.MEDIUM]);
      expect(AI_THINK_DELAY[AI_DIFFICULTY.MEDIUM]).toBeGreaterThanOrEqual(AI_THINK_DELAY[AI_DIFFICULTY.EASY]);
    });
  });

  describe('PLAYER_TYPE', () => {
    test('should have human and ai types', () => {
      expect(PLAYER_TYPE.HUMAN).toBe('human');
      expect(PLAYER_TYPE.AI).toBe('ai');
    });
  });

  describe('isValidAIDifficulty', () => {
    test('should return true for valid difficulties', () => {
      expect(isValidAIDifficulty('easy')).toBe(true);
      expect(isValidAIDifficulty('medium')).toBe(true);
      expect(isValidAIDifficulty('hard')).toBe(true);
    });

    test('should return false for invalid difficulties', () => {
      expect(isValidAIDifficulty('invalid')).toBe(false);
      expect(isValidAIDifficulty('')).toBe(false);
      expect(isValidAIDifficulty(null)).toBe(false);
    });
  });

  describe('getAIDifficultyDescription', () => {
    test('should return description for valid difficulty', () => {
      const desc = getAIDifficultyDescription('easy');
      expect(desc).toContain('簡單');
    });

    test('should return descriptions for all difficulties', () => {
      expect(getAIDifficultyDescription('easy')).toBeDefined();
      expect(getAIDifficultyDescription('medium')).toBeDefined();
      expect(getAIDifficultyDescription('hard')).toBeDefined();
    });

    test('should return unknown for invalid difficulty', () => {
      const desc = getAIDifficultyDescription('invalid');
      expect(desc).toBe('未知難度');
    });
  });

  describe('getAIPlayerName', () => {
    test('should return formatted name with index', () => {
      const name = getAIPlayerName(0, 'easy');
      expect(name).toContain('AI');
      expect(name).toContain('1');
    });

    test('should include difficulty description in name', () => {
      const easyName = getAIPlayerName(0, 'easy');
      expect(easyName).toContain('初學者');

      const mediumName = getAIPlayerName(0, 'medium');
      expect(mediumName).toContain('中級');

      const hardName = getAIPlayerName(0, 'hard');
      expect(hardName).toContain('專家');
    });

    test('should handle missing difficulty gracefully', () => {
      const name = getAIPlayerName(0);
      expect(name).toContain('AI');
      expect(name).toContain('1');
    });
  });
});
