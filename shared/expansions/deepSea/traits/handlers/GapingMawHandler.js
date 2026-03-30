/**
 * 巨口性狀處理器
 * @module expansions/deepSea/traits/handlers/GapingMawHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 巨口性狀處理器
 *
 * 巨口特性：
 * - 此性狀賦予肉食生物攻擊巨化（massive）生物的能力
 * - 無需攻擊者自身擁有巨化性狀
 * - 需配合肉食性狀才能發動攻擊
 */
class GapingMawHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GAPING_MAW]);
  }

  /**
   * 巨口不提供主動攻擊能力（由肉食驅動），
   * 但讓攻擊者繞過目標的巨化防禦。
   * 此方法供規則引擎查詢攻擊者是否具備巨口。
   */
  canBypassMassiveDefense() {
    return true;
  }
}

module.exports = GapingMawHandler;
