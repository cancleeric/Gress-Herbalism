/**
 * 深潛性狀處理器
 * @module expansions/deep-sea/traits/handlers/DeepDiveHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 深潛性狀處理器
 *
 * 深潛生物特性：
 * - 潛入深海，只有擁有電感的肉食才能攻擊
 */
class DeepDiveHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]);
  }

  /**
   * 檢查攻擊者是否能攻擊有深潛的生物
   */
  checkDefense(context) {
    const { attacker } = context;

    const hasElectroreception = attacker.traits?.some(
      t => t.type === DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION
    );

    if (!hasElectroreception) {
      return {
        canAttack: false,
        reason: '需要電感才能攻擊有深潛的生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = DeepDiveHandler;
