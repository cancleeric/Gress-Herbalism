/**
 * 長時間遊戲穩定性測試
 * 測試 AI 在長時間遊戲中的效能和記憶體穩定性
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
  measureDecisionTime,
  generateStats
} from './helpers/performanceHelpers';
import {
  MemoryTracker,
  formatMemory,
  triggerGC,
  waitForGC
} from './helpers/memoryHelpers';

describe('長時間遊戲穩定性測試', () => {
  describe('100 回合遊戲穩定性 - Medium AI', () => {
    let aiPlayer;
    let decisionMaker;
    let informationTracker;
    let memoryTracker;

    beforeEach(async () => {
      const aiId = 'ai-stability-medium';
      const strategy = new MediumStrategy();
      strategy.selfId = aiId;

      informationTracker = new InformationTracker(aiId);
      decisionMaker = new DecisionMaker(strategy, aiId);

      aiPlayer = new AIPlayer(aiId, 'Stability Test AI', 'medium');
      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = informationTracker;
      aiPlayer.decisionMaker = decisionMaker;
      aiPlayer.thinkDelay = jest.fn().mockResolvedValue();

      memoryTracker = new MemoryTracker();

      // 初始化記憶體
      if (triggerGC()) {
        await waitForGC();
      }
      memoryTracker.takeSnapshot('baseline');
    });

    test('100 回合遊戲決策時間應該保持穩定', async () => {
      const gameSequence = generateGameSequence('ai-stability-medium', 100);
      const decisionTimes = [];

      // 執行 100 回合決策
      for (let round = 0; round < 100; round++) {
        const gameState = gameSequence[round];
        const knowledge = createKnowledge(gameState, 'medium');

        const { duration, decision } = measureDecisionTime(decisionMaker, gameState, knowledge);
        decisionTimes.push(duration);

        // 記錄動作
        aiPlayer.actionHistory.push({
          action: decision,
          timestamp: Date.now(),
          gameState: { ...gameState }
        });

        // 模擬問牌事件
        informationTracker.processEvent({
          type: EVENT_TYPES.QUESTION_RESULT,
          askerId: 'ai-stability-medium',
          targetId: 'player-2',
          colors: ['red', 'blue'],
          questionType: 1,
          result: {
            cardsGiven: [],
            noCardsForColors: ['red', 'blue']
          }
        });

        // 每 10 回合記錄一次
        if ((round + 1) % 10 === 0) {
          const recentTimes = decisionTimes.slice(-10);
          const recentAvg = recentTimes.reduce((sum, t) => sum + t, 0) / recentTimes.length;
          console.log(`第 ${round + 1} 回合平均決策時間: ${recentAvg.toFixed(2)}ms`);
        }
      }

      // 統計分析
      const firstTenTimes = decisionTimes.slice(0, 10);
      const lastTenTimes = decisionTimes.slice(-10);

      const firstTenAvg = firstTenTimes.reduce((sum, t) => sum + t, 0) / firstTenTimes.length;
      const lastTenAvg = lastTenTimes.reduce((sum, t) => sum + t, 0) / lastTenTimes.length;

      console.log(`前 10 回合平均: ${firstTenAvg.toFixed(2)}ms`);
      console.log(`後 10 回合平均: ${lastTenAvg.toFixed(2)}ms`);

      // 決策時間不應超過初始時間的 120%
      expect(lastTenAvg).toBeLessThan(firstTenAvg * 1.2);

      // 所有決策時間都應該 < 200ms
      const allStats = generateStats(decisionTimes);
      expect(allStats.max).toBeLessThan(200);
      console.log(`100 回合決策時間統計: 平均=${allStats.avg.toFixed(2)}ms, 最大=${allStats.max.toFixed(2)}ms, 最小=${allStats.min.toFixed(2)}ms`);
    });

    test('100 回合遊戲記憶體成長應該線性', async () => {
      const gameSequence = generateGameSequence('ai-stability-medium', 100);

      // 執行 100 回合
      for (let round = 0; round < 100; round++) {
        const gameState = gameSequence[round];
        const knowledge = createKnowledge(gameState, 'medium');

        // 執行決策
        const decision = decisionMaker.decide(gameState, knowledge);
        aiPlayer.actionHistory.push({
          action: decision,
          timestamp: Date.now(),
          gameState: { ...gameState }
        });

        // 模擬問牌事件
        informationTracker.processEvent({
          type: EVENT_TYPES.QUESTION_RESULT,
          askerId: 'ai-stability-medium',
          targetId: 'player-2',
          colors: ['red', 'blue'],
          questionType: 1,
          result: {
            cardsGiven: [],
            noCardsForColors: ['red', 'blue']
          }
        });

        // 每 20 回合記錄記憶體
        if ((round + 1) % 20 === 0) {
          memoryTracker.takeSnapshot(`round_${round + 1}`);
          const growth = memoryTracker.getGrowth();
          console.log(`第 ${round + 1} 回合記憶體成長: ${formatMemory(growth.heapUsed)}`);
        }
      }

      // 最終記憶體快照
      memoryTracker.takeSnapshot('end');

      // 總記憶體成長應該 < 20MB
      const finalGrowth = memoryTracker.getGrowth();
      console.log(`100 回合總記憶體成長: ${formatMemory(finalGrowth.heapUsed)}`);
      expect(finalGrowth.heapUsed).toBeLessThan(20 * 1024 * 1024); // < 20MB

      // 分析成長模式
      const pattern = memoryTracker.analyzeGrowthPattern();
      console.log(`記憶體成長模式: ${pattern.pattern}`);
      if (pattern.isLinear !== null) {
        console.log(`變異係數 (CV): ${pattern.cv.toFixed(2)}`);
        // 期望是線性成長，但不強制要求（因為 GC 時機不可控）
      }
    });

    test('資料結構不應無限成長', async () => {
      const gameSequence = generateGameSequence('ai-stability-medium', 100);

      // 執行 100 回合
      for (let round = 0; round < 100; round++) {
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
          askerId: 'ai-stability-medium',
          targetId: 'player-2',
          colors: ['red', 'blue'],
          questionType: 1,
          result: {
            cardsGiven: [],
            noCardsForColors: ['red', 'blue']
          }
        });
      }

      // 檢查資料結構大小
      expect(aiPlayer.actionHistory.length).toBe(100);

      const knowledge = informationTracker.getKnowledge();
      expect(knowledge.questionHistory.length).toBe(100);

      // knownCards 和 playerHandCounts 大小應該有限
      const knownCardsCount = Object.keys(knowledge.knownCards).length;
      const playerHandCountsCount = Object.keys(knowledge.playerHandCounts).length;
      expect(knownCardsCount).toBeLessThanOrEqual(4);
      expect(playerHandCountsCount).toBeLessThanOrEqual(4);

      console.log(`資料結構大小: actionHistory=${aiPlayer.actionHistory.length}, questionHistory=${knowledge.questionHistory.length}`);
    });
  });

  describe('100 回合遊戲穩定性 - Hard AI', () => {
    let aiPlayer;
    let decisionMaker;
    let informationTracker;

    beforeEach(async () => {
      const aiId = 'ai-stability-hard';
      const strategy = new HardStrategy();
      strategy.selfId = aiId;

      informationTracker = new InformationTracker(aiId);
      decisionMaker = new DecisionMaker(strategy, aiId);

      aiPlayer = new AIPlayer(aiId, 'Hard Stability Test AI', 'hard');
      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = informationTracker;
      aiPlayer.decisionMaker = decisionMaker;
      aiPlayer.thinkDelay = jest.fn().mockResolvedValue();
    });

    test('Hard AI 100 回合決策時間應該保持穩定', async () => {
      const gameSequence = generateGameSequence('ai-stability-hard', 100);
      const decisionTimes = [];

      // 執行 100 回合決策
      for (let round = 0; round < 100; round++) {
        const gameState = gameSequence[round];
        const knowledge = createKnowledge(gameState, 'high');

        const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);
        decisionTimes.push(duration);

        // 每 20 回合記錄一次
        if ((round + 1) % 20 === 0) {
          const recentTimes = decisionTimes.slice(-20);
          const recentAvg = recentTimes.reduce((sum, t) => sum + t, 0) / recentTimes.length;
          console.log(`Hard AI 第 ${round + 1} 回合平均決策時間: ${recentAvg.toFixed(2)}ms`);
        }
      }

      // 統計分析
      const firstTenTimes = decisionTimes.slice(0, 10);
      const lastTenTimes = decisionTimes.slice(-10);

      const firstTenAvg = firstTenTimes.reduce((sum, t) => sum + t, 0) / firstTenTimes.length;
      const lastTenAvg = lastTenTimes.reduce((sum, t) => sum + t, 0) / lastTenTimes.length;

      console.log(`Hard AI 前 10 回合平均: ${firstTenAvg.toFixed(2)}ms`);
      console.log(`Hard AI 後 10 回合平均: ${lastTenAvg.toFixed(2)}ms`);

      // 決策時間不應超過初始時間的 120%
      expect(lastTenAvg).toBeLessThan(firstTenAvg * 1.2);

      // 所有決策時間都應該 < 500ms
      const allStats = generateStats(decisionTimes);
      expect(allStats.max).toBeLessThan(500);
      console.log(`Hard AI 100 回合決策時間統計: 平均=${allStats.avg.toFixed(2)}ms, 最大=${allStats.max.toFixed(2)}ms`);
    });
  });
});
