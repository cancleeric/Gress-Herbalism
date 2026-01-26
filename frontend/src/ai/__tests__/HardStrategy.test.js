/**
 * HardStrategy 單元測試
 */

import HardStrategy, { createHardStrategy } from '../strategies/HardStrategy';
import { ACTION_TYPE } from '../strategies/BaseStrategy';
import { AI_DIFFICULTY, ALL_COLORS } from '../../shared/constants';

describe('HardStrategy', () => {
  describe('constructor', () => {
    test('should create with HARD difficulty', () => {
      const strategy = new HardStrategy();
      expect(strategy.difficulty).toBe(AI_DIFFICULTY.HARD);
    });

    test('should have correct thresholds', () => {
      const strategy = new HardStrategy();
      expect(strategy.guessConfidenceThreshold).toBe(0.8);
      expect(strategy.followGuessProbThreshold).toBe(0.3);
      expect(strategy.expectedValueMinimum).toBe(0.5);
      expect(strategy.informationEntropyWeight).toBe(0.2);
    });

    test('should accept custom parameters', () => {
      const customParams = {
        guessConfidenceThreshold: 0.75,
        followGuessProbThreshold: 0.25,
        expectedValueMinimum: 0.6,
        informationEntropyWeight: 0.3
      };

      const strategy = new HardStrategy(customParams);
      expect(strategy.guessConfidenceThreshold).toBe(0.75);
      expect(strategy.followGuessProbThreshold).toBe(0.25);
      expect(strategy.expectedValueMinimum).toBe(0.6);
      expect(strategy.informationEntropyWeight).toBe(0.3);
    });
  });

  // calculateEntropy 已移至 ProbabilityCalculator (REF: 202601250050)
  // 相關測試請參考 ProbabilityCalculator.test.js

  describe('calculateSuccessProbability', () => {
    test('should calculate success probability correctly', () => {
      const strategy = new HardStrategy();
      const knowledge = {
        hiddenCardProbability: {
          red: 0.5,
          yellow: 0.4,
          green: 0.05,
          blue: 0.05
        }
      };

      const prob = strategy.calculateSuccessProbability(['red', 'yellow'], knowledge);

      // 聯合概率 = 0.5 * 0.4 = 0.2
      expect(prob).toBeCloseTo(0.2, 2);
    });

    test('should return 0 without knowledge', () => {
      const strategy = new HardStrategy();
      const prob = strategy.calculateSuccessProbability(['red', 'yellow'], null);
      expect(prob).toBe(0);
    });

    test('should return 0 with invalid colors', () => {
      const strategy = new HardStrategy();
      const knowledge = {
        hiddenCardProbability: {
          red: 0.5,
          yellow: 0.5,
          green: 0,
          blue: 0
        }
      };

      const prob = strategy.calculateSuccessProbability([], knowledge);
      expect(prob).toBe(0);
    });
  });

  describe('calculateGuessExpectedValue', () => {
    test('should calculate positive EV for high probability', () => {
      const strategy = new HardStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true }
        ]
      };

      const knowledge = {
        hiddenCardProbability: {
          red: 0.8,
          yellow: 0.9,
          green: 0.05,
          blue: 0.05
        }
      };

      const ev = strategy.calculateGuessExpectedValue(gameState, knowledge);

      // 成功概率 = 0.8 * 0.9 = 0.72
      // EV = 0.72 * 3 - 0.28 * 0 = 2.16
      expect(ev).toBeCloseTo(2.16, 2);
      expect(ev).toBeGreaterThan(0);
    });

    test('should calculate low EV for low probability', () => {
      const strategy = new HardStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true }
        ]
      };

      const knowledge = {
        hiddenCardProbability: {
          red: 0.3,
          yellow: 0.3,
          green: 0.2,
          blue: 0.2
        }
      };

      const ev = strategy.calculateGuessExpectedValue(gameState, knowledge);

      // 成功概率 = 0.3 * 0.3 = 0.09
      // EV = 0.09 * 3 = 0.27
      expect(ev).toBeCloseTo(0.27, 2);
    });
  });

  describe('calculateQuestionValue', () => {
    test('should calculate question value based on entropy', () => {
      const strategy = new HardStrategy();
      const knowledge = {
        hiddenCardProbability: {
          red: 0.25,
          yellow: 0.25,
          green: 0.25,
          blue: 0.25
        }
      };

      const value = strategy.calculateQuestionValue({}, knowledge);

      // 當前熵 ≈ 2，資訊價值 = 2 * 0.2 = 0.4
      expect(value).toBeCloseTo(0.4, 1);
      expect(value).toBeGreaterThan(0);
    });

    test('should return 0 without knowledge', () => {
      const strategy = new HardStrategy();
      const value = strategy.calculateQuestionValue({}, null);
      expect(value).toBe(0);
    });
  });

  describe('decideAction', () => {
    test('should return GUESS when EV is high and exceeds question value', () => {
      const strategy = new HardStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true }
        ]
      };

      const knowledge = {
        hiddenCardProbability: {
          red: 0.9,
          yellow: 0.9,
          green: 0.05,
          blue: 0.05
        }
      };

      const action = strategy.decideAction(gameState, knowledge);

      // 猜牌 EV = 0.81 * 3 = 2.43 > 0.5 且遠高於問牌價值
      expect(action).toBe(ACTION_TYPE.GUESS);
    });

    test('should return QUESTION when EV is low', () => {
      const strategy = new HardStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true }
        ]
      };

      const knowledge = {
        hiddenCardProbability: {
          red: 0.3,
          yellow: 0.3,
          green: 0.2,
          blue: 0.2
        }
      };

      const action = strategy.decideAction(gameState, knowledge);

      // 猜牌 EV = 0.09 * 3 = 0.27 < 0.5
      expect(action).toBe(ACTION_TYPE.QUESTION);
    });

    test('should return GUESS when forced (only player left)', () => {
      const strategy = new HardStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true }
        ]
      };

      const knowledge = {
        hiddenCardProbability: {
          red: 0.25,
          yellow: 0.25,
          green: 0.25,
          blue: 0.25
        }
      };

      const action = strategy.decideAction(gameState, knowledge);
      expect(action).toBe(ACTION_TYPE.GUESS);
    });
  });

  describe('selectTargetPlayer', () => {
    test('should select player with most unknown cards', () => {
      const strategy = new HardStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true },
          { id: 'player-3', isActive: true }
        ]
      };

      const knowledge = {
        playerHandCounts: {
          'player-2': 3,
          'player-3': 5
        },
        knownCards: new Map([
          ['player-2', []],
          ['player-3', []]
        ])
      };

      const target = strategy.selectTargetPlayer(gameState, knowledge);

      // player-3 有更多未知手牌（5 張）
      expect(target.id).toBe('player-3');
    });

    test('should return null when no other players', () => {
      const strategy = new HardStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true }
        ]
      };

      const target = strategy.selectTargetPlayer(gameState, {});
      expect(target).toBeNull();
    });
  });

  describe('calculateTargetValue', () => {
    test('should calculate unknown cards correctly', () => {
      const strategy = new HardStrategy();

      const player = { id: 'player-2' };
      const knowledge = {
        playerHandCounts: {
          'player-2': 5
        },
        knownCards: new Map([
          ['player-2', [{}, {}]]  // 已知 2 張
        ])
      };

      const value = strategy.calculateTargetValue(player, knowledge);

      // 未知手牌 = 5 - 2 = 3
      expect(value).toBe(3);
    });

    test('should use default hand size when no info', () => {
      const strategy = new HardStrategy();

      const player = { id: 'player-2' };
      const knowledge = {};

      const value = strategy.calculateTargetValue(player, knowledge);

      // 預設手牌數 3，已知 0 張
      expect(value).toBe(3);
    });
  });

  describe('evaluateColorPair', () => {
    test('should prefer colors with higher uncertainty', () => {
      const strategy = new HardStrategy();

      const knowledge = {
        hiddenCardProbability: {
          red: 0.5,    // 不確定性：0.5 * 0.5 = 0.25
          yellow: 0.5, // 不確定性：0.5 * 0.5 = 0.25
          green: 0.9,  // 不確定性：0.9 * 0.1 = 0.09
          blue: 0.1    // 不確定性：0.1 * 0.9 = 0.09
        }
      };

      const value1 = strategy.evaluateColorPair(['red', 'yellow'], knowledge);
      const value2 = strategy.evaluateColorPair(['green', 'blue'], knowledge);

      // red+yellow 的總不確定性 (0.25 + 0.25 = 0.5) 應大於 green+blue (0.09 + 0.09 = 0.18)
      expect(value1).toBeGreaterThan(value2);
    });
  });

  describe('selectColors', () => {
    test('should select colors with maximum information gain', () => {
      const strategy = new HardStrategy();

      const gameState = {};
      const knowledge = {
        hiddenCardProbability: {
          red: 0.4,
          yellow: 0.4,
          green: 0.1,
          blue: 0.1
        }
      };

      const colors = strategy.selectColors(gameState, knowledge);

      // 應該選擇不確定性較高的顏色組合
      expect(colors).toHaveLength(2);
      expect(ALL_COLORS).toContain(colors[0]);
      expect(ALL_COLORS).toContain(colors[1]);
    });

    test('should return random colors without knowledge', () => {
      const strategy = new HardStrategy();

      const colors = strategy.selectColors({}, null);

      expect(colors).toHaveLength(2);
      expect(ALL_COLORS).toContain(colors[0]);
      expect(ALL_COLORS).toContain(colors[1]);
    });
  });

  describe('selectQuestionType', () => {
    test('should return type 2 (all one color)', () => {
      const strategy = new HardStrategy();
      const type = strategy.selectQuestionType({}, {}, ['red', 'yellow']);
      expect(type).toBe(2);
    });
  });

  describe('selectGuessColors', () => {
    test('should select top probability colors', () => {
      const strategy = new HardStrategy();

      const knowledge = {
        hiddenCardProbability: {
          red: 0.5,
          yellow: 0.3,
          green: 0.1,
          blue: 0.1
        }
      };

      const colors = strategy.selectGuessColors(knowledge);
      expect(colors).toEqual(['red', 'yellow']);
    });

    test('should return random colors without knowledge', () => {
      const strategy = new HardStrategy();
      const colors = strategy.selectGuessColors(null);

      expect(colors).toHaveLength(2);
      expect(ALL_COLORS).toContain(colors[0]);
      expect(ALL_COLORS).toContain(colors[1]);
    });
  });

  describe('decideFollowGuess', () => {
    test('should follow when EV is positive', () => {
      const strategy = new HardStrategy();

      const knowledge = {
        hiddenCardProbability: {
          red: 0.6,
          yellow: 0.6,
          green: 0.2,
          blue: 0.2
        }
      };

      // 成功概率 = 0.6 * 0.6 = 0.36
      // EV = 0.36 * 1 - 0.64 * 1 = -0.28 < 0，不應該跟猜
      const shouldNotFollow = strategy.decideFollowGuess(['red', 'yellow'], knowledge);
      expect(shouldNotFollow).toBe(false);

      // 更高概率的情況
      const highProbKnowledge = {
        hiddenCardProbability: {
          red: 0.8,
          yellow: 0.7,
          green: 0.1,
          blue: 0.1
        }
      };

      // 成功概率 = 0.8 * 0.7 = 0.56
      // EV = 0.56 * 1 - 0.44 * 1 = 0.12 > 0，應該跟猜
      const shouldFollow = strategy.decideFollowGuess(['red', 'yellow'], highProbKnowledge);
      expect(shouldFollow).toBe(true);
    });

    test('should not follow when EV is negative', () => {
      const strategy = new HardStrategy();

      const knowledge = {
        hiddenCardProbability: {
          red: 0.3,
          yellow: 0.3,
          green: 0.2,
          blue: 0.2
        }
      };

      // 成功概率 = 0.3 * 0.3 = 0.09
      // EV = 0.09 * 1 - 0.91 * 1 = -0.82 < 0
      const shouldFollow = strategy.decideFollowGuess(['red', 'yellow'], knowledge);
      expect(shouldFollow).toBe(false);
    });

    test('should not follow without knowledge', () => {
      const strategy = new HardStrategy();
      const shouldFollow = strategy.decideFollowGuess(['red', 'yellow'], null);
      expect(shouldFollow).toBe(false);
    });
  });

  describe('getInfo', () => {
    test('should return strategy information', () => {
      const strategy = new HardStrategy();
      const info = strategy.getInfo();

      expect(info.name).toBe('HardStrategy');
      expect(info.difficulty).toBe(AI_DIFFICULTY.HARD);
      expect(info.guessConfidenceThreshold).toBe(0.8);
      expect(info.followGuessProbThreshold).toBe(0.3);
      expect(info.expectedValueMinimum).toBe(0.5);
      expect(info.informationEntropyWeight).toBe(0.2);
      expect(info.description).toBeDefined();
    });
  });
});

describe('createHardStrategy', () => {
  test('should create HardStrategy instance', () => {
    const strategy = createHardStrategy();
    expect(strategy).toBeInstanceOf(HardStrategy);
    expect(strategy.difficulty).toBe(AI_DIFFICULTY.HARD);
  });
});
