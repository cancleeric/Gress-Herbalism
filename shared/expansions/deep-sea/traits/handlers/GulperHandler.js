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
 * - 攻擊時忽略目標的斷尾防禦效果（由規則引擎在攻擊流程中調用 hasGulper 檢查）
 */
class GulperHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GULPER]);
  }

  /**
   * 檢查攻擊者是否擁有巨口性狀
   * 供規則引擎在攻擊流程中判斷是否忽略斷尾
   *
   * @param {Object} attacker - 攻擊者生物
   * @returns {boolean}
   */
  static hasGulper(attacker) {
    return attacker.traits?.some(t => t.type === DEEP_SEA_TRAIT_TYPES.GULPER) || false;
  }
}

module.exports = GulperHandler;
