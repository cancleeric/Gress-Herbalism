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
 * - 只有擁有水生（aquatic）性狀的肉食生物才能攻擊此生物
 */
class DeepDiveHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]);
  }

  /**
   * 只有水生肉食才能攻擊深潛生物
   * @param {Object} context
   * @param {Object} context.attacker - 攻擊方生物
   * @returns {{ canAttack: boolean, reason: string }}
   */
  checkDefense(context) {
    const { attacker } = context;

    const attackerIsAquatic = attacker.traits?.some(t => t.type === 'aquatic');

    if (!attackerIsAquatic) {
      return {
        canAttack: false,
        reason: '只有水生肉食生物才能攻擊深潛生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = DeepDiveHandler;
