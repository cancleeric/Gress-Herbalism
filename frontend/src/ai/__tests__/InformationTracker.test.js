/**
 * InformationTracker 單元測試
 */

import InformationTracker, {
  createInformationTracker,
  EVENT_TYPES
} from '../InformationTracker';
import { ALL_COLORS, CARD_COUNTS, TOTAL_CARDS } from '../../shared/constants';

describe('InformationTracker', () => {
  describe('constructor', () => {
    test('should create tracker with selfId', () => {
      const tracker = new InformationTracker('player-1');

      expect(tracker.selfId).toBe('player-1');
    });

    test('should initialize empty knownCards map', () => {
      const tracker = new InformationTracker('player-1');

      expect(tracker.knownCards).toBeInstanceOf(Map);
      expect(tracker.knownCards.size).toBe(0);
    });

    test('should initialize hiddenCardProbability with correct values', () => {
      const tracker = new InformationTracker('player-1');

      // 檢查機率總和為 1
      const totalProb = Object.values(tracker.hiddenCardProbability).reduce((a, b) => a + b, 0);
      expect(totalProb).toBeCloseTo(1, 5);

      // 檢查各顏色機率
      expect(tracker.hiddenCardProbability.red).toBeCloseTo(2/14, 5);
      expect(tracker.hiddenCardProbability.yellow).toBeCloseTo(3/14, 5);
      expect(tracker.hiddenCardProbability.green).toBeCloseTo(4/14, 5);
      expect(tracker.hiddenCardProbability.blue).toBeCloseTo(5/14, 5);
    });

    test('should initialize empty visibleColorCounts', () => {
      const tracker = new InformationTracker('player-1');

      for (const color of ALL_COLORS) {
        expect(tracker.visibleColorCounts[color]).toBe(0);
      }
    });

    test('should initialize empty questionHistory', () => {
      const tracker = new InformationTracker('player-1');

      expect(tracker.questionHistory).toEqual([]);
    });

    test('should initialize empty eliminatedColors', () => {
      const tracker = new InformationTracker('player-1');

      expect(tracker.eliminatedColors).toBeInstanceOf(Set);
      expect(tracker.eliminatedColors.size).toBe(0);
    });

    test('should initialize empty myHand', () => {
      const tracker = new InformationTracker('player-1');

      expect(tracker.myHand).toEqual([]);
    });
  });

  describe('reset', () => {
    test('should reset all tracking data', () => {
      const tracker = new InformationTracker('player-1');

      // 修改一些資料
      tracker.knownCards.set('player-2', { hasColors: new Set(['red']), noColors: new Set() });
      tracker.visibleColorCounts.red = 2;
      tracker.questionHistory.push({ test: true });
      tracker.eliminatedColors.add('red');
      tracker.myHand = [{ color: 'blue' }];

      tracker.reset();

      expect(tracker.knownCards.size).toBe(0);
      expect(tracker.visibleColorCounts.red).toBe(0);
      expect(tracker.questionHistory).toEqual([]);
      expect(tracker.eliminatedColors.size).toBe(0);
      expect(tracker.myHand).toEqual([]);
    });

    test('should restore initial probabilities', () => {
      const tracker = new InformationTracker('player-1');

      tracker.hiddenCardProbability.red = 0.5;
      tracker.reset();

      expect(tracker.hiddenCardProbability.red).toBeCloseTo(2/14, 5);
    });
  });

  describe('processEvent', () => {
    test('should ignore null event', () => {
      const tracker = new InformationTracker('player-1');

      expect(() => tracker.processEvent(null)).not.toThrow();
    });

    test('should ignore event without type', () => {
      const tracker = new InformationTracker('player-1');

      expect(() => tracker.processEvent({ data: 'test' })).not.toThrow();
    });

    test('should ignore unknown event type', () => {
      const tracker = new InformationTracker('player-1');

      expect(() => tracker.processEvent({ type: 'UNKNOWN_TYPE' })).not.toThrow();
    });

    test('should process QUESTION_RESULT event', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.QUESTION_RESULT,
        askerId: 'player-1',
        targetId: 'player-2',
        colors: ['red', 'blue'],
        questionType: 1,
        result: {}
      };

      tracker.processEvent(event);

      expect(tracker.questionHistory).toHaveLength(1);
    });

    test('should process CARD_TRANSFER event', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'player-1',
        cards: [{ color: 'red' }]
      };

      tracker.processEvent(event);

      expect(tracker.visibleColorCounts.red).toBe(1);
    });

    test('should process GAME_START event', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.GAME_START,
        players: [
          { id: 'player-1', handCount: 3 },
          { id: 'player-2', handCount: 3 }
        ]
      };

      tracker.processEvent(event);

      expect(tracker.activePlayers.has('player-1')).toBe(true);
      expect(tracker.activePlayers.has('player-2')).toBe(true);
    });

    test('should process HAND_SET event for self', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.HAND_SET,
        playerId: 'player-1',
        cards: [{ color: 'red' }, { color: 'blue' }]
      };

      tracker.processEvent(event);

      expect(tracker.myHand).toHaveLength(2);
      expect(tracker.visibleColorCounts.red).toBe(1);
      expect(tracker.visibleColorCounts.blue).toBe(1);
    });
  });

  describe('processQuestionResult', () => {
    test('should record question in history', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.QUESTION_RESULT,
        askerId: 'player-1',
        targetId: 'player-2',
        colors: ['red', 'blue'],
        questionType: 1,
        result: {}
      };

      tracker.processQuestionResult(event);

      expect(tracker.questionHistory).toHaveLength(1);
      expect(tracker.questionHistory[0].askerId).toBe('player-1');
      expect(tracker.questionHistory[0].targetId).toBe('player-2');
      expect(tracker.questionHistory[0].colors).toEqual(['red', 'blue']);
    });

    test('should add timestamp to history', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.QUESTION_RESULT,
        askerId: 'player-1',
        targetId: 'player-2',
        colors: ['red', 'blue'],
        questionType: 1,
        result: {}
      };

      const beforeTime = Date.now();
      tracker.processQuestionResult(event);
      const afterTime = Date.now();

      expect(tracker.questionHistory[0].timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(tracker.questionHistory[0].timestamp).toBeLessThanOrEqual(afterTime);
    });

    test('should record noCardsForColors', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.QUESTION_RESULT,
        askerId: 'player-1',
        targetId: 'player-2',
        colors: ['red', 'blue'],
        questionType: 1,
        result: {
          noCardsForColors: ['red']
        }
      };

      tracker.processQuestionResult(event);

      expect(tracker.playerHasNoColor('player-2', 'red')).toBe(true);
    });
  });

  describe('processCardTransfer', () => {
    test('should update visible color counts', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'player-1',
        cards: [{ color: 'red' }, { color: 'blue' }]
      };

      tracker.processCardTransfer(event);

      expect(tracker.visibleColorCounts.red).toBe(1);
      expect(tracker.visibleColorCounts.blue).toBe(1);
    });

    test('should record receiver has the colors', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'player-1',
        cards: [{ color: 'red' }]
      };

      tracker.processCardTransfer(event);

      expect(tracker.playerHasColor('player-1', 'red')).toBe(true);
    });

    test('should handle empty cards array', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'player-1',
        cards: []
      };

      expect(() => tracker.processCardTransfer(event)).not.toThrow();
    });

    test('should update player hand counts', () => {
      const tracker = new InformationTracker('player-1');
      tracker.playerHandCounts.set('player-1', 3);
      tracker.playerHandCounts.set('player-2', 3);

      const event = {
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: 'player-1',
        cards: [{ color: 'red' }]
      };

      tracker.processCardTransfer(event);

      expect(tracker.playerHandCounts.get('player-1')).toBe(4);
      expect(tracker.playerHandCounts.get('player-2')).toBe(2);
    });
  });

  describe('processGuessResult', () => {
    test('should mark colors as eliminated on correct guess', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.GUESS_RESULT,
        guessedColors: ['red', 'blue'],
        isCorrect: true
      };

      tracker.processGuessResult(event);

      expect(tracker.eliminatedColors.has('red')).toBe(true);
      expect(tracker.eliminatedColors.has('blue')).toBe(true);
    });

    test('should set probabilities on correct guess', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.GUESS_RESULT,
        guessedColors: ['red', 'blue'],
        isCorrect: true
      };

      tracker.processGuessResult(event);

      expect(tracker.hiddenCardProbability.red).toBe(0.5);
      expect(tracker.hiddenCardProbability.blue).toBe(0.5);
      expect(tracker.hiddenCardProbability.yellow).toBe(0);
      expect(tracker.hiddenCardProbability.green).toBe(0);
    });

    test('should handle incorrect guess', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        type: EVENT_TYPES.GUESS_RESULT,
        guessedColors: ['red', 'blue'],
        isCorrect: false
      };

      // 不應該拋出錯誤
      expect(() => tracker.processGuessResult(event)).not.toThrow();
    });
  });

  describe('processNewRound', () => {
    test('should reset question history', () => {
      const tracker = new InformationTracker('player-1');
      tracker.questionHistory.push({ test: true });

      tracker.processNewRound({});

      expect(tracker.questionHistory).toEqual([]);
    });

    test('should reset visible color counts', () => {
      const tracker = new InformationTracker('player-1');
      tracker.visibleColorCounts.red = 5;

      tracker.processNewRound({});

      expect(tracker.visibleColorCounts.red).toBe(0);
    });

    test('should reset hidden card probability', () => {
      const tracker = new InformationTracker('player-1');
      tracker.hiddenCardProbability.red = 0.9;

      tracker.processNewRound({});

      expect(tracker.hiddenCardProbability.red).toBeCloseTo(2/14, 5);
    });
  });

  describe('processPlayerEliminated', () => {
    test('should remove player from active players', () => {
      const tracker = new InformationTracker('player-1');
      tracker.activePlayers.add('player-2');
      tracker.activePlayers.add('player-3');

      tracker.processPlayerEliminated({ playerId: 'player-2' });

      expect(tracker.activePlayers.has('player-2')).toBe(false);
      expect(tracker.activePlayers.has('player-3')).toBe(true);
    });
  });

  describe('processGameStart', () => {
    test('should reset tracker', () => {
      const tracker = new InformationTracker('player-1');
      tracker.questionHistory.push({ test: true });

      tracker.processGameStart({ players: [] });

      expect(tracker.questionHistory).toEqual([]);
    });

    test('should set active players', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        players: [
          { id: 'player-1' },
          { id: 'player-2' },
          { id: 'player-3' }
        ]
      };

      tracker.processGameStart(event);

      expect(tracker.activePlayers.size).toBe(3);
    });

    test('should set player hand counts', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        players: [
          { id: 'player-1', handCount: 4 },
          { id: 'player-2', handCount: 4 }
        ]
      };

      tracker.processGameStart(event);

      expect(tracker.playerHandCounts.get('player-1')).toBe(4);
      expect(tracker.playerHandCounts.get('player-2')).toBe(4);
    });
  });

  describe('processHandSet', () => {
    test('should set myHand when playerId matches selfId', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        playerId: 'player-1',
        cards: [{ color: 'red' }, { color: 'blue' }]
      };

      tracker.processHandSet(event);

      expect(tracker.myHand).toHaveLength(2);
    });

    test('should not set myHand when playerId does not match', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        playerId: 'player-2',
        cards: [{ color: 'red' }]
      };

      tracker.processHandSet(event);

      expect(tracker.myHand).toEqual([]);
    });

    test('should update visible color counts for own hand', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        playerId: 'player-1',
        cards: [{ color: 'red' }, { color: 'red' }, { color: 'blue' }]
      };

      tracker.processHandSet(event);

      expect(tracker.visibleColorCounts.red).toBe(2);
      expect(tracker.visibleColorCounts.blue).toBe(1);
    });

    test('should update player hand counts', () => {
      const tracker = new InformationTracker('player-1');
      const event = {
        playerId: 'player-2',
        cards: [{ color: 'red' }, { color: 'blue' }]
      };

      tracker.processHandSet(event);

      expect(tracker.playerHandCounts.get('player-2')).toBe(2);
    });
  });

  describe('recalculateProbabilities', () => {
    test('should update probabilities based on visible cards', () => {
      const tracker = new InformationTracker('player-1');

      // 看到 1 張紅色
      tracker.visibleColorCounts.red = 1;
      tracker.recalculateProbabilities();

      // 紅色剩 1 張，總剩餘 13 張
      // 紅色機率 = 1/13
      expect(tracker.hiddenCardProbability.red).toBeCloseTo(1/13, 5);
    });

    test('should eliminate color when all cards are visible', () => {
      const tracker = new InformationTracker('player-1');

      // 看到所有 2 張紅色
      tracker.visibleColorCounts.red = 2;
      tracker.recalculateProbabilities();

      expect(tracker.hiddenCardProbability.red).toBe(0);
      expect(tracker.eliminatedColors.has('red')).toBe(true);
    });

    test('should handle zero remaining cards', () => {
      const tracker = new InformationTracker('player-1');

      // 看到所有牌（不可能的情況，但要處理）
      tracker.visibleColorCounts.red = 2;
      tracker.visibleColorCounts.yellow = 3;
      tracker.visibleColorCounts.green = 4;
      tracker.visibleColorCounts.blue = 5;

      tracker.recalculateProbabilities();

      // 應該回到初始機率
      const totalProb = Object.values(tracker.hiddenCardProbability).reduce((a, b) => a + b, 0);
      expect(totalProb).toBeCloseTo(1, 5);
    });
  });

  describe('getKnowledge', () => {
    test('should return knowledge object', () => {
      const tracker = new InformationTracker('player-1');
      const knowledge = tracker.getKnowledge();

      expect(knowledge).toHaveProperty('knownCards');
      expect(knowledge).toHaveProperty('hiddenCardProbability');
      expect(knowledge).toHaveProperty('eliminatedColors');
      expect(knowledge).toHaveProperty('questionHistory');
      expect(knowledge).toHaveProperty('visibleColorCounts');
      expect(knowledge).toHaveProperty('myHand');
      expect(knowledge).toHaveProperty('activePlayers');
      expect(knowledge).toHaveProperty('playerHandCounts');
      expect(knowledge).toHaveProperty('inference');
    });

    test('should return copy of data', () => {
      const tracker = new InformationTracker('player-1');
      const knowledge = tracker.getKnowledge();

      // 修改返回的資料不應影響原始追蹤器
      knowledge.questionHistory.push({ test: true });
      knowledge.eliminatedColors.push('red');

      expect(tracker.questionHistory).toEqual([]);
      expect(tracker.eliminatedColors.size).toBe(0);
    });

    test('should include inference data', () => {
      const tracker = new InformationTracker('player-1');
      const knowledge = tracker.getKnowledge();

      expect(knowledge.inference).toHaveProperty('mostLikelyHiddenColors');
      expect(knowledge.inference).toHaveProperty('confidence');
      expect(knowledge.inference).toHaveProperty('colorProbabilities');
    });
  });

  describe('getInferenceData', () => {
    test('should return most likely hidden colors', () => {
      const tracker = new InformationTracker('player-1');
      const inference = tracker.getInferenceData();

      expect(inference.mostLikelyHiddenColors).toHaveLength(2);
      // 初始狀態下，藍色(5/14)和綠色(4/14)機率最高
      expect(inference.mostLikelyHiddenColors).toContain('blue');
      expect(inference.mostLikelyHiddenColors).toContain('green');
    });

    test('should return confidence between 0 and 1', () => {
      const tracker = new InformationTracker('player-1');
      const inference = tracker.getInferenceData();

      expect(inference.confidence).toBeGreaterThanOrEqual(0);
      expect(inference.confidence).toBeLessThanOrEqual(1);
    });

    test('should return sorted color probabilities', () => {
      const tracker = new InformationTracker('player-1');
      const inference = tracker.getInferenceData();

      const probabilities = inference.colorProbabilities;
      for (let i = 1; i < probabilities.length; i++) {
        expect(probabilities[i-1].probability).toBeGreaterThanOrEqual(probabilities[i].probability);
      }
    });
  });

  describe('helper methods', () => {
    describe('playerHasNoColor', () => {
      test('should return false for unknown player', () => {
        const tracker = new InformationTracker('player-1');

        expect(tracker.playerHasNoColor('unknown', 'red')).toBe(false);
      });

      test('should return true when recorded', () => {
        const tracker = new InformationTracker('player-1');
        tracker.recordPlayerHasNoColor('player-2', 'red');

        expect(tracker.playerHasNoColor('player-2', 'red')).toBe(true);
      });
    });

    describe('playerHasColor', () => {
      test('should return false for unknown player', () => {
        const tracker = new InformationTracker('player-1');

        expect(tracker.playerHasColor('unknown', 'red')).toBe(false);
      });

      test('should return true when recorded', () => {
        const tracker = new InformationTracker('player-1');
        tracker.recordPlayerHasColor('player-2', 'red');

        expect(tracker.playerHasColor('player-2', 'red')).toBe(true);
      });
    });

    describe('getRemainingCount', () => {
      test('should return full count initially', () => {
        const tracker = new InformationTracker('player-1');

        expect(tracker.getRemainingCount('red')).toBe(2);
        expect(tracker.getRemainingCount('blue')).toBe(5);
      });

      test('should return reduced count after seeing cards', () => {
        const tracker = new InformationTracker('player-1');
        tracker.visibleColorCounts.red = 1;

        expect(tracker.getRemainingCount('red')).toBe(1);
      });

      test('should not return negative', () => {
        const tracker = new InformationTracker('player-1');
        tracker.visibleColorCounts.red = 10;

        expect(tracker.getRemainingCount('red')).toBe(0);
      });
    });

    describe('isColorEliminated', () => {
      test('should return false initially', () => {
        const tracker = new InformationTracker('player-1');

        expect(tracker.isColorEliminated('red')).toBe(false);
      });

      test('should return true after elimination', () => {
        const tracker = new InformationTracker('player-1');
        tracker.eliminatedColors.add('red');

        expect(tracker.isColorEliminated('red')).toBe(true);
      });
    });

    describe('setSelfId', () => {
      test('should update selfId', () => {
        const tracker = new InformationTracker('player-1');
        tracker.setSelfId('player-2');

        expect(tracker.selfId).toBe('player-2');
      });
    });
  });

  describe('recordPlayerHasColor and recordPlayerHasNoColor', () => {
    test('should create player entry if not exists', () => {
      const tracker = new InformationTracker('player-1');
      tracker.recordPlayerHasColor('player-2', 'red');

      expect(tracker.knownCards.has('player-2')).toBe(true);
    });

    test('should remove from noColors when adding to hasColors', () => {
      const tracker = new InformationTracker('player-1');
      tracker.recordPlayerHasNoColor('player-2', 'red');
      tracker.recordPlayerHasColor('player-2', 'red');

      const info = tracker.knownCards.get('player-2');
      expect(info.hasColors.has('red')).toBe(true);
      expect(info.noColors.has('red')).toBe(false);
    });
  });
});

describe('createInformationTracker', () => {
  test('should create InformationTracker instance', () => {
    const tracker = createInformationTracker('player-1');

    expect(tracker).toBeInstanceOf(InformationTracker);
    expect(tracker.selfId).toBe('player-1');
  });
});

describe('EVENT_TYPES', () => {
  test('should have all event types', () => {
    expect(EVENT_TYPES.QUESTION_RESULT).toBe('QUESTION_RESULT');
    expect(EVENT_TYPES.CARD_TRANSFER).toBe('CARD_TRANSFER');
    expect(EVENT_TYPES.GUESS_RESULT).toBe('GUESS_RESULT');
    expect(EVENT_TYPES.NEW_ROUND).toBe('NEW_ROUND');
    expect(EVENT_TYPES.PLAYER_ELIMINATED).toBe('PLAYER_ELIMINATED');
    expect(EVENT_TYPES.GAME_START).toBe('GAME_START');
    expect(EVENT_TYPES.HAND_SET).toBe('HAND_SET');
  });
});
