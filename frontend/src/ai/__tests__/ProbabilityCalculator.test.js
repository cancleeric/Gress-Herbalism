/**
 * ProbabilityCalculator 單元測試
 */

import ProbabilityCalculator, { createProbabilityCalculator } from '../ProbabilityCalculator';
import { COLORS } from '../../shared/constants';

describe('ProbabilityCalculator', () => {
  describe('constructor', () => {
    test('should initialize with correct initial probabilities', () => {
      const calc = new ProbabilityCalculator();

      const dist = calc.getProbabilityDistribution();

      // 紅: 2/14 ≈ 0.143
      expect(dist[COLORS.RED]).toBeCloseTo(2 / 14, 5);
      // 黃: 3/14 ≈ 0.214
      expect(dist[COLORS.YELLOW]).toBeCloseTo(3 / 14, 5);
      // 綠: 4/14 ≈ 0.286
      expect(dist[COLORS.GREEN]).toBeCloseTo(4 / 14, 5);
      // 藍: 5/14 ≈ 0.357
      expect(dist[COLORS.BLUE]).toBeCloseTo(5 / 14, 5);
    });

    test('should initialize visible counts to zero', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.getVisibleCount(COLORS.RED)).toBe(0);
      expect(calc.getVisibleCount(COLORS.YELLOW)).toBe(0);
      expect(calc.getVisibleCount(COLORS.GREEN)).toBe(0);
      expect(calc.getVisibleCount(COLORS.BLUE)).toBe(0);
    });

    test('should have correct total remaining cards', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.getRemainingCount()).toBe(14);
    });
  });

  describe('reset', () => {
    test('should reset to initial state', () => {
      const calc = new ProbabilityCalculator();

      // 揭示一些牌
      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.BLUE);

      // 重置
      calc.reset();

      // 驗證回到初始狀態
      const dist = calc.getProbabilityDistribution();
      expect(dist[COLORS.RED]).toBeCloseTo(2 / 14, 5);
      expect(calc.getVisibleCount()).toBe(0);
      expect(calc.getRemainingCount()).toBe(14);
    });
  });

  describe('calculateInitialProbabilities', () => {
    test('should calculate correct initial probabilities', () => {
      const calc = new ProbabilityCalculator();

      // 總和應該為 1
      const dist = calc.getProbabilityDistribution();
      const sum = Object.values(dist).reduce((a, b) => a + b, 0);

      expect(sum).toBeCloseTo(1, 5);
    });

    test('should have probabilities proportional to card counts', () => {
      const calc = new ProbabilityCalculator();
      const dist = calc.getProbabilityDistribution();

      // 藍色應該是紅色的 2.5 倍 (5/2)
      expect(dist[COLORS.BLUE] / dist[COLORS.RED]).toBeCloseTo(2.5, 2);

      // 綠色應該是紅色的 2 倍 (4/2)
      expect(dist[COLORS.GREEN] / dist[COLORS.RED]).toBeCloseTo(2, 2);
    });
  });

  describe('updateOnCardRevealed', () => {
    test('should update visible count when card revealed', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);

      expect(calc.getVisibleCount(COLORS.RED)).toBe(1);
      expect(calc.getRemainingCount(COLORS.RED)).toBe(1);
    });

    test('should update probabilities after card revealed', () => {
      const calc = new ProbabilityCalculator();

      // 揭示 1 張紅色牌
      calc.updateOnCardRevealed(COLORS.RED);

      const dist = calc.getProbabilityDistribution();

      // 剩餘 13 張牌：紅1、黃3、綠4、藍5
      expect(dist[COLORS.RED]).toBeCloseTo(1 / 13, 5);
      expect(dist[COLORS.YELLOW]).toBeCloseTo(3 / 13, 5);
      expect(dist[COLORS.GREEN]).toBeCloseTo(4 / 13, 5);
      expect(dist[COLORS.BLUE]).toBeCloseTo(5 / 13, 5);
    });

    test('should handle multiple reveals', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.BLUE);

      // 剩餘 11 張：紅0、黃3、綠4、藍4
      expect(calc.getRemainingCount()).toBe(11);
      expect(calc.getVisibleCount()).toBe(3);

      const dist = calc.getProbabilityDistribution();
      expect(dist[COLORS.RED]).toBe(0);
      expect(dist[COLORS.YELLOW]).toBeCloseTo(3 / 11, 5);
    });

    test('should return false for invalid color', () => {
      const calc = new ProbabilityCalculator();

      const result = calc.updateOnCardRevealed('invalid');

      expect(result).toBe(false);
    });

    test('should warn when all cards of color are visible', () => {
      const calc = new ProbabilityCalculator();
      const spy = jest.spyOn(console, 'warn').mockImplementation();

      // 揭示所有紅色牌 (2張)
      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.RED);

      // 嘗試再揭示一張
      const result = calc.updateOnCardRevealed(COLORS.RED);

      expect(result).toBe(false);
      expect(spy).toHaveBeenCalled();

      spy.mockRestore();
    });

    test('should set probability to zero when all cards visible', () => {
      const calc = new ProbabilityCalculator();

      // 揭示所有紅色牌
      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.RED);

      const dist = calc.getProbabilityDistribution();
      expect(dist[COLORS.RED]).toBe(0);
    });
  });

  describe('updateOnQuestionResult', () => {
    test('should update visible counts based on question result', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnQuestionResult({
        askedColor1: COLORS.RED,
        askedColor2: COLORS.BLUE,
        receivedCount1: 1,
        receivedCount2: 2
      });

      expect(calc.getVisibleCount(COLORS.RED)).toBe(1);
      expect(calc.getVisibleCount(COLORS.BLUE)).toBe(2);
    });

    test('should update probabilities after question', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnQuestionResult({
        askedColor1: COLORS.RED,
        askedColor2: COLORS.YELLOW,
        receivedCount1: 2,
        receivedCount2: 0
      });

      const dist = calc.getProbabilityDistribution();

      // 剩餘 12 張：紅0、黃3、綠4、藍5
      expect(dist[COLORS.RED]).toBe(0);
      expect(dist[COLORS.YELLOW]).toBeCloseTo(3 / 12, 5);
    });

    test('should handle zero received counts', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnQuestionResult({
        askedColor1: COLORS.GREEN,
        askedColor2: COLORS.BLUE,
        receivedCount1: 0,
        receivedCount2: 0
      });

      // 概率分布應該不變
      const dist = calc.getProbabilityDistribution();
      expect(dist[COLORS.RED]).toBeCloseTo(2 / 14, 5);
    });

    test('should return false for null data', () => {
      const calc = new ProbabilityCalculator();

      const result = calc.updateOnQuestionResult(null);

      expect(result).toBe(false);
    });
  });

  describe('recalculateProbabilities', () => {
    test('should maintain probability sum as 1 (or 0 when all visible)', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.BLUE);

      const dist = calc.getProbabilityDistribution();
      const sum = Object.values(dist).reduce((a, b) => a + b, 0);

      expect(sum).toBeCloseTo(1, 5);
    });

    test('should set all probabilities to zero when all cards visible', () => {
      const calc = new ProbabilityCalculator();

      // 揭示所有牌
      for (let i = 0; i < 2; i++) calc.updateOnCardRevealed(COLORS.RED);
      for (let i = 0; i < 3; i++) calc.updateOnCardRevealed(COLORS.YELLOW);
      for (let i = 0; i < 4; i++) calc.updateOnCardRevealed(COLORS.GREEN);
      for (let i = 0; i < 5; i++) calc.updateOnCardRevealed(COLORS.BLUE);

      const dist = calc.getProbabilityDistribution();

      expect(dist[COLORS.RED]).toBe(0);
      expect(dist[COLORS.YELLOW]).toBe(0);
      expect(dist[COLORS.GREEN]).toBe(0);
      expect(dist[COLORS.BLUE]).toBe(0);
    });
  });

  describe('getProbabilityDistribution', () => {
    test('should return object with all colors', () => {
      const calc = new ProbabilityCalculator();
      const dist = calc.getProbabilityDistribution();

      expect(dist).toHaveProperty(COLORS.RED);
      expect(dist).toHaveProperty(COLORS.YELLOW);
      expect(dist).toHaveProperty(COLORS.GREEN);
      expect(dist).toHaveProperty(COLORS.BLUE);
    });

    test('should return current probabilities', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);

      const dist = calc.getProbabilityDistribution();

      expect(dist[COLORS.RED]).toBeCloseTo(1 / 13, 5);
    });
  });

  describe('isColorEliminated', () => {
    test('should return false for colors with probability > 0', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.isColorEliminated(COLORS.RED)).toBe(false);
      expect(calc.isColorEliminated(COLORS.BLUE)).toBe(false);
    });

    test('should return true when all cards of color are visible', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.RED);

      expect(calc.isColorEliminated(COLORS.RED)).toBe(true);
    });

    test('should return false for invalid color', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.isColorEliminated('invalid')).toBe(false);
    });
  });

  describe('getTopProbabilityColors', () => {
    test('should return colors sorted by probability descending', () => {
      const calc = new ProbabilityCalculator();

      const top = calc.getTopProbabilityColors(4);

      // 初始狀態：藍(5/14) > 綠(4/14) > 黃(3/14) > 紅(2/14)
      expect(top[0]).toBe(COLORS.BLUE);
      expect(top[1]).toBe(COLORS.GREEN);
      expect(top[2]).toBe(COLORS.YELLOW);
      expect(top[3]).toBe(COLORS.RED);
    });

    test('should return top 2 by default', () => {
      const calc = new ProbabilityCalculator();

      const top = calc.getTopProbabilityColors();

      expect(top).toHaveLength(2);
      expect(top[0]).toBe(COLORS.BLUE);
      expect(top[1]).toBe(COLORS.GREEN);
    });

    test('should handle ties in probability', () => {
      const calc = new ProbabilityCalculator();

      // 揭示讓某些顏色有相同概率
      calc.updateOnCardRevealed(COLORS.BLUE);
      calc.updateOnCardRevealed(COLORS.GREEN);

      // 剩餘：紅2、黃3、綠3、藍4
      const top = calc.getTopProbabilityColors(4);

      expect(top).toHaveLength(4);
      expect(top[0]).toBe(COLORS.BLUE); // 4/12
    });

    test('should update after cards revealed', () => {
      const calc = new ProbabilityCalculator();

      // 揭示所有藍色牌
      for (let i = 0; i < 5; i++) {
        calc.updateOnCardRevealed(COLORS.BLUE);
      }

      const top = calc.getTopProbabilityColors(3);

      // 現在綠色應該是最高
      expect(top[0]).toBe(COLORS.GREEN);
      expect(top.includes(COLORS.BLUE)).toBe(false);
    });
  });

  describe('getProbability', () => {
    test('should return correct probability for color', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.getProbability(COLORS.RED)).toBeCloseTo(2 / 14, 5);
      expect(calc.getProbability(COLORS.BLUE)).toBeCloseTo(5 / 14, 5);
    });

    test('should return 0 for invalid color', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.getProbability('invalid')).toBe(0);
    });

    test('should update after card revealed', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);

      expect(calc.getProbability(COLORS.RED)).toBeCloseTo(1 / 13, 5);
    });
  });

  describe('getRemainingCount', () => {
    test('should return correct remaining count for color', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.getRemainingCount(COLORS.RED)).toBe(2);
      expect(calc.getRemainingCount(COLORS.YELLOW)).toBe(3);
      expect(calc.getRemainingCount(COLORS.GREEN)).toBe(4);
      expect(calc.getRemainingCount(COLORS.BLUE)).toBe(5);
    });

    test('should return total remaining when no color specified', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.getRemainingCount()).toBe(14);
    });

    test('should decrease after card revealed', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);

      expect(calc.getRemainingCount(COLORS.RED)).toBe(1);
      expect(calc.getRemainingCount()).toBe(13);
    });

    test('should return 0 when all cards visible', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.RED);

      expect(calc.getRemainingCount(COLORS.RED)).toBe(0);
    });
  });

  describe('getVisibleCount', () => {
    test('should return 0 initially for all colors', () => {
      const calc = new ProbabilityCalculator();

      expect(calc.getVisibleCount(COLORS.RED)).toBe(0);
      expect(calc.getVisibleCount(COLORS.YELLOW)).toBe(0);
    });

    test('should return total visible when no color specified', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.BLUE);

      expect(calc.getVisibleCount()).toBe(2);
    });

    test('should increase after card revealed', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.GREEN);

      expect(calc.getVisibleCount(COLORS.GREEN)).toBe(1);
    });

    test('should track multiple reveals correctly', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.BLUE);
      calc.updateOnCardRevealed(COLORS.BLUE);
      calc.updateOnCardRevealed(COLORS.BLUE);

      expect(calc.getVisibleCount(COLORS.BLUE)).toBe(3);
      expect(calc.getVisibleCount()).toBe(3);
    });
  });

  describe('getInfo', () => {
    test('should return complete calculator state', () => {
      const calc = new ProbabilityCalculator();

      const info = calc.getInfo();

      expect(info).toHaveProperty('probabilities');
      expect(info).toHaveProperty('visibleCounts');
      expect(info).toHaveProperty('remainingTotal');
      expect(info).toHaveProperty('visibleTotal');
    });

    test('should have correct initial values', () => {
      const calc = new ProbabilityCalculator();

      const info = calc.getInfo();

      expect(info.remainingTotal).toBe(14);
      expect(info.visibleTotal).toBe(0);
      expect(info.visibleCounts[COLORS.RED]).toBe(0);
    });

    test('should update after cards revealed', () => {
      const calc = new ProbabilityCalculator();

      calc.updateOnCardRevealed(COLORS.RED);
      calc.updateOnCardRevealed(COLORS.BLUE);

      const info = calc.getInfo();

      expect(info.remainingTotal).toBe(12);
      expect(info.visibleTotal).toBe(2);
      expect(info.visibleCounts[COLORS.RED]).toBe(1);
      expect(info.visibleCounts[COLORS.BLUE]).toBe(1);
    });
  });
});

describe('createProbabilityCalculator', () => {
  test('should create ProbabilityCalculator instance', () => {
    const calc = createProbabilityCalculator();

    expect(calc).toBeInstanceOf(ProbabilityCalculator);
  });

  test('should create instance with initial state', () => {
    const calc = createProbabilityCalculator();

    expect(calc.getRemainingCount()).toBe(14);
    expect(calc.getVisibleCount()).toBe(0);
  });
});
