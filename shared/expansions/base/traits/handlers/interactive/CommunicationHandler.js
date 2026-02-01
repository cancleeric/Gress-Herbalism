/**
 * 溝通性狀處理器
 * @module expansions/base/traits/handlers/interactive/CommunicationHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 溝通性狀處理器
 *
 * 溝通特性（互動性狀）：
 * - 連結兩隻生物
 * - 當其中一隻生物拿取紅色食物時，另一隻也從中央拿取 1 個紅色食物
 * - 會連鎖觸發
 */
class CommunicationHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.COMMUNICATION]);
  }

  /**
   * 獲得食物時觸發
   */
  onGainFood(context, foodType, processedCreatures = new Set()) {
    const { creature, gameState, linkedCreatureId } = context;

    // 只有紅色食物才觸發溝通
    if (foodType !== 'red') {
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

    // 檢查食物池是否還有食物
    if ((gameState.foodPool?.red || 0) <= 0) {
      return gameState;
    }

    // 連結的生物也獲得紅色食物
    gameState.foodPool.red -= 1;
    if (!linkedCreature.food) {
      linkedCreature.food = { red: 0, blue: 0, yellow: 0 };
    }
    linkedCreature.food.red += 1;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'COMMUNICATION_TRIGGER',
      sourceCreatureId: creature.id,
      targetCreatureId: linkedCreatureId,
      foodType: 'red',
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
    // 找到這個性狀並記錄連結
    const thisTrait = creature.traits?.find(t =>
      t.type === TRAIT_TYPES.COMMUNICATION && !t.linkedCreatureId
    );
    if (thisTrait) {
      thisTrait.linkedCreatureId = targetCreature.id;
    }

    // 在目標生物上也標記連結
    if (!targetCreature.linkedCommunication) {
      targetCreature.linkedCommunication = [];
    }
    targetCreature.linkedCommunication.push(creature.id);

    return gameState;
  }

  /**
   * 移除時解除連結
   */
  onRemove(context) {
    const { creature, gameState } = context;

    // 找到連結的生物並解除連結
    const linkedId = creature.traits?.find(t => t.type === TRAIT_TYPES.COMMUNICATION)?.linkedCreatureId;
    if (linkedId) {
      for (const player of gameState.players || []) {
        const linked = player.creatures?.find(c => c.id === linkedId);
        if (linked && linked.linkedCommunication) {
          linked.linkedCommunication = linked.linkedCommunication.filter(id => id !== creature.id);
        }
      }
    }

    return gameState;
  }
}

module.exports = CommunicationHandler;
