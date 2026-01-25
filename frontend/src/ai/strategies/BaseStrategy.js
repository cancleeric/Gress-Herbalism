/**
 * 策略基類
 *
 * 定義 AI 決策策略的抽象介面。
 * 所有難度的策略類別都必須繼承此基類並實現抽象方法。
 *
 * @module ai/strategies/BaseStrategy
 */

import { AI_DIFFICULTY, ALL_COLORS } from '../../shared/constants';

/**
 * 動作類型常數
 * @readonly
 * @enum {string}
 */
export const ACTION_TYPE = {
  /** 問牌動作 */
  QUESTION: 'question',
  /** 猜牌動作 */
  GUESS: 'guess'
};

/**
 * 策略基類
 * @abstract
 */
class BaseStrategy {
  /**
   * 建立策略實例
   *
   * @param {string} difficulty - 難度級別
   */
  constructor(difficulty = AI_DIFFICULTY.MEDIUM) {
    if (new.target === BaseStrategy) {
      throw new Error('BaseStrategy is abstract and cannot be instantiated directly');
    }

    this.difficulty = difficulty;
    this.name = 'BaseStrategy';
  }

  /**
   * 決定動作類型（問牌或猜牌）
   *
   * @abstract
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {string} 動作類型 ('question' 或 'guess')
   * @throws {Error} 子類必須實現此方法
   */
  decideAction(gameState, knowledge) {
    throw new Error('decideAction must be implemented by subclass');
  }

  /**
   * 選擇目標玩家
   *
   * @abstract
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {Object|null} 目標玩家物件
   * @throws {Error} 子類必須實現此方法
   */
  selectTargetPlayer(gameState, knowledge) {
    throw new Error('selectTargetPlayer must be implemented by subclass');
  }

  /**
   * 選擇問牌顏色（兩個）
   *
   * @abstract
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {string[]} 兩個顏色的陣列
   * @throws {Error} 子類必須實現此方法
   */
  selectColors(gameState, knowledge) {
    throw new Error('selectColors must be implemented by subclass');
  }

  /**
   * 選擇問牌類型
   *
   * @abstract
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @param {string[]} colors - 選定的顏色
   * @returns {number} 問牌類型 (1, 2, 或 3)
   * @throws {Error} 子類必須實現此方法
   */
  selectQuestionType(gameState, knowledge, colors) {
    throw new Error('selectQuestionType must be implemented by subclass');
  }

  /**
   * 選擇猜牌顏色（兩個）
   *
   * @abstract
   * @param {Object} knowledge - 知識狀態
   * @returns {string[]} 兩個顏色的陣列
   * @throws {Error} 子類必須實現此方法
   */
  selectGuessColors(knowledge) {
    throw new Error('selectGuessColors must be implemented by subclass');
  }

  /**
   * 決定是否跟猜
   *
   * @abstract
   * @param {string[]} guessedColors - 被猜測的顏色
   * @param {Object} knowledge - 知識狀態
   * @returns {boolean} 是否跟猜
   * @throws {Error} 子類必須實現此方法
   */
  decideFollowGuess(guessedColors, knowledge) {
    throw new Error('decideFollowGuess must be implemented by subclass');
  }

  // ==================== 輔助方法（子類可使用）====================

  /**
   * 取得其他活躍玩家
   *
   * @protected
   * @param {Object} gameState - 遊戲狀態
   * @param {string} selfId - 自己的 ID
   * @returns {Array} 其他活躍玩家列表
   */
  getOtherActivePlayers(gameState, selfId) {
    if (!gameState || !gameState.players) {
      return [];
    }

    return gameState.players.filter(
      player => player.id !== selfId && player.isActive
    );
  }

  /**
   * 檢查是否必須猜牌（只剩自己一個活躍玩家）
   *
   * @protected
   * @param {Object} gameState - 遊戲狀態
   * @param {string} selfId - 自己的 ID
   * @returns {boolean} 是否必須猜牌
   */
  mustGuess(gameState, selfId) {
    const otherPlayers = this.getOtherActivePlayers(gameState, selfId);
    return otherPlayers.length === 0;
  }

  /**
   * 隨機選擇兩個不同的顏色
   *
   * @protected
   * @returns {string[]} 兩個顏色的陣列
   */
  randomSelectTwoColors() {
    const shuffled = [...ALL_COLORS].sort(() => Math.random() - 0.5);
    return [shuffled[0], shuffled[1]];
  }

  /**
   * 隨機選擇一個玩家
   *
   * @protected
   * @param {Array} players - 玩家列表
   * @returns {Object|null} 隨機選擇的玩家
   */
  randomSelectPlayer(players) {
    if (!players || players.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * players.length);
    return players[index];
  }

  /**
   * 根據機率選擇顏色
   *
   * @protected
   * @param {Object} probabilities - 顏色機率物件
   * @param {number} count - 要選擇的數量
   * @returns {string[]} 選擇的顏色陣列
   */
  selectColorsByProbability(probabilities, count = 2) {
    // 轉換為陣列並按機率排序
    const colorProbs = Object.entries(probabilities)
      .map(([color, prob]) => ({ color, prob }))
      .sort((a, b) => b.prob - a.prob);

    // 取前 count 個
    return colorProbs.slice(0, count).map(item => item.color);
  }

  /**
   * 檢查顏色組合是否包含某顏色
   *
   * @protected
   * @param {string[]} colors - 顏色陣列
   * @param {string} color - 要檢查的顏色
   * @returns {boolean} 是否包含
   */
  hasColor(colors, color) {
    return colors.includes(color);
  }

  /**
   * 計算兩個顏色組合的聯合機率
   *
   * @protected
   * @param {Object} probabilities - 顏色機率物件
   * @param {string} color1 - 第一個顏色
   * @param {string} color2 - 第二個顏色
   * @returns {number} 聯合機率
   */
  calculateJointProbability(probabilities, color1, color2) {
    const p1 = probabilities[color1] || 0;
    const p2 = probabilities[color2] || 0;
    // 簡化計算：假設獨立事件
    return p1 * p2;
  }

  /**
   * 取得策略資訊
   *
   * @returns {Object} 策略資訊
   */
  getInfo() {
    return {
      name: this.name,
      difficulty: this.difficulty
    };
  }
}

/**
 * 驗證策略實例是否完整實現所有抽象方法
 *
 * @param {BaseStrategy} strategy - 策略實例
 * @returns {Object} 驗證結果
 */
export function validateStrategy(strategy) {
  const requiredMethods = [
    'decideAction',
    'selectTargetPlayer',
    'selectColors',
    'selectQuestionType',
    'selectGuessColors',
    'decideFollowGuess'
  ];

  const missing = [];
  const implemented = [];

  for (const method of requiredMethods) {
    try {
      // 嘗試呼叫方法，如果拋出 "must be implemented" 錯誤，表示未實現
      strategy[method]({}, {});
      implemented.push(method);
    } catch (error) {
      if (error.message.includes('must be implemented')) {
        missing.push(method);
      } else {
        // 其他錯誤表示方法已實現但可能參數不對
        implemented.push(method);
      }
    }
  }

  return {
    isValid: missing.length === 0,
    implemented,
    missing
  };
}

export default BaseStrategy;
