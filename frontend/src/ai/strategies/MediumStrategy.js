/**
 * 中等難度策略
 *
 * 使用基礎推理，追蹤明顯資訊並做出決策。
 * 依賴知識狀態中的概率資訊。
 *
 * @module ai/strategies/MediumStrategy
 */

import BaseStrategy, { ACTION_TYPE } from './BaseStrategy';
import { AI_DIFFICULTY, QUESTION_TYPE_ALL_ONE_COLOR } from '../../shared/constants';
import { AI_PARAMS } from '../config/aiConfig';

/**
 * 中等難度策略類別
 *
 * 行為特點：
 * - 根據信心度決定是否猜牌（可配置閾值）
 * - 選擇手牌最多的玩家（資訊量最大）
 * - 選擇概率最高的顏色
 * - 預設使用問牌類型 2（資訊量較大）
 * - 跟猜時評估概率（可配置閾值）
 */
class MediumStrategy extends BaseStrategy {
  /**
   * 建立 MediumStrategy 實例
   *
   * @param {Object} params - 參數配置（選填，預設使用 AI_PARAMS.MEDIUM）
   */
  constructor(params = AI_PARAMS.MEDIUM) {
    super(AI_DIFFICULTY.MEDIUM);
    this.name = 'MediumStrategy';

    /**
     * 猜牌信心度閾值
     * @type {number}
     */
    this.guessConfidenceThreshold = params.guessConfidenceThreshold || 0.6;

    /**
     * 跟猜概率閾值
     * @type {number}
     */
    this.followGuessProbThreshold = params.followGuessProbThreshold || 0.15;
  }

  /**
   * 決定下一步行動
   *
   * 中等策略：根據信心度決定是否猜牌
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @returns {string} ACTION_TYPE.QUESTION 或 ACTION_TYPE.GUESS
   */
  decideAction(gameState, knowledge) {
    // 檢查是否必須猜牌
    if (this.mustGuess(gameState, this.selfId)) {
      return ACTION_TYPE.GUESS;
    }

    // 計算猜牌信心度
    const confidence = this.calculateConfidence(knowledge);

    // 信心度足夠時選擇猜牌
    if (confidence >= this.guessConfidenceThreshold) {
      return ACTION_TYPE.GUESS;
    }

    // 否則選擇問牌
    return ACTION_TYPE.QUESTION;
  }

  /**
   * 計算猜牌信心度
   *
   * 使用前兩名顏色的聯合概率作為信心度
   *
   * @param {Object} knowledge - AI 知識狀態
   * @returns {number} 信心度 (0-1)
   */
  calculateConfidence(knowledge) {
    if (!knowledge || !knowledge.hiddenCardProbability) {
      return 0;
    }

    // 獲取概率最高的兩個顏色
    const topColors = this.selectColorsByProbability(knowledge.hiddenCardProbability, 2);

    if (topColors.length < 2) {
      return 0;
    }

    // 計算聯合概率作為信心度
    const confidence = this.calculateJointProbability(
      knowledge.hiddenCardProbability,
      topColors[0],
      topColors[1]
    );

    return confidence;
  }

  /**
   * 選擇要問的目標玩家
   *
   * 中等策略：選擇手牌最多的玩家（資訊量最大）
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @returns {Object|null} 目標玩家物件
   */
  selectTargetPlayer(gameState, knowledge) {
    const otherPlayers = this.getOtherActivePlayers(gameState, this.selfId);

    if (!otherPlayers || otherPlayers.length === 0) {
      return null;
    }

    // 如果有玩家手牌數量資訊，選擇手牌最多的玩家
    if (knowledge && knowledge.playerHandCounts) {
      let maxCards = -1;
      let targetPlayer = null;

      for (const player of otherPlayers) {
        const cardCount = knowledge.playerHandCounts[player.id] || 0;
        if (cardCount > maxCards) {
          maxCards = cardCount;
          targetPlayer = player;
        }
      }

      if (targetPlayer) {
        return targetPlayer;
      }
    }

    // 如果沒有資訊，隨機選擇
    return this.randomSelectPlayer(otherPlayers);
  }

  /**
   * 選擇要問的兩個顏色
   *
   * 中等策略：選擇概率最高的兩個顏色
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @returns {string[]} 兩個顏色的陣列
   */
  selectColors(gameState, knowledge) {
    if (knowledge && knowledge.hiddenCardProbability) {
      return this.selectColorsByProbability(knowledge.hiddenCardProbability, 2);
    }

    // 沒有知識時隨機選擇
    return this.randomSelectTwoColors();
  }

  /**
   * 選擇問牌類型
   *
   * 中等策略：預設使用類型 2（資訊量較大）
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @param {string[]} colors - 選擇的顏色
   * @returns {number} 問牌類型 (2)
   */
  selectQuestionType(gameState, knowledge, colors) {
    // 預設使用類型 2（要全部），因為資訊量較大
    return QUESTION_TYPE_ALL_ONE_COLOR;
  }

  /**
   * 選擇要猜的兩個顏色
   *
   * 中等策略：選擇概率最高的兩個顏色
   *
   * @param {Object} knowledge - AI 知識狀態
   * @returns {string[]} 兩個顏色的陣列
   */
  selectGuessColors(knowledge) {
    if (knowledge && knowledge.hiddenCardProbability) {
      return this.selectColorsByProbability(knowledge.hiddenCardProbability, 2);
    }

    // 沒有知識時隨機選擇
    return this.randomSelectTwoColors();
  }

  /**
   * 決定是否跟猜
   *
   * 中等策略：評估猜測概率 > 15% 時跟猜
   *
   * @param {string[]} guessedColors - 被猜的顏色
   * @param {Object} knowledge - AI 知識狀態
   * @returns {boolean} 是否跟猜
   */
  decideFollowGuess(guessedColors, knowledge) {
    if (!knowledge || !knowledge.hiddenCardProbability || !guessedColors || guessedColors.length < 2) {
      // 沒有足夠資訊時不跟猜
      return false;
    }

    // 計算被猜顏色的聯合概率
    const probability = this.calculateJointProbability(
      knowledge.hiddenCardProbability,
      guessedColors[0],
      guessedColors[1]
    );

    // 概率超過閾值時跟猜
    return probability >= this.followGuessProbThreshold;
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
      guessConfidenceThreshold: this.guessConfidenceThreshold,
      followGuessProbThreshold: this.followGuessProbThreshold,
      description: '基礎推理，追蹤明顯資訊'
    };
  }
}

/**
 * 建立 MediumStrategy 實例的工廠函數
 *
 * @returns {MediumStrategy} MediumStrategy 實例
 */
export function createMediumStrategy() {
  return new MediumStrategy();
}

export default MediumStrategy;
