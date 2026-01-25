/**
 * AI 記憶體使用追蹤測試
 * 測試 AI 模組的記憶體使用與成長
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
  waitForGC
} from './helpers/memoryHelpers';

describe('AI 記憶體使用追蹤', () => {
  let memoryTracker;

  beforeEach(async () => {
    memoryTracker = new MemoryTracker();

    // 觸發 GC 清理記憶體
    if (triggerGC()) {
      await waitForGC();
    }

    // 建立基準快照
    memoryTracker.takeSnapshot('baseline');
  });

  describe('InformationTracker 記憶體使用', () => {
    test('questionHistory 大小應該可控', () => {
      const aiId = 'ai-memory-test';
      const tracker = new InformationTracker(aiId);

      // 初始記憶體快照
      memoryTracker.takeSnapshot('before_questions');

      // 模擬 50 次問牌
      for (let i = 0; i < 50; i++) {
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

      memoryTracker.takeSnapshot('after_50_questions');

      // 驗證問題歷史大小
      const knowledge = tracker.getKnowledge();
      expect(knowledge.questionHistory).toHaveLength(50);

      // 記憶體成長應該合理（< 1MB）
      const growth = memoryTracker.getGrowth();
      console.log(`50 次問牌記憶體成長: ${formatMemory(growth.heapUsed)}`);
      expect(growth.heapUsed).toBeLessThan(1024 * 1024); // < 1MB
    });

    test('knownCards Map 大小應該穩定', () => {
      const aiId = 'ai-memory-test';
      const tracker = new InformationTracker(aiId);

      memoryTracker.takeSnapshot('before_cards');

      // 模擬記錄 4 個玩家的手牌資訊（各 3 張）
      for (let playerId = 1; playerId <= 4; playerId++) {
        tracker.processEvent({
          type: EVENT_TYPES.CARD_TRANSFER,
          fromPlayerId: `player-${playerId}`,
          toPlayerId: aiId,
          cards: [
            { color: 'red' },
            { color: 'blue' },
            { color: 'green' }
          ]
        });
      }

      memoryTracker.takeSnapshot('after_known_cards');

      // 驗證 knownCards 大小
      const knowledge = tracker.getKnowledge();
      const knownCardsCount = Object.keys(knowledge.knownCards).length;
      expect(knownCardsCount).toBeLessThanOrEqual(4);

      // 記憶體成長應該很小（< 500KB）
      const growth = memoryTracker.getGrowth();
      console.log(`記錄手牌記憶體成長: ${formatMemory(growth.heapUsed)}`);
      expect(growth.heapUsed).toBeLessThan(512 * 1024); // < 500KB
    });
  });

  describe('AIPlayer 記憶體使用', () => {
    test('actionHistory 大小應該可控', () => {
      const aiId = 'ai-memory-test';
      const strategy = new MediumStrategy();
      strategy.selfId = aiId;

      const tracker = new InformationTracker(aiId);
      const decisionMaker = new DecisionMaker(strategy, aiId);
      const aiPlayer = new AIPlayer(aiId, 'Memory Test AI', 'medium');

      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = tracker;
      aiPlayer.decisionMaker = decisionMaker;

      memoryTracker.takeSnapshot('before_actions');

      // 模擬 30 次動作
      const gameSequence = generateGameSequence(aiId, 30);
      gameSequence.forEach(gameState => {
        const knowledge = createKnowledge(gameState, 'medium');
        const action = decisionMaker.decide(gameState, knowledge);
        aiPlayer.actionHistory.push({
          action,
          timestamp: Date.now(),
          gameState: { ...gameState }
        });
      });

      memoryTracker.takeSnapshot('after_30_actions');

      // 驗證動作歷史大小
      expect(aiPlayer.actionHistory).toHaveLength(30);

      // 記憶體成長應該合理（< 2MB）
      const growth = memoryTracker.getGrowth();
      console.log(`30 次動作記憶體成長: ${formatMemory(growth.heapUsed)}`);
      expect(growth.heapUsed).toBeLessThan(2 * 1024 * 1024); // < 2MB
    });
  });

  describe('50 回合遊戲記憶體成長', () => {
    test('Medium AI 50 回合記憶體成長應該 < 10MB', async () => {
      const aiId = 'ai-50-rounds';
      const strategy = new MediumStrategy();
      strategy.selfId = aiId;

      const tracker = new InformationTracker(aiId);
      const decisionMaker = new DecisionMaker(strategy, aiId);
      const aiPlayer = new AIPlayer(aiId, '50 Rounds AI', 'medium');

      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = tracker;
      aiPlayer.decisionMaker = decisionMaker;
      aiPlayer.thinkDelay = jest.fn().mockResolvedValue();

      // 初始記憶體快照
      if (triggerGC()) {
        await waitForGC();
      }
      memoryTracker.takeSnapshot('start');

      // 模擬 50 回合遊戲
      const gameSequence = generateGameSequence(aiId, 50);

      for (let round = 0; round < 50; round++) {
        const gameState = gameSequence[round];
        const knowledge = createKnowledge(gameState, 'medium');

        // 執行決策
        const action = decisionMaker.decide(gameState, knowledge);
        aiPlayer.actionHistory.push({
          action,
          timestamp: Date.now(),
          gameState: { ...gameState }
        });

        // 模擬問牌事件
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

        // 每 10 回合記錄一次記憶體
        if ((round + 1) % 10 === 0) {
          memoryTracker.takeSnapshot(`round_${round + 1}`);
          const growth = memoryTracker.getGrowth();
          console.log(`第 ${round + 1} 回合記憶體成長: ${formatMemory(growth.heapUsed)}`);
        }
      }

      // 最終記憶體快照
      memoryTracker.takeSnapshot('end');

      // 驗證記憶體成長 < 10MB
      const finalGrowth = memoryTracker.getGrowth();
      console.log(`50 回合總記憶體成長: ${formatMemory(finalGrowth.heapUsed)}`);
      expect(finalGrowth.heapUsed).toBeLessThan(10 * 1024 * 1024); // < 10MB

      // 驗證成長模式是線性的
      const pattern = memoryTracker.analyzeGrowthPattern();
      console.log(`記憶體成長模式: ${pattern.pattern} (CV=${pattern.cv?.toFixed(2)})`);
      // 不強制要求線性，但記錄模式供參考
    });

    test('Hard AI 50 回合記憶體成長應該 < 10MB', async () => {
      const aiId = 'ai-hard-50-rounds';
      const strategy = new HardStrategy();
      strategy.selfId = aiId;

      const tracker = new InformationTracker(aiId);
      const decisionMaker = new DecisionMaker(strategy, aiId);
      const aiPlayer = new AIPlayer(aiId, 'Hard 50 Rounds AI', 'hard');

      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = tracker;
      aiPlayer.decisionMaker = decisionMaker;
      aiPlayer.thinkDelay = jest.fn().mockResolvedValue();

      // 初始記憶體快照
      if (triggerGC()) {
        await waitForGC();
      }
      memoryTracker.reset();
      memoryTracker.takeSnapshot('start');

      // 模擬 50 回合遊戲
      const gameSequence = generateGameSequence(aiId, 50);

      for (let round = 0; round < 50; round++) {
        const gameState = gameSequence[round];
        const knowledge = createKnowledge(gameState, 'high'); // Hard AI 有更多知識

        // 執行決策
        const action = decisionMaker.decide(gameState, knowledge);
        aiPlayer.actionHistory.push({
          action,
          timestamp: Date.now(),
          gameState: { ...gameState }
        });

        // 模擬問牌事件
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

        // 每 10 回合記錄一次記憶體
        if ((round + 1) % 10 === 0) {
          memoryTracker.takeSnapshot(`round_${round + 1}`);
          const growth = memoryTracker.getGrowth();
          console.log(`Hard AI 第 ${round + 1} 回合記憶體成長: ${formatMemory(growth.heapUsed)}`);
        }
      }

      // 最終記憶體快照
      memoryTracker.takeSnapshot('end');

      // 驗證記憶體成長 < 10MB
      const finalGrowth = memoryTracker.getGrowth();
      console.log(`Hard AI 50 回合總記憶體成長: ${formatMemory(finalGrowth.heapUsed)}`);
      expect(finalGrowth.heapUsed).toBeLessThan(10 * 1024 * 1024); // < 10MB
    });
  });

  describe('資料結構大小驗證', () => {
    test('InformationTracker 資料結構應該有合理上限', () => {
      const aiId = 'ai-structure-test';
      const tracker = new InformationTracker(aiId);

      // 模擬 100 次問牌
      for (let i = 0; i < 100; i++) {
        tracker.processEvent({
          type: EVENT_TYPES.QUESTION_RESULT,
          askerId: aiId,
          targetId: `player-${i % 4 + 1}`,
          colors: ['red', 'blue'],
          questionType: 1,
          result: {
            cardsGiven: [],
            noCardsForColors: ['red', 'blue']
          }
        });
      }

      const knowledge = tracker.getKnowledge();

      // questionHistory 應該有所有記錄（目前無上限）
      expect(knowledge.questionHistory.length).toBe(100);

      // knownCards 大小應該有限（最多 4 個玩家）
      const knownCardsCount = Object.keys(knowledge.knownCards).length;
      expect(knownCardsCount).toBeLessThanOrEqual(4);

      // playerHandCounts 大小應該有限
      const playerHandCountsCount = Object.keys(knowledge.playerHandCounts).length;
      expect(playerHandCountsCount).toBeLessThanOrEqual(4);

      console.log(`資料結構大小: questionHistory=${knowledge.questionHistory.length}, knownCards=${knownCardsCount}`);
    });
  });
});
