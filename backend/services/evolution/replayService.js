/**
 * 遊戲回放服務
 *
 * 負責記錄和存取遊戲回放資料
 */

const { getSupabase, isSupabaseEnabled } = require('../supabaseClient');

/**
 * 遊戲事件類型
 */
const EVENT_TYPES = {
  GAME_START: 'game_start',
  PHASE_CHANGE: 'phase_change',
  CARD_PLAY: 'card_play',
  CREATE_CREATURE: 'create_creature',
  ADD_TRAIT: 'add_trait',
  FOOD_REVEAL: 'food_reveal',
  FEEDING: 'feeding',
  ATTACK: 'attack',
  DEFENSE: 'defense',
  EXTINCTION: 'extinction',
  GAME_END: 'game_end',
};

/**
 * 遊戲回放服務類別
 */
class ReplayService {
  constructor() {
    // 記憶體中的事件緩衝區（gameId -> events[]）
    this.eventBuffers = new Map();
  }

  /**
   * 檢查服務是否可用
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
    this.eventBuffers.set(gameId, [
      {
        type: EVENT_TYPES.GAME_START,
        timestamp: Date.now(),
        data: {
          config: initialState.config,
          turnOrder: initialState.turnOrder,
          playerCount: initialState.turnOrder?.length || 0,
        },
      },
    ]);

    console.log(`[ReplayService] 開始記錄遊戲: ${gameId}`);
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
      console.warn(`[ReplayService] 找不到遊戲緩衝區: ${gameId}`);
      return;
    }

    buffer.push({
      type,
      timestamp: Date.now(),
      data: this.sanitizeEventData(data),
    });
  }

  /**
   * 記錄階段變更
   */
  recordPhaseChange(gameId, phase, round) {
    this.recordEvent(gameId, EVENT_TYPES.PHASE_CHANGE, { phase, round });
  }

  /**
   * 記錄創造生物
   */
  recordCreateCreature(gameId, playerId, creatureId, cardId) {
    this.recordEvent(gameId, EVENT_TYPES.CREATE_CREATURE, {
      playerId,
      creatureId,
      cardId,
    });
  }

  /**
   * 記錄添加性狀
   */
  recordAddTrait(gameId, playerId, creatureId, traitType, cardId, targetCreatureId = null) {
    this.recordEvent(gameId, EVENT_TYPES.ADD_TRAIT, {
      playerId,
      creatureId,
      traitType,
      cardId,
      targetCreatureId,
    });
  }

  /**
   * 記錄食物揭示
   */
  recordFoodReveal(gameId, foodAmount) {
    this.recordEvent(gameId, EVENT_TYPES.FOOD_REVEAL, { foodAmount });
  }

  /**
   * 記錄進食
   */
  recordFeeding(gameId, playerId, creatureId, foodType) {
    this.recordEvent(gameId, EVENT_TYPES.FEEDING, {
      playerId,
      creatureId,
      foodType,
    });
  }

  /**
   * 記錄攻擊
   */
  recordAttack(gameId, attackerId, attackerCreatureId, targetId, targetCreatureId, success) {
    this.recordEvent(gameId, EVENT_TYPES.ATTACK, {
      attackerId,
      attackerCreatureId,
      targetId,
      targetCreatureId,
      success,
    });
  }

  /**
   * 記錄防禦
   */
  recordDefense(gameId, defenderId, creatureId, traitUsed, success) {
    this.recordEvent(gameId, EVENT_TYPES.DEFENSE, {
      defenderId,
      creatureId,
      traitUsed,
      success,
    });
  }

  /**
   * 記錄滅絕
   */
  recordExtinction(gameId, playerId, creatureId, reason) {
    this.recordEvent(gameId, EVENT_TYPES.EXTINCTION, {
      playerId,
      creatureId,
      reason,
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
      console.warn(`[ReplayService] 找不到遊戲緩衝區: ${gameId}`);
      return false;
    }

    // 記錄遊戲結束事件
    buffer.push({
      type: EVENT_TYPES.GAME_END,
      timestamp: Date.now(),
      data: {
        winner: finalState.winner,
        scores: finalState.scores,
        rounds: finalState.round,
      },
    });

    // 儲存到資料庫
    const success = await this.saveReplay(gameId, buffer);

    // 清除緩衝區
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
      console.warn('[ReplayService] Supabase 未啟用，跳過儲存');
      return false;
    }

    const supabase = getSupabase();

    try {
      // 壓縮事件資料
      const compressedEvents = this.compressEvents(events);
      const eventsJson = JSON.stringify(compressedEvents);

      const { error } = await supabase.from('evolution_game_replays').upsert({
        game_id: gameId,
        events: compressedEvents,
        compressed: true,
        size_bytes: eventsJson.length,
      });

      if (error) {
        console.error('[ReplayService] 儲存回放失敗:', error);
        return false;
      }

      console.log(`[ReplayService] 回放已儲存: ${gameId} (${eventsJson.length} bytes)`);
      return true;
    } catch (error) {
      console.error('[ReplayService] 儲存回放異常:', error);
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
        .from('evolution_game_replays')
        .select('*')
        .eq('game_id', gameId)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') {
          console.error('[ReplayService] 取得回放失敗:', error);
        }
        return null;
      }

      // 解壓縮事件
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
      console.error('[ReplayService] 取得回放異常:', error);
      return null;
    }
  }

  /**
   * 壓縮事件（移除冗餘資料）
   * @param {Array} events - 事件列表
   * @returns {Array}
   */
  compressEvents(events) {
    if (!Array.isArray(events)) return [];

    let baseTimestamp = events[0]?.timestamp || Date.now();

    return events.map((event, index) => ({
      t: event.type,
      // 使用相對時間戳（毫秒差）
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

    const baseTimestamp = Date.now(); // 回放時使用當前時間為基準

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

    // 建立資料副本
    const sanitized = { ...data };

    // 移除可能的敏感欄位
    delete sanitized.socketId;
    delete sanitized.ip;
    delete sanitized.token;

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
const replayService = new ReplayService();

module.exports = {
  ReplayService,
  replayService,
  EVENT_TYPES,
};
