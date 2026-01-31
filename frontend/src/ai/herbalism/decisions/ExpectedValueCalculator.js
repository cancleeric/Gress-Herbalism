/**
 * 期望值計算器
 *
 * 提供各種決策的期望值計算方法，基於機率論和博弈論。
 * 用於輔助 AI 做出最佳化的決策。
 *
 * @module ai/decisions/ExpectedValueCalculator
 */

/**
 * 期望值計算器類別
 *
 * 計算各種遊戲決策的期望值，包含：
 * - 猜牌期望值
 * - 跟猜期望值
 * - 問牌資訊價值
 */
class ExpectedValueCalculator {
  /**
   * 建立 ExpectedValueCalculator 實例
   *
   * @param {Object} params - 參數配置（選填）
   * @param {number} params.guessSuccessScore - 猜對得分（預設 3）
   * @param {number} params.guessFailureCost - 猜錯損失（預設 0）
   * @param {number} params.followGuessSuccessScore - 跟猜成功得分（預設 1）
   * @param {number} params.followGuessFailureCost - 跟猜失敗損失（預設 1）
   * @param {number} params.informationEntropyWeight - 資訊熵權重（預設 0.2）
   */
  constructor(params = {}) {
    /**
     * 猜對得分
     * @type {number}
     */
    this.guessSuccessScore = params.guessSuccessScore || 3;

    /**
     * 猜錯損失（退出當局但不扣分）
     * @type {number}
     */
    this.guessFailureCost = params.guessFailureCost || 0;

    /**
     * 跟猜成功得分
     * @type {number}
     */
    this.followGuessSuccessScore = params.followGuessSuccessScore || 1;

    /**
     * 跟猜失敗損失
     * @type {number}
     */
    this.followGuessFailureCost = params.followGuessFailureCost || 1;

    /**
     * 資訊熵權重（用於計算問牌價值）
     * @type {number}
     */
    this.informationEntropyWeight = params.informationEntropyWeight || 0.2;
  }

  /**
   * 計算猜牌期望值
   *
   * 公式：EV = (成功概率 × 成功得分) - (失敗概率 × 失敗損失)
   *
   * 遊戲規則：
   * - 猜對得 3 分
   * - 猜錯退出當局但不扣分（損失 0 分）
   *
   * @param {number} successProb - 猜測成功的概率（0 到 1 之間）
   * @returns {number} 猜牌期望值
   *
   * @example
   * const calculator = new ExpectedValueCalculator();
   *
   * // 高成功概率：P = 0.8
   * calculator.calculateGuessEV(0.8);
   * // 返回：2.4 (0.8 × 3 - 0.2 × 0 = 2.4)
   *
   * // 低成功概率：P = 0.3
   * calculator.calculateGuessEV(0.3);
   * // 返回：0.9 (0.3 × 3 - 0.7 × 0 = 0.9)
   */
  calculateGuessEV(successProb) {
    // 邊界檢查
    if (typeof successProb !== 'number' || successProb < 0 || successProb > 1) {
      return 0;
    }

    const failureProb = 1 - successProb;

    return (successProb * this.guessSuccessScore) -
           (failureProb * this.guessFailureCost);
  }

  /**
   * 計算跟猜期望值
   *
   * 公式：EV = (成功概率 × 1分) - (失敗概率 × 1分)
   *            = 2 × P(success) - 1
   *
   * 遊戲規則：
   * - 跟猜正確得 1 分
   * - 跟猜錯誤扣 1 分且退出當局
   *
   * 臨界點：
   * - EV = 0 時，P(success) = 0.5
   * - 只在成功概率 > 50% 時 EV 為正
   *
   * @param {number} successProb - 跟猜成功的概率（0 到 1 之間）
   * @returns {number} 跟猜期望值
   *
   * @example
   * const calculator = new ExpectedValueCalculator();
   *
   * // 高成功概率：P = 0.7
   * calculator.calculateFollowGuessEV(0.7);
   * // 返回：0.4 (0.7 × 1 - 0.3 × 1 = 0.4)
   *
   * // 臨界點：P = 0.5
   * calculator.calculateFollowGuessEV(0.5);
   * // 返回：0.0 (0.5 × 1 - 0.5 × 1 = 0.0)
   *
   * // 低成功概率：P = 0.3
   * calculator.calculateFollowGuessEV(0.3);
   * // 返回：-0.4 (0.3 × 1 - 0.7 × 1 = -0.4)
   */
  calculateFollowGuessEV(successProb) {
    // 邊界檢查
    if (typeof successProb !== 'number' || successProb < 0 || successProb > 1) {
      return 0;
    }

    const failureProb = 1 - successProb;

    return (successProb * this.followGuessSuccessScore) -
           (failureProb * this.followGuessFailureCost);
  }

  /**
   * 計算問牌的資訊價值
   *
   * 公式：問牌價值 = 當前信息熵 × 信息熵權重
   *
   * 信息熵衡量概率分布的不確定性：
   * - 熵值越高，不確定性越大，問牌的資訊價值越高
   * - 熵值越低，不確定性越小，問牌的資訊價值越低
   *
   * 權重參數（預設 0.2）用於將熵值轉換為與期望值可比較的量級。
   *
   * @param {number} currentEntropy - 當前的信息熵（0 到 2 之間）
   * @returns {number} 問牌的資訊價值
   *
   * @example
   * const calculator = new ExpectedValueCalculator();
   *
   * // 高不確定性（均勻分布）：H = 2.0
   * calculator.calculateQuestionEV(2.0);
   * // 返回：0.4 (2.0 × 0.2 = 0.4)
   *
   * // 中等不確定性：H = 1.0
   * calculator.calculateQuestionEV(1.0);
   * // 返回：0.2 (1.0 × 0.2 = 0.2)
   *
   * // 低不確定性（接近確定）：H = 0.5
   * calculator.calculateQuestionEV(0.5);
   * // 返回：0.1 (0.5 × 0.2 = 0.1)
   */
  calculateQuestionEV(currentEntropy) {
    // 邊界檢查
    if (typeof currentEntropy !== 'number' || currentEntropy < 0) {
      return 0;
    }

    return currentEntropy * this.informationEntropyWeight;
  }

  /**
   * 取得計算器配置資訊
   *
   * @returns {Object} 配置資訊
   */
  getConfig() {
    return {
      guessSuccessScore: this.guessSuccessScore,
      guessFailureCost: this.guessFailureCost,
      followGuessSuccessScore: this.followGuessSuccessScore,
      followGuessFailureCost: this.followGuessFailureCost,
      informationEntropyWeight: this.informationEntropyWeight
    };
  }
}

/**
 * 建立 ExpectedValueCalculator 實例的工廠函數
 *
 * @param {Object} params - 參數配置（選填）
 * @returns {ExpectedValueCalculator} ExpectedValueCalculator 實例
 */
export function createExpectedValueCalculator(params) {
  return new ExpectedValueCalculator(params);
}

export default ExpectedValueCalculator;
