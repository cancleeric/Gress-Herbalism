/**
 * 巨化性狀處理器
 * @module expansions/base/traits/handlers/defense/MassiveHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 巨化性狀處理器
 *
 * 巨化生物特性：
 * - 食量 +1
 * - 只有巨化肉食可攻擊巨化生物
 * - 巨化可以攻擊非巨化（與水生不同）
 */
class MassiveHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.MASSIVE]);
  }

  /**
   * 檢查巨化生物是否可被攻擊
   */
  checkDefense(context) {
    const { attacker } = context;

    const attackerIsMassive = attacker.traits?.some(t => t.type === TRAIT_TYPES.MASSIVE);

    if (!attackerIsMassive) {
      return {
        canAttack: false,
        reason: '只有巨化生物才能攻擊巨化生物',
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = MassiveHandler;
