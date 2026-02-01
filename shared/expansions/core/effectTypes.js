/**
 * 效果類型定義
 *
 * @module expansions/core/effectTypes
 */

/**
 * 效果觸發時機
 * @readonly
 * @enum {string}
 */
const EFFECT_TIMING = {
  // 階段相關
  PHASE_START: 'phase_start',
  PHASE_END: 'phase_end',

  // 進食相關
  BEFORE_FEED: 'before_feed',
  ON_FEED: 'on_feed',
  AFTER_FEED: 'after_feed',

  // 攻擊相關
  BEFORE_ATTACK: 'before_attack',
  ON_ATTACK: 'on_attack',
  ATTACK_BLOCKED: 'attack_blocked',
  AFTER_ATTACK: 'after_attack',

  // 被攻擊相關
  BEFORE_DEFEND: 'before_defend',
  ON_DEFEND: 'on_defend',
  AFTER_DEFEND: 'after_defend',

  // 生物狀態
  ON_CREATURE_CREATE: 'on_creature_create',
  ON_CREATURE_DEATH: 'on_creature_death',
  ON_TRAIT_ADD: 'on_trait_add',
  ON_TRAIT_REMOVE: 'on_trait_remove',

  // 回合相關
  TURN_START: 'turn_start',
  TURN_END: 'turn_end',
  ROUND_START: 'round_start',
  ROUND_END: 'round_end',
};

/**
 * 效果類型
 * @readonly
 * @enum {string}
 */
const EFFECT_TYPE = {
  // 進食效果
  GAIN_FOOD: 'gain_food',
  LOSE_FOOD: 'lose_food',
  TRANSFER_FOOD: 'transfer_food',

  // 脂肪效果
  STORE_FAT: 'store_fat',
  USE_FAT: 'use_fat',

  // 攻擊效果
  DEAL_DAMAGE: 'deal_damage',
  BLOCK_ATTACK: 'block_attack',
  REDIRECT_ATTACK: 'redirect_attack',

  // 生物效果
  CREATE_CREATURE: 'create_creature',
  DESTROY_CREATURE: 'destroy_creature',

  // 性狀效果
  ADD_TRAIT: 'add_trait',
  REMOVE_TRAIT: 'remove_trait',
  DISABLE_TRAIT: 'disable_trait',

  // 特殊效果
  SKIP_PHASE: 'skip_phase',
  DRAW_CARD: 'draw_card',
  DISCARD_CARD: 'discard_card',
  APPLY_POISON: 'apply_poison',
};

/**
 * 效果優先級（數字越大越先執行）
 * @readonly
 * @enum {number}
 */
const EFFECT_PRIORITY = {
  INSTANT: 100,    // 即時效果（如：毒液致死）
  HIGH: 80,        // 高優先級（如：斷尾）
  NORMAL: 50,      // 一般優先級
  LOW: 20,         // 低優先級
  DELAYED: 0,      // 延遲效果（階段結束時）
};

/**
 * 效果結果
 * @readonly
 * @enum {string}
 */
const EFFECT_RESULT = {
  SUCCESS: 'success',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  REDIRECTED: 'redirected',
  CANCELLED: 'cancelled',
  PARTIAL: 'partial',
};

module.exports = {
  EFFECT_TIMING,
  EFFECT_TYPE,
  EFFECT_PRIORITY,
  EFFECT_RESULT,
};
