/**
 * 壓抗性狀處理器
 * @module expansions/deep-sea/traits/handlers/PressureResistanceHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');
const { TRAIT_TYPES } = require('../../../base/traits/definitions');

/**
 * 壓抗性狀處理器
 *
 * 壓抗生物特性：
 * - 對巨化肉食免疫（巨化肉食無法攻擊此生物）
 */
class PressureResistanceHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.PRESSURE_RESISTANCE]);
  }

  /**
   * 壓抗：巨化肉食無法攻擊此生物
   */
  checkDefense(context) {
    const { attacker } = context;

    const attackerIsMassive = attacker.traits?.some(t => t.type === TRAIT_TYPES.MASSIVE);
    const attackerIsCarnivore = attacker.traits?.some(t => t.type === TRAIT_TYPES.CARNIVORE);

    if (attackerIsMassive && attackerIsCarnivore) {
      return {
        canAttack: false,
        reason: '此生物具有壓抗，巨化肉食無法攻擊',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = PressureResistanceHandler;
