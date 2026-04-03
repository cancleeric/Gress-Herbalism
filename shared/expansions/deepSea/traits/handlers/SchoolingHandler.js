/**
 * 群游性狀處理器
 * @module expansions/deepSea/traits/handlers/SchoolingHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

const SCHOOLING_MIN_CREATURES = 3;

/**
 * 群游性狀處理器
 *
 * 群游生物特性：
 * - 當擁有此性狀的玩家有 3 隻以上生物時，此生物無法被攻擊
 */
class SchoolingHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.SCHOOLING]);
  }

  /**
   * 檢查群游防禦是否生效
   */
  checkDefense(context) {
    const { defender, gameState } = context;

    // 找到擁有此生物的玩家
    let ownerPlayer = null;
    for (const player of gameState.players || []) {
      if (player.creatures?.some(c => c.id === defender.id)) {
        ownerPlayer = player;
        break;
      }
    }

    if (!ownerPlayer) {
      return { canAttack: true, reason: '' };
    }

    const creatureCount = ownerPlayer.creatures?.length || 0;

    if (creatureCount >= SCHOOLING_MIN_CREATURES) {
      return {
        canAttack: false,
        reason: `群游生物：玩家擁有 ${creatureCount} 隻生物，此生物受到群游保護無法被攻擊`,
      };
    }

    return { canAttack: true, reason: '' };
  }
}

module.exports = SchoolingHandler;
