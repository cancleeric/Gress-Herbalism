/**
 * 水生性狀處理器
 * @module expansions/base/traits/handlers/defense/AquaticHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 水生性狀處理器
 *
 * 水生生物特性：
 * - 只有水生肉食可攻擊水生生物
 * - 水生肉食也只能攻擊水生生物
 */
class AquaticHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.AQUATIC]);
  }

  /**
   * 水生只能被水生攻擊
   */
  checkDefense(context) {
    const { attacker } = context;

    const attackerIsAquatic = attacker.traits?.some(t => t.type === TRAIT_TYPES.AQUATIC);

    // 水生只能被水生攻擊
    if (!attackerIsAquatic) {
      return {
        canAttack: false,
        reason: '只有水生生物才能攻擊水生生物',
      };
    }

    return { canAttack: true, reason: '' };
  }

  /**
   * 水生生物作為攻擊者時的額外檢查
   * 水生肉食不能攻擊非水生生物
   *
   * @static
   */
  static checkAttackerConstraint(attacker, defender) {
    const attackerIsAquatic = attacker.traits?.some(t => t.type === TRAIT_TYPES.AQUATIC);
    const defenderIsAquatic = defender.traits?.some(t => t.type === TRAIT_TYPES.AQUATIC);

    if (attackerIsAquatic && !defenderIsAquatic) {
      return {
        canAttack: false,
        reason: '水生肉食不能攻擊非水生生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = AquaticHandler;
