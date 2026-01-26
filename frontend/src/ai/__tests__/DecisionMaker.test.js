/**
 * DecisionMaker 單元測試
 */

import DecisionMaker, { createDecisionMaker } from '../DecisionMaker';
import { ACTION_TYPE } from '../strategies/BaseStrategy';

// Mock 策略
const createMockStrategy = (overrides = {}) => ({
  decideAction: jest.fn().mockReturnValue(ACTION_TYPE.QUESTION),
  selectTargetPlayer: jest.fn().mockReturnValue({ id: 'player-2' }),
  selectColors: jest.fn().mockReturnValue(['red', 'blue']),
  selectQuestionType: jest.fn().mockReturnValue(1),
  selectGuessColors: jest.fn().mockReturnValue(['green', 'yellow']),
  decideFollowGuess: jest.fn().mockReturnValue(true),
  getInfo: jest.fn().mockReturnValue({ name: 'MockStrategy', difficulty: 'medium' }),
  ...overrides
});

describe('DecisionMaker', () => {
  describe('constructor', () => {
    test('should throw error without strategy', () => {
      expect(() => new DecisionMaker(null)).toThrow('Strategy is required');
    });

    test('should create with strategy', () => {
      const strategy = createMockStrategy();
      const dm = new DecisionMaker(strategy);

      expect(dm.strategy).toBe(strategy);
    });

    test('should accept selfId parameter', () => {
      const strategy = createMockStrategy();
      const dm = new DecisionMaker(strategy, 'player-1');

      expect(dm.selfId).toBe('player-1');
    });

    test('should initialize empty decision history', () => {
      const strategy = createMockStrategy();
      const dm = new DecisionMaker(strategy);

      expect(dm.decisionHistory).toEqual([]);
    });
  });

  describe('setSelfId', () => {
    test('should update selfId', () => {
      const dm = new DecisionMaker(createMockStrategy());
      dm.setSelfId('player-1');

      expect(dm.selfId).toBe('player-1');
    });
  });

  describe('setStrategy', () => {
    test('should update strategy', () => {
      const dm = new DecisionMaker(createMockStrategy());
      const newStrategy = createMockStrategy();

      dm.setStrategy(newStrategy);

      expect(dm.strategy).toBe(newStrategy);
    });

    test('should throw for null strategy', () => {
      const dm = new DecisionMaker(createMockStrategy());

      expect(() => dm.setStrategy(null)).toThrow('Strategy cannot be null');
    });
  });

  describe('decide', () => {
    test('should call strategy.decideAction', () => {
      const strategy = createMockStrategy();
      const dm = new DecisionMaker(strategy);
      const gameState = {};
      const knowledge = {};

      dm.decide(gameState, knowledge);

      expect(strategy.decideAction).toHaveBeenCalledWith(gameState, knowledge);
    });

    test('should make question decision when action is question', () => {
      const strategy = createMockStrategy({
        decideAction: jest.fn().mockReturnValue(ACTION_TYPE.QUESTION)
      });
      const dm = new DecisionMaker(strategy);

      const action = dm.decide({}, {});

      expect(action.type).toBe(ACTION_TYPE.QUESTION);
      expect(strategy.selectTargetPlayer).toHaveBeenCalled();
      expect(strategy.selectColors).toHaveBeenCalled();
      expect(strategy.selectQuestionType).toHaveBeenCalled();
    });

    test('should make guess decision when action is guess', () => {
      const strategy = createMockStrategy({
        decideAction: jest.fn().mockReturnValue(ACTION_TYPE.GUESS)
      });
      const dm = new DecisionMaker(strategy);

      const action = dm.decide({}, {});

      expect(action.type).toBe(ACTION_TYPE.GUESS);
      expect(strategy.selectGuessColors).toHaveBeenCalled();
    });

    test('should record decision in history', () => {
      const dm = new DecisionMaker(createMockStrategy());

      dm.decide({}, {});

      expect(dm.decisionHistory).toHaveLength(1);
      expect(dm.decisionHistory[0].type).toBe('action');
    });
  });

  describe('makeQuestionDecision', () => {
    test('should return question action object', () => {
      const strategy = createMockStrategy();
      const dm = new DecisionMaker(strategy);

      const action = dm.makeQuestionDecision({}, {});

      expect(action.type).toBe(ACTION_TYPE.QUESTION);
      expect(action.targetPlayerId).toBe('player-2');
      expect(action.colors).toEqual(['red', 'blue']);
      expect(action.questionType).toBe(1);
    });

    test('should handle null target player', () => {
      const strategy = createMockStrategy({
        selectTargetPlayer: jest.fn().mockReturnValue(null)
      });
      const dm = new DecisionMaker(strategy);

      const action = dm.makeQuestionDecision({}, {});

      expect(action.targetPlayerId).toBeNull();
    });
  });

  describe('makeGuessDecision', () => {
    test('should return guess action object', () => {
      const strategy = createMockStrategy();
      const dm = new DecisionMaker(strategy);

      const action = dm.makeGuessDecision({}, {});

      expect(action.type).toBe(ACTION_TYPE.GUESS);
      expect(action.colors).toEqual(['green', 'yellow']);
    });
  });

  describe('decideFollowGuess', () => {
    test('should call strategy.decideFollowGuess', () => {
      const strategy = createMockStrategy();
      const dm = new DecisionMaker(strategy);

      dm.decideFollowGuess({}, ['red', 'blue'], {});

      expect(strategy.decideFollowGuess).toHaveBeenCalledWith(['red', 'blue'], {});
    });

    test('should return boolean result', () => {
      const dm = new DecisionMaker(createMockStrategy());

      const result = dm.decideFollowGuess({}, ['red', 'blue'], {});

      expect(typeof result).toBe('boolean');
    });

    test('should record follow guess decision', () => {
      const dm = new DecisionMaker(createMockStrategy());

      dm.decideFollowGuess({}, ['red', 'blue'], {});

      expect(dm.decisionHistory).toHaveLength(1);
      expect(dm.decisionHistory[0].type).toBe('followGuess');
    });
  });

  describe('decision history', () => {
    test('getDecisionHistory should return copy', () => {
      const dm = new DecisionMaker(createMockStrategy());
      dm.decide({}, {});

      const history = dm.getDecisionHistory();
      history.push({ test: true });

      expect(dm.decisionHistory).toHaveLength(1);
    });

    test('clearHistory should empty history', () => {
      const dm = new DecisionMaker(createMockStrategy());
      dm.decide({}, {});
      dm.decide({}, {});

      dm.clearHistory();

      expect(dm.decisionHistory).toEqual([]);
    });

    test('getRecentDecisions should return last N decisions', () => {
      const dm = new DecisionMaker(createMockStrategy());

      for (let i = 0; i < 10; i++) {
        dm.decide({}, {});
      }

      const recent = dm.getRecentDecisions(3);

      expect(recent).toHaveLength(3);
    });

    test('getRecentDecisions should handle count > history length', () => {
      const dm = new DecisionMaker(createMockStrategy());
      dm.decide({}, {});

      const recent = dm.getRecentDecisions(10);

      expect(recent).toHaveLength(1);
    });
  });

  describe('getStatistics', () => {
    test('should count decisions correctly', () => {
      const dm = new DecisionMaker(createMockStrategy({
        decideAction: jest.fn()
          .mockReturnValueOnce(ACTION_TYPE.QUESTION)
          .mockReturnValueOnce(ACTION_TYPE.QUESTION)
          .mockReturnValueOnce(ACTION_TYPE.GUESS)
      }));

      dm.decide({}, {}); // question
      dm.decide({}, {}); // question
      dm.decide({}, {}); // guess
      dm.decideFollowGuess({}, [], {}); // follow guess yes

      const stats = dm.getStatistics();

      expect(stats.totalDecisions).toBe(4);
      expect(stats.actionDecisions).toBe(3);
      expect(stats.questionActions).toBe(2);
      expect(stats.guessActions).toBe(1);
      expect(stats.followGuessDecisions).toBe(1);
      expect(stats.followGuessYes).toBe(1);
    });

    test('should count follow guess no', () => {
      const dm = new DecisionMaker(createMockStrategy({
        decideFollowGuess: jest.fn().mockReturnValue(false)
      }));

      dm.decideFollowGuess({}, [], {});

      const stats = dm.getStatistics();

      expect(stats.followGuessNo).toBe(1);
    });
  });

  describe('validateAction', () => {
    let dm;

    beforeEach(() => {
      dm = new DecisionMaker(createMockStrategy());
    });

    test('should reject null action', () => {
      const result = dm.validateAction(null);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action is null');
    });

    test('should reject missing action type', () => {
      const result = dm.validateAction({});

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action type is missing');
    });

    test('should validate question action', () => {
      const result = dm.validateAction({
        type: ACTION_TYPE.QUESTION,
        targetPlayerId: 'player-2',
        colors: ['red', 'blue'],
        questionType: 1
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject question action without target', () => {
      const result = dm.validateAction({
        type: ACTION_TYPE.QUESTION,
        colors: ['red', 'blue'],
        questionType: 1
      });

      expect(result.isValid).toBe(false);
    });

    test('should reject question action with wrong colors count', () => {
      const result = dm.validateAction({
        type: ACTION_TYPE.QUESTION,
        targetPlayerId: 'player-2',
        colors: ['red'],
        questionType: 1
      });

      expect(result.isValid).toBe(false);
    });

    test('should reject question action with invalid type', () => {
      const result = dm.validateAction({
        type: ACTION_TYPE.QUESTION,
        targetPlayerId: 'player-2',
        colors: ['red', 'blue'],
        questionType: 5
      });

      expect(result.isValid).toBe(false);
    });

    test('should validate guess action', () => {
      const result = dm.validateAction({
        type: ACTION_TYPE.GUESS,
        colors: ['red', 'blue']
      });

      expect(result.isValid).toBe(true);
    });

    test('should reject guess action with wrong colors count', () => {
      const result = dm.validateAction({
        type: ACTION_TYPE.GUESS,
        colors: ['red']
      });

      expect(result.isValid).toBe(false);
    });

    test('should reject unknown action type', () => {
      const result = dm.validateAction({
        type: 'unknown'
      });

      expect(result.isValid).toBe(false);
    });
  });

  describe('getInfo', () => {
    test('should return decision maker info', () => {
      const dm = new DecisionMaker(createMockStrategy(), 'player-1');
      dm.decide({}, {});

      const info = dm.getInfo();

      expect(info.selfId).toBe('player-1');
      expect(info.strategy.name).toBe('MockStrategy');
      expect(info.historyLength).toBe(1);
    });

    test('should handle strategy without getInfo', () => {
      const strategy = createMockStrategy();
      delete strategy.getInfo;
      const dm = new DecisionMaker(strategy);

      const info = dm.getInfo();

      expect(info.strategy.name).toBe('unknown');
    });
  });

  describe('reset', () => {
    test('should clear decision history', () => {
      const dm = new DecisionMaker(createMockStrategy());
      dm.decide({}, {});
      dm.decide({}, {});

      dm.reset();

      expect(dm.decisionHistory).toEqual([]);
    });
  });

  describe('summarizeKnowledge', () => {
    test('should return null for null knowledge', () => {
      const dm = new DecisionMaker(createMockStrategy());

      expect(dm.summarizeKnowledge(null)).toBeNull();
    });

    test('should summarize knowledge correctly', () => {
      const dm = new DecisionMaker(createMockStrategy());
      const knowledge = {
        hiddenCardProbability: { red: 0.25, blue: 0.25 },
        eliminatedColors: ['yellow'],
        inference: { confidence: 0.8 }
      };

      const summary = dm.summarizeKnowledge(knowledge);

      expect(summary.hiddenCardProbability).toEqual({ red: 0.25, blue: 0.25 });
      expect(summary.eliminatedColors).toEqual(['yellow']);
      expect(summary.confidence).toBe(0.8);
    });

    test('should handle missing properties', () => {
      const dm = new DecisionMaker(createMockStrategy());
      const knowledge = {};

      const summary = dm.summarizeKnowledge(knowledge);

      expect(summary.hiddenCardProbability).toBeNull();
      expect(summary.eliminatedColors).toEqual([]);
      expect(summary.confidence).toBeNull();
    });
  });
});

describe('createDecisionMaker', () => {
  test('should create DecisionMaker instance', () => {
    const strategy = createMockStrategy();
    const dm = createDecisionMaker(strategy, 'player-1');

    expect(dm).toBeInstanceOf(DecisionMaker);
    expect(dm.selfId).toBe('player-1');
  });

  test('should work without selfId', () => {
    const strategy = createMockStrategy();
    const dm = createDecisionMaker(strategy);

    expect(dm.selfId).toBeNull();
  });
});
