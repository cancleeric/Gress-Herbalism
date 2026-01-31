/**
 * 簡單難度策略
 *
 * 使用隨機決策，適合新手練習。
 * 不依賴任何知識狀態，所有決策都是隨機的。
 *
 * @module ai/strategies/EasyStrategy
 */

import BaseStrategy, { ACTION_TYPE } from './BaseStrategy';
import { AI_DIFFICULTY } from '../../../shared/constants';
import { AI_PARAMS } from '../config/aiConfig';

/**
 * 簡單難度策略類別
 *
 * 行為特點：
 * - 優先問牌，除非被強制猜牌
 * - 隨機選擇目標玩家
 * - 隨機選擇顏色
 * - 加權隨機選擇問牌類型（可配置權重）
 * - 可配置的跟猜機率
 */
class EasyStrategy extends BaseStrategy {
  /**
   * 建立 EasyStrategy 實例
   *
   * @param {Object} params - 參數配置（選填，預設使用 AI_PARAMS.EASY）
   */
  constructor(params = AI_PARAMS.EASY) {
    super(AI_DIFFICULTY.EASY);
    this.name = 'EasyStrategy';

    /**
     * 問牌類型的權重配置
     * @type {number[]}
     */
    this.questionTypeWeights = params.questionTypeWeights || [0.6, 0.3, 0.1];

    /**
     * 跟猜機率
     * @type {number}
     */
    this.followGuessProbability = params.followGuessProbability || 0.5;
  }

  /**
   * 決定下一步行動
   *
   * 簡單策略：優先問牌，除非強制猜牌
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態（簡單難度不使用）
   * @returns {string} ACTION_TYPE.QUESTION 或 ACTION_TYPE.GUESS
   */
  decideAction(gameState, knowledge) {
    // 檢查是否必須猜牌（沒有其他存活玩家）
    if (this.mustGuess(gameState, this.selfId)) {
      return ACTION_TYPE.GUESS;
    }

    // 簡單難度永遠選擇問牌（除非被強制猜牌）
    return ACTION_TYPE.QUESTION;
  }

  /**
   * 選擇要問的目標玩家
   *
   * 簡單策略：隨機選擇其他存活玩家
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態（簡單難度不使用）
   * @returns {Object|null} 目標玩家物件，如果沒有可選玩家則返回 null
   */
  selectTargetPlayer(gameState, knowledge) {
    const otherPlayers = this.getOtherActivePlayers(gameState, this.selfId);
    return this.randomSelectPlayer(otherPlayers);
  }

  /**
   * 選擇要問的兩個顏色
   *
   * 簡單策略：隨機選擇兩個顏色
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態（簡單難度不使用）
   * @returns {string[]} 兩個顏色的陣列
   */
  selectColors(gameState, knowledge) {
    return this.randomSelectTwoColors();
  }

  /**
   * 選擇問牌類型
   *
   * 簡單策略：加權隨機選擇
   * - 類型1（各一張）: 60%
   * - 類型2（全部）: 30%
   * - 類型3（給一要全）: 10%
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態（簡單難度不使用）
   * @param {string[]} colors - 選擇的顏色（簡單難度不使用）
   * @returns {number} 問牌類型 (1, 2, 或 3)
   */
  selectQuestionType(gameState, knowledge, colors) {
    return this.weightedRandomSelect(this.questionTypeWeights);
  }

  /**
   * 選擇要猜的兩個顏色
   *
   * 簡單策略：完全隨機選擇
   *
   * @param {Object} knowledge - AI 知識狀態（簡單難度不使用）
   * @returns {string[]} 兩個顏色的陣列
   */
  selectGuessColors(knowledge) {
    return this.randomSelectTwoColors();
  }

  /**
   * 決定是否跟猜
   *
   * 簡單策略：根據配置的機率跟猜
   *
   * @param {string[]} guessedColors - 被猜的顏色（簡單難度不使用）
   * @param {Object} knowledge - AI 知識狀態（簡單難度不使用）
   * @returns {boolean} 是否跟猜
   */
  decideFollowGuess(guessedColors, knowledge) {
    return Math.random() < this.followGuessProbability;
  }

  /**
   * 加權隨機選擇
   *
   * 根據權重陣列進行加權隨機選擇
   * 例如：weights = [0.6, 0.3, 0.1] 會以 60% 機率選擇索引 0，30% 選擇索引 1，10% 選擇索引 2
   *
   * @param {number[]} weights - 權重陣列，總和應為 1
   * @returns {number} 選擇的索引 + 1（對應問牌類型 1, 2, 3）
   */
  weightedRandomSelect(weights) {
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        return i + 1; // 返回問牌類型 (1, 2, 3)
      }
    }

    // 如果因為浮點數誤差沒有選中，返回最後一個
    return weights.length;
  }

  /**
   * 取得策略資訊
   *
   * @returns {Object} 策略資訊
   */
  getInfo() {
    return {
      name: this.name,
      difficulty: this.difficulty,
      questionTypeWeights: this.questionTypeWeights,
      description: '隨機決策，適合新手練習'
    };
  }
}

/**
 * 建立 EasyStrategy 實例的工廠函數
 *
 * @returns {EasyStrategy} EasyStrategy 實例
 */
export function createEasyStrategy() {
  return new EasyStrategy();
}

export default EasyStrategy;
