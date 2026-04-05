/**
 * 本草遊戲回放服務
 *
 * 負責記錄和存取本草遊戲的完整回放資料
 */

const { getSupabase, isSupabaseEnabled } = require('../supabaseClient');

/**
 * 遊戲事件類型
 */
const HERBALISM_EVENT_TYPES = {
  GAME_START: 'game_start',
  ROUND_START: 'round_start',
  QUESTION: 'question',
  COLOR_CHOICE: 'color_choice',
  END_TURN: 'end_turn',
  PREDICTION: 'prediction',
  GUESS: 'guess',
  FOLLOW_GUESS: 'follow_guess',
  ROUND_RESULT: 'round_result',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
};

/**
 * 本草遊戲回放服務類別
 */
class HerbalismReplayService {
  constructor() {
    // 記憶體中的事件緩衝區（gameId -> { events[], metadata }）
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
    if (this.eventBuffers.has(gameId)) {
      console.warn(`[HerbalismReplay] 覆蓋現有緩衝區: ${gameId}`);
    }

    const playerNames = (initialState.players || []).map(p => ({
      id: p.id,
      name: p.name,
    }));

    this.eventBuffers.set(gameId, {
      startTime: Date.now(),
      events: [
        {
          type: HERBALISM_EVENT_TYPES.GAME_START,
          timestamp: Date.now(),
          data: {
            players: playerNames,
            playerCount: playerNames.length,
            winningScore: initialState.winningScore || 7,
          },
        },
      ],
    });

    console.log(`[HerbalismReplay] 開始記錄遊戲: ${gameId}`);
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

    buffer.events.push({
      type,
      timestamp: Date.now(),
      data: this._sanitize(data),
    });
  }

  /**
   * 記錄新局開始
   */
  recordRoundStart(gameId, round, startPlayerName) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.ROUND_START, {
      round,
      startPlayerName,
    });
  }

  /**
   * 記錄問牌動作
   */
  recordQuestion(gameId, { playerId, playerName, targetPlayerId, targetPlayerName, colors, questionType }) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.QUESTION, {
      playerId,
      playerName,
      targetPlayerId,
      targetPlayerName,
      colors,
      questionType,
    });
  }

  /**
   * 記錄顏色選擇（被問牌玩家回應）
   */
  recordColorChoice(gameId, { playerId, playerName, chosenColor, cardsTransferred }) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.COLOR_CHOICE, {
      playerId,
      playerName,
      chosenColor,
      cardsTransferred,
    });
  }

  /**
   * 記錄回合結束（含預測）
   */
  recordEndTurn(gameId, { playerId, playerName, prediction }) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.END_TURN, {
      playerId,
      playerName,
      prediction: prediction || null,
    });
  }

  /**
   * 記錄猜牌動作
   */
  recordGuess(gameId, { playerId, playerName, guessedColors }) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.GUESS, {
      playerId,
      playerName,
      guessedColors,
    });
  }

  /**
   * 記錄跟猜決策
   */
  recordFollowGuess(gameId, { playerId, playerName, isFollowing }) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.FOLLOW_GUESS, {
      playerId,
      playerName,
      isFollowing,
    });
  }

  /**
   * 記錄猜牌結果（局結果）
   */
  recordRoundResult(gameId, {
    guessingPlayerId,
    guessingPlayerName,
    guessedColors,
    hiddenColors,
    isCorrect,
    followingPlayers,
    scoreChanges,
    scores,
  }) {
    this.recordEvent(gameId, HERBALISM_EVENT_TYPES.ROUND_RESULT, {
      guessingPlayerId,
      guessingPlayerName,
      guessedColors,
      hiddenColors,
      isCorrect,
      followingPlayers,
      scoreChanges,
      scores,
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
      return false;
    }

    // 找出勝利者名稱
    const winnerPlayer = (finalState.players || []).find(p => p.id === finalState.winner);

    // 記錄遊戲結束
    buffer.events.push({
      type: HERBALISM_EVENT_TYPES.GAME_END,
      timestamp: Date.now(),
      data: {
        winner: finalState.winner,
        winnerName: winnerPlayer ? winnerPlayer.name : null,
        scores: finalState.scores || {},
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
   * @param {Object} buffer - { startTime, events[] }
   * @returns {Promise<boolean>}
   */
  async saveReplay(gameId, buffer) {
    if (!this.isAvailable()) {
      console.warn('[HerbalismReplay] Supabase 未啟用，跳過儲存');
      return false;
    }

    const supabase = getSupabase();

    try {
      const compressed = this._compressEvents(buffer.events);
      const eventsJson = JSON.stringify(compressed);

      // Extract player names from game_start event for easy querying
      const startEvent = buffer.events.find(e => e.type === HERBALISM_EVENT_TYPES.GAME_START);
      const playerNames = startEvent ? startEvent.data.players.map(p => p.name) : [];

      // Extract winner from game_end event
      const endEvent = buffer.events.find(e => e.type === HERBALISM_EVENT_TYPES.GAME_END);
      const winnerName = endEvent ? endEvent.data.winnerName : null;
      const rounds = endEvent ? endEvent.data.rounds : null;

      const { error } = await supabase.from('herbalism_game_replays').upsert({
        game_id: gameId,
        events: compressed,
        player_names: playerNames,
        winner_name: winnerName,
        rounds_played: rounds,
        size_bytes: eventsJson.length,
        duration_ms: Date.now() - (buffer.startTime || Date.now()),
      });

      if (error) {
        console.error('[HerbalismReplay] 儲存回放失敗:', error);
        return false;
      }

      console.log(`[HerbalismReplay] 回放已儲存: ${gameId} (${eventsJson.length} bytes)`);
      return true;
    } catch (err) {
      console.error('[HerbalismReplay] 儲存回放異常:', err);
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
          console.error('[HerbalismReplay] 取得回放失敗:', error);
        }
        return null;
      }

      const events = this._decompressEvents(data.events);

      return {
        gameId: data.game_id,
        events,
        playerNames: data.player_names,
        winnerName: data.winner_name,
        roundsPlayed: data.rounds_played,
        sizeBytes: data.size_bytes,
        durationMs: data.duration_ms,
        createdAt: data.created_at,
      };
    } catch (err) {
      console.error('[HerbalismReplay] 取得回放異常:', err);
      return null;
    }
  }

  /**
   * 列出最近的回放
   * @param {Object} options - { limit, playerName }
   * @returns {Promise<Array>}
   */
  async listReplays({ limit = 20, playerName = null } = {}) {
    if (!this.isAvailable()) {
      return [];
    }

    const supabase = getSupabase();

    try {
      let query = supabase
        .from('herbalism_game_replays')
        .select('game_id, player_names, winner_name, rounds_played, duration_ms, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (playerName) {
        query = query.contains('player_names', [playerName]);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[HerbalismReplay] 列出回放失敗:', error);
        return [];
      }

      return (data || []).map(row => ({
        gameId: row.game_id,
        playerNames: row.player_names,
        winnerName: row.winner_name,
        roundsPlayed: row.rounds_played,
        durationMs: row.duration_ms,
        createdAt: row.created_at,
      }));
    } catch (err) {
      console.error('[HerbalismReplay] 列出回放異常:', err);
      return [];
    }
  }

  /**
   * 壓縮事件（縮短欄位名稱並使用相對時間戳）
   * @param {Array} events
   * @returns {Array}
   */
  _compressEvents(events) {
    if (!Array.isArray(events) || events.length === 0) return [];

    const baseTs = events[0].timestamp || Date.now();

    return events.map((event, index) => ({
      t: event.type,
      d: index === 0 ? 0 : (event.timestamp || baseTs) - baseTs,
      ...event.data,
    }));
  }

  /**
   * 解壓縮事件
   * @param {Array} compressed
   * @returns {Array}
   */
  _decompressEvents(compressed) {
    if (!Array.isArray(compressed) || compressed.length === 0) return [];

    const baseTs = Date.now();

    return compressed.map(event => {
      const { t, d, ...data } = event;
      return {
        type: t,
        timestamp: baseTs + (d || 0),
        data,
      };
    });
  }

  /**
   * 清理事件資料（移除敏感欄位）
   * @param {Object} data
   * @returns {Object}
   */
  _sanitize(data) {
    if (!data) return {};
    const sanitized = { ...data };
    delete sanitized.socketId;
    delete sanitized.ip;
    delete sanitized.token;
    delete sanitized.hand; // 不記錄玩家手牌，避免洩漏
    return sanitized;
  }

  /**
   * 取得緩衝區中的事件數量
   * @param {string} gameId
   * @returns {number}
   */
  getEventCount(gameId) {
    const buffer = this.eventBuffers.get(gameId);
    return buffer ? buffer.events.length : 0;
  }

  /**
   * 清除指定遊戲的緩衝區
   * @param {string} gameId
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
