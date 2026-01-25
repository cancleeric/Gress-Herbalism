/**
 * 決策執行器
 *
 * 負責協調策略和知識狀態，執行具體的決策流程。
 * 將策略的各個決策方法組合成完整的動作。
 *
 * @module ai/DecisionMaker
 */

import { ACTION_TYPE } from './strategies/BaseStrategy';

/**
 * 決策執行器類別
 */
class DecisionMaker {
  /**
   * 建立決策執行器
   *
   * @param {Object} strategy - 策略實例
   * @param {string} selfId - 自己的玩家 ID
   */
  constructor(strategy, selfId = null) {
    if (!strategy) {
      throw new Error('Strategy is required for DecisionMaker');
    }

    this.strategy = strategy;
    this.selfId = selfId;

    // 決策歷史記錄
    this.decisionHistory = [];
  }

  /**
   * 設定自己的 ID
   *
   * @param {string} selfId - 自己的玩家 ID
   */
  setSelfId(selfId) {
    this.selfId = selfId;
  }

  /**
   * 設定策略
   *
   * @param {Object} strategy - 策略實例
   */
  setStrategy(strategy) {
    if (!strategy) {
      throw new Error('Strategy cannot be null');
    }
    this.strategy = strategy;
  }

  /**
   * 執行主要決策
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {Object} 決策動作物件
   */
  decide(gameState, knowledge) {
    // 決定動作類型
    const actionType = this.strategy.decideAction(gameState, knowledge);

    let action;
    if (actionType === ACTION_TYPE.GUESS || actionType === 'guess') {
      action = this.makeGuessDecision(gameState, knowledge);
    } else {
      action = this.makeQuestionDecision(gameState, knowledge);
    }

    // 記錄決策
    this.recordDecision(action, gameState, knowledge);

    return action;
  }

  /**
   * 執行問牌決策
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {Object} 問牌動作物件
   */
  makeQuestionDecision(gameState, knowledge) {
    // 選擇目標玩家
    const targetPlayer = this.strategy.selectTargetPlayer(gameState, knowledge);

    // 選擇顏色
    const colors = this.strategy.selectColors(gameState, knowledge);

    // 選擇問牌類型
    const questionType = this.strategy.selectQuestionType(gameState, knowledge, colors);

    return {
      type: ACTION_TYPE.QUESTION,
      targetPlayerId: targetPlayer?.id || null,
      colors: colors,
      questionType: questionType
    };
  }

  /**
   * 執行猜牌決策
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   * @returns {Object} 猜牌動作物件
   */
  makeGuessDecision(gameState, knowledge) {
    // 選擇猜牌顏色
    const colors = this.strategy.selectGuessColors(knowledge);

    return {
      type: ACTION_TYPE.GUESS,
      colors: colors
    };
  }

  /**
   * 決定是否跟猜
   *
   * @param {Object} gameState - 遊戲狀態
   * @param {string[]} guessedColors - 被猜測的顏色
   * @param {Object} knowledge - 知識狀態
   * @returns {boolean} 是否跟猜
   */
  decideFollowGuess(gameState, guessedColors, knowledge) {
    const decision = this.strategy.decideFollowGuess(guessedColors, knowledge);

    // 記錄跟猜決策
    this.recordFollowGuessDecision(guessedColors, decision, knowledge);

    return decision;
  }

  /**
   * 記錄決策
   *
   * @private
   * @param {Object} action - 決策動作
   * @param {Object} gameState - 遊戲狀態
   * @param {Object} knowledge - 知識狀態
   */
  recordDecision(action, gameState, knowledge) {
    this.decisionHistory.push({
      type: 'action',
      action: { ...action },
      timestamp: Date.now(),
      knowledge: this.summarizeKnowledge(knowledge)
    });
  }

  /**
   * 記錄跟猜決策
   *
   * @private
   * @param {string[]} guessedColors - 被猜測的顏色
   * @param {boolean} decision - 是否跟猜
   * @param {Object} knowledge - 知識狀態
   */
  recordFollowGuessDecision(guessedColors, decision, knowledge) {
    this.decisionHistory.push({
      type: 'followGuess',
      guessedColors: [...guessedColors],
      decision,
      timestamp: Date.now(),
      knowledge: this.summarizeKnowledge(knowledge)
    });
  }

  /**
   * 摘要知識狀態（用於記錄）
   *
   * @private
   * @param {Object} knowledge - 知識狀態
   * @returns {Object} 摘要資訊
   */
  summarizeKnowledge(knowledge) {
    if (!knowledge) {
      return null;
    }

    return {
      hiddenCardProbability: knowledge.hiddenCardProbability
        ? { ...knowledge.hiddenCardProbability }
        : null,
      eliminatedColors: knowledge.eliminatedColors
        ? [...knowledge.eliminatedColors]
        : [],
      confidence: knowledge.inference?.confidence || null
    };
  }

  /**
   * 取得決策歷史
   *
   * @returns {Array} 決策歷史陣列
   */
  getDecisionHistory() {
    return [...this.decisionHistory];
  }

  /**
   * 清除決策歷史
   */
  clearHistory() {
    this.decisionHistory = [];
  }

  /**
   * 取得最近的決策
   *
   * @param {number} count - 要取得的數量
   * @returns {Array} 最近的決策陣列
   */
  getRecentDecisions(count = 5) {
    return this.decisionHistory.slice(-count);
  }

  /**
   * 取得決策統計
   *
   * @returns {Object} 決策統計資訊
   */
  getStatistics() {
    const stats = {
      totalDecisions: this.decisionHistory.length,
      actionDecisions: 0,
      followGuessDecisions: 0,
      questionActions: 0,
      guessActions: 0,
      followGuessYes: 0,
      followGuessNo: 0
    };

    for (const record of this.decisionHistory) {
      if (record.type === 'action') {
        stats.actionDecisions++;
        if (record.action.type === ACTION_TYPE.QUESTION) {
          stats.questionActions++;
        } else if (record.action.type === ACTION_TYPE.GUESS) {
          stats.guessActions++;
        }
      } else if (record.type === 'followGuess') {
        stats.followGuessDecisions++;
        if (record.decision) {
          stats.followGuessYes++;
        } else {
          stats.followGuessNo++;
        }
      }
    }

    return stats;
  }

  /**
   * 驗證動作是否有效
   *
   * @param {Object} action - 動作物件
   * @returns {Object} 驗證結果
   */
  validateAction(action) {
    const errors = [];

    if (!action) {
      errors.push('Action is null');
      return { isValid: false, errors };
    }

    if (!action.type) {
      errors.push('Action type is missing');
    }

    if (action.type === ACTION_TYPE.QUESTION) {
      if (!action.targetPlayerId) {
        errors.push('Target player ID is missing for question action');
      }
      if (!action.colors || action.colors.length !== 2) {
        errors.push('Colors must be an array of 2 colors for question action');
      }
      if (!action.questionType || ![1, 2, 3].includes(action.questionType)) {
        errors.push('Question type must be 1, 2, or 3');
      }
    } else if (action.type === ACTION_TYPE.GUESS) {
      if (!action.colors || action.colors.length !== 2) {
        errors.push('Colors must be an array of 2 colors for guess action');
      }
    } else {
      errors.push(`Unknown action type: ${action.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 取得執行器資訊
   *
   * @returns {Object} 執行器資訊
   */
  getInfo() {
    return {
      selfId: this.selfId,
      strategy: this.strategy?.getInfo?.() || { name: 'unknown' },
      historyLength: this.decisionHistory.length
    };
  }

  /**
   * 重置執行器狀態
   */
  reset() {
    this.decisionHistory = [];
  }
}

/**
 * 工廠函數：建立決策執行器
 *
 * @param {Object} strategy - 策略實例
 * @param {string} selfId - 自己的玩家 ID
 * @returns {DecisionMaker} 決策執行器實例
 */
export function createDecisionMaker(strategy, selfId = null) {
  return new DecisionMaker(strategy, selfId);
}

export default DecisionMaker;
