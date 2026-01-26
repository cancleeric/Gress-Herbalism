/**
 * MediumStrategy 單元測試
 */

import MediumStrategy, { createMediumStrategy } from '../strategies/MediumStrategy';
import { ACTION_TYPE } from '../strategies/BaseStrategy';
import { AI_DIFFICULTY, ALL_COLORS } from '../../shared/constants';

describe('MediumStrategy', () => {
  describe('constructor', () => {
    test('should create with MEDIUM difficulty', () => {
      const strategy = new MediumStrategy();
      expect(strategy.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
    });

    test('should have correct thresholds', () => {
      const strategy = new MediumStrategy();
      expect(strategy.guessConfidenceThreshold).toBe(0.6);
      expect(strategy.followGuessProbThreshold).toBe(0.15);
    });
  });

  describe('calculateConfidence', () => {
    test('should return 0 without knowledge', () => {
      const strategy = new MediumStrategy();
      expect(strategy.calculateConfidence(null)).toBe(0);
      expect(strategy.calculateConfidence({})).toBe(0);
    });

    test('should calculate confidence from top probabilities', () => {
      const strategy = new MediumStrategy();
      const knowledge = {
        hiddenCardProbability: { red: 0.4, yellow: 0.3, green: 0.2, blue: 0.1 }
      };
      const confidence = strategy.calculateConfidence(knowledge);
      expect(confidence).toBeCloseTo(0.12, 2); // 0.4 * 0.3
    });
  });

  describe('decideAction', () => {
    test('should return GUESS when confidence high', () => {
      const strategy = new MediumStrategy();
      strategy.selfId = 'player-1';
      const gameState = { players: [{ id: 'player-1', isActive: true }, { id: 'player-2', isActive: true }] };
      const knowledge = { hiddenCardProbability: { red: 0.8, yellow: 0.9, green: 0.05, blue: 0.05 } };

      expect(strategy.decideAction(gameState, knowledge)).toBe(ACTION_TYPE.GUESS);
    });

    test('should return QUESTION when confidence low', () => {
      const strategy = new MediumStrategy();
      strategy.selfId = 'player-1';
      const gameState = { players: [{ id: 'player-1', isActive: true }, { id: 'player-2', isActive: true }] };
      const knowledge = { hiddenCardProbability: { red: 0.3, yellow: 0.3, green: 0.2, blue: 0.2 } };

      expect(strategy.decideAction(gameState, knowledge)).toBe(ACTION_TYPE.QUESTION);
    });

    test('should return GUESS when forced', () => {
      const strategy = new MediumStrategy();
      strategy.selfId = 'player-1';
      const gameState = { players: [{ id: 'player-1', isActive: true }] };

      expect(strategy.decideAction(gameState, {})).toBe(ACTION_TYPE.GUESS);
    });
  });

  describe('selectTargetPlayer', () => {
    test('should select player with most cards', () => {
      const strategy = new MediumStrategy();
      strategy.selfId = 'player-1';
      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true },
          { id: 'player-3', isActive: true }
        ]
      };
      const knowledge = {
        playerHandCounts: { 'player-2': 3, 'player-3': 5 }
      };

      const target = strategy.selectTargetPlayer(gameState, knowledge);
      expect(target.id).toBe('player-3');
    });

    test('should return null when no other players', () => {
      const strategy = new MediumStrategy();
      strategy.selfId = 'player-1';
      const gameState = { players: [{ id: 'player-1', isActive: true }] };

      expect(strategy.selectTargetPlayer(gameState, {})).toBeNull();
    });
  });

  describe('selectColors', () => {
    test('should select top probability colors', () => {
      const strategy = new MediumStrategy();
      const knowledge = {
        hiddenCardProbability: { red: 0.1, yellow: 0.2, green: 0.3, blue: 0.4 }
      };

      const colors = strategy.selectColors({}, knowledge);
      expect(colors).toEqual(['blue', 'green']);
    });

    test('should return random colors without knowledge', () => {
      const strategy = new MediumStrategy();
      const colors = strategy.selectColors({}, {});

      expect(colors).toHaveLength(2);
      expect(ALL_COLORS).toContain(colors[0]);
      expect(ALL_COLORS).toContain(colors[1]);
    });
  });

  describe('selectQuestionType', () => {
    test('should always return type 2', () => {
      const strategy = new MediumStrategy();
      expect(strategy.selectQuestionType({}, {}, [])).toBe(2);
    });
  });

  describe('selectGuessColors', () => {
    test('should select top probability colors', () => {
      const strategy = new MediumStrategy();
      const knowledge = {
        hiddenCardProbability: { red: 0.5, yellow: 0.3, green: 0.1, blue: 0.1 }
      };

      const colors = strategy.selectGuessColors(knowledge);
      expect(colors).toEqual(['red', 'yellow']);
    });
  });

  describe('decideFollowGuess', () => {
    test('should return true when probability high', () => {
      const strategy = new MediumStrategy();
      const knowledge = {
        hiddenCardProbability: { red: 0.5, blue: 0.5, green: 0, yellow: 0 }
      };

      expect(strategy.decideFollowGuess(['red', 'blue'], knowledge)).toBe(true);
    });

    test('should return false when probability low', () => {
      const strategy = new MediumStrategy();
      const knowledge = {
        hiddenCardProbability: { red: 0.1, blue: 0.1, green: 0.4, yellow: 0.4 }
      };

      expect(strategy.decideFollowGuess(['red', 'blue'], knowledge)).toBe(false);
    });

    test('should return false without knowledge', () => {
      const strategy = new MediumStrategy();
      expect(strategy.decideFollowGuess(['red', 'blue'], null)).toBe(false);
    });
  });

  describe('getInfo', () => {
    test('should return strategy information', () => {
      const strategy = new MediumStrategy();
      const info = strategy.getInfo();

      expect(info.name).toBe('MediumStrategy');
      expect(info.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
      expect(info.guessConfidenceThreshold).toBe(0.6);
      expect(info.followGuessProbThreshold).toBe(0.15);
    });
  });
});

describe('createMediumStrategy', () => {
  test('should create MediumStrategy instance', () => {
    const strategy = createMediumStrategy();
    expect(strategy).toBeInstanceOf(MediumStrategy);
    expect(strategy.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
  });
});
