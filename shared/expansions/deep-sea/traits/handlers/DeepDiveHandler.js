/**
 * 深潛性狀處理器
 * @module expansions/deep-sea/traits/handlers/DeepDiveHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 深潛性狀處理器
 *
 * 深潛生物特性：
 * - 每回合可使用一次，使此生物本回合無法被攻擊
 * - 下回合開始時自動浮出（解除保護）
 */
class DeepDiveHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]);
  }

  /**
   * 深潛生物正在深潛時無法被攻擊
   */
  checkDefense(context) {
    const { defender } = context;

    if (defender.isDeepDiving) {
      return {
        canAttack: false,
        reason: '此生物正在深潛，無法被攻擊',
      };
    }

    return { canAttack: true, reason: '' };
  }

  /**
   * 可以使用深潛能力
   */
  canUseAbility(context) {
    const { creature } = context;

    if (creature.hasUsedDeepDiveThisTurn) {
      return { canUse: false, reason: '本回合已使用深潛' };
    }

    if (creature.isDeepDiving) {
      return { canUse: false, reason: '已在深潛狀態' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 使用深潛，將生物標記為深潛狀態
   */
  useAbility(context) {
    const { creature, gameState } = context;

    creature.isDeepDiving = true;
    creature.hasUsedDeepDiveThisTurn = true;

    return {
      success: true,
      gameState,
      message: `${creature.name || '生物'} 潛入深海，本回合無法被攻擊`,
    };
  }

  /**
   * 回合開始時解除深潛狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;

    if (creature) {
      creature.isDeepDiving = false;
      creature.hasUsedDeepDiveThisTurn = false;
    }

    return gameState;
  }
}

module.exports = DeepDiveHandler;
