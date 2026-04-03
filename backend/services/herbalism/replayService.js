/**
 * 本草遊戲回放服務
 *
 * 負責記錄本草遊戲的事件，支援回放功能。
 * 目前使用記憶體存儲；如需持久化可擴充至資料庫。
 */

/**
 * 本草遊戲事件類型
 */
const HERBALISM_EVENT_TYPES = {
  GAME_START: 'game_start',
  ROUND_START: 'round_start',
  ASK_CARD: 'ask_card',
  COLOR_CHOICE: 'color_choice',
  POST_QUESTION: 'post_question',
  GUESS_CARDS: 'guess_cards',
  FOLLOW_GUESS: 'follow_guess',
  GUESS_RESULT: 'guess_result',
  SCORE_UPDATE: 'score_update',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
};

/**
 * 關鍵事件類型（用於標記精彩時刻）
 */
const KEY_EVENT_TYPES = new Set([
  HERBALISM_EVENT_TYPES.GUESS_RESULT,
  HERBALISM_EVENT_TYPES.GAME_END,
  HERBALISM_EVENT_TYPES.ROUND_END,
]);

/**
 * 本草遊戲回放服務類別
 */
class HerbalismReplayService {
  constructor() {
    // 記憶體中的事件緩衝區（gameId -> events[]）
    this.eventBuffers = new Map();
    // 儲存已完成的回放（gameId -> replay）
    this.completedReplays = new Map();
  }

  /**
   * 開始記錄新遊戲
   * @param {string} gameId - 遊戲 ID
   * @param {Object} initialState - 初始遊戲狀態
   */
  startRecording(gameId, initialState) {
    this.eventBuffers.set(gameId, [
      {
        type: HERBALISM_EVENT_TYPES.GAME_START,
        timestamp: Date.now(),
        data: {
          playerCount: initialState.players?.length || 0,
          players: (initialState.players || []).map((p) => ({
            id: p.id,
            name: p.name,
          })),
        },
      },
    ]);

    console.log(`[HerbalismReplayService] 開始記錄遊戲: ${gameId}`);
  }

  /**
   * 記錄遊戲事件
   * @param {string} gameId - 遊戲 ID
   * @param {string} type - 事件類型
   * @param {Object} data - 事件資料
   */
  recordEvent(gameId, type, data) {
    const buffer = this.eventBuffers.get(gameId);
    if (!buffer) {
      return;
    }

    buffer.push({
      type,
      timestamp: Date.now(),
      data: this.sanitizeEventData(data),
      isKeyMoment: KEY_EVENT_TYPES.has(type),
    });
  }

  /**
   * 記錄問牌事件
   */
  recordAskCard(gameId, askingPlayerId, targetPlayerId, round) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.ASK_CARD, {
      askingPlayerId,
      targetPlayerId,
      round,
    });
  }

  /**
   * 記錄顏色選擇事件
   */
  recordColorChoice(gameId, targetPlayerId, chosenColor) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.COLOR_CHOICE, {
      targetPlayerId,
      chosenColor,
    });
  }

  /**
   * 記錄猜牌事件
   */
  recordGuessCards(gameId, guessingPlayerId, guessedColors, round) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.GUESS_CARDS, {
      guessingPlayerId,
      guessedColors,
      round,
    });
  }

  /**
   * 記錄猜牌結果事件
   */
  recordGuessResult(gameId, isCorrect, guessingPlayerId, hiddenCards, scoreChanges) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.GUESS_RESULT, {
      isCorrect,
      guessingPlayerId,
      hiddenCards,
      scoreChanges,
    });
  }

  /**
   * 記錄遊戲結束事件
   */
  recordGameEnd(gameId, scores, winner) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.GAME_END, {
      scores,
      winner,
    });

    // 將已完成回放存入記憶體
    const buffer = this.eventBuffers.get(gameId);
    if (buffer) {
      this.completedReplays.set(gameId, {
        gameId,
        gameType: 'herbalism',
        events: [...buffer],
        createdAt: new Date().toISOString(),
      });
      this.eventBuffers.delete(gameId);
    }

    console.log(`[HerbalismReplayService] 遊戲結束，回放已儲存: ${gameId}`);
  }

  /**
   * 取得回放資料
   * @param {string} gameId - 遊戲 ID
   * @returns {Object|null}
   */
  getReplay(gameId) {
    return this.completedReplays.get(gameId) || null;
  }

  /**
   * 取得緩衝區事件數量
   * @param {string} gameId - 遊戲 ID
   */
  getEventCount(gameId) {
    const buffer = this.eventBuffers.get(gameId);
    return buffer ? buffer.length : 0;
  }

  /**
   * 清理事件資料（移除敏感資訊）
   * @param {Object} data - 事件資料
   * @returns {Object}
   */
  sanitizeEventData(data) {
    if (!data) return {};

    const sanitized = { ...data };
    delete sanitized.socketId;
    delete sanitized.ip;
    delete sanitized.token;
    delete sanitized.password;

    return sanitized;
  }
}

// 單例匯出
const herbalismReplayService = new HerbalismReplayService();

module.exports = {
  HerbalismReplayService,
  herbalismReplayService,
  HERBALISM_EVENT_TYPES,
};
