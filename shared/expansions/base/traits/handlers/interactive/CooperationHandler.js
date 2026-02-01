/**
 * 合作性狀處理器
 * @module expansions/base/traits/handlers/interactive/CooperationHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 合作性狀處理器
 *
 * 合作特性（互動性狀）：
 * - 連結兩隻生物
 * - 當其中一隻生物獲得紅/藍食物時，另一隻獲得 1 個藍色食物
 * - 會連鎖觸發
 */
class CooperationHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.COOPERATION]);
  }

  /**
   * 獲得食物時觸發
   */
  onGainFood(context, foodType, processedCreatures = new Set()) {
    const { creature, gameState, linkedCreatureId } = context;

    // 紅色或藍色食物都會觸發合作
    if (foodType !== 'red' && foodType !== 'blue') {
      return gameState;
    }

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

    // 連結的生物獲得藍色食物（不消耗食物池）
    if (!linkedCreature.food) {
      linkedCreature.food = { red: 0, blue: 0, yellow: 0 };
    }
    linkedCreature.food.blue += 1;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'COOPERATION_TRIGGER',
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

    // 建立雙向連結
    const thisTrait = creature.traits?.find(t =>
      t.type === TRAIT_TYPES.COOPERATION && !t.linkedCreatureId
    );
    if (thisTrait) {
      thisTrait.linkedCreatureId = targetCreature.id;
    }

    // 在目標生物上也標記連結
    if (!targetCreature.linkedCooperation) {
      targetCreature.linkedCooperation = [];
    }
    targetCreature.linkedCooperation.push(creature.id);

    return gameState;
  }

  /**
   * 移除時解除連結
   */
  onRemove(context) {
    const { creature, gameState } = context;

    const linkedId = creature.traits?.find(t => t.type === TRAIT_TYPES.COOPERATION)?.linkedCreatureId;
    if (linkedId) {
      for (const player of gameState.players || []) {
        const linked = player.creatures?.find(c => c.id === linkedId);
        if (linked && linked.linkedCooperation) {
          linked.linkedCooperation = linked.linkedCooperation.filter(id => id !== creature.id);
        }
      }
    }

    return gameState;
  }
}

module.exports = CooperationHandler;
