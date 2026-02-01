/**
 * 穴居性狀處理器
 * @module expansions/base/traits/handlers/defense/BurrowingHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 穴居性狀處理器
 *
 * 穴居生物特性：
 * - 當此生物吃飽時，無法被攻擊
 */
class BurrowingHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.BURROWING]);
  }

  /**
   * 檢查穴居生物是否可被攻擊
   */
  checkDefense(context) {
    const { defender } = context;

    // 檢查是否吃飽
    const currentFood = (defender.food?.red || 0) + (defender.food?.blue || 0);
    const isFed = currentFood >= (defender.foodNeeded || 1);

    if (isFed) {
      return {
        canAttack: false,
        reason: '穴居生物吃飽時無法被攻擊',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = BurrowingHandler;
