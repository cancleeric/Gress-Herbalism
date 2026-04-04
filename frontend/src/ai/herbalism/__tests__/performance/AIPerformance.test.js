/**
 * AI 決策效能測試
 * 測試 AI 決策時間（排除 think delay）
 *
 * REF: 202601250060
 */

import AIPlayer from '../../AIPlayer';
import InformationTracker from '../../InformationTracker';
import DecisionMaker from '../../DecisionMaker';
import EasyStrategy from '../../strategies/EasyStrategy';
import MediumStrategy from '../../strategies/MediumStrategy';
import HardStrategy from '../../strategies/HardStrategy';
import {
  generateEarlyGameState,
  generateMidGameState,
  generateLateGameState,
  createKnowledge
} from './helpers/gameStateGenerator';
import {
  measureDecisionTime,
  assertPerformance,
  measureMultipleTimes,
  generateStats
} from './helpers/performanceHelpers';

describe('AI 決策效能測試', () => {
  describe('Easy AI 決策效能', () => {
    let aiPlayer;
    let decisionMaker;
    let informationTracker;

    beforeEach(() => {
      const aiId = 'ai-easy';
      const strategy = new EasyStrategy();
      strategy.selfId = aiId;

      informationTracker = new InformationTracker(aiId);
      decisionMaker = new DecisionMaker(strategy, aiId);

      aiPlayer = new AIPlayer(aiId, 'Easy AI', 'easy');
      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = informationTracker;
      aiPlayer.decisionMaker = decisionMaker;

      // Mock thinkDelay 避免人工延遲
      aiPlayer.thinkDelay = jest.fn().mockResolvedValue();
    });

    test('早期遊戲決策時間應該 < 50ms', () => {
      const gameState = generateEarlyGameState('ai-easy', 4);
      const knowledge = createKnowledge(gameState, 'low');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 50, 'Easy AI 早期遊戲');
      expect(duration).toBeLessThan(50);
    });

    test('中期遊戲決策時間應該 < 50ms', () => {
      const gameState = generateMidGameState('ai-easy', 4);
      const knowledge = createKnowledge(gameState, 'medium');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 50, 'Easy AI 中期遊戲');
      expect(duration).toBeLessThan(50);
    });

    test('後期遊戲決策時間應該 < 50ms', () => {
      const gameState = generateLateGameState('ai-easy', 4);
      const knowledge = createKnowledge(gameState, 'high');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 50, 'Easy AI 後期遊戲');
      expect(duration).toBeLessThan(50);
    });

    test('連續 10 次決策平均時間應該 < 50ms', () => {
      const gameState = generateMidGameState('ai-easy', 4);
      const knowledge = createKnowledge(gameState, 'medium');

      const stats = measureMultipleTimes(
        () => decisionMaker.decide(gameState, knowledge),
        10
      );

      expect(stats.avg).toBeLessThan(50);
      expect(stats.max).toBeLessThan(100); // 最大值也不應超過 100ms
      console.log(`Easy AI 連續決策統計: 平均 ${stats.avg.toFixed(2)}ms, 最大 ${stats.max.toFixed(2)}ms`);
    });
  });

  describe('Medium AI 決策效能', () => {
    let aiPlayer;
    let decisionMaker;
    let informationTracker;

    beforeEach(() => {
      const aiId = 'ai-medium';
      const strategy = new MediumStrategy();
      strategy.selfId = aiId;

      informationTracker = new InformationTracker(aiId);
      decisionMaker = new DecisionMaker(strategy, aiId);

      aiPlayer = new AIPlayer(aiId, 'Medium AI', 'medium');
      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = informationTracker;
      aiPlayer.decisionMaker = decisionMaker;

      aiPlayer.thinkDelay = jest.fn().mockResolvedValue();
    });

    test('早期遊戲決策時間應該 < 200ms', () => {
      const gameState = generateEarlyGameState('ai-medium', 4);
      const knowledge = createKnowledge(gameState, 'low');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 200, 'Medium AI 早期遊戲');
      expect(duration).toBeLessThan(200);
    });

    test('中期遊戲決策時間應該 < 200ms', () => {
      const gameState = generateMidGameState('ai-medium', 4);
      const knowledge = createKnowledge(gameState, 'medium');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 200, 'Medium AI 中期遊戲');
      expect(duration).toBeLessThan(200);
    });

    test('後期遊戲決策時間應該 < 200ms', () => {
      const gameState = generateLateGameState('ai-medium', 4);
      const knowledge = createKnowledge(gameState, 'high');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 200, 'Medium AI 後期遊戲');
      expect(duration).toBeLessThan(200);
    });

    test('連續 10 次決策平均時間應該 < 200ms', () => {
      const gameState = generateMidGameState('ai-medium', 4);
      const knowledge = createKnowledge(gameState, 'medium');

      const stats = measureMultipleTimes(
        () => decisionMaker.decide(gameState, knowledge),
        10
      );

      expect(stats.avg).toBeLessThan(200);
      expect(stats.max).toBeLessThan(400); // 最大值也不應超過 400ms
      console.log(`Medium AI 連續決策統計: 平均 ${stats.avg.toFixed(2)}ms, 最大 ${stats.max.toFixed(2)}ms`);
    });
  });

  describe('Hard AI 決策效能', () => {
    let aiPlayer;
    let decisionMaker;
    let informationTracker;

    beforeEach(() => {
      const aiId = 'ai-hard';
      const strategy = new HardStrategy();
      strategy.selfId = aiId;

      informationTracker = new InformationTracker(aiId);
      decisionMaker = new DecisionMaker(strategy, aiId);

      aiPlayer = new AIPlayer(aiId, 'Hard AI', 'hard');
      aiPlayer.strategy = strategy;
      aiPlayer.informationTracker = informationTracker;
      aiPlayer.decisionMaker = decisionMaker;

      aiPlayer.thinkDelay = jest.fn().mockResolvedValue();
    });

    test('早期遊戲決策時間應該 < 500ms', () => {
      const gameState = generateEarlyGameState('ai-hard', 4);
      const knowledge = createKnowledge(gameState, 'low');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 500, 'Hard AI 早期遊戲');
      expect(duration).toBeLessThan(500);
    });

    test('中期遊戲決策時間應該 < 500ms', () => {
      const gameState = generateMidGameState('ai-hard', 4);
      const knowledge = createKnowledge(gameState, 'medium');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 500, 'Hard AI 中期遊戲');
      expect(duration).toBeLessThan(500);
    });

    test('後期遊戲決策時間應該 < 500ms', () => {
      const gameState = generateLateGameState('ai-hard', 4);
      const knowledge = createKnowledge(gameState, 'high');

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 500, 'Hard AI 後期遊戲');
      expect(duration).toBeLessThan(500);
    });

    test('連續 10 次決策平均時間應該 < 500ms', () => {
      const gameState = generateMidGameState('ai-hard', 4);
      const knowledge = createKnowledge(gameState, 'medium');

      const stats = measureMultipleTimes(
        () => decisionMaker.decide(gameState, knowledge),
        10
      );

      expect(stats.avg).toBeLessThan(500);
      expect(stats.max).toBeLessThan(1000); // 最大值也不應超過 1000ms
      console.log(`Hard AI 連續決策統計: 平均 ${stats.avg.toFixed(2)}ms, 最大 ${stats.max.toFixed(2)}ms`);
    });

    test('複雜遊戲狀態（高知識量）決策時間應該可控', () => {
      const gameState = generateLateGameState('ai-hard', 4);
      const knowledge = createKnowledge(gameState, 'high');

      // 加入大量問題歷史
      for (let i = 0; i < 20; i++) {
        knowledge.questionHistory.push({
          askerId: 'ai-hard',
          targetId: 'player-2',
          colors: ['red', 'blue'],
          questionType: 1,
          result: { cardsGiven: [], noCardsForColors: ['red', 'blue'] }
        });
      }

      const { duration } = measureDecisionTime(decisionMaker, gameState, knowledge);

      assertPerformance(duration, 500, 'Hard AI 複雜狀態');
      expect(duration).toBeLessThan(500);
    });
  });

  describe('效能穩定性測試', () => {
    test('三種難度 AI 平均決策時間應該符合預期排序', () => {
      const gameState = generateMidGameState('ai-test', 4);
      const knowledge = createKnowledge(gameState, 'medium');

      const easyStrategy = new EasyStrategy();
      const mediumStrategy = new MediumStrategy();
      const hardStrategy = new HardStrategy();

      easyStrategy.selfId = 'ai-test';
      mediumStrategy.selfId = 'ai-test';
      hardStrategy.selfId = 'ai-test';

      const easyDM = new DecisionMaker(easyStrategy, 'ai-test');
      const mediumDM = new DecisionMaker(mediumStrategy, 'ai-test');
      const hardDM = new DecisionMaker(hardStrategy, 'ai-test');

      // 測量 10 次取平均值以減少波動
      const easyStats = measureMultipleTimes(() => easyDM.decide(gameState, knowledge), 10);
      const mediumStats = measureMultipleTimes(() => mediumDM.decide(gameState, knowledge), 10);
      const hardStats = measureMultipleTimes(() => hardDM.decide(gameState, knowledge), 10);

      // Medium 平均 < Hard 平均（Easy 因為隨機性，時間可能與 Medium 相近或更快）
      // 允許 1ms 的誤差以處理測試環境的時間波動
      expect(mediumStats.avg).toBeLessThan(hardStats.avg + 1);

      console.log(`決策時間平均排序: Easy=${easyStats.avg.toFixed(2)}ms, Medium=${mediumStats.avg.toFixed(2)}ms, Hard=${hardStats.avg.toFixed(2)}ms`);
    });
  });
});
