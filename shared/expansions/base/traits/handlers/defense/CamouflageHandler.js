/**
 * 偽裝性狀處理器
 * @module expansions/base/traits/handlers/defense/CamouflageHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 偽裝性狀處理器
 *
 * 偽裝生物特性：
 * - 肉食生物必須擁有銳目性狀才能攻擊此生物
 */
class CamouflageHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.CAMOUFLAGE]);
  }

  /**
   * 檢查攻擊者是否能攻擊有偽裝的生物
   */
  checkDefense(context) {
    const { attacker } = context;

    // 檢查攻擊者是否有銳目
    const hasSharpVision = attacker.traits?.some(t => t.type === TRAIT_TYPES.SHARP_VISION);

    if (!hasSharpVision) {
      return {
        canAttack: false,
        reason: '需要銳目才能攻擊有偽裝的生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = CamouflageHandler;
