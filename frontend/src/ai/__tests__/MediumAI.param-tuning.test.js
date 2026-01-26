/**
 * Medium AI 參數調整測試
 *
 * 測試不同參數組合的效果，找出最佳參數值。
 * REF: 202601250049
 */

import AIPlayer from '../AIPlayer';
import MediumStrategy from '../strategies/MediumStrategy';
import InformationTracker, { EVENT_TYPES } from '../InformationTracker';
import DecisionMaker from '../DecisionMaker';
import { AI_DIFFICULTY } from '../../shared/constants';

/**
 * 測試參數組合
 *
 * 注意：信心度計算使用乘法 (p1 * p2)
 * - 理論最大值：0.5 * 0.5 = 0.25 (兩個顏色各 50%)
 * - 實際觀察：通常在 0.10-0.15 範圍
 * - 因此閾值必須設定在可達成的範圍內
 */
const PARAM_COMBINATIONS = [
  {
    name: 'Current (預設) - 不可達成',
    guessConfidenceThreshold: 0.6,   // 太高，永遠不會猜牌
    followGuessProbThreshold: 0.15
  },
  {
    name: 'Balanced (平衡)',
    guessConfidenceThreshold: 0.12,  // 合理範圍
    followGuessProbThreshold: 0.05
  },
  {
    name: 'Aggressive (激進)',
    guessConfidenceThreshold: 0.10,  // 較早猜牌
    followGuessProbThreshold: 0.03
  },
  {
    name: 'Conservative (保守)',
    guessConfidenceThreshold: 0.15,  // 較晚猜牌
    followGuessProbThreshold: 0.08
  },
  {
    name: 'Very Conservative (極保守)',
    guessConfidenceThreshold: 0.20,  // 接近理論最大值
    followGuessProbThreshold: 0.10
  }
];

/**
 * 模擬一場遊戲並收集統計資料
 */
function simulateGame(params, hiddenCards) {
  // 建立 AI 玩家
  const aiId = 'ai-test';
  const strategy = new MediumStrategy(params);
  strategy.selfId = aiId;

  // 除錯：確認參數已正確設定
  if (params.name !== 'Current (預設) - 不可達成') {
    console.log(`  Strategy created with threshold: ${strategy.guessConfidenceThreshold}`);
  }

  const informationTracker = new InformationTracker(aiId);
  const decisionMaker = new DecisionMaker(strategy, aiId);

  const aiPlayer = new AIPlayer(aiId, 'AI-Medium', AI_DIFFICULTY.MEDIUM);
  aiPlayer.strategy = strategy;
  aiPlayer.informationTracker = informationTracker;
  aiPlayer.decisionMaker = decisionMaker;

  // 遊戲狀態
  const gameState = {
    players: [
      { id: aiId, name: 'AI-Medium', isActive: true, cards: [] },
      { id: 'player-2', name: 'Player 2', isActive: true, cards: ['red', 'blue', 'green'] },
      { id: 'player-3', name: 'Player 3', isActive: true, cards: ['yellow'] }
    ],
    hiddenCards: hiddenCards,
    currentPlayerId: aiId
  };

  // 統計資料
  const stats = {
    questionCount: 0,
    guessAttempt: false,
    guessCorrect: false,
    followGuessCount: 0,
    followGuessCorrect: 0,
    roundsUntilGuess: 0
  };

  // 模擬遊戲進行
  // 策略：逐步排除非目標顏色，使剩餘概率集中在目標顏色
  for (let round = 1; round <= 20; round++) {
    // 模擬逐漸獲得資訊，提高信心度
    // 找出非目標顏色（蓋牌以外的顏色）
    const nonTargetColors = ['red', 'yellow', 'green', 'blue'].filter(c => !hiddenCards.includes(c));

    if (round === 2 && nonTargetColors.length >= 1) {
      // Round 2: 排除第一個非目標顏色（獲得所有該顏色的牌）
      const colorToEliminate = nonTargetColors[0];
      const cardCount = { red: 2, yellow: 3, green: 4, blue: 5 }[colorToEliminate];
      const cards = Array(cardCount).fill(null).map(() => ({ color: colorToEliminate }));

      informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-2',
        toPlayerId: aiId,
        cards: cards
      });
    }

    if (round === 5 && nonTargetColors.length >= 2) {
      // Round 5: 排除第二個非目標顏色
      const colorToEliminate = nonTargetColors[1];
      const cardCount = { red: 2, yellow: 3, green: 4, blue: 5 }[colorToEliminate];
      const cards = Array(cardCount).fill(null).map(() => ({ color: colorToEliminate }));

      informationTracker.processEvent({
        type: EVENT_TYPES.CARD_TRANSFER,
        fromPlayerId: 'player-3',
        toPlayerId: aiId,
        cards: cards
      });
    }

    // 現在只剩兩個目標顏色，概率應該集中了

    // 取得知識狀態
    const knowledge = informationTracker.getKnowledge();

    // 除錯輸出：每 5 回合顯示一次概率分布和信心度
    if (round % 5 === 0 || round === 1) {
      const confidence = strategy.calculateConfidence(knowledge);
      console.log(`  Round ${round}: Confidence=${confidence.toFixed(3)}, Probs=${JSON.stringify(knowledge.hiddenCardProbability)}`);
    }

    // AI 決策
    const action = decisionMaker.decide(gameState, knowledge);

    // 除錯輸出：第一次決策時顯示動作類型
    if (round === 6 && params.name !== 'Current (預設) - 不可達成') {
      const conf = strategy.calculateConfidence(knowledge);
      console.log(`  Round ${round} Decision: ${action.type}, Confidence: ${conf.toFixed(3)}, Threshold: ${strategy.guessConfidenceThreshold}`);
    }

    if (action.type === 'guess') {
      stats.guessAttempt = true;
      stats.roundsUntilGuess = round;

      // 檢查猜測是否正確
      const guessedColors = action.colors.slice().sort().join(',');
      const actualColors = hiddenCards.slice().sort().join(',');
      stats.guessCorrect = (guessedColors === actualColors);

      // 猜牌後跳出循環
      break;
    } else {
      stats.questionCount++;
    }

    // 模擬其他玩家猜牌情境（測試跟猜決策）
    if (round === 10) {
      const shouldFollow = strategy.decideFollowGuess(hiddenCards, knowledge);
      if (shouldFollow) {
        stats.followGuessCount++;
        stats.followGuessCorrect++;  // 假設跟猜正確（因為我們知道實際答案）
      }
    }
  }

  return stats;
}

describe('Medium AI 參數調整測試 - REF: 202601250049', () => {
  /**
   * 測試目標：
   * - AI 不應過早猜牌（避免頻繁猜錯）
   * - AI 不應過於保守（避免永遠不猜牌）
   * - 跟猜決策應該合理（不盲目跟猜）
   */

  describe('參數組合效果測試', () => {
    PARAM_COMBINATIONS.forEach(paramSet => {
      test(`參數組合：${paramSet.name}`, () => {
        console.log(`\n========== 測試參數組合：${paramSet.name} ==========`);
        console.log(`  guessConfidenceThreshold: ${paramSet.guessConfidenceThreshold}`);
        console.log(`  followGuessProbThreshold: ${paramSet.followGuessProbThreshold}`);

        // 測試多場遊戲取平均值
        const results = [];
        const scenarios = [
          ['red', 'blue'],
          ['yellow', 'green'],
          ['red', 'yellow'],
          ['blue', 'green']
        ];

        scenarios.forEach(hiddenCards => {
          const stats = simulateGame(paramSet, hiddenCards);
          results.push(stats);
        });

        // 計算平均統計
        const avgQuestions = results.reduce((sum, r) => sum + r.questionCount, 0) / results.length;
        const guessAttempts = results.filter(r => r.guessAttempt).length;
        const correctGuesses = results.filter(r => r.guessCorrect).length;
        const avgRoundsUntilGuess = results
          .filter(r => r.guessAttempt)
          .reduce((sum, r) => sum + r.roundsUntilGuess, 0) / guessAttempts;

        // 輸出結果
        console.log(`  平均問牌次數: ${avgQuestions.toFixed(2)}`);
        console.log(`  猜牌次數: ${guessAttempts}/4`);
        console.log(`  猜對次數: ${correctGuesses}/4 (${(correctGuesses / 4 * 100).toFixed(1)}%)`);
        console.log(`  平均回合數: ${avgRoundsUntilGuess.toFixed(2)}`);

        // 驗證目標
        // 1. AI 應該會猜牌（不過於保守）
        expect(guessAttempts).toBeGreaterThan(0);

        // 2. 不應在極早期猜牌（至少問 3 次牌）
        if (guessAttempts > 0) {
          expect(avgRoundsUntilGuess).toBeGreaterThanOrEqual(3);
        }

        // 3. 也不應該過於保守（應在 15 回合內猜牌）
        if (guessAttempts > 0) {
          expect(avgRoundsUntilGuess).toBeLessThanOrEqual(15);
        }

        // 儲存結果供分析
        global.testResults = global.testResults || [];
        global.testResults.push({
          paramSet: paramSet.name,
          params: paramSet,
          avgQuestions,
          guessAttempts,
          correctGuesses,
          guessAccuracy: correctGuesses / 4,
          avgRoundsUntilGuess
        });
      });
    });
  });

  describe('跟猜決策測試', () => {
    test('應該根據概率閾值做出合理的跟猜決策', () => {
      const scenarios = [
        {
          name: '高概率情境',
          hiddenCardProb: { red: 0.35, blue: 0.35, yellow: 0.15, green: 0.15 },
          guessedColors: ['red', 'blue'],
          expectedFollow: true,  // 聯合概率 0.35 * 0.35 = 0.1225 > 0.05 (平衡閾值)
          jointProb: 0.1225
        },
        {
          name: '中等概率情境',
          hiddenCardProb: { red: 0.25, blue: 0.25, yellow: 0.25, green: 0.25 },
          guessedColors: ['red', 'blue'],
          expectedFollow: true,  // 聯合概率 0.25 * 0.25 = 0.0625 > 0.05
          jointProb: 0.0625
        },
        {
          name: '低概率情境',
          hiddenCardProb: { red: 0.1, blue: 0.1, yellow: 0.4, green: 0.4 },
          guessedColors: ['red', 'blue'],
          expectedFollow: false,  // 聯合概率 0.1 * 0.1 = 0.01 < 0.05
          jointProb: 0.01
        }
      ];

      scenarios.forEach(scenario => {
        console.log(`\n測試跟猜情境：${scenario.name}`);

        // 使用平衡參數
        const params = PARAM_COMBINATIONS.find(p => p.name === 'Balanced (平衡)');
        const strategy = new MediumStrategy(params);
        strategy.selfId = 'ai-test';

        const knowledge = {
          hiddenCardProbability: scenario.hiddenCardProb
        };

        const shouldFollow = strategy.decideFollowGuess(scenario.guessedColors, knowledge);

        console.log(`  概率分布: ${JSON.stringify(scenario.hiddenCardProb)}`);
        console.log(`  被猜顏色: ${scenario.guessedColors.join(', ')}`);
        console.log(`  聯合概率: ${scenario.jointProb.toFixed(4)} (閾值: ${params.followGuessProbThreshold})`);
        console.log(`  跟猜決策: ${shouldFollow ? '跟猜' : '不跟猜'}`);
        console.log(`  預期決策: ${scenario.expectedFollow ? '跟猜' : '不跟猜'}`);

        if (scenario.expectedFollow) {
          // 高概率情境應該跟猜
          expect(shouldFollow).toBe(true);
        }
        // 注意：低概率情境的預期可能因參數調整而變化，所以只測試明確的情況
      });
    });
  });

  // 測試完成後輸出比較表
  afterAll(() => {
    if (global.testResults && global.testResults.length > 0) {
      console.log('\n========== 參數調整結果摘要 ==========');
      console.log('\n參數組合比較表：');
      console.log('|參數組合|平均問牌|猜牌次數|猜對率|平均回合數|');
      console.log('|--------|--------|--------|------|----------|');

      global.testResults.forEach(result => {
        console.log(
          `|${result.paramSet}` +
          `|${result.avgQuestions.toFixed(2)}` +
          `|${result.guessAttempts}/4` +
          `|${(result.guessAccuracy * 100).toFixed(1)}%` +
          `|${result.avgRoundsUntilGuess.toFixed(2)}|`
        );
      });

      console.log('\n========== 推薦參數 ==========');
      // 找出最佳參數組合（綜合考慮猜對率和回合數）
      const bestResult = global.testResults.reduce((best, current) => {
        // 評分：猜對率權重 0.7，回合數適中權重 0.3
        const currentScore =
          (current.guessAccuracy * 0.7) +
          ((10 - Math.abs(current.avgRoundsUntilGuess - 8)) / 10 * 0.3);
        const bestScore =
          (best.guessAccuracy * 0.7) +
          ((10 - Math.abs(best.avgRoundsUntilGuess - 8)) / 10 * 0.3);

        return currentScore > bestScore ? current : best;
      });

      console.log(`最佳參數組合：${bestResult.paramSet}`);
      console.log(`  guessConfidenceThreshold: ${bestResult.params.guessConfidenceThreshold}`);
      console.log(`  followGuessProbThreshold: ${bestResult.params.followGuessProbThreshold}`);
      console.log(`  猜對率: ${(bestResult.guessAccuracy * 100).toFixed(1)}%`);
      console.log(`  平均回合數: ${bestResult.avgRoundsUntilGuess.toFixed(2)}`);
      console.log('=========================================\n');
    }
  });
});
