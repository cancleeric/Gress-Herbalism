/**
 * 群游性狀處理器
 * @module expansions/deep-sea/traits/handlers/SchoolingHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 群游性狀處理器
 *
 * 群游生物特性：
 * - 互動性狀，連結兩隻生物
 * - 每當其中一隻獲得食物時，另一隻本回合獲得一次免疫攻擊保護
 */
class SchoolingHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.SCHOOLING]);
  }

  /**
   * 群游保護：若生物擁有群游保護，無法被攻擊一次
   */
  checkDefense(context) {
    const { defender } = context;

    if (defender.schoolingProtection > 0) {
      return {
        canAttack: false,
        reason: '此生物受群游保護，無法被攻擊',
      };
    }

    return { canAttack: true, reason: '' };
  }

  /**
   * 生物獲得食物時觸發群游效果
   * 透過 trait link 通知連結的另一隻生物獲得保護
   */
  onGainFood(context, foodType, processedCreatures) {
    const { creature, gameState } = context;

    if (processedCreatures.has(creature.id)) {
      return gameState;
    }

    // 找到透過群游連結的生物
    const linkedCreatureId = creature.traitLinks?.[DEEP_SEA_TRAIT_TYPES.SCHOOLING];
    if (!linkedCreatureId) return gameState;

    processedCreatures.add(creature.id);

    // 給連結生物增加群游保護標記
    for (const player of gameState.players || []) {
      const linked = player.creatures?.find(c => c.id === linkedCreatureId);
      if (linked) {
        linked.schoolingProtection = (linked.schoolingProtection || 0) + 1;
        break;
      }
    }

    return gameState;
  }

  /**
   * 回合結束時清除群游保護
   */
  onPhaseEnd(context) {
    const { creature, gameState } = context;

    if (creature) {
      creature.schoolingProtection = 0;
    }

    return gameState;
  }

  /**
   * 攻擊發生時消耗一次群游保護
   * （由規則引擎在防禦檢查後調用）
   */
  onDefenseUsed(context) {
    const { defender, gameState } = context;

    if (defender && defender.schoolingProtection > 0) {
      defender.schoolingProtection -= 1;
    }

    return gameState;
  }
}

module.exports = SchoolingHandler;
