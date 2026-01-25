/**
 * 困難難度策略
 *
 * 使用完整推理引擎，包含期望值計算、資訊熵評估、最佳化決策。
 * 提供最高難度的挑戰。
 *
 * @module ai/strategies/HardStrategy
 */

import BaseStrategy, { ACTION_TYPE } from './BaseStrategy';
import { AI_DIFFICULTY, QUESTION_TYPE_ALL_ONE_COLOR, ALL_COLORS } from '../../shared/constants';
import { AI_PARAMS } from '../config/aiConfig';
import ProbabilityCalculator from '../ProbabilityCalculator';

/**
 * 困難難度策略類別
 *
 * 行為特點：
 * - 使用期望值計算決定猜牌時機
 * - 資訊熵評估問牌價值
 * - 選擇資訊價值最高的目標玩家
 * - 最大化資訊增益的顏色組合
 * - 跟猜時使用期望值評估
 */
class HardStrategy extends BaseStrategy {
  /**
   * 建立 HardStrategy 實例
   *
   * @param {Object} params - 參數配置（選填，預設使用 AI_PARAMS.HARD）
   */
  constructor(params = AI_PARAMS.HARD) {
    super(AI_DIFFICULTY.HARD);
    this.name = 'HardStrategy';

    /**
     * 猜牌信心度閾值（更保守）
     * @type {number}
     */
    this.guessConfidenceThreshold = params.guessConfidenceThreshold || 0.8;

    /**
     * 跟猜概率閾值（更謹慎）
     * @type {number}
     */
    this.followGuessProbThreshold = params.followGuessProbThreshold || 0.3;

    /**
     * 期望值最小值
     * @type {number}
     */
    this.expectedValueMinimum = params.expectedValueMinimum || 0.5;

    /**
     * 資訊熵權重
     * @type {number}
     */
    this.informationEntropyWeight = params.informationEntropyWeight || 0.2;

    /**
     * 概率計算器（用於信息熵、信息增益等計算）
     * @type {ProbabilityCalculator}
     */
    this.calculator = new ProbabilityCalculator();
  }

  /**
   * 決定下一步行動
   *
   * 困難策略：使用期望值計算來決定是否猜牌
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

    // 計算猜牌期望值
    const guessEV = this.calculateGuessExpectedValue(gameState, knowledge);

    // 計算問牌資訊價值
    const questionValue = this.calculateQuestionValue(gameState, knowledge);

    // 如果猜牌期望值為正且高於問牌價值，選擇猜牌
    if (guessEV >= this.expectedValueMinimum && guessEV > questionValue) {
      return ACTION_TYPE.GUESS;
    }

    // 否則選擇問牌
    return ACTION_TYPE.QUESTION;
  }

  /**
   * 計算猜牌期望值
   *
   * EV = (成功概率 × 成功得分) - (失敗概率 × 失敗損失)
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @returns {number} 期望值
   */
  calculateGuessExpectedValue(gameState, knowledge) {
    const bestGuess = this.selectGuessColors(knowledge);
    const successProb = this.calculateSuccessProbability(bestGuess, knowledge);

    // 遊戲規則：猜對得 3 分，猜錯退出當局但不扣分
    const successScore = 3;
    const failureCost = 0;

    return (successProb * successScore) - ((1 - successProb) * failureCost);
  }

  /**
   * 計算猜測成功概率
   *
   * @param {string[]} guessedColors - 猜測的顏色
   * @param {Object} knowledge - AI 知識狀態
   * @returns {number} 成功概率
   */
  calculateSuccessProbability(guessedColors, knowledge) {
    if (!knowledge || !knowledge.hiddenCardProbability || !guessedColors || guessedColors.length < 2) {
      return 0;
    }

    const probs = knowledge.hiddenCardProbability;
    const [color1, color2] = guessedColors;

    // 計算聯合概率作為成功概率
    return this.calculateJointProbability(probs, color1, color2);
  }

  /**
   * 計算問牌的資訊價值
   *
   * 使用資訊熵概念評估問牌能獲得的資訊量
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @returns {number} 資訊價值
   */
  calculateQuestionValue(gameState, knowledge) {
    if (!knowledge || !knowledge.hiddenCardProbability) {
      return 0;
    }

    // 計算當前的信息熵（不確定性）
    const currentEntropy = this.calculator.calculateEntropy(knowledge.hiddenCardProbability);

    // 預期問牌後的熵減少量
    // 使用配置的權重參數
    return currentEntropy * this.informationEntropyWeight;
  }

  /**
   * 選擇要問的目標玩家
   *
   * 困難策略：選擇資訊價值最高的玩家
   * 考慮因素：手牌數量、已知資訊、問牌歷史
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

    // 計算每個玩家的資訊價值，選擇價值最高的
    let bestPlayer = otherPlayers[0];
    let bestValue = this.calculateTargetValue(otherPlayers[0], knowledge);

    for (let i = 1; i < otherPlayers.length; i++) {
      const player = otherPlayers[i];
      const value = this.calculateTargetValue(player, knowledge);

      if (value > bestValue) {
        bestValue = value;
        bestPlayer = player;
      }
    }

    return bestPlayer;
  }

  /**
   * 計算目標玩家的資訊價值
   *
   * 資訊價值 = 未知手牌數量
   *
   * @param {Object} player - 玩家物件
   * @param {Object} knowledge - AI 知識狀態
   * @returns {number} 資訊價值
   */
  calculateTargetValue(player, knowledge) {
    // 預設手牌數量為 3（遊戲初始狀態）
    const handSize = (knowledge && knowledge.playerHandCounts && knowledge.playerHandCounts[player.id]) || 3;

    // 計算已知手牌數量
    const knownCards = (knowledge && knowledge.knownCards && knowledge.knownCards.get &&
                       knowledge.knownCards.get(player.id)?.length) || 0;

    // 未知手牌數量 = 總手牌數 - 已知手牌數
    const unknownCards = handSize - knownCards;

    return unknownCards;
  }

  /**
   * 選擇要問的兩個顏色
   *
   * 困難策略：選擇能最大化資訊增益的顏色組合
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @returns {string[]} 兩個顏色的陣列
   */
  selectColors(gameState, knowledge) {
    if (!knowledge || !knowledge.hiddenCardProbability) {
      return this.randomSelectTwoColors();
    }

    // 過濾掉已確認不在蓋牌的顏色
    const availableColors = ALL_COLORS.filter(color => {
      const prob = knowledge.hiddenCardProbability[color];
      return prob > 0;
    });

    if (availableColors.length < 2) {
      return this.randomSelectTwoColors();
    }

    // 評估所有可能的顏色組合，選擇資訊增益最大的
    let bestPair = [availableColors[0], availableColors[1]];
    let bestValue = this.evaluateColorPair([availableColors[0], availableColors[1]], knowledge);

    for (let i = 0; i < availableColors.length; i++) {
      for (let j = i + 1; j < availableColors.length; j++) {
        const pair = [availableColors[i], availableColors[j]];
        const value = this.evaluateColorPair(pair, knowledge);

        if (value > bestValue) {
          bestValue = value;
          bestPair = pair;
        }
      }
    }

    return bestPair;
  }

  /**
   * 評估顏色組合的資訊價值
   *
   * 選擇不確定性最高的組合（即概率接近 0.5 的顏色）
   *
   * @param {string[]} colors - 顏色組合
   * @param {Object} knowledge - AI 知識狀態
   * @returns {number} 資訊價值
   */
  evaluateColorPair(colors, knowledge) {
    const probs = knowledge.hiddenCardProbability;

    // 使用 p(1-p) 來衡量不確定性
    // 當 p = 0.5 時，p(1-p) 最大，不確定性最高
    const uncertainty1 = probs[colors[0]] * (1 - probs[colors[0]]);
    const uncertainty2 = probs[colors[1]] * (1 - probs[colors[1]]);

    return uncertainty1 + uncertainty2;
  }

  /**
   * 選擇問牌類型
   *
   * 困難策略：根據當前手牌和目標情況選擇最佳問牌方式
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - AI 知識狀態
   * @param {string[]} colors - 選擇的顏色
   * @returns {number} 問牌類型 (2 或 3)
   */
  selectQuestionType(gameState, knowledge, colors) {
    // 困難策略預設使用類型 2（資訊量最大）
    // 未來可以根據手牌情況動態調整
    return QUESTION_TYPE_ALL_ONE_COLOR;
  }

  /**
   * 選擇要猜的兩個顏色
   *
   * 困難策略：選擇概率最高的兩個顏色
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
   * 困難策略：使用期望值評估
   * 只有當預期值為正時才跟猜
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

    // 計算成功概率
    const successProb = this.calculateSuccessProbability(guessedColors, knowledge);

    // 計算期望值：EV = (成功概率 × 1分) - (失敗概率 × 1分)
    const ev = successProb * 1 - (1 - successProb) * 1;

    // 期望值為正時跟猜
    return ev > 0;
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
      expectedValueMinimum: this.expectedValueMinimum,
      informationEntropyWeight: this.informationEntropyWeight,
      description: '完整推理引擎，期望值計算，資訊熵評估'
    };
  }
}

/**
 * 建立 HardStrategy 實例的工廠函數
 *
 * @returns {HardStrategy} HardStrategy 實例
 */
export function createHardStrategy() {
  return new HardStrategy();
}

export default HardStrategy;
