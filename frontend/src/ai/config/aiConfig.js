/**
 * AI 參數配置
 *
 * 此檔案集中管理所有 AI 決策參數，方便快速調整和 A/B 測試。
 * 所有參數都有詳細說明和調整建議範圍。
 *
 * @module ai/config/aiConfig
 */

/**
 * AI 參數配置
 */
export const AI_PARAMS = {
  /**
   * Easy 難度參數
   *
   * 特點：隨機決策，適合新手練習
   * 目標勝率：20-30% (vs 一般玩家)
   */
  EASY: {
    /**
     * 問牌類型權重 [類型1, 類型2, 類型3]
     *
     * - 類型1（各一張）：最簡單，60%
     * - 類型2（其中一種顏色全部）：中等，30%
     * - 類型3（給一張要全部）：複雜，10%
     *
     * 調整建議：保持類型1為主要選擇（50-70%）
     */
    questionTypeWeights: [0.6, 0.3, 0.1],

    /**
     * 跟猜機率
     *
     * 當前值：0.5 (50%)
     * 建議範圍：0.3 - 0.5
     *
     * 影響：
     * - 過高：跟猜過多，容易損失分數
     * - 過低：錯過得分機會
     */
    followGuessProbability: 0.5,
  },

  /**
   * Medium 難度參數
   *
   * 特點：基礎推理，追蹤明顯資訊
   * 目標勝率：40-50% (vs 一般玩家)
   */
  MEDIUM: {
    /**
     * 猜牌信心度閾值
     *
     * 當前值：0.2 (20%) - 經參數調整測試最佳化（REF: 202601250049）
     * 建議範圍：0.15 - 0.25
     * 理論最大值：0.247 (兩色各 50% 概率時)
     *
     * 說明：當兩個最高概率顏色的聯合概率（p1 * p2）超過此值時，AI 會選擇猜牌
     *
     * 測試結果（REF: 202601250049）：
     * - 0.10 (激進): 太早猜牌（Round 1），準確率低
     * - 0.12 (平衡): 稍早猜牌（Round 2），準確率低
     * - 0.15 (保守): 合理平衡（Round 3.5），準確率 50%
     * - 0.20 (極保守): 最佳參數（Round 5），準確率 100% ✓
     *
     * 注意：原設定值 0.6 數學上不可達成（信心度計算使用乘法）
     */
    guessConfidenceThreshold: 0.2,

    /**
     * 跟猜概率閾值
     *
     * 當前值：0.1 (10%) - 經參數調整測試最佳化（REF: 202601250049）
     * 建議範圍：0.05 - 0.15
     *
     * 說明：當被猜顏色的聯合概率（p1 * p2）超過此值時，AI 會選擇跟猜
     *
     * 影響：
     * - 過低（0.03-0.05）：跟猜過於頻繁，損失分數風險高
     * - 過高（0.15-0.22）：跟猜過於保守，錯過得分機會
     * - 最佳值（0.10）：平衡風險與機會
     */
    followGuessProbThreshold: 0.1,
  },

  /**
   * Hard 難度參數（預留）
   *
   * 特點：完整推理引擎，最佳化策略
   * 目標勝率：60-70% (vs 一般玩家)
   */
  HARD: {
    /**
     * 猜牌信心度閾值（更保守）
     */
    guessConfidenceThreshold: 0.8,

    /**
     * 跟猜概率閾值（更謹慎）
     */
    followGuessProbThreshold: 0.3,

    /**
     * 期望值最小值
     *
     * 說明：只有當猜牌期望值超過此值時才會猜牌
     */
    expectedValueMinimum: 0.5,

    /**
     * 資訊熵權重
     *
     * 說明：在計算問牌價值時，資訊熵的權重
     */
    informationEntropyWeight: 0.2,
  },

  /**
   * 思考延遲配置（毫秒）
   *
   * 模擬真實玩家的思考時間，提供更自然的遊戲體驗
   */
  THINK_DELAY: {
    /**
     * 一般決策最小延遲
     *
     * 當前值：1000ms (1秒)
     * 建議範圍：500 - 2000ms
     */
    MIN: 1000,

    /**
     * 一般決策最大延遲
     *
     * 當前值：3000ms (3秒)
     * 建議範圍：2000 - 4000ms
     */
    MAX: 3000,

    /**
     * 跟猜決策最小延遲（較短）
     *
     * 當前值：500ms
     * 建議範圍：300 - 800ms
     */
    FOLLOW_GUESS_MIN: 500,

    /**
     * 跟猜決策最大延遲（較短）
     *
     * 當前值：1500ms
     * 建議範圍：1000 - 2000ms
     */
    FOLLOW_GUESS_MAX: 1500,
  }
};

/**
 * 實驗性參數配置
 *
 * 用於 A/B 測試不同參數組合的效果
 */
export const EXPERIMENTAL_PARAMS = {
  /**
   * Medium 激進模式
   *
   * 更早猜牌，更頻繁跟猜
   * 預期：回合數減少，風險提高
   */
  MEDIUM_AGGRESSIVE: {
    guessConfidenceThreshold: 0.5,   // 降低猜牌閾值
    followGuessProbThreshold: 0.1,   // 降低跟猜閾值
  },

  /**
   * Medium 保守模式
   *
   * 較晚猜牌，較少跟猜
   * 預期：回合數增加，穩定性提高
   */
  MEDIUM_CONSERVATIVE: {
    guessConfidenceThreshold: 0.7,   // 提高猜牌閾值
    followGuessProbThreshold: 0.25,  // 提高跟猜閾值
  },

  /**
   * Easy 更隨機模式
   *
   * 問牌類型更均勻分布
   */
  EASY_MORE_RANDOM: {
    questionTypeWeights: [0.5, 0.35, 0.15],  // 更均勻
    followGuessProbability: 0.4,              // 降低跟猜
  },

  /**
   * Fast 測試模式
   *
   * 快速決策，用於快速測試
   */
  FAST_TEST: {
    MIN: 100,
    MAX: 500,
    FOLLOW_GUESS_MIN: 100,
    FOLLOW_GUESS_MAX: 300,
  }
};

/**
 * 取得指定難度的參數
 *
 * @param {string} difficulty - 難度級別 ('easy', 'medium', 'hard')
 * @param {string} variant - 變體 ('default', 'aggressive', 'conservative')
 * @returns {Object} 參數配置
 */
export function getAIParams(difficulty, variant = 'default') {
  const difficultyUpper = difficulty.toUpperCase();

  // 取得基礎參數
  let params = AI_PARAMS[difficultyUpper];

  // 如果指定了變體，合併實驗性參數
  if (variant !== 'default') {
    const variantKey = `${difficultyUpper}_${variant.toUpperCase()}`;
    const experimentalParams = EXPERIMENTAL_PARAMS[variantKey];

    if (experimentalParams) {
      params = { ...params, ...experimentalParams };
    }
  }

  return params || AI_PARAMS.MEDIUM;
}

/**
 * 取得思考延遲配置
 *
 * @param {string} mode - 模式 ('default', 'fast')
 * @returns {Object} 延遲配置
 */
export function getThinkDelay(mode = 'default') {
  if (mode === 'fast') {
    return EXPERIMENTAL_PARAMS.FAST_TEST;
  }

  return AI_PARAMS.THINK_DELAY;
}

export default AI_PARAMS;
