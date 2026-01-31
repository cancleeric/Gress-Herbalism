/**
 * ExpectedValueCalculator 單元測試
 *
 * REF: 202601250052
 */

import ExpectedValueCalculator, { createExpectedValueCalculator } from '../decisions/ExpectedValueCalculator';

describe('ExpectedValueCalculator', () => {
  describe('constructor', () => {
    test('should create with default parameters', () => {
      const calculator = new ExpectedValueCalculator();

      expect(calculator.guessSuccessScore).toBe(3);
      expect(calculator.guessFailureCost).toBe(0);
      expect(calculator.followGuessSuccessScore).toBe(1);
      expect(calculator.followGuessFailureCost).toBe(1);
      expect(calculator.informationEntropyWeight).toBe(0.2);
    });

    test('should accept custom parameters', () => {
      const customParams = {
        guessSuccessScore: 5,
        guessFailureCost: 1,
        followGuessSuccessScore: 2,
        followGuessFailureCost: 2,
        informationEntropyWeight: 0.3
      };

      const calculator = new ExpectedValueCalculator(customParams);

      expect(calculator.guessSuccessScore).toBe(5);
      expect(calculator.guessFailureCost).toBe(1);
      expect(calculator.followGuessSuccessScore).toBe(2);
      expect(calculator.followGuessFailureCost).toBe(2);
      expect(calculator.informationEntropyWeight).toBe(0.3);
    });

    test('should use default values for missing parameters', () => {
      const partialParams = {
        guessSuccessScore: 4
      };

      const calculator = new ExpectedValueCalculator(partialParams);

      expect(calculator.guessSuccessScore).toBe(4);
      expect(calculator.guessFailureCost).toBe(0);
      expect(calculator.followGuessSuccessScore).toBe(1);
    });
  });

  describe('calculateGuessEV', () => {
    test('should calculate positive EV for high success probability', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 0.8
      // EV = 0.8 × 3 - 0.2 × 0 = 2.4
      const ev = calculator.calculateGuessEV(0.8);

      expect(ev).toBeCloseTo(2.4, 2);
    });

    test('should calculate low EV for low success probability', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 0.3
      // EV = 0.3 × 3 - 0.7 × 0 = 0.9
      const ev = calculator.calculateGuessEV(0.3);

      expect(ev).toBeCloseTo(0.9, 2);
    });

    test('should calculate EV of 3 for certain success', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 1.0
      // EV = 1.0 × 3 - 0.0 × 0 = 3.0
      const ev = calculator.calculateGuessEV(1.0);

      expect(ev).toBeCloseTo(3.0, 2);
    });

    test('should calculate EV of 0 for certain failure', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 0.0
      // EV = 0.0 × 3 - 1.0 × 0 = 0.0
      const ev = calculator.calculateGuessEV(0.0);

      expect(ev).toBeCloseTo(0.0, 2);
    });

    test('should return 0 for invalid probability (negative)', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateGuessEV(-0.1);

      expect(ev).toBe(0);
    });

    test('should return 0 for invalid probability (> 1)', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateGuessEV(1.5);

      expect(ev).toBe(0);
    });

    test('should return 0 for non-number input', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateGuessEV('invalid');

      expect(ev).toBe(0);
    });

    test('should work with custom success score', () => {
      const calculator = new ExpectedValueCalculator({
        guessSuccessScore: 5
      });

      // P(success) = 0.6
      // EV = 0.6 × 5 - 0.4 × 0 = 3.0
      const ev = calculator.calculateGuessEV(0.6);

      expect(ev).toBeCloseTo(3.0, 2);
    });

    test('should work with custom failure cost', () => {
      const calculator = new ExpectedValueCalculator({
        guessFailureCost: 2
      });

      // P(success) = 0.5
      // EV = 0.5 × 3 - 0.5 × 2 = 0.5
      const ev = calculator.calculateGuessEV(0.5);

      expect(ev).toBeCloseTo(0.5, 2);
    });
  });

  describe('calculateFollowGuessEV', () => {
    test('should calculate positive EV for high success probability', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 0.7
      // EV = 0.7 × 1 - 0.3 × 1 = 0.4
      const ev = calculator.calculateFollowGuessEV(0.7);

      expect(ev).toBeCloseTo(0.4, 2);
    });

    test('should calculate zero EV at critical point (P = 0.5)', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 0.5
      // EV = 0.5 × 1 - 0.5 × 1 = 0.0
      const ev = calculator.calculateFollowGuessEV(0.5);

      expect(ev).toBeCloseTo(0.0, 2);
    });

    test('should calculate negative EV for low success probability', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 0.3
      // EV = 0.3 × 1 - 0.7 × 1 = -0.4
      const ev = calculator.calculateFollowGuessEV(0.3);

      expect(ev).toBeCloseTo(-0.4, 2);
    });

    test('should calculate EV of 1 for certain success', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 1.0
      // EV = 1.0 × 1 - 0.0 × 1 = 1.0
      const ev = calculator.calculateFollowGuessEV(1.0);

      expect(ev).toBeCloseTo(1.0, 2);
    });

    test('should calculate EV of -1 for certain failure', () => {
      const calculator = new ExpectedValueCalculator();

      // P(success) = 0.0
      // EV = 0.0 × 1 - 1.0 × 1 = -1.0
      const ev = calculator.calculateFollowGuessEV(0.0);

      expect(ev).toBeCloseTo(-1.0, 2);
    });

    test('should return 0 for invalid probability (negative)', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateFollowGuessEV(-0.1);

      expect(ev).toBe(0);
    });

    test('should return 0 for invalid probability (> 1)', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateFollowGuessEV(1.2);

      expect(ev).toBe(0);
    });

    test('should return 0 for non-number input', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateFollowGuessEV(null);

      expect(ev).toBe(0);
    });

    test('should work with custom success score', () => {
      const calculator = new ExpectedValueCalculator({
        followGuessSuccessScore: 2
      });

      // P(success) = 0.6
      // EV = 0.6 × 2 - 0.4 × 1 = 0.8
      const ev = calculator.calculateFollowGuessEV(0.6);

      expect(ev).toBeCloseTo(0.8, 2);
    });

    test('should work with custom failure cost', () => {
      const calculator = new ExpectedValueCalculator({
        followGuessFailureCost: 2
      });

      // P(success) = 0.6
      // EV = 0.6 × 1 - 0.4 × 2 = -0.2
      const ev = calculator.calculateFollowGuessEV(0.6);

      expect(ev).toBeCloseTo(-0.2, 2);
    });

    test('should verify symmetry formula: EV = 2P - 1', () => {
      const calculator = new ExpectedValueCalculator();

      // Test multiple probabilities
      const probabilities = [0.3, 0.5, 0.7, 0.9];

      probabilities.forEach(prob => {
        const ev = calculator.calculateFollowGuessEV(prob);
        const expected = 2 * prob - 1;

        expect(ev).toBeCloseTo(expected, 5);
      });
    });
  });

  describe('calculateQuestionEV', () => {
    test('should calculate question value for high entropy', () => {
      const calculator = new ExpectedValueCalculator();

      // H = 2.0 (均勻分布)
      // EV = 2.0 × 0.2 = 0.4
      const ev = calculator.calculateQuestionEV(2.0);

      expect(ev).toBeCloseTo(0.4, 2);
    });

    test('should calculate question value for medium entropy', () => {
      const calculator = new ExpectedValueCalculator();

      // H = 1.0
      // EV = 1.0 × 0.2 = 0.2
      const ev = calculator.calculateQuestionEV(1.0);

      expect(ev).toBeCloseTo(0.2, 2);
    });

    test('should calculate question value for low entropy', () => {
      const calculator = new ExpectedValueCalculator();

      // H = 0.5
      // EV = 0.5 × 0.2 = 0.1
      const ev = calculator.calculateQuestionEV(0.5);

      expect(ev).toBeCloseTo(0.1, 2);
    });

    test('should return 0 for zero entropy', () => {
      const calculator = new ExpectedValueCalculator();

      // H = 0.0 (確定分布)
      // EV = 0.0 × 0.2 = 0.0
      const ev = calculator.calculateQuestionEV(0.0);

      expect(ev).toBeCloseTo(0.0, 2);
    });

    test('should return 0 for negative entropy (invalid)', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateQuestionEV(-1.0);

      expect(ev).toBe(0);
    });

    test('should return 0 for non-number input', () => {
      const calculator = new ExpectedValueCalculator();

      const ev = calculator.calculateQuestionEV(undefined);

      expect(ev).toBe(0);
    });

    test('should work with custom information entropy weight', () => {
      const calculator = new ExpectedValueCalculator({
        informationEntropyWeight: 0.3
      });

      // H = 2.0
      // EV = 2.0 × 0.3 = 0.6
      const ev = calculator.calculateQuestionEV(2.0);

      expect(ev).toBeCloseTo(0.6, 2);
    });

    test('should handle very high entropy values', () => {
      const calculator = new ExpectedValueCalculator();

      // H = 10.0 (理論上不會發生，但應該能處理)
      // EV = 10.0 × 0.2 = 2.0
      const ev = calculator.calculateQuestionEV(10.0);

      expect(ev).toBeCloseTo(2.0, 2);
    });
  });

  describe('getConfig', () => {
    test('should return configuration object', () => {
      const calculator = new ExpectedValueCalculator();
      const config = calculator.getConfig();

      expect(config).toEqual({
        guessSuccessScore: 3,
        guessFailureCost: 0,
        followGuessSuccessScore: 1,
        followGuessFailureCost: 1,
        informationEntropyWeight: 0.2
      });
    });

    test('should return custom configuration', () => {
      const customParams = {
        guessSuccessScore: 5,
        guessFailureCost: 2,
        followGuessSuccessScore: 3,
        followGuessFailureCost: 3,
        informationEntropyWeight: 0.4
      };

      const calculator = new ExpectedValueCalculator(customParams);
      const config = calculator.getConfig();

      expect(config).toEqual(customParams);
    });
  });
});

describe('createExpectedValueCalculator', () => {
  test('should create ExpectedValueCalculator instance', () => {
    const calculator = createExpectedValueCalculator();

    expect(calculator).toBeInstanceOf(ExpectedValueCalculator);
  });

  test('should create instance with custom parameters', () => {
    const params = {
      guessSuccessScore: 4,
      informationEntropyWeight: 0.25
    };

    const calculator = createExpectedValueCalculator(params);

    expect(calculator.guessSuccessScore).toBe(4);
    expect(calculator.informationEntropyWeight).toBe(0.25);
  });
});
