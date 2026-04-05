/**
 * BaseStrategy 單元測試
 */

import BaseStrategy, { ACTION_TYPE, validateStrategy } from '../strategies/BaseStrategy';
import { AI_DIFFICULTY, ALL_COLORS } from '../../../shared/constants';

// 建立具體實現類別用於測試
class ConcreteStrategy extends BaseStrategy {
  constructor(difficulty) {
    super(difficulty);
    this.name = 'ConcreteStrategy';
  }

  decideAction(gameState, knowledge) {
    return ACTION_TYPE.QUESTION;
  }

  selectTargetPlayer(gameState, knowledge) {
    const others = this.getOtherActivePlayers(gameState, this.selfId || 'test');
    return this.randomSelectPlayer(others);
  }

  selectColors(gameState, knowledge) {
    return this.randomSelectTwoColors();
  }

  selectQuestionType(gameState, knowledge, colors) {
    return 1;
  }

  selectGuessColors(knowledge) {
    if (knowledge && knowledge.hiddenCardProbability) {
      return this.selectColorsByProbability(knowledge.hiddenCardProbability, 2);
    }
    return this.randomSelectTwoColors();
  }

  decideFollowGuess(guessedColors, knowledge) {
    return true;
  }
}

describe('BaseStrategy', () => {
  describe('constructor', () => {
    test('should throw error when instantiated directly', () => {
      expect(() => new BaseStrategy()).toThrow(
        'BaseStrategy is abstract and cannot be instantiated directly'
      );
    });

    test('should allow subclass instantiation', () => {
      const strategy = new ConcreteStrategy();
      expect(strategy).toBeInstanceOf(BaseStrategy);
    });

    test('should set default difficulty to MEDIUM', () => {
      const strategy = new ConcreteStrategy();
      expect(strategy.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
    });

    test('should accept custom difficulty', () => {
      const strategy = new ConcreteStrategy(AI_DIFFICULTY.HARD);
      expect(strategy.difficulty).toBe(AI_DIFFICULTY.HARD);
    });

    test('should set name property', () => {
      const strategy = new ConcreteStrategy();
      expect(strategy.name).toBe('ConcreteStrategy');
    });
  });

  describe('abstract methods', () => {
    // 建立只部分實現的策略類別
    class PartialStrategy extends BaseStrategy {
      constructor() {
        super();
        this.name = 'PartialStrategy';
      }
      // 只實現部分方法
      decideAction() {
        return ACTION_TYPE.QUESTION;
      }
    }

    test('decideAction should throw if not implemented', () => {
      // 使用 Object.create 繞過 constructor 檢查
      const strategy = Object.create(BaseStrategy.prototype);
      expect(() => strategy.decideAction({}, {})).toThrow(
        'decideAction must be implemented by subclass'
      );
    });

    test('selectTargetPlayer should throw if not implemented', () => {
      const strategy = Object.create(BaseStrategy.prototype);
      expect(() => strategy.selectTargetPlayer({}, {})).toThrow(
        'selectTargetPlayer must be implemented by subclass'
      );
    });

    test('selectColors should throw if not implemented', () => {
      const strategy = Object.create(BaseStrategy.prototype);
      expect(() => strategy.selectColors({}, {})).toThrow(
        'selectColors must be implemented by subclass'
      );
    });

    test('selectQuestionType should throw if not implemented', () => {
      const strategy = Object.create(BaseStrategy.prototype);
      expect(() => strategy.selectQuestionType({}, {}, [])).toThrow(
        'selectQuestionType must be implemented by subclass'
      );
    });

    test('selectGuessColors should throw if not implemented', () => {
      const strategy = Object.create(BaseStrategy.prototype);
      expect(() => strategy.selectGuessColors({})).toThrow(
        'selectGuessColors must be implemented by subclass'
      );
    });

    test('decideFollowGuess should throw if not implemented', () => {
      const strategy = Object.create(BaseStrategy.prototype);
      expect(() => strategy.decideFollowGuess([], {})).toThrow(
        'decideFollowGuess must be implemented by subclass'
      );
    });
  });

  describe('helper methods', () => {
    let strategy;

    beforeEach(() => {
      strategy = new ConcreteStrategy();
    });

    describe('getOtherActivePlayers', () => {
      test('should return empty array for null gameState', () => {
        expect(strategy.getOtherActivePlayers(null, 'player-1')).toEqual([]);
      });

      test('should return empty array for missing players', () => {
        expect(strategy.getOtherActivePlayers({}, 'player-1')).toEqual([]);
      });

      test('should filter out self and inactive players', () => {
        const gameState = {
          players: [
            { id: 'player-1', isActive: true },
            { id: 'player-2', isActive: true },
            { id: 'player-3', isActive: false }
          ]
        };

        const others = strategy.getOtherActivePlayers(gameState, 'player-1');

        expect(others).toHaveLength(1);
        expect(others[0].id).toBe('player-2');
      });
    });

    describe('mustGuess', () => {
      test('should return true when no other active players', () => {
        const gameState = {
          players: [{ id: 'player-1', isActive: true }]
        };

        expect(strategy.mustGuess(gameState, 'player-1')).toBe(true);
      });

      test('should return false when other active players exist', () => {
        const gameState = {
          players: [
            { id: 'player-1', isActive: true },
            { id: 'player-2', isActive: true }
          ]
        };

        expect(strategy.mustGuess(gameState, 'player-1')).toBe(false);
      });
    });

    describe('randomSelectTwoColors', () => {
      test('should return array of 2 colors', () => {
        const colors = strategy.randomSelectTwoColors();

        expect(colors).toHaveLength(2);
        expect(ALL_COLORS).toContain(colors[0]);
        expect(ALL_COLORS).toContain(colors[1]);
      });

      test('should return different colors', () => {
        const colors = strategy.randomSelectTwoColors();

        expect(colors[0]).not.toBe(colors[1]);
      });
    });

    describe('randomSelectPlayer', () => {
      test('should return null for empty array', () => {
        expect(strategy.randomSelectPlayer([])).toBeNull();
      });

      test('should return null for null array', () => {
        expect(strategy.randomSelectPlayer(null)).toBeNull();
      });

      test('should return a player from the array', () => {
        const players = [
          { id: 'player-1' },
          { id: 'player-2' },
          { id: 'player-3' }
        ];

        const selected = strategy.randomSelectPlayer(players);

        expect(players).toContainEqual(selected);
      });
    });

    describe('selectColorsByProbability', () => {
      test('should return colors sorted by probability', () => {
        const probabilities = {
          red: 0.1,
          yellow: 0.2,
          green: 0.3,
          blue: 0.4
        };

        const colors = strategy.selectColorsByProbability(probabilities, 2);

        expect(colors).toEqual(['blue', 'green']);
      });

      test('should return requested number of colors', () => {
        const probabilities = {
          red: 0.25,
          yellow: 0.25,
          green: 0.25,
          blue: 0.25
        };

        const colors = strategy.selectColorsByProbability(probabilities, 3);

        expect(colors).toHaveLength(3);
      });
    });

    describe('hasColor', () => {
      test('should return true if color is in array', () => {
        expect(strategy.hasColor(['red', 'blue'], 'red')).toBe(true);
      });

      test('should return false if color is not in array', () => {
        expect(strategy.hasColor(['red', 'blue'], 'green')).toBe(false);
      });
    });

    describe('calculateJointProbability', () => {
      test('should multiply probabilities', () => {
        const probabilities = {
          red: 0.5,
          blue: 0.4
        };

        const joint = strategy.calculateJointProbability(probabilities, 'red', 'blue');

        expect(joint).toBeCloseTo(0.2, 5);
      });

      test('should handle missing colors', () => {
        const probabilities = {
          red: 0.5
        };

        const joint = strategy.calculateJointProbability(probabilities, 'red', 'blue');

        expect(joint).toBe(0);
      });
    });

    describe('getInfo', () => {
      test('should return strategy info', () => {
        const info = strategy.getInfo();

        expect(info.name).toBe('ConcreteStrategy');
        expect(info.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
      });
    });
  });

  describe('concrete implementation', () => {
    let strategy;

    beforeEach(() => {
      strategy = new ConcreteStrategy();
    });

    test('decideAction should return valid action type', () => {
      const action = strategy.decideAction({}, {});

      expect([ACTION_TYPE.QUESTION, ACTION_TYPE.GUESS]).toContain(action);
    });

    test('selectTargetPlayer should work with valid game state', () => {
      const gameState = {
        players: [
          { id: 'player-1', isActive: true },
          { id: 'player-2', isActive: true }
        ]
      };

      strategy.selfId = 'player-1';
      const target = strategy.selectTargetPlayer(gameState, {});

      expect(target).toBeTruthy();
      expect(target.id).toBe('player-2');
    });

    test('selectColors should return two colors', () => {
      const colors = strategy.selectColors({}, {});

      expect(colors).toHaveLength(2);
    });

    test('selectQuestionType should return valid type', () => {
      const type = strategy.selectQuestionType({}, {}, []);

      expect([1, 2, 3]).toContain(type);
    });

    test('selectGuessColors should use probabilities when available', () => {
      const knowledge = {
        hiddenCardProbability: {
          red: 0.1,
          yellow: 0.2,
          green: 0.3,
          blue: 0.4
        }
      };

      const colors = strategy.selectGuessColors(knowledge);

      expect(colors).toEqual(['blue', 'green']);
    });

    test('decideFollowGuess should return boolean', () => {
      const decision = strategy.decideFollowGuess(['red', 'blue'], {});

      expect(typeof decision).toBe('boolean');
    });
  });
});

describe('ACTION_TYPE', () => {
  test('should have QUESTION and GUESS types', () => {
    expect(ACTION_TYPE.QUESTION).toBe('question');
    expect(ACTION_TYPE.GUESS).toBe('guess');
  });
});

describe('validateStrategy', () => {
  test('should return valid for complete implementation', () => {
    const strategy = new ConcreteStrategy();
    const result = validateStrategy(strategy);

    expect(result.isValid).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.implemented).toHaveLength(6);
  });

  test('should detect missing methods', () => {
    const strategy = Object.create(BaseStrategy.prototype);
    const result = validateStrategy(strategy);

    expect(result.isValid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });
});
