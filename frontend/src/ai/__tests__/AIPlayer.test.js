/**
 * AIPlayer 單元測試
 */

import AIPlayer, { createAIPlayer } from '../AIPlayer';
import { AI_DIFFICULTY, PLAYER_TYPE, AI_THINK_DELAY } from '../../shared/constants';

describe('AIPlayer', () => {
  describe('constructor', () => {
    test('should create AI player with default difficulty', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      expect(ai.id).toBe('ai-1');
      expect(ai.name).toBe('Test AI');
      expect(ai.isAI).toBe(true);
      expect(ai.playerType).toBe(PLAYER_TYPE.AI);
      expect(ai.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
    });

    test('should create AI player with specified difficulty', () => {
      const ai = new AIPlayer('ai-1', 'Test AI', AI_DIFFICULTY.HARD);

      expect(ai.difficulty).toBe(AI_DIFFICULTY.HARD);
    });

    test('should use default name if not provided', () => {
      const ai = new AIPlayer('ai-1', null);

      expect(ai.name).toBe('小草'); // First name in AI_PLAYER_NAMES
    });

    test('should fallback to medium difficulty for invalid difficulty', () => {
      const ai = new AIPlayer('ai-1', 'Test AI', 'invalid');

      expect(ai.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
    });

    test('should initialize game state properties', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      expect(ai.hand).toEqual([]);
      expect(ai.isActive).toBe(true);
      expect(ai.score).toBe(0);
      expect(ai.isCurrentTurn).toBe(false);
    });

    test('should initialize AI components', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      expect(ai.strategy).toBeDefined();
      expect(ai.informationTracker).toBeDefined();
      expect(ai.decisionMaker).toBeDefined();
    });

    test('should initialize tracking state', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      expect(ai.isThinking).toBe(false);
      expect(ai.lastAction).toBeNull();
      expect(ai.actionHistory).toEqual([]);
    });
  });

  describe('createStrategy', () => {
    test('should create strategy with correct difficulty', () => {
      const ai = new AIPlayer('ai-1', 'Test AI', AI_DIFFICULTY.EASY);

      expect(ai.strategy.difficulty).toBe(AI_DIFFICULTY.EASY);
    });

    test('should create strategy with required methods', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      expect(typeof ai.strategy.decideAction).toBe('function');
      expect(typeof ai.strategy.selectTargetPlayer).toBe('function');
      expect(typeof ai.strategy.selectColors).toBe('function');
      expect(typeof ai.strategy.selectQuestionType).toBe('function');
      expect(typeof ai.strategy.selectGuessColors).toBe('function');
      expect(typeof ai.strategy.decideFollowGuess).toBe('function');
    });
  });

  describe('createInformationTracker', () => {
    test('should create tracker with initial probability', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const tracker = ai.informationTracker;

      expect(tracker.hiddenCardProbability.red).toBeCloseTo(2/14, 5);
      expect(tracker.hiddenCardProbability.yellow).toBeCloseTo(3/14, 5);
      expect(tracker.hiddenCardProbability.green).toBeCloseTo(4/14, 5);
      expect(tracker.hiddenCardProbability.blue).toBeCloseTo(5/14, 5);
    });

    test('should have reset method', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      ai.informationTracker.questionHistory.push({ test: true });
      ai.informationTracker.reset();

      expect(ai.informationTracker.questionHistory).toEqual([]);
    });

    test('should have getKnowledge method', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const knowledge = ai.informationTracker.getKnowledge();

      expect(knowledge).toHaveProperty('knownCards');
      expect(knowledge).toHaveProperty('hiddenCardProbability');
      expect(knowledge).toHaveProperty('eliminatedColors');
      expect(knowledge).toHaveProperty('questionHistory');
    });
  });

  describe('onGameEvent', () => {
    test('should process question result event', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const event = {
        type: 'QUESTION_RESULT',
        askerId: 'player-1',
        colors: ['red', 'blue']
      };

      ai.onGameEvent(event);

      expect(ai.informationTracker.questionHistory).toHaveLength(1);
      // 檢查事件的關鍵字段，而不是完全匹配（因為 InformationTracker 可能添加額外字段）
      expect(ai.informationTracker.questionHistory[0]).toMatchObject({
        askerId: 'player-1',
        colors: ['red', 'blue']
      });
    });
  });

  describe('takeTurn', () => {
    test('should return action object', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = {
        players: [
          { id: 'ai-1', isActive: true },
          { id: 'player-2', isActive: true }
        ],
        currentPlayerIndex: 0
      };

      // 使用快速延遲進行測試
      ai.thinkDelay = jest.fn().mockResolvedValue();

      const action = await ai.takeTurn(gameState);

      expect(action).toHaveProperty('type');
      expect(['question', 'guess']).toContain(action.type);
    });

    test('should set isThinking during decision', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = { players: [{ id: 'ai-1', isActive: true }] };

      let wasThinking = false;
      ai.thinkDelay = jest.fn().mockImplementation(() => {
        wasThinking = ai.isThinking;
        return Promise.resolve();
      });

      await ai.takeTurn(gameState);

      expect(wasThinking).toBe(true);
      expect(ai.isThinking).toBe(false);
    });

    test('should record action in history', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = {
        players: [
          { id: 'ai-1', isActive: true },
          { id: 'player-2', isActive: true }
        ]
      };

      ai.thinkDelay = jest.fn().mockResolvedValue();

      await ai.takeTurn(gameState);

      expect(ai.actionHistory).toHaveLength(1);
      expect(ai.lastAction).toBeDefined();
    });

    test('should return guess action when must guess', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = {
        players: [
          { id: 'ai-1', isActive: true }
          // Only one active player
        ]
      };

      ai.thinkDelay = jest.fn().mockResolvedValue();

      const action = await ai.takeTurn(gameState);

      expect(action.type).toBe('guess');
      expect(action.colors).toHaveLength(2);
    });
  });

  describe('decideFollowGuess', () => {
    test('should return boolean', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = { players: [] };
      const guessedColors = ['red', 'blue'];

      ai.thinkDelay = jest.fn().mockResolvedValue();

      const result = await ai.decideFollowGuess(gameState, guessedColors);

      expect(typeof result).toBe('boolean');
    });

    test('should use shorter delay for follow guess', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = { players: [] };

      const mockThinkDelay = jest.fn().mockResolvedValue();
      ai.thinkDelay = mockThinkDelay;

      await ai.decideFollowGuess(gameState, ['red', 'blue']);

      expect(mockThinkDelay).toHaveBeenCalledWith(
        AI_THINK_DELAY.FOLLOW_GUESS_MIN,
        AI_THINK_DELAY.FOLLOW_GUESS_MAX
      );
    });
  });

  describe('thinkDelay', () => {
    test('should return promise that resolves', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      // 使用很短的延遲進行測試
      const result = ai.thinkDelay(1, 2);

      expect(result).toBeInstanceOf(Promise);
      await expect(result).resolves.toBeUndefined();
    });

    test('should delay within specified range', async () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const min = 10;
      const max = 20;

      const start = Date.now();
      await ai.thinkDelay(min, max);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeGreaterThanOrEqual(min - 5); // 允許小誤差
      expect(elapsed).toBeLessThanOrEqual(max + 50); // 允許較大的上限誤差
    });
  });

  describe('reset', () => {
    test('should reset game state properties', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      // 修改狀態
      ai.hand = [{ color: 'red' }];
      ai.isActive = false;
      ai.score = 5;
      ai.isCurrentTurn = true;

      ai.reset();

      expect(ai.hand).toEqual([]);
      expect(ai.isActive).toBe(true);
      expect(ai.score).toBe(0);
      expect(ai.isCurrentTurn).toBe(false);
    });

    test('should reset tracking state', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      ai.isThinking = true;
      ai.lastAction = { type: 'question' };
      ai.actionHistory.push({ action: {} });

      ai.reset();

      expect(ai.isThinking).toBe(false);
      expect(ai.lastAction).toBeNull();
      expect(ai.actionHistory).toEqual([]);
    });

    test('should reset information tracker', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');

      ai.informationTracker.questionHistory.push({ test: true });

      ai.reset();

      expect(ai.informationTracker.questionHistory).toEqual([]);
    });
  });

  describe('setHand', () => {
    test('should set hand cards', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const cards = [
        { color: 'red', id: 1 },
        { color: 'blue', id: 2 }
      ];

      ai.setHand(cards);

      expect(ai.hand).toEqual(cards);
    });

    test('should create copy of cards array', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const cards = [{ color: 'red' }];

      ai.setHand(cards);
      cards.push({ color: 'blue' });

      expect(ai.hand).toHaveLength(1);
    });
  });

  describe('getPlayerInfo', () => {
    test('should return player info object', () => {
      const ai = new AIPlayer('ai-1', 'Test AI', AI_DIFFICULTY.HARD);
      ai.hand = [{ color: 'red' }, { color: 'blue' }];
      ai.score = 3;

      const info = ai.getPlayerInfo();

      expect(info).toEqual({
        id: 'ai-1',
        name: 'Test AI',
        isAI: true,
        difficulty: AI_DIFFICULTY.HARD,
        isActive: true,
        score: 3,
        handCount: 2,
        isThinking: false
      });
    });
  });

  describe('default decision methods', () => {
    test('defaultSelectColors should return two different colors', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const colors = ai.defaultSelectColors({}, {});

      expect(colors).toHaveLength(2);
      expect(colors[0]).not.toBe(colors[1]);
      expect(['red', 'yellow', 'green', 'blue']).toContain(colors[0]);
      expect(['red', 'yellow', 'green', 'blue']).toContain(colors[1]);
    });

    test('defaultSelectQuestionType should return valid type', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const type = ai.defaultSelectQuestionType({}, {}, []);

      expect([1, 2, 3]).toContain(type);
    });

    test('defaultSelectTargetPlayer should return other player', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = {
        players: [
          { id: 'ai-1', isActive: true },
          { id: 'player-2', isActive: true },
          { id: 'player-3', isActive: false }
        ]
      };

      const target = ai.defaultSelectTargetPlayer(gameState, {});

      expect(target.id).toBe('player-2');
    });

    test('defaultSelectTargetPlayer should return null if no other players', () => {
      const ai = new AIPlayer('ai-1', 'Test AI');
      const gameState = {
        players: [{ id: 'ai-1', isActive: true }]
      };

      const target = ai.defaultSelectTargetPlayer(gameState, {});

      expect(target).toBeNull();
    });
  });
});

describe('createAIPlayer', () => {
  test('should create AIPlayer instance', () => {
    const ai = createAIPlayer('ai-1', 'Test AI', AI_DIFFICULTY.EASY);

    expect(ai).toBeInstanceOf(AIPlayer);
    expect(ai.id).toBe('ai-1');
    expect(ai.name).toBe('Test AI');
    expect(ai.difficulty).toBe(AI_DIFFICULTY.EASY);
  });

  test('should use default difficulty', () => {
    const ai = createAIPlayer('ai-1', 'Test AI');

    expect(ai.difficulty).toBe(AI_DIFFICULTY.MEDIUM);
  });
});
