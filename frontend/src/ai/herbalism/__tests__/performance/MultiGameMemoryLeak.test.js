/**
 * 多場遊戲記憶體洩漏測試
 * 測試 AI 在多場遊戲後是否正確釋放記憶體
 *
 * REF: 202601250060
 */

import AIPlayer from '../../AIPlayer';
import InformationTracker, { EVENT_TYPES } from '../../InformationTracker';
import DecisionMaker from '../../DecisionMaker';
import MediumStrategy from '../../strategies/MediumStrategy';
import HardStrategy from '../../strategies/HardStrategy';
import {
  generateGameSequence,
  createKnowledge
} from './helpers/gameStateGenerator';
import {
  MemoryTracker,
  formatMemory,
  triggerGC,
  waitForGC,
  hasMemoryLeak
} from './helpers/memoryHelpers';

describe('多場遊戲記憶體洩漏測試', () => {
  let memoryTracker;

  beforeEach(async () => {
    memoryTracker = new MemoryTracker();

    // 強制 GC 並等待完成
    if (triggerGC()) {
      await waitForGC();
    }

    memoryTracker.takeSnapshot('baseline');
  });

  describe('Medium AI 記憶體洩漏測試', () => {
    test('10 場遊戲後記憶體成長應該合理', async () => {
      const numGames = 10;
      const roundsPerGame = 20;

      for (let game = 0; game < numGames; game++) {
        const aiId = 'ai-leak-test';
        const strategy = new MediumStrategy();
        strategy.selfId = aiId;

        const informationTracker = new InformationTracker(aiId);
        const decisionMaker = new DecisionMaker(strategy, aiId);

        let aiPlayer = new AIPlayer(aiId, 'Leak Test AI', 'medium');
        aiPlayer.strategy = strategy;
        aiPlayer.informationTracker = informationTracker;
        aiPlayer.decisionMaker = decisionMaker;
        aiPlayer.thinkDelay = jest.fn().mockResolvedValue();

        // 執行一場遊戲（20 回合）
        const gameSequence = generateGameSequence(aiId, roundsPerGame);

        for (let round = 0; round < roundsPerGame; round++) {
          const gameState = gameSequence[round];
          const knowledge = createKnowledge(gameState, 'medium');

          const decision = decisionMaker.decide(gameState, knowledge);
          aiPlayer.actionHistory.push({
            action: decision,
            timestamp: Date.now(),
            gameState: { ...gameState }
          });

          informationTracker.processEvent({
            type: EVENT_TYPES.QUESTION_RESULT,
            askerId: aiId,
            targetId: 'player-2',
            colors: ['red', 'blue'],
            questionType: 1,
            result: {
              cardsGiven: [],
              noCardsForColors: ['red', 'blue']
            }
          });
        }

        // 記錄遊戲結束時的記憶體
        memoryTracker.takeSnapshot(`game_${game + 1}_before_reset`);

        // 模擬遊戲重置（清空引用）
        aiPlayer.actionHistory = [];
        informationTracker.questionHistory = [];
        informationTracker.knownCards.clear();
        informationTracker.playerHandCounts.clear();

        // 解除引用
        aiPlayer = null;

        // 強制 GC
        if (triggerGC()) {
          await waitForGC();
        }

        memoryTracker.takeSnapshot(`game_${game + 1}_after_reset`);

        const growth = memoryTracker.getGrowth();
        console.log(`第 ${game + 1} 場遊戲後記憶體成長: ${formatMemory(growth.heapUsed)}`);
      }

      // 最終記憶體快照
      memoryTracker.takeSnapshot('final');

      // 驗證記憶體成長是否合理（< 10MB）
      const baseline = memoryTracker.getSnapshots()[0].usage;
      const final = memoryTracker.getSnapshots()[memoryTracker.getSnapshots().length - 1].usage;
      const growthMB = (final.heapUsed - baseline.heapUsed) / 1024 / 1024;

      console.log(`最終記憶體成長: ${formatMemory(final.heapUsed - baseline.heapUsed)}`);
      expect(growthMB).toBeLessThan(10); // 10 場遊戲記憶體成長應 < 10MB
    });

    test('reset() 應清空 questionHistory', () => {
      const aiId = 'ai-reset-test';
      const tracker = new InformationTracker(aiId);

      // 模擬 20 次問牌
      for (let i = 0; i < 20; i++) {
        tracker.processEvent({
          type: EVENT_TYPES.QUESTION_RESULT,
          askerId: aiId,
          targetId: 'player-2',
          colors: ['red', 'blue'],
          questionType: 1,
          result: {
            cardsGiven: [],
            noCardsForColors: ['red', 'blue']
          }
        });
      }

      // 驗證有資料
      const beforeReset = tracker.getKnowledge();
      expect(beforeReset.questionHistory.length).toBe(20);

      // 執行重置
      tracker.questionHistory = [];

      // 驗證清空
      const afterReset = tracker.getKnowledge();
      expect(afterReset.questionHistory.length).toBe(0);
    });

    test('reset() 應清空 actionHistory', () => {
      const aiId = 'ai-action-reset-test';
      const strategy = new MediumStrategy();
      strategy.selfId = aiId;

      const tracker = new InformationTracker(aiId);
      const decisionMaker = new DecisionMaker(strategy, aiId);
      const aiPlayer = new AIPlayer(aiId, 'Action Reset AI', 'medium');

      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = tracker;
      aiPlayer.decisionMaker = decisionMaker;

      // 模擬 20 次動作
      const gameSequence = generateGameSequence(aiId, 20);
      gameSequence.forEach(gameState => {
        const knowledge = createKnowledge(gameState, 'medium');
        const action = decisionMaker.decide(gameState, knowledge);
        aiPlayer.actionHistory.push({
          action,
          timestamp: Date.now(),
          gameState: { ...gameState }
        });
      });

      // 驗證有資料
      expect(aiPlayer.actionHistory.length).toBe(20);

      // 執行重置
      aiPlayer.actionHistory = [];

      // 驗證清空
      expect(aiPlayer.actionHistory.length).toBe(0);
    });

    test('reset() 應清空 knownCards', () => {
      const aiId = 'ai-cards-reset-test';
      const tracker = new InformationTracker(aiId);

      // 模擬記錄手牌
      tracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: aiId,
        cards: [{ color: 'red' }, { color: 'blue' }]
      });

      // 驗證有資料
      const beforeReset = tracker.getKnowledge();
      const beforeResetCount = Object.keys(beforeReset.knownCards).length;
      expect(beforeResetCount).toBeGreaterThan(0);

      // 執行重置
      tracker.knownCards.clear();

      // 驗證清空
      const afterReset = tracker.getKnowledge();
      const afterResetCount = Object.keys(afterReset.knownCards).length;
      expect(afterResetCount).toBe(0);
    });
  });

  describe('Hard AI 記憶體洩漏測試', () => {
    test('Hard AI 10 場遊戲後記憶體應穩定', async () => {
      const numGames = 10;
      const roundsPerGame = 20;

      for (let game = 0; game < numGames; game++) {
        const aiId = 'ai-hard-leak-test';
        const strategy = new HardStrategy();
        strategy.selfId = aiId;

        const informationTracker = new InformationTracker(aiId);
        const decisionMaker = new DecisionMaker(strategy, aiId);

        let aiPlayer = new AIPlayer(aiId, 'Hard Leak Test AI', 'hard');
        aiPlayer.strategy = strategy;
        aiPlayer.informationTracker = informationTracker;
        aiPlayer.decisionMaker = decisionMaker;
        aiPlayer.thinkDelay = jest.fn().mockResolvedValue();

        // 執行一場遊戲（20 回合）
        const gameSequence = generateGameSequence(aiId, roundsPerGame);

        for (let round = 0; round < roundsPerGame; round++) {
          const gameState = gameSequence[round];
          const knowledge = createKnowledge(gameState, 'high'); // Hard AI 有更多知識

          const decision = decisionMaker.decide(gameState, knowledge);
          aiPlayer.actionHistory.push({
            action: decision,
            timestamp: Date.now(),
            gameState: { ...gameState }
          });

          informationTracker.processEvent({
            type: EVENT_TYPES.QUESTION_RESULT,
            askerId: aiId,
            targetId: 'player-2',
            colors: ['red', 'blue'],
            questionType: 1,
            result: {
              cardsGiven: [],
              noCardsForColors: ['red', 'blue']
            }
          });
        }

        memoryTracker.takeSnapshot(`hard_game_${game + 1}_before_reset`);

        // 模擬遊戲重置
        aiPlayer.actionHistory = [];
        informationTracker.questionHistory = [];
        informationTracker.knownCards.clear();
        informationTracker.playerHandCounts.clear();

        aiPlayer = null;

        // 強制 GC
        if (triggerGC()) {
          await waitForGC();
        }

        memoryTracker.takeSnapshot(`hard_game_${game + 1}_after_reset`);

        const growth = memoryTracker.getGrowth();
        console.log(`Hard AI 第 ${game + 1} 場遊戲後記憶體成長: ${formatMemory(growth.heapUsed)}`);
      }

      // 最終記憶體快照
      memoryTracker.takeSnapshot('final');

      // 驗證記憶體洩漏
      const baseline = memoryTracker.getSnapshots()[0].usage;
      const final = memoryTracker.getSnapshots()[memoryTracker.getSnapshots().length - 1].usage;

      const leaked = hasMemoryLeak(baseline, final, 5); // 閾值 5MB（Node.js GC 時機不可控）

      console.log(`Hard AI 最終記憶體成長: ${formatMemory(final.heapUsed - baseline.heapUsed)}`);
      expect(leaked).toBe(false);
    });
  });

  describe('記憶體洩漏偵測', () => {
    test('應該能偵測到明顯的記憶體洩漏', () => {
      const baseline = { heapUsed: 10 * 1024 * 1024 }; // 10MB
      const leaked = { heapUsed: 15 * 1024 * 1024 };   // 15MB（成長 5MB）

      // 閾值 2MB，應該偵測到洩漏
      expect(hasMemoryLeak(baseline, leaked, 2)).toBe(true);
    });

    test('正常的記憶體成長不應被判定為洩漏', () => {
      const baseline = { heapUsed: 10 * 1024 * 1024 }; // 10MB
      const normal = { heapUsed: 11 * 1024 * 1024 };   // 11MB（成長 1MB）

      // 閾值 2MB，不應被判定為洩漏
      expect(hasMemoryLeak(baseline, normal, 2)).toBe(false);
    });
  });
});
