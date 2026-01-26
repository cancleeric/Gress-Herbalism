/**
 * EasyStrategy 單元測試
 */

import EasyStrategy, { createEasyStrategy } from '../strategies/EasyStrategy';
import { ACTION_TYPE } from '../strategies/BaseStrategy';
import { AI_DIFFICULTY, ALL_COLORS } from '../../shared/constants';

describe('EasyStrategy', () => {
  describe('constructor', () => {
    test('should create with EASY difficulty', () => {
      const strategy = new EasyStrategy();

      expect(strategy.difficulty).toBe(AI_DIFFICULTY.EASY);
    });

    test('should have correct name', () => {
      const strategy = new EasyStrategy();

      expect(strategy.name).toBe('EasyStrategy');
    });

    test('should have question type weights', () => {
      const strategy = new EasyStrategy();

      expect(strategy.questionTypeWeights).toEqual([0.6, 0.3, 0.1]);
    });
  });

  describe('decideAction', () => {
    test('should return QUESTION when other players exist', () => {
      const strategy = new EasyStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true }
        ]
      };

      const action = strategy.decideAction(gameState, {});

      expect(action).toBe(ACTION_TYPE.QUESTION);
    });

    test('should return GUESS when forced (no other active players)', () => {
      const strategy = new EasyStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: false }
        ]
      };

      const action = strategy.decideAction(gameState, {});

      expect(action).toBe(ACTION_TYPE.GUESS);
    });

    test('should always choose QUESTION when not forced', () => {
      const strategy = new EasyStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true },
          { id: 'player-3', isActive: true }
        ]
      };

      // 測試多次以確保一致性
      for (let i = 0; i < 10; i++) {
        const action = strategy.decideAction(gameState, {});
        expect(action).toBe(ACTION_TYPE.QUESTION);
      }
    });
  });

  describe('selectTargetPlayer', () => {
    test('should return a player from other active players', () => {
      const strategy = new EasyStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true },
          { id: 'player-3', isActive: true }
        ]
      };

      const target = strategy.selectTargetPlayer(gameState, {});

      expect(target).toBeTruthy();
      expect(target.id).not.toBe('player-1');
      expect(['player-2', 'player-3']).toContain(target.id);
    });

    test('should return null when no other players', () => {
      const strategy = new EasyStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true }
        ]
      };

      const target = strategy.selectTargetPlayer(gameState, {});

      expect(target).toBeNull();
    });

    test('should distribute selections randomly', () => {
      const strategy = new EasyStrategy();
      strategy.selfId = 'player-1';

      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true },
          { id: 'player-3', isActive: true }
        ]
      };

      const selections = {};
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const target = strategy.selectTargetPlayer(gameState, {});
        selections[target.id] = (selections[target.id] || 0) + 1;
      }

      // 驗證兩個玩家都被選到
      expect(Object.keys(selections)).toHaveLength(2);
      expect(selections['player-2']).toBeGreaterThan(0);
      expect(selections['player-3']).toBeGreaterThan(0);
    });
  });

  describe('selectColors', () => {
    test('should return two different colors', () => {
      const strategy = new EasyStrategy();

      const colors = strategy.selectColors({}, {});

      expect(colors).toHaveLength(2);
      expect(colors[0]).not.toBe(colors[1]);
      expect(ALL_COLORS).toContain(colors[0]);
      expect(ALL_COLORS).toContain(colors[1]);
    });

    test('should be random', () => {
      const strategy = new EasyStrategy();
      const results = new Set();

      // 測試多次，應該得到不同的組合
      for (let i = 0; i < 20; i++) {
        const colors = strategy.selectColors({}, {});
        results.add(colors.sort().join(','));
      }

      // 20 次應該至少有 3 種不同的組合
      expect(results.size).toBeGreaterThan(2);
    });
  });

  describe('selectQuestionType', () => {
    test('should return valid question type (1, 2, or 3)', () => {
      const strategy = new EasyStrategy();

      const type = strategy.selectQuestionType({}, {}, []);

      expect([1, 2, 3]).toContain(type);
    });

    test('should follow weighted distribution approximately', () => {
      const strategy = new EasyStrategy();
      const counts = { 1: 0, 2: 0, 3: 0 };
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const type = strategy.selectQuestionType({}, {}, []);
        counts[type]++;
      }

      // 驗證分布接近預期（60%, 30%, 10%）
      // 允許 ±10% 的誤差
      expect(counts[1] / iterations).toBeCloseTo(0.6, 1);
      expect(counts[2] / iterations).toBeCloseTo(0.3, 1);
      expect(counts[3] / iterations).toBeCloseTo(0.1, 1);
    });

    test('should always return a value even with edge cases', () => {
      const strategy = new EasyStrategy();

      for (let i = 0; i < 10; i++) {
        const type = strategy.selectQuestionType(null, null, null);
        expect([1, 2, 3]).toContain(type);
      }
    });
  });

  describe('selectGuessColors', () => {
    test('should return two different colors', () => {
      const strategy = new EasyStrategy();

      const colors = strategy.selectGuessColors({});

      expect(colors).toHaveLength(2);
      expect(colors[0]).not.toBe(colors[1]);
      expect(ALL_COLORS).toContain(colors[0]);
      expect(ALL_COLORS).toContain(colors[1]);
    });

    test('should be random', () => {
      const strategy = new EasyStrategy();
      const results = new Set();

      for (let i = 0; i < 20; i++) {
        const colors = strategy.selectGuessColors({});
        results.add(colors.sort().join(','));
      }

      // 應該有多種不同的組合
      expect(results.size).toBeGreaterThan(2);
    });
  });

  describe('decideFollowGuess', () => {
    test('should return boolean', () => {
      const strategy = new EasyStrategy();

      const decision = strategy.decideFollowGuess(['red', 'blue'], {});

      expect(typeof decision).toBe('boolean');
    });

    test('should be approximately 50% true and 50% false', () => {
      const strategy = new EasyStrategy();
      let trueCount = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        if (strategy.decideFollowGuess(['red', 'blue'], {})) {
          trueCount++;
        }
      }

      // 驗證接近 50%（允許 ±10% 誤差）
      expect(trueCount / iterations).toBeCloseTo(0.5, 1);
    });
  });

  describe('weightedRandomSelect', () => {
    test('should return value in range', () => {
      const strategy = new EasyStrategy();

      const result = strategy.weightedRandomSelect([0.6, 0.3, 0.1]);

      expect([1, 2, 3]).toContain(result);
    });

    test('should handle single weight', () => {
      const strategy = new EasyStrategy();

      const result = strategy.weightedRandomSelect([1.0]);

      expect(result).toBe(1);
    });

    test('should follow weight distribution', () => {
      const strategy = new EasyStrategy();
      const weights = [0.5, 0.3, 0.2];
      const counts = { 1: 0, 2: 0, 3: 0 };
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const result = strategy.weightedRandomSelect(weights);
        counts[result]++;
      }

      expect(counts[1] / iterations).toBeCloseTo(0.5, 1);
      expect(counts[2] / iterations).toBeCloseTo(0.3, 1);
      expect(counts[3] / iterations).toBeCloseTo(0.2, 1);
    });

    test('should handle edge case with zero probability', () => {
      const strategy = new EasyStrategy();
      const weights = [0.0, 0.0, 1.0];

      for (let i = 0; i < 10; i++) {
        const result = strategy.weightedRandomSelect(weights);
        expect(result).toBe(3);
      }
    });
  });

  describe('getInfo', () => {
    test('should return strategy information', () => {
      const strategy = new EasyStrategy();

      const info = strategy.getInfo();

      expect(info.name).toBe('EasyStrategy');
      expect(info.difficulty).toBe(AI_DIFFICULTY.EASY);
      expect(info.questionTypeWeights).toEqual([0.6, 0.3, 0.1]);
      expect(info.description).toBeTruthy();
    });
  });

  describe('integration', () => {
    test('should work with complete game flow', () => {
      const strategy = new EasyStrategy();
      strategy.selfId = 'ai-player';

      const gameState = {
        players: [
          { id: 'ai-player', isActive: true },
          { id: 'human-player', isActive: true }
        ]
      };

      const knowledge = {};

      // 決定行動
      const action = strategy.decideAction(gameState, knowledge);
      expect([ACTION_TYPE.QUESTION, ACTION_TYPE.GUESS]).toContain(action);

      if (action === ACTION_TYPE.QUESTION) {
        // 選擇目標玩家
        const target = strategy.selectTargetPlayer(gameState, knowledge);
        expect(target).toBeTruthy();
        expect(target.id).toBe('human-player');

        // 選擇顏色
        const colors = strategy.selectColors(gameState, knowledge);
        expect(colors).toHaveLength(2);

        // 選擇問牌類型
        const type = strategy.selectQuestionType(gameState, knowledge, colors);
        expect([1, 2, 3]).toContain(type);
      } else {
        // 選擇猜測顏色
        const guessColors = strategy.selectGuessColors(knowledge);
        expect(guessColors).toHaveLength(2);
      }

      // 跟猜決策
      const followDecision = strategy.decideFollowGuess(['red', 'blue'], knowledge);
      expect(typeof followDecision).toBe('boolean');
    });
  });
});

describe('createEasyStrategy', () => {
  test('should create EasyStrategy instance', () => {
    const strategy = createEasyStrategy();

    expect(strategy).toBeInstanceOf(EasyStrategy);
    expect(strategy.difficulty).toBe(AI_DIFFICULTY.EASY);
  });
});
