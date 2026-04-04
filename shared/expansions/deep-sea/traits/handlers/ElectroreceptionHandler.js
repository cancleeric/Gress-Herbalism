/**
 * 電感性狀處理器
 * @module expansions/deep-sea/traits/handlers/ElectroreceptionHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 電感性狀處理器
 *
 * 電感生物特性：
 * - 可攻擊擁有深潛的生物
 * （被動性狀；DeepDiveHandler.checkDefense 已處理邏輯）
 */
class ElectroreceptionHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]);
  }
}

module.exports = ElectroreceptionHandler;
