/**
 * 腐食性狀處理器
 * @module expansions/base/traits/handlers/carnivore/ScavengerHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 腐食性狀處理器
 *
 * 腐食生物特性：
 * - 當任何生物被肉食攻擊滅絕時，獲得 1 個藍色食物
 * - 與肉食互斥
 */
class ScavengerHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.SCAVENGER]);
  }

  /**
   * 當其他生物被肉食攻擊滅絕時觸發
   */
  onOtherExtinct(context, extinctCreature, attacker) {
    const { creature, gameState } = context;

    // 只有被肉食攻擊滅絕才觸發
    if (!attacker) return gameState;

    // 檢查攻擊者是否為肉食
    const attackerIsCarnivore = attacker.traits?.some(t => t.type === TRAIT_TYPES.CARNIVORE);
    if (!attackerIsCarnivore) return gameState;

    // 獲得 1 個藍色食物
    if (!creature.food) {
      creature.food = { red: 0, blue: 0, yellow: 0 };
    }
    creature.food.blue += 1;

    // 記錄到日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'SCAVENGER_TRIGGER',
      creatureId: creature.id,
      ownerId: creature.ownerId,
      foodGained: 1,
    });

    return gameState;
  }
}

module.exports = ScavengerHandler;
