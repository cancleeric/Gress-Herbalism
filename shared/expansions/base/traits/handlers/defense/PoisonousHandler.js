/**
 * 毒液性狀處理器
 * @module expansions/base/traits/handlers/defense/PoisonousHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 毒液性狀處理器
 *
 * 毒液生物特性：
 * - 被攻擊滅絕時，攻擊者也會在滅絕階段死亡
 */
class PoisonousHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.POISONOUS]);
  }

  /**
   * 被攻擊滅絕時，攻擊者也會中毒
   */
  onExtinct(context, attacker) {
    const { gameState } = context;

    if (!attacker) return gameState;

    // 標記攻擊者為中毒
    attacker.isPoisoned = true;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'POISON_TRIGGER',
      poisonedCreatureId: attacker.id,
      poisonedOwnerId: attacker.ownerId,
    });

    return gameState;
  }
}

module.exports = PoisonousHandler;
