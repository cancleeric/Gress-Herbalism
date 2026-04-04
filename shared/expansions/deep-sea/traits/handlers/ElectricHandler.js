/**
 * 電擊性狀處理器
 * @module expansions/deep-sea/traits/handlers/ElectricHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 電擊性狀處理器
 *
 * 電擊生物特性：
 * - 被肉食攻擊時，攻擊者失去 1 個藍色食物（攻擊仍然進行）
 */
class ElectricHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ELECTRIC]);
  }

  /**
   * 攻擊此生物時，攻擊者觸發電擊效果
   * 攻擊可以繼續，但需通知攻擊方失去食物
   * @param {Object} context
   * @returns {{ canAttack: boolean, reason: string, electricEffect: boolean }}
   */
  checkDefense(context) {
    return {
      canAttack: true,
      reason: '',
      electricEffect: true,
    };
  }

  /**
   * 生物被攻擊時觸發電擊效果（由規則引擎讀取 electricEffect 標記執行）
   * @param {Object} context
   * @param {Object} context.attacker - 攻擊方生物
   * @param {Object} context.gameState - 遊戲狀態
   * @returns {Object} 修改後的 gameState
   */
  onExtinct(context, attacker) {
    // 即使生物滅絕，電擊效果也應已在攻擊階段觸發
    return context.gameState;
  }

  /**
   * 電擊效果：讓攻擊者失去 1 個藍色食物
   * 由規則引擎呼叫此靜態方法執行實際效果
   * @param {Object} attacker - 攻擊方生物
   */
  static applyElectricEffect(attacker) {
    if (attacker && attacker.food && attacker.food.blue > 0) {
      attacker.food.blue -= 1;
      return true;
    }
    return false;
  }
}

module.exports = ElectricHandler;
