/**
 * 發光性狀處理器
 * @module expansions/deep-sea/traits/handlers/BioluminescenceHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 發光性狀處理器
 *
 * 發光生物特性：
 * - 當此生物進食時，自己控制的另一隻生物（若有）從食物池獲得 1 個藍色食物
 */
class BioluminescenceHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]);
  }

  /**
   * 進食時觸發發光效果
   * @param {Object} context
   * @param {Object} context.creature - 進食的生物
   * @param {Object} context.player - 玩家
   * @param {Object} context.gameState - 遊戲狀態
   * @returns {Object} 修改後的 gameState
   */
  onFeed(context) {
    const { creature, player, gameState } = context;

    if (!player || !gameState) {
      return gameState;
    }

    // 找到同一玩家的其他生物
    const ownerPlayer = gameState.players?.find(p => p.id === player.id);
    if (!ownerPlayer) {
      return gameState;
    }

    const otherCreature = ownerPlayer.creatures?.find(
      c => c.id !== creature.id && !this._isFed(c)
    );

    // 如果有其他未吃飽的生物且食物池有食物，給予 1 個藍色食物
    if (otherCreature && gameState.foodPool && gameState.foodPool.blue > 0) {
      gameState.foodPool.blue -= 1;
      otherCreature.food = otherCreature.food || { red: 0, blue: 0, yellow: 0 };
      otherCreature.food.blue = (otherCreature.food.blue || 0) + 1;
    }

    return gameState;
  }

  /**
   * 檢查生物是否吃飽
   * @private
   */
  _isFed(creature) {
    const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
    return currentFood >= (creature.foodNeeded || 1);
  }
}

module.exports = BioluminescenceHandler;
