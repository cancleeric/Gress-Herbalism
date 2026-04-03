/**
 * 發光性狀處理器
 * @module expansions/deepSea/traits/handlers/BioluminescenceHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 發光性狀處理器
 *
 * 發光特性（互動性狀）：
 * - 連結兩隻生物
 * - 任何一隻生物進食（獲得任意食物）時，另一隻從食物池獲得 1 個藍色食物
 */
class BioluminescenceHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]);
  }

  /**
   * 獲得食物時觸發發光效果
   */
  onGainFood(context, foodType, processedCreatures = new Set()) {
    const { creature, gameState, linkedCreatureId } = context;

    // 檢查是否有連結的生物
    if (!linkedCreatureId) {
      return gameState;
    }

    // 避免無限迴圈
    const key = `${creature.id}-${linkedCreatureId}`;
    if (processedCreatures.has(key)) {
      return gameState;
    }
    processedCreatures.add(key);

    // 找到連結的生物
    let linkedCreature = null;
    for (const player of gameState.players || []) {
      linkedCreature = player.creatures?.find(c => c.id === linkedCreatureId);
      if (linkedCreature) break;
    }

    if (!linkedCreature) {
      return gameState;
    }

    // 檢查食物池是否還有藍色食物
    if ((gameState.foodPool?.blue || 0) <= 0) {
      return gameState;
    }

    // 連結的生物獲得 1 個藍色食物
    gameState.foodPool.blue -= 1;
    if (!linkedCreature.food) {
      linkedCreature.food = { red: 0, blue: 0, yellow: 0 };
    }
    linkedCreature.food.blue += 1;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'BIOLUMINESCENCE_TRIGGER',
      sourceCreatureId: creature.id,
      targetCreatureId: linkedCreatureId,
      foodType: 'blue',
    });

    return gameState;
  }

  /**
   * 放置時需要指定連結的生物
   */
  onPlace(context) {
    const { creature, targetCreature, gameState } = context;

    if (!targetCreature) {
      return gameState;
    }

    // 建立連結
    const thisTrait = creature.traits?.find(t =>
      t.type === DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE && !t.linkedCreatureId
    );
    if (thisTrait) {
      thisTrait.linkedCreatureId = targetCreature.id;
    }

    // 在目標生物上也標記連結
    if (!targetCreature.linkedBioluminescence) {
      targetCreature.linkedBioluminescence = [];
    }
    targetCreature.linkedBioluminescence.push(creature.id);

    return gameState;
  }

  /**
   * 移除時解除連結
   */
  onRemove(context) {
    const { creature, gameState } = context;

    const linkedId = creature.traits?.find(
      t => t.type === DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE
    )?.linkedCreatureId;

    if (linkedId) {
      for (const player of gameState.players || []) {
        const linked = player.creatures?.find(c => c.id === linkedId);
        if (linked && linked.linkedBioluminescence) {
          linked.linkedBioluminescence = linked.linkedBioluminescence.filter(
            id => id !== creature.id
          );
        }
      }
    }

    return gameState;
  }
}

module.exports = BioluminescenceHandler;
