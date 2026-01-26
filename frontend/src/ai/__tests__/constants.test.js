/**
 * AI 相關常數測試
 */

import {
  AI_DIFFICULTY,
  ALL_AI_DIFFICULTIES,
  AI_DIFFICULTY_DESCRIPTIONS,
  AI_PLAYER_NAMES,
  AI_THINK_DELAY,
  PLAYER_TYPE,
  AI_THRESHOLDS,
  isValidAIDifficulty,
  getAIDifficultyDescription,
  getAIPlayerName
} from '../../shared/constants';

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

  describe('AI_DIFFICULTY_DESCRIPTIONS', () => {
    test('should have descriptions for all difficulties', () => {
      expect(AI_DIFFICULTY_DESCRIPTIONS[AI_DIFFICULTY.EASY]).toBeDefined();
      expect(AI_DIFFICULTY_DESCRIPTIONS[AI_DIFFICULTY.MEDIUM]).toBeDefined();
      expect(AI_DIFFICULTY_DESCRIPTIONS[AI_DIFFICULTY.HARD]).toBeDefined();
    });
  });

  describe('AI_PLAYER_NAMES', () => {
    test('should have at least 4 names', () => {
      expect(AI_PLAYER_NAMES.length).toBeGreaterThanOrEqual(4);
    });

    test('should contain expected names', () => {
      expect(AI_PLAYER_NAMES).toContain('小草');
      expect(AI_PLAYER_NAMES).toContain('藥師');
    });
  });

  describe('AI_THINK_DELAY', () => {
    test('should have valid delay values', () => {
      expect(AI_THINK_DELAY.MIN).toBeLessThan(AI_THINK_DELAY.MAX);
      expect(AI_THINK_DELAY.FOLLOW_GUESS_MIN).toBeLessThan(AI_THINK_DELAY.FOLLOW_GUESS_MAX);
      expect(AI_THINK_DELAY.MIN).toBeGreaterThan(0);
    });
  });

  describe('PLAYER_TYPE', () => {
    test('should have human and ai types', () => {
      expect(PLAYER_TYPE.HUMAN).toBe('human');
      expect(PLAYER_TYPE.AI).toBe('ai');
    });
  });

  describe('AI_THRESHOLDS', () => {
    test('should have valid threshold values', () => {
      expect(AI_THRESHOLDS.MEDIUM_GUESS_CONFIDENCE).toBeGreaterThan(0);
      expect(AI_THRESHOLDS.MEDIUM_GUESS_CONFIDENCE).toBeLessThanOrEqual(1);
      expect(AI_THRESHOLDS.HARD_GUESS_CONFIDENCE).toBeGreaterThan(AI_THRESHOLDS.MEDIUM_GUESS_CONFIDENCE);
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

    test('should return unknown for invalid difficulty', () => {
      const desc = getAIDifficultyDescription('invalid');
      expect(desc).toBe('未知難度');
    });
  });

  describe('getAIPlayerName', () => {
    test('should return name for valid index', () => {
      expect(getAIPlayerName(0)).toBe('小草');
      expect(getAIPlayerName(1)).toBe('藥師');
    });

    test('should wrap around for large index', () => {
      expect(getAIPlayerName(4)).toBe('小草');
      expect(getAIPlayerName(5)).toBe('藥師');
    });
  });
});
