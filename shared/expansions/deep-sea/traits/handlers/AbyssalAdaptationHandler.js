/**
 * 深淵適應性狀處理器
 * @module expansions/deep-sea/traits/handlers/AbyssalAdaptationHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 深淵適應性狀處理器
 *
 * 深淵適應生物特性：
 * - 此生物的食量需求減少 1（最低 1）
 * - 可疊加，每張減少 1 點食量需求
 */
class AbyssalAdaptationHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION]);
  }

  /**
   * 放置深淵適應時，減少生物的食量需求
   * @param {Object} context
   * @param {Object} context.creature - 目標生物
   * @param {Object} context.gameState - 遊戲狀態
   * @returns {Object} 修改後的 gameState
   */
  onPlace(context) {
    const { creature, gameState } = context;

    if (creature) {
      // 確保 foodNeeded 初始化
      creature.foodNeeded = creature.foodNeeded !== undefined ? creature.foodNeeded : 1;
      // 減少食量需求，最低為 1
      creature.foodNeeded = Math.max(1, creature.foodNeeded - 1);
    }

    return gameState;
  }

  /**
   * 移除深淵適應時，恢復生物的食量需求
   * @param {Object} context
   * @param {Object} context.creature - 目標生物
   * @param {Object} context.gameState - 遊戲狀態
   * @returns {Object} 修改後的 gameState
   */
  onRemove(context) {
    const { creature, gameState } = context;

    if (creature) {
      creature.foodNeeded = creature.foodNeeded !== undefined ? creature.foodNeeded : 1;
      // 恢復 1 點食量需求
      creature.foodNeeded = creature.foodNeeded + 1;
    }

    return gameState;
  }

  /**
   * 深淵適應的計分加成（負值代表食量減少，但計分不減少）
   * @returns {number} 0（不影響計分）
   */
  getScoreBonus() {
    return 0;
  }
}

module.exports = AbyssalAdaptationHandler;
