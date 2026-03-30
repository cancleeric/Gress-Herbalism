/**
 * 群游性狀處理器
 * @module expansions/deepSea/traits/handlers/SchoolingHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 群游性狀處理器
 *
 * 群游特性（互動性狀）：
 * - 連結兩隻自己的生物
 * - 當其中一隻生物從食物池獲得紅色食物時，另一隻也獲得 1 個藍色食物
 * - 藍色食物來自額外獎勵（不從食物池扣除）
 */
class SchoolingHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.SCHOOLING]);
  }

  /**
   * 獲得紅色食物時，連結的生物獲得 1 個藍色食物獎勵
   */
  onGainFood(context, foodType, processedCreatures = new Set()) {
    const { creature, gameState, linkedCreatureId } = context;

    // 只有紅色食物才觸發群游
    if (foodType !== 'red') {
      return gameState;
    }

    if (!linkedCreatureId) {
      return gameState;
    }

    // 避免無限迴圈
    const key = `${creature.id}-${linkedCreatureId}-schooling`;
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

    // 連結的生物獲得 1 個藍色食物（獎勵，不從食物池扣除）
    if (!linkedCreature.food) {
      linkedCreature.food = { red: 0, blue: 0, yellow: 0 };
    }
    linkedCreature.food.blue += 1;

    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'SCHOOLING_TRIGGER',
      sourceCreatureId: creature.id,
      targetCreatureId: linkedCreatureId,
      foodGained: 'blue',
      amount: 1,
    });

    return gameState;
  }

  /**
   * 放置時建立雙向群游連結（只能連結自己的生物）
   */
  onPlace(context) {
    const { creature, targetCreature, gameState } = context;

    if (!targetCreature) {
      return gameState;
    }

    // 建立單向連結（從此性狀到目標生物）
    const thisTrait = creature.traits?.find(
      t => t.type === DEEP_SEA_TRAIT_TYPES.SCHOOLING && !t.linkedCreatureId
    );
    if (thisTrait) {
      thisTrait.linkedCreatureId = targetCreature.id;
    }

    // 在目標生物上標記反向連結
    if (!targetCreature.linkedSchooling) {
      targetCreature.linkedSchooling = [];
    }
    targetCreature.linkedSchooling.push(creature.id);

    return gameState;
  }

  /**
   * 移除時解除群游連結
   */
  onRemove(context) {
    const { creature, gameState } = context;

    const linkedId = creature.traits?.find(
      t => t.type === DEEP_SEA_TRAIT_TYPES.SCHOOLING
    )?.linkedCreatureId;

    if (linkedId) {
      for (const player of gameState.players || []) {
        const linked = player.creatures?.find(c => c.id === linkedId);
        if (linked && linked.linkedSchooling) {
          linked.linkedSchooling = linked.linkedSchooling.filter(id => id !== creature.id);
        }
      }
    }

    return gameState;
  }
}

module.exports = SchoolingHandler;
