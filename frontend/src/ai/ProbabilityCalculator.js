/**
 * 概率計算引擎
 *
 * 用於計算和更新牌的概率分布，支援貝氏推理。
 * 根據可見牌和問牌結果動態更新概率。
 *
 * @module ai/ProbabilityCalculator
 */

import { CARD_COUNTS, ALL_COLORS, TOTAL_CARDS } from '../shared/constants';

/**
 * 初始牌組配置
 * @constant
 * @type {Object<string, number>}
 */
const INITIAL_DECK = { ...CARD_COUNTS };

/**
 * 概率計算引擎類別
 *
 * 維護牌的概率分布，並根據遊戲資訊更新概率
 */
class ProbabilityCalculator {
  /**
   * 建立 ProbabilityCalculator 實例
   */
  constructor() {
    /**
     * 當前各顏色概率分布
     * @type {Map<string, number>}
     */
    this.probabilities = new Map();

    /**
     * 已可見的各顏色牌數
     * @type {Map<string, number>}
     */
    this.visibleCounts = new Map();

    /**
     * 初始牌組總數
     * @type {number}
     */
    this.totalCards = TOTAL_CARDS;

    this.reset();
  }

  /**
   * 重置計算器到初始狀態
   */
  reset() {
    this.probabilities.clear();
    this.visibleCounts.clear();

    // 初始化所有顏色的可見數為 0
    ALL_COLORS.forEach(color => {
      this.visibleCounts.set(color, 0);
    });

    // 計算初始概率分布
    this.calculateInitialProbabilities();
  }

  /**
   * 計算初始概率分布
   *
   * 根據牌組配置計算每個顏色的初始概率：
   * - 紅: 2/14 ≈ 0.143
   * - 黃: 3/14 ≈ 0.214
   * - 綠: 4/14 ≈ 0.286
   * - 藍: 5/14 ≈ 0.357
   */
  calculateInitialProbabilities() {
    ALL_COLORS.forEach(color => {
      const count = INITIAL_DECK[color];
      const probability = count / this.totalCards;
      this.probabilities.set(color, probability);
    });
  }

  /**
   * 當牌被揭示時更新概率
   *
   * @param {string} color - 被揭示的牌顏色
   * @returns {boolean} 更新是否成功
   */
  updateOnCardRevealed(color) {
    if (!ALL_COLORS.includes(color)) {
      console.warn(`Invalid color: ${color}`);
      return false;
    }

    // 增加可見計數
    const currentVisible = this.visibleCounts.get(color) || 0;
    const totalOfColor = INITIAL_DECK[color];

    if (currentVisible >= totalOfColor) {
      console.warn(`All ${color} cards are already visible`);
      return false;
    }

    this.visibleCounts.set(color, currentVisible + 1);

    // 重新計算概率分布
    this.recalculateProbabilities();

    return true;
  }

  /**
   * 根據問牌結果更新概率
   *
   * @param {Object} questionData - 問牌資料
   * @param {string} questionData.askedColor1 - 問的第一個顏色
   * @param {string} questionData.askedColor2 - 問的第二個顏色
   * @param {number} questionData.receivedCount1 - 收到的第一個顏色數量
   * @param {number} questionData.receivedCount2 - 收到的第二個顏色數量
   * @returns {boolean} 更新是否成功
   */
  updateOnQuestionResult(questionData) {
    if (!questionData) {
      return false;
    }

    const { askedColor1, askedColor2, receivedCount1, receivedCount2 } = questionData;

    // 更新收到的牌的可見計數
    if (receivedCount1 > 0) {
      const current = this.visibleCounts.get(askedColor1) || 0;
      this.visibleCounts.set(askedColor1, current + receivedCount1);
    }

    if (receivedCount2 > 0) {
      const current = this.visibleCounts.get(askedColor2) || 0;
      this.visibleCounts.set(askedColor2, current + receivedCount2);
    }

    // 重新計算概率分布
    this.recalculateProbabilities();

    return true;
  }

  /**
   * 重新計算概率分布
   *
   * 根據當前可見牌數量重新計算剩餘牌的概率分布
   */
  recalculateProbabilities() {
    // 計算剩餘總牌數
    let remainingTotal = 0;
    const remainingCounts = new Map();

    ALL_COLORS.forEach(color => {
      const total = INITIAL_DECK[color];
      const visible = this.visibleCounts.get(color) || 0;
      const remaining = total - visible;

      remainingCounts.set(color, remaining);
      remainingTotal += remaining;
    });

    // 計算新的概率分布
    if (remainingTotal === 0) {
      // 所有牌都已可見，概率都為 0
      ALL_COLORS.forEach(color => {
        this.probabilities.set(color, 0);
      });
    } else {
      ALL_COLORS.forEach(color => {
        const remaining = remainingCounts.get(color);
        const probability = remaining / remainingTotal;
        this.probabilities.set(color, probability);
      });
    }
  }

  /**
   * 取得當前概率分布
   *
   * @returns {Object<string, number>} 概率分布物件
   */
  getProbabilityDistribution() {
    const distribution = {};
    ALL_COLORS.forEach(color => {
      distribution[color] = this.probabilities.get(color) || 0;
    });
    return distribution;
  }

  /**
   * 檢查某顏色是否已被排除（概率為 0）
   *
   * @param {string} color - 要檢查的顏色
   * @returns {boolean} 是否已被排除
   */
  isColorEliminated(color) {
    if (!ALL_COLORS.includes(color)) {
      return false;
    }

    const probability = this.probabilities.get(color) || 0;
    return probability === 0;
  }

  /**
   * 取得概率最高的 N 個顏色
   *
   * @param {number} count - 要取得的顏色數量
   * @returns {string[]} 依概率排序的顏色陣列
   */
  getTopProbabilityColors(count = 2) {
    const entries = Array.from(this.probabilities.entries());

    // 依概率降序排序
    entries.sort((a, b) => b[1] - a[1]);

    // 取前 N 個顏色
    return entries.slice(0, count).map(entry => entry[0]);
  }

  /**
   * 取得特定顏色的概率
   *
   * @param {string} color - 顏色
   * @returns {number} 概率值（0-1）
   */
  getProbability(color) {
    return this.probabilities.get(color) || 0;
  }

  /**
   * 取得剩餘牌數
   *
   * @param {string} color - 顏色（可選）
   * @returns {number} 剩餘牌數
   */
  getRemainingCount(color = null) {
    if (color) {
      const total = INITIAL_DECK[color] || 0;
      const visible = this.visibleCounts.get(color) || 0;
      return total - visible;
    }

    // 計算所有顏色的剩餘總數
    let total = 0;
    ALL_COLORS.forEach(c => {
      total += this.getRemainingCount(c);
    });
    return total;
  }

  /**
   * 取得可見牌數
   *
   * @param {string} color - 顏色（可選）
   * @returns {number} 可見牌數
   */
  getVisibleCount(color = null) {
    if (color) {
      return this.visibleCounts.get(color) || 0;
    }

    // 計算所有顏色的可見總數
    let total = 0;
    ALL_COLORS.forEach(c => {
      total += this.visibleCounts.get(c) || 0;
    });
    return total;
  }

  /**
   * 取得計算器資訊
   *
   * @returns {Object} 計算器狀態資訊
   */
  getInfo() {
    return {
      probabilities: this.getProbabilityDistribution(),
      visibleCounts: Object.fromEntries(this.visibleCounts),
      remainingTotal: this.getRemainingCount(),
      visibleTotal: this.getVisibleCount()
    };
  }

  /**
   * 計算信息熵（Shannon Entropy）
   *
   * H = -Σ(p_i × log2(p_i))
   *
   * 用途：衡量概率分布的不確定性
   * - 熵值越高，不確定性越大
   * - 均勻分布時熵值最大
   * - 確定分布時熵值為 0
   *
   * @param {Object<string, number>} probabilities - 顏色概率分布 {color: probability}
   * @returns {number} 信息熵（0 到 2 之間，2 表示 4 個顏色均勻分布）
   *
   * @example
   * // 均勻分布（最大不確定性）
   * calculateEntropy({ red: 0.25, yellow: 0.25, green: 0.25, blue: 0.25 })
   * // 返回：2.0
   *
   * // 確定分布（無不確定性）
   * calculateEntropy({ red: 1.0, yellow: 0, green: 0, blue: 0 })
   * // 返回：0.0
   */
  calculateEntropy(probabilities) {
    let entropy = 0;

    for (const prob of Object.values(probabilities)) {
      if (prob > 0) {
        entropy -= prob * Math.log2(prob);
      }
    }

    return entropy;
  }

  /**
   * 計算信息增益（Information Gain）
   *
   * IG = H(before) - H(after)
   *
   * 用途：評估某個問牌動作能獲得多少信息
   * - 增益越大，該動作越有價值
   * - 用於決策最佳問牌策略
   *
   * @param {Object<string, number>} beforeProb - 動作前的概率分布
   * @param {Object<string, number>} afterProb - 動作後的概率分布
   * @returns {number} 信息增益（0 到 2 之間）
   *
   * @example
   * const before = { red: 0.25, yellow: 0.25, green: 0.25, blue: 0.25 };
   * const after = { red: 0.5, yellow: 0.5, green: 0, blue: 0 };
   * calculateInformationGain(before, after)
   * // 返回：1.0（獲得 1 bit 信息）
   */
  calculateInformationGain(beforeProb, afterProb) {
    const entropyBefore = this.calculateEntropy(beforeProb);
    const entropyAfter = this.calculateEntropy(afterProb);

    return entropyBefore - entropyAfter;
  }

  /**
   * 計算條件概率（Conditional Probability）
   *
   * P(A|B) = P(A ∩ B) / P(B)
   *
   * 用途：已知事件 B 發生，計算事件 A 發生的概率
   *
   * 簡化模型：假設兩張蓋牌獨立選擇
   * 在已知顏色 B 在蓋牌中的前提下，計算顏色 A 也在蓋牌中的概率
   * 透過歸一化（排除 B 後重新計算概率）來近似條件概率
   *
   * @param {string} colorA - 事件 A（某顏色在蓋牌中）
   * @param {string} colorB - 事件 B（某顏色在蓋牌中）
   * @param {Object<string, number>} probabilities - 當前概率分布
   * @returns {number} 條件概率 P(A|B)
   *
   * @example
   * // 已知紅色在蓋牌中，藍色也在的概率
   * const probs = { red: 0.4, yellow: 0.1, green: 0.1, blue: 0.4 };
   * calculateConditionalProbability('blue', 'red', probs)
   * // 排除紅色後：yellow(0.1) + green(0.1) + blue(0.4) = 0.6
   * // P(blue | red) = 0.4 / 0.6 = 0.667
   */
  calculateConditionalProbability(colorA, colorB, probabilities) {
    const pB = probabilities[colorB] || 0;

    if (pB === 0) {
      return 0;
    }

    // 簡化模型：假設兩張蓋牌獨立
    // P(A|B) ≈ P(A) （在剩餘顏色中的歸一化概率）
    const pA = probabilities[colorA] || 0;

    // 歸一化：排除 colorB 後重新計算概率
    const remainingColors = Object.keys(probabilities).filter(c => c !== colorB);
    const totalRemaining = remainingColors.reduce((sum, c) => sum + probabilities[c], 0);

    if (totalRemaining === 0) {
      return 0;
    }

    return pA / totalRemaining;
  }
}

/**
 * 建立 ProbabilityCalculator 實例的工廠函數
 *
 * @returns {ProbabilityCalculator} ProbabilityCalculator 實例
 */
export function createProbabilityCalculator() {
  return new ProbabilityCalculator();
}

export default ProbabilityCalculator;
