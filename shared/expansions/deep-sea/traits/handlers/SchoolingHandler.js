/**
 * 群游性狀處理器
 * @module expansions/deep-sea/traits/handlers/SchoolingHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 群游性狀處理器
 *
 * 群游生物特性：
 * - 連結兩隻生物（互動性狀）
 * - 其中一隻獲得任意食物時，另一隻從食物池獲得 1 個藍色食物
 * - 類似合作（Cooperation）但觸發條件更廣（任意食物類型）
 */
class SchoolingHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.SCHOOLING]);
  }

  /**
   * 獲得食物時觸發群游效果
   * @param {Object} context
   * @param {Object} context.creature - 進食的生物
   * @param {Object} context.linkedCreatureId - 連結的生物 ID
   * @param {Object} context.gameState - 遊戲狀態
   * @param {string} foodType - 食物類型
   * @param {Set} processedCreatures - 已處理的生物（避免無限迴圈）
   * @returns {Object} 修改後的 gameState
   */
  onGainFood(context, foodType, processedCreatures) {
    const { creature, gameState } = context;

    if (!gameState) {
      return gameState;
    }

    // 取得連結的生物 ID
    const schoolingTrait = creature.traits?.find(
      t => t.type === DEEP_SEA_TRAIT_TYPES.SCHOOLING
    );
    const linkedCreatureId = schoolingTrait?.linkedCreatureId;

    if (!linkedCreatureId) {
      return gameState;
    }

    // 避免無限迴圈
    if (processedCreatures && processedCreatures.has(`${creature.id}_schooling`)) {
      return gameState;
    }

    if (processedCreatures) {
      processedCreatures.add(`${creature.id}_schooling`);
    }

    // 尋找連結的生物
    let linkedCreature = null;
    for (const player of gameState.players || []) {
      linkedCreature = player.creatures?.find(c => c.id === linkedCreatureId);
      if (linkedCreature) break;
    }

    if (!linkedCreature) {
      return gameState;
    }

    // 從食物池給連結的生物 1 個藍色食物
    if (gameState.foodPool && gameState.foodPool.blue > 0) {
      gameState.foodPool.blue -= 1;
      linkedCreature.food = linkedCreature.food || { red: 0, blue: 0, yellow: 0 };
      linkedCreature.food.blue = (linkedCreature.food.blue || 0) + 1;
    }

    return gameState;
  }
}

module.exports = SchoolingHandler;
