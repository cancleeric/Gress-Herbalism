/**
 * 電感知性狀處理器
 * @module expansions/deepSea/traits/handlers/ElectroreceptionHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 電感知性狀處理器
 *
 * 電感知特性：
 * - 此性狀賦予肉食生物偵測穴居（burrowing）生物的能力
 * - 即使穴居生物已吃飽，也可被此肉食生物攻擊
 * - 需配合肉食性狀才能發動攻擊
 */
class ElectroreceptionHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]);
  }

  /**
   * 電感知不提供主動攻擊能力（由肉食驅動），
   * 但讓攻擊者繞過目標的穴居飽食防禦。
   * 此方法供規則引擎查詢攻擊者是否具備電感知。
   */
  canBypassBurrowingDefense() {
    return true;
  }
}

module.exports = ElectroreceptionHandler;
