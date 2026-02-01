/**
 * 遊戲事件定義
 *
 * @module expansions/core/gameEvents
 */

/**
 * 遊戲事件類型
 * @readonly
 * @enum {string}
 */
const GAME_EVENTS = {
  // === 遊戲生命週期 ===
  GAME_CREATED: 'game:created',
  GAME_STARTED: 'game:started',
  GAME_ENDED: 'game:ended',
  GAME_PAUSED: 'game:paused',
  GAME_RESUMED: 'game:resumed',

  // === 回合與階段 ===
  ROUND_START: 'round:start',
  ROUND_END: 'round:end',
  PHASE_ENTER: 'phase:enter',
  PHASE_EXIT: 'phase:exit',
  TURN_START: 'turn:start',
  TURN_END: 'turn:end',

  // === 玩家行動 ===
  PLAYER_ACTION: 'player:action',
  PLAYER_PASS: 'player:pass',
  PLAYER_TIMEOUT: 'player:timeout',
  PLAYER_RECONNECT: 'player:reconnect',
  PLAYER_DISCONNECT: 'player:disconnect',

  // === 卡牌操作 ===
  CARD_DRAWN: 'card:drawn',
  CARD_PLAYED: 'card:played',
  CARD_DISCARDED: 'card:discarded',
  DECK_SHUFFLED: 'deck:shuffled',
  DECK_EMPTY: 'deck:empty',

  // === 生物相關 ===
  CREATURE_CREATED: 'creature:created',
  CREATURE_DIED: 'creature:died',
  CREATURE_FED: 'creature:fed',
  CREATURE_HUNGRY: 'creature:hungry',
  CREATURE_SATISFIED: 'creature:satisfied',

  // === 性狀相關 ===
  TRAIT_ADDED: 'trait:added',
  TRAIT_REMOVED: 'trait:removed',
  TRAIT_ACTIVATED: 'trait:activated',
  TRAIT_DEACTIVATED: 'trait:deactivated',

  // === 進食相關 ===
  FOOD_POOL_SET: 'food:pool_set',
  FOOD_TAKEN: 'food:taken',
  FOOD_EXHAUSTED: 'food:exhausted',
  FAT_STORED: 'fat:stored',
  FAT_CONSUMED: 'fat:consumed',

  // === 攻擊相關 ===
  ATTACK_DECLARED: 'attack:declared',
  ATTACK_RESOLVED: 'attack:resolved',
  ATTACK_BLOCKED: 'attack:blocked',
  ATTACK_SUCCEEDED: 'attack:succeeded',
  ATTACK_FAILED: 'attack:failed',

  // === 互動性狀 ===
  LINK_CREATED: 'link:created',
  LINK_BROKEN: 'link:broken',
  FOOD_SHARED: 'food:shared',

  // === 滅絕 ===
  EXTINCTION_START: 'extinction:start',
  EXTINCTION_END: 'extinction:end',

  // === 計分 ===
  SCORE_UPDATED: 'score:updated',
  WINNER_DETERMINED: 'winner:determined',
};

/**
 * 事件資料工廠
 */
const EventData = {
  /**
   * 基礎事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {number} timestamp - 時間戳
   * @returns {Object}
   */
  base: (gameId, timestamp = Date.now()) => ({
    gameId,
    timestamp,
  }),

  /**
   * 階段事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {string} phase - 階段
   * @param {number} round - 回合
   * @returns {Object}
   */
  phase: (gameId, phase, round) => ({
    ...EventData.base(gameId),
    phase,
    round,
  }),

  /**
   * 玩家事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {string} playerId - 玩家 ID
   * @param {string} action - 行動
   * @param {Object} data - 額外資料
   * @returns {Object}
   */
  player: (gameId, playerId, action, data = {}) => ({
    ...EventData.base(gameId),
    playerId,
    action,
    ...data,
  }),

  /**
   * 生物事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {string} creatureId - 生物 ID
   * @param {string} ownerId - 擁有者 ID
   * @param {Object} data - 額外資料
   * @returns {Object}
   */
  creature: (gameId, creatureId, ownerId, data = {}) => ({
    ...EventData.base(gameId),
    creatureId,
    ownerId,
    ...data,
  }),

  /**
   * 攻擊事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {string} attackerId - 攻擊者玩家 ID
   * @param {string} attackerCreatureId - 攻擊者生物 ID
   * @param {string} defenderId - 防禦者玩家 ID
   * @param {string} defenderCreatureId - 防禦者生物 ID
   * @returns {Object}
   */
  attack: (gameId, attackerId, attackerCreatureId, defenderId, defenderCreatureId) => ({
    ...EventData.base(gameId),
    attackerId,
    attackerCreatureId,
    defenderId,
    defenderCreatureId,
  }),

  /**
   * 卡牌事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {string} playerId - 玩家 ID
   * @param {string} cardId - 卡牌 ID
   * @param {Object} data - 額外資料
   * @returns {Object}
   */
  card: (gameId, playerId, cardId, data = {}) => ({
    ...EventData.base(gameId),
    playerId,
    cardId,
    ...data,
  }),

  /**
   * 性狀事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {string} creatureId - 生物 ID
   * @param {string} traitType - 性狀類型
   * @param {Object} data - 額外資料
   * @returns {Object}
   */
  trait: (gameId, creatureId, traitType, data = {}) => ({
    ...EventData.base(gameId),
    creatureId,
    traitType,
    ...data,
  }),

  /**
   * 連結事件資料
   * @param {string} gameId - 遊戲 ID
   * @param {string} creature1Id - 生物 1 ID
   * @param {string} creature2Id - 生物 2 ID
   * @param {string} linkType - 連結類型
   * @returns {Object}
   */
  link: (gameId, creature1Id, creature2Id, linkType) => ({
    ...EventData.base(gameId),
    creature1Id,
    creature2Id,
    linkType,
  }),
};

module.exports = {
  GAME_EVENTS,
  EventData,
};
