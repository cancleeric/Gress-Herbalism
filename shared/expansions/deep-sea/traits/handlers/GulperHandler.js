/**
 * 巨口性狀處理器
 * @module expansions/deep-sea/traits/handlers/GulperHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');
const { TRAIT_TYPES } = require('../../../base/traits/definitions');

/**
 * 巨口性狀處理器
 *
 * 巨口生物特性：
 * - 食量 +1
 * - 攻擊時忽略目標的斷尾防禦效果
 */
class GulperHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GULPER]);
  }

  /**
   * 巨口不能從食物池進食（需要配合肉食使用）
   * 注意：巨口本身不是肉食，不限制進食；食量+1 由 foodBonus 提供
   * 巨口的特殊效果在攻擊時體現（忽略斷尾），這由規則引擎處理
   */

  /**
   * 標記此攻擊者擁有巨口，以供規則引擎判斷忽略斷尾
   * 由規則引擎在攻擊流程中查詢
   */
  static hasGulper(attacker) {
    return attacker.traits?.some(t => t.type === DEEP_SEA_TRAIT_TYPES.GULPER);
  }
}

module.exports = GulperHandler;
