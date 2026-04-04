/**
 * 本草遊戲回放服務
 *
 * 負責記錄和存取本草遊戲回放資料
 */

const { getSupabase, isSupabaseEnabled } = require('../supabaseClient');

/**
 * 本草遊戲事件類型
 */
const HERBALISM_EVENT_TYPES = {
  GAME_START: 'game_start',
  QUESTION: 'question',
  COLOR_CHOICE: 'color_choice',
  PREDICTION: 'prediction',
  GUESS: 'guess',
  FOLLOW_GUESS: 'follow_guess',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
};

/**
 * 本草遊戲回放服務類別
 */
class HerbalismReplayService {
  constructor() {
    // 記憶體中的事件緩衝區（gameId -> events[]）
    this.eventBuffers = new Map();
  }

  /**
   * 檢查 Supabase 服務是否可用
   * @returns {boolean}
   */
  isAvailable() {
    return isSupabaseEnabled();
  }

  /**
   * 開始記錄新遊戲
   * @param {string} gameId - 遊戲 ID
   * @param {Object} initialState - 初始遊戲狀態
   */
  startRecording(gameId, initialState) {
    const players = (initialState.players || []).map(p => ({
      id: p.id,
      name: p.name,
    }));

    this.eventBuffers.set(gameId, [
      {
        type: HERBALISM_EVENT_TYPES.GAME_START,
        timestamp: Date.now(),
        data: {
          players,
          playerCount: players.length,
          round: initialState.currentRound || 1,
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
    });
  }

  /**
   * 記錄問牌事件
   * @param {string} gameId - 遊戲 ID
   * @param {string} askingPlayerId - 問牌玩家 ID
   * @param {string} targetPlayerId - 被問牌玩家 ID
   * @param {Array<string>} colors - 詢問的顏色
   */
  recordQuestion(gameId, askingPlayerId, targetPlayerId, colors) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.QUESTION, {
      askingPlayerId,
      targetPlayerId,
      colors,
    });
  }

  /**
   * 記錄顏色選擇事件（被問牌玩家選擇給哪個顏色）
   * @param {string} gameId - 遊戲 ID
   * @param {string} targetPlayerId - 被問牌玩家 ID
   * @param {string} chosenColor - 選擇的顏色
   * @param {number} cardsTransferred - 轉移的牌數
   */
  recordColorChoice(gameId, targetPlayerId, chosenColor, cardsTransferred) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.COLOR_CHOICE, {
      targetPlayerId,
      chosenColor,
      cardsTransferred,
    });
  }

  /**
   * 記錄預測事件
   * @param {string} gameId - 遊戲 ID
   * @param {string} playerId - 玩家 ID
   * @param {string} color - 預測的顏色
   * @param {number} round - 回合數
   */
  recordPrediction(gameId, playerId, color, round) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.PREDICTION, {
      playerId,
      color,
      round,
    });
  }

  /**
   * 記錄猜牌事件
   * @param {string} gameId - 遊戲 ID
   * @param {string} playerId - 猜牌玩家 ID
   * @param {Array<string>} guessedColors - 猜的顏色
   * @param {boolean} isCorrect - 是否猜對
   */
  recordGuess(gameId, playerId, guessedColors, isCorrect) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.GUESS, {
      playerId,
      guessedColors,
      isCorrect,
    });
  }

  /**
   * 記錄跟猜事件
   * @param {string} gameId - 遊戲 ID
   * @param {string} playerId - 跟猜玩家 ID
   * @param {boolean} isFollowing - 是否跟猜
   */
  recordFollowGuess(gameId, playerId, isFollowing) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.FOLLOW_GUESS, {
      playerId,
      isFollowing,
    });
  }

  /**
   * 記錄局結束事件
   * @param {string} gameId - 遊戲 ID
   * @param {number} round - 回合數
   * @param {Object} scores - 分數
   * @param {Array<string>} hiddenCards - 蓋牌顏色
   */
  recordRoundEnd(gameId, round, scores, hiddenCards) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.ROUND_END, {
      round,
      scores,
      hiddenCards: hiddenCards ? hiddenCards.map(c => c.color) : [],
    });
  }

  /**
   * 結束記錄並儲存
   * @param {string} gameId - 遊戲 ID
   * @param {Object} finalState - 最終遊戲狀態
   * @returns {Promise<boolean>}
   */
  async endRecording(gameId, finalState) {
    const buffer = this.eventBuffers.get(gameId);
    if (!buffer) {
      console.warn(`[HerbalismReplayService] 找不到遊戲緩衝區: ${gameId}`);
      return false;
    }

    buffer.push({
      type: HERBALISM_EVENT_TYPES.GAME_END,
      timestamp: Date.now(),
      data: {
        winner: finalState.winner,
        scores: finalState.scores,
        rounds: finalState.currentRound || 1,
      },
    });

    const success = await this.saveReplay(gameId, buffer);

    this.eventBuffers.delete(gameId);

    return success;
  }

  /**
   * 儲存回放到資料庫
   * @param {string} gameId - 遊戲 ID
   * @param {Array} events - 事件列表
   * @returns {Promise<boolean>}
   */
  async saveReplay(gameId, events) {
    if (!this.isAvailable()) {
      console.warn('[HerbalismReplayService] Supabase 未啟用，跳過儲存');
      return false;
    }

    const supabase = getSupabase();

    try {
      const compressedEvents = this.compressEvents(events);
      const eventsJson = JSON.stringify(compressedEvents);

      const { error } = await supabase.from('herbalism_game_replays').upsert({
        game_id: gameId,
        events: compressedEvents,
        compressed: true,
        size_bytes: eventsJson.length,
      });

      if (error) {
        console.error('[HerbalismReplayService] 儲存回放失敗:', error);
        return false;
      }

      console.log(`[HerbalismReplayService] 回放已儲存: ${gameId} (${eventsJson.length} bytes)`);
      return true;
    } catch (error) {
      console.error('[HerbalismReplayService] 儲存回放異常:', error);
      return false;
    }
  }

  /**
   * 取得回放資料
   * @param {string} gameId - 遊戲 ID
   * @returns {Promise<Object|null>}
   */
  async getReplay(gameId) {
    if (!this.isAvailable()) {
      return null;
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('herbalism_game_replays')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('[HerbalismReplayService] 取得回放失敗:', error);
        }
        return null;
      }

      const events = data.compressed
        ? this.decompressEvents(data.events)
        : data.events;

      return {
        gameId: data.game_id,
        events,
        sizeBytes: data.size_bytes,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error('[HerbalismReplayService] 取得回放異常:', error);
      return null;
    }
  }

  /**
   * 取得玩家的回放列表
   * @param {string} firebaseUid - Firebase UID
   * @param {number} limit - 限制筆數
   * @returns {Promise<Array>}
   */
  async getPlayerReplays(firebaseUid, limit = 20) {
    if (!this.isAvailable()) {
      return [];
    }

    const supabase = getSupabase();

    try {
      const { data, error } = await supabase
        .from('herbalism_game_replays')
        .select('game_id, size_bytes, created_at')
        .contains('player_uids', [firebaseUid])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[HerbalismReplayService] 取得玩家回放列表失敗:', error);
        return [];
      }

      return (data || []).map(row => ({
        gameId: row.game_id,
        sizeBytes: row.size_bytes,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('[HerbalismReplayService] 取得玩家回放列表異常:', error);
      return [];
    }
  }

  /**
   * 壓縮事件（使用相對時間戳）
   * @param {Array} events - 事件列表
   * @returns {Array}
   */
  compressEvents(events) {
    if (!Array.isArray(events)) return [];

    const baseTimestamp = events[0]?.timestamp || Date.now();

    return events.map((event, index) => ({
      t: event.type,
      d: index === 0 ? 0 : event.timestamp - baseTimestamp,
      ...event.data,
    }));
  }

  /**
   * 解壓縮事件
   * @param {Array} compressedEvents - 壓縮的事件列表
   * @returns {Array}
   */
  decompressEvents(compressedEvents) {
    if (!Array.isArray(compressedEvents)) return [];

    const baseTimestamp = Date.now();

    return compressedEvents.map((event) => {
      const { t, d, ...data } = event;
      return {
        type: t,
        timestamp: baseTimestamp + (d || 0),
        data,
      };
    });
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
    delete sanitized.hand;

    return sanitized;
  }

  /**
   * 取得緩衝區中的事件數量
   * @param {string} gameId - 遊戲 ID
   * @returns {number}
   */
  getEventCount(gameId) {
    const buffer = this.eventBuffers.get(gameId);
    return buffer ? buffer.length : 0;
  }

  /**
   * 清除指定遊戲的緩衝區
   * @param {string} gameId - 遊戲 ID
   */
  clearBuffer(gameId) {
    this.eventBuffers.delete(gameId);
  }
}

// 單例匯出
const herbalismReplayService = new HerbalismReplayService();

module.exports = {
  HerbalismReplayService,
  herbalismReplayService,
  HERBALISM_EVENT_TYPES,
};
