/**
 * 資訊追蹤器
 *
 * 負責追蹤 AI 所知道的遊戲資訊，包括：
 * - 已知玩家手牌
 * - 蓋牌機率分布
 * - 可見顏色計數
 * - 問牌歷史記錄
 * - 已排除的顏色
 *
 * @module ai/InformationTracker
 */

import {
  ALL_COLORS,
  CARD_COUNTS,
  TOTAL_CARDS,
  HIDDEN_CARDS_COUNT
} from '../../shared/constants';

/**
 * 遊戲事件類型
 * @readonly
 * @enum {string}
 */
export const EVENT_TYPES = {
  /** 問牌結果事件 */
  QUESTION_RESULT: 'QUESTION_RESULT',
  /** 卡牌交換事件 */
  CARD_TRANSFER: 'CARD_TRANSFER',
  /** 猜牌結果事件 */
  GUESS_RESULT: 'GUESS_RESULT',
  /** 新回合開始事件 */
  NEW_ROUND: 'NEW_ROUND',
  /** 玩家出局事件 */
  PLAYER_ELIMINATED: 'PLAYER_ELIMINATED',
  /** 遊戲開始事件 */
  GAME_START: 'GAME_START',
  /** 手牌設定事件 */
  HAND_SET: 'HAND_SET'
};

/**
 * 資訊追蹤器類別
 */
class InformationTracker {
  /**
   * 建立資訊追蹤器
   *
   * @param {string} selfId - 自己的玩家 ID
   */
  constructor(selfId) {
    this.selfId = selfId;

    // 初始化追蹤資料
    this.knownCards = new Map();
    this.hiddenCardProbability = this.getInitialProbabilities();
    this.visibleColorCounts = this.getEmptyColorCounts();
    this.questionHistory = [];
    this.eliminatedColors = new Set();

    // 追蹤自己的手牌
    this.myHand = [];

    // 追蹤玩家狀態
    this.activePlayers = new Set();
    this.playerHandCounts = new Map();
  }

  /**
   * 取得初始機率分布
   * 基於牌組組成：紅2/黃3/綠4/藍5 = 14 張
   *
   * @returns {Object} 初始機率分布
   */
  getInitialProbabilities() {
    const probabilities = {};
    for (const color of ALL_COLORS) {
      probabilities[color] = CARD_COUNTS[color] / TOTAL_CARDS;
    }
    return probabilities;
  }

  /**
   * 取得空的顏色計數物件
   *
   * @returns {Object} 顏色計數物件
   */
  getEmptyColorCounts() {
    const counts = {};
    for (const color of ALL_COLORS) {
      counts[color] = 0;
    }
    return counts;
  }

  /**
   * 重置追蹤器狀態（新遊戲或新回合開始時）
   */
  reset() {
    this.knownCards = new Map();
    this.hiddenCardProbability = this.getInitialProbabilities();
    this.visibleColorCounts = this.getEmptyColorCounts();
    this.questionHistory = [];
    this.eliminatedColors = new Set();
    this.myHand = [];
    this.activePlayers = new Set();
    this.playerHandCounts = new Map();
  }

  /**
   * 處理遊戲事件
   *
   * @param {Object} event - 遊戲事件
   * @param {string} event.type - 事件類型
   */
  processEvent(event) {
    if (!event || !event.type) {
      return;
    }

    switch (event.type) {
      case EVENT_TYPES.QUESTION_RESULT:
        this.processQuestionResult(event);
        break;

      case EVENT_TYPES.CARD_TRANSFER:
        this.processCardTransfer(event);
        break;

      case EVENT_TYPES.GUESS_RESULT:
        this.processGuessResult(event);
        break;

      case EVENT_TYPES.NEW_ROUND:
        this.processNewRound(event);
        break;

      case EVENT_TYPES.PLAYER_ELIMINATED:
        this.processPlayerEliminated(event);
        break;

      case EVENT_TYPES.GAME_START:
        this.processGameStart(event);
        break;

      case EVENT_TYPES.HAND_SET:
        this.processHandSet(event);
        break;

      default:
        // 未知事件類型，靜默忽略
        break;
    }
  }

  /**
   * 處理問牌結果事件
   *
   * @param {Object} event - 問牌結果事件
   * @param {string} event.askerId - 詢問者 ID
   * @param {string} event.targetId - 目標玩家 ID
   * @param {string[]} event.colors - 詢問的顏色
   * @param {number} event.questionType - 問牌類型
   * @param {Object} event.result - 問牌結果
   */
  processQuestionResult(event) {
    // 記錄問牌歷史
    this.questionHistory.push({
      askerId: event.askerId,
      targetId: event.targetId,
      colors: event.colors,
      questionType: event.questionType,
      result: event.result,
      timestamp: Date.now()
    });

    // 如果有回應結果，更新已知資訊
    if (event.result) {
      this.updateKnownCardsFromQuestion(event);
    }

    // 重新計算機率
    this.recalculateProbabilities();
  }

  /**
   * 根據問牌結果更新已知牌資訊
   *
   * @param {Object} event - 問牌事件
   */
  updateKnownCardsFromQuestion(event) {
    const { targetId, colors, result } = event;

    // 如果目標玩家沒有某顏色的牌，記錄這個資訊
    if (result.cardsGiven) {
      for (const color of colors) {
        const givenOfColor = result.cardsGiven.filter(c => c.color === color);
        if (givenOfColor.length === 0) {
          // 目標玩家沒有這個顏色的牌
          this.recordPlayerHasNoColor(targetId, color);
        }
      }
    }

    // 如果有回報沒有的顏色
    if (result.noCardsForColors) {
      for (const color of result.noCardsForColors) {
        this.recordPlayerHasNoColor(targetId, color);
      }
    }
  }

  /**
   * 記錄玩家沒有某顏色的牌
   *
   * @param {string} playerId - 玩家 ID
   * @param {string} color - 顏色
   */
  recordPlayerHasNoColor(playerId, color) {
    if (!this.knownCards.has(playerId)) {
      this.knownCards.set(playerId, {
        hasColors: new Set(),
        noColors: new Set()
      });
    }

    const playerInfo = this.knownCards.get(playerId);
    playerInfo.noColors.add(color);
  }

  /**
   * 記錄玩家有某顏色的牌
   *
   * @param {string} playerId - 玩家 ID
   * @param {string} color - 顏色
   */
  recordPlayerHasColor(playerId, color) {
    if (!this.knownCards.has(playerId)) {
      this.knownCards.set(playerId, {
        hasColors: new Set(),
        noColors: new Set()
      });
    }

    const playerInfo = this.knownCards.get(playerId);
    playerInfo.hasColors.add(color);
    // 如果確認有，則從沒有的集合中移除
    playerInfo.noColors.delete(color);
  }

  /**
   * 處理卡牌交換事件
   *
   * @param {Object} event - 卡牌交換事件
   * @param {string} event.fromPlayerId - 給牌玩家 ID
   * @param {string} event.toPlayerId - 收牌玩家 ID
   * @param {Array} event.cards - 交換的牌
   */
  processCardTransfer(event) {
    const { fromPlayerId, toPlayerId, cards } = event;

    if (!cards || cards.length === 0) {
      return;
    }

    // 更新可見顏色計數
    for (const card of cards) {
      if (card && card.color) {
        this.visibleColorCounts[card.color]++;
      }
    }

    // 記錄收牌玩家現在有這些顏色
    for (const card of cards) {
      if (card && card.color) {
        this.recordPlayerHasColor(toPlayerId, card.color);
      }
    }

    // 更新手牌計數
    if (this.playerHandCounts.has(fromPlayerId)) {
      const fromCount = this.playerHandCounts.get(fromPlayerId);
      this.playerHandCounts.set(fromPlayerId, Math.max(0, fromCount - cards.length));
    }

    if (this.playerHandCounts.has(toPlayerId)) {
      const toCount = this.playerHandCounts.get(toPlayerId);
      this.playerHandCounts.set(toPlayerId, toCount + cards.length);
    }

    // 重新計算機率
    this.recalculateProbabilities();
  }

  /**
   * 處理猜牌結果事件
   *
   * @param {Object} event - 猜牌結果事件
   * @param {string[]} event.guessedColors - 猜測的顏色
   * @param {boolean} event.isCorrect - 是否猜對
   */
  processGuessResult(event) {
    const { guessedColors, isCorrect } = event;

    if (isCorrect) {
      // 猜對了，蓋牌顏色確定
      for (const color of guessedColors) {
        this.eliminatedColors.add(color);
      }
      // 將蓋牌機率設為確定值
      for (const color of ALL_COLORS) {
        if (guessedColors.includes(color)) {
          this.hiddenCardProbability[color] = 1 / HIDDEN_CARDS_COUNT;
        } else {
          this.hiddenCardProbability[color] = 0;
        }
      }
    } else {
      // 猜錯了，這個組合不可能是蓋牌
      // 記錄排除的組合（可用於高級推理）
    }
  }

  /**
   * 處理新回合開始事件
   *
   * @param {Object} event - 新回合事件
   */
  processNewRound(event) {
    // 新回合重置部分資訊，但保留玩家狀態
    this.questionHistory = [];
    this.visibleColorCounts = this.getEmptyColorCounts();
    this.hiddenCardProbability = this.getInitialProbabilities();
    this.eliminatedColors = new Set();

    // 保留 knownCards 但清除暫時資訊
    // 可以根據遊戲規則決定要保留多少資訊
  }

  /**
   * 處理玩家出局事件
   *
   * @param {Object} event - 玩家出局事件
   * @param {string} event.playerId - 出局玩家 ID
   */
  processPlayerEliminated(event) {
    const { playerId } = event;

    this.activePlayers.delete(playerId);
  }

  /**
   * 處理遊戲開始事件
   *
   * @param {Object} event - 遊戲開始事件
   * @param {Array} event.players - 玩家列表
   */
  processGameStart(event) {
    this.reset();

    if (event.players) {
      for (const player of event.players) {
        this.activePlayers.add(player.id);
        // 初始手牌數量（遊戲開始時每人有幾張牌取決於玩家數）
        if (player.handCount !== undefined) {
          this.playerHandCounts.set(player.id, player.handCount);
        }
      }
    }
  }

  /**
   * 處理手牌設定事件
   *
   * @param {Object} event - 手牌設定事件
   * @param {string} event.playerId - 玩家 ID
   * @param {Array} event.cards - 手牌
   */
  processHandSet(event) {
    const { playerId, cards } = event;

    // 如果是自己的手牌，記錄下來
    if (playerId === this.selfId && cards) {
      this.myHand = [...cards];

      // 更新可見顏色計數（自己的牌是可見的）
      for (const card of cards) {
        if (card && card.color) {
          this.visibleColorCounts[card.color]++;
        }
      }

      // 重新計算機率
      this.recalculateProbabilities();
    }

    // 更新手牌數量
    if (cards) {
      this.playerHandCounts.set(playerId, cards.length);
    }
  }

  /**
   * 重新計算蓋牌機率
   *
   * 基於已知資訊（可見牌、已知玩家牌）計算各顏色作為蓋牌的機率
   */
  recalculateProbabilities() {
    // 計算各顏色的剩餘未知牌數
    const remainingCounts = {};
    let totalRemaining = 0;

    for (const color of ALL_COLORS) {
      // 原始牌數 - 已見到的牌數
      const remaining = CARD_COUNTS[color] - this.visibleColorCounts[color];
      remainingCounts[color] = Math.max(0, remaining);
      totalRemaining += remainingCounts[color];
    }

    // 如果沒有剩餘的牌，保持初始機率
    if (totalRemaining === 0) {
      this.hiddenCardProbability = this.getInitialProbabilities();
      return;
    }

    // 計算各顏色作為蓋牌的機率
    // 機率 = 該顏色剩餘牌數 / 總剩餘牌數
    for (const color of ALL_COLORS) {
      this.hiddenCardProbability[color] = remainingCounts[color] / totalRemaining;
    }

    // 如果某顏色所有牌都已見到，則該顏色不可能是蓋牌
    for (const color of ALL_COLORS) {
      if (this.visibleColorCounts[color] >= CARD_COUNTS[color]) {
        this.hiddenCardProbability[color] = 0;
        this.eliminatedColors.add(color);
      }
    }
  }

  /**
   * 取得當前知識狀態
   *
   * @returns {Object} 知識狀態物件
   */
  getKnowledge() {
    return {
      // 已知玩家牌資訊（轉換 Map 為普通物件方便使用）
      knownCards: this.getKnownCardsAsObject(),

      // 蓋牌機率分布
      hiddenCardProbability: { ...this.hiddenCardProbability },

      // 已排除的顏色（轉換 Set 為陣列）
      eliminatedColors: [...this.eliminatedColors],

      // 問牌歷史（複製陣列）
      questionHistory: [...this.questionHistory],

      // 可見顏色計數
      visibleColorCounts: { ...this.visibleColorCounts },

      // 自己的手牌
      myHand: [...this.myHand],

      // 活躍玩家
      activePlayers: [...this.activePlayers],

      // 玩家手牌數量
      playerHandCounts: Object.fromEntries(this.playerHandCounts),

      // 推斷資訊
      inference: this.getInferenceData()
    };
  }

  /**
   * 將 knownCards Map 轉換為普通物件
   *
   * @returns {Object} 玩家已知牌資訊
   */
  getKnownCardsAsObject() {
    const result = {};
    for (const [playerId, info] of this.knownCards) {
      result[playerId] = {
        hasColors: [...info.hasColors],
        noColors: [...info.noColors]
      };
    }
    return result;
  }

  /**
   * 取得推斷資料
   *
   * @returns {Object} 推斷資料
   */
  getInferenceData() {
    // 計算最可能的蓋牌組合
    const colorProbabilities = ALL_COLORS.map(color => ({
      color,
      probability: this.hiddenCardProbability[color]
    }));

    // 按機率排序
    colorProbabilities.sort((a, b) => b.probability - a.probability);

    // 取機率最高的兩個顏色作為最可能的蓋牌
    const mostLikelyHiddenColors = colorProbabilities
      .slice(0, HIDDEN_CARDS_COUNT)
      .map(item => item.color);

    // 計算信心度（兩個最高機率的乘積的某種變換）
    const confidence = this.calculateConfidence(colorProbabilities);

    return {
      mostLikelyHiddenColors,
      confidence,
      colorProbabilities
    };
  }

  /**
   * 計算猜牌信心度
   *
   * @param {Array} colorProbabilities - 顏色機率陣列
   * @returns {number} 信心度 (0-1)
   */
  calculateConfidence(colorProbabilities) {
    if (colorProbabilities.length < 2) {
      return 0;
    }

    // 取前兩高機率
    const top1 = colorProbabilities[0].probability;
    const top2 = colorProbabilities[1].probability;

    // 如果前兩個機率都很高且遠超其他，則信心度高
    // 簡單計算：(top1 + top2) * 差距因子
    const sum = top1 + top2;

    // 計算與第三高的差距
    const top3 = colorProbabilities[2]?.probability || 0;
    const gap = sum - (top3 * 2);

    // 信心度 = 總和 * (1 + 差距)，正規化到 0-1
    const rawConfidence = sum * (1 + Math.max(0, gap));
    return Math.min(1, rawConfidence);
  }

  /**
   * 檢查某玩家是否已知沒有某顏色
   *
   * @param {string} playerId - 玩家 ID
   * @param {string} color - 顏色
   * @returns {boolean} 是否已知沒有該顏色
   */
  playerHasNoColor(playerId, color) {
    const info = this.knownCards.get(playerId);
    if (!info) {
      return false;
    }
    return info.noColors.has(color);
  }

  /**
   * 檢查某玩家是否已知有某顏色
   *
   * @param {string} playerId - 玩家 ID
   * @param {string} color - 顏色
   * @returns {boolean} 是否已知有該顏色
   */
  playerHasColor(playerId, color) {
    const info = this.knownCards.get(playerId);
    if (!info) {
      return false;
    }
    return info.hasColors.has(color);
  }

  /**
   * 取得某顏色的剩餘未知牌數
   *
   * @param {string} color - 顏色
   * @returns {number} 剩餘未知牌數
   */
  getRemainingCount(color) {
    return Math.max(0, CARD_COUNTS[color] - this.visibleColorCounts[color]);
  }

  /**
   * 檢查某顏色是否已被排除（不可能是蓋牌）
   *
   * @param {string} color - 顏色
   * @returns {boolean} 是否已被排除
   */
  isColorEliminated(color) {
    return this.eliminatedColors.has(color);
  }

  /**
   * 設定自己的 ID
   *
   * @param {string} selfId - 自己的玩家 ID
   */
  setSelfId(selfId) {
    this.selfId = selfId;
  }
}

/**
 * 工廠函數：建立資訊追蹤器
 *
 * @param {string} selfId - 自己的玩家 ID
 * @returns {InformationTracker} 資訊追蹤器實例
 */
export function createInformationTracker(selfId) {
  return new InformationTracker(selfId);
}

export default InformationTracker;
