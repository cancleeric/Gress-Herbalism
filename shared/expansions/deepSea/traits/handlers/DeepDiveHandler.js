/**
 * 深潛性狀處理器
 * @module expansions/deepSea/traits/handlers/DeepDiveHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 深潛性狀處理器
 *
 * 深潛生物特性：
 * - 攻擊者必須同時擁有水生（aquatic）和肉食（carnivore）才能攻擊此生物
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
    const traits = attacker.traits || [];

    const hasAquatic = traits.some(t => t.type === 'aquatic');
    const hasCarnivore = traits.some(t => t.type === 'carnivore');

    if (!hasAquatic || !hasCarnivore) {
      return {
        canAttack: false,
        reason: '需要同時擁有水生和肉食才能攻擊有深潛的生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = DeepDiveHandler;
