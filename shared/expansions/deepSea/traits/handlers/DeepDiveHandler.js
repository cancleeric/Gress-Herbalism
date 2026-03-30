/**
 * 深潛性狀處理器
 * @module expansions/deepSea/traits/handlers/DeepDiveHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 深潛性狀處理器
 *
 * 深潛生物特性：
 * - 只有擁有水生（aquatic）性狀的肉食生物才能攻擊
 * - 非水生肉食無法追入深海
 */
class DeepDiveHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]);
  }

  /**
   * 深潛防禦：只有水生肉食才能攻擊
   */
  checkDefense(context) {
    const { attacker } = context;

    const attackerIsAquatic = attacker.traits?.some(t => t.type === 'aquatic');

    if (!attackerIsAquatic) {
      return {
        canAttack: false,
        reason: '深潛生物只有水生肉食才能攻擊',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = DeepDiveHandler;
