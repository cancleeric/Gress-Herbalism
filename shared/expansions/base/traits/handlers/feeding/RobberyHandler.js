/**
 * 掠奪性狀處理器
 * @module expansions/base/traits/handlers/feeding/RobberyHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 掠奪性狀處理器
 *
 * 掠奪生物特性：
 * - 可偷取其他未吃飽生物身上的 1 個食物
 * - 每階段限用一次
 */
class RobberyHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.ROBBERY]);
  }

  /**
   * 檢查是否可以使用掠奪
   */
  canUseAbility(context) {
    const { creature } = context;

    // 檢查是否已使用
    if (creature.robberyUsedThisPhase) {
      return { canUse: false, reason: '本階段已使用掠奪' };
    }

    // 檢查是否有可偷取的目標
    const targets = this.getAbilityTargets(context);
    if (targets.length === 0) {
      return { canUse: false, reason: '沒有可偷取的目標' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 取得可偷取的目標
   */
  getAbilityTargets(context) {
    const { creature, gameState } = context;
    const targets = [];

    for (const player of gameState.players || []) {
      for (const target of player.creatures || []) {
        // 跳過自己
        if (target.id === creature.id) continue;

        // 檢查是否未吃飽且有食物
        const currentFood = (target.food?.red || 0) + (target.food?.blue || 0);
        const isFed = currentFood >= (target.foodNeeded || 1);

        if (!isFed && currentFood > 0) {
          targets.push({
            creatureId: target.id,
            ownerId: player.id,
            ownerName: player.name,
            food: target.food,
          });
        }
      }
    }

    return targets;
  }

  /**
   * 使用掠奪
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    // 找到目標生物
    let targetCreature = null;
    for (const player of gameState.players || []) {
      targetCreature = player.creatures?.find(c => c.id === target.creatureId);
      if (targetCreature) break;
    }

    if (!targetCreature) {
      return {
        success: false,
        gameState,
        message: '找不到目標生物',
      };
    }

    // 偷取食物（優先偷取藍色，再偷紅色）
    let stolenType = null;
    if (targetCreature.food?.blue > 0) {
      targetCreature.food.blue -= 1;
      stolenType = 'blue';
    } else if (targetCreature.food?.red > 0) {
      targetCreature.food.red -= 1;
      stolenType = 'red';
    }

    if (!stolenType) {
      return {
        success: false,
        gameState,
        message: '目標沒有可偷取的食物',
      };
    }

    // 給自己食物
    if (!creature.food) {
      creature.food = { red: 0, blue: 0, yellow: 0 };
    }
    creature.food.blue += 1; // 偷取的食物變成藍色

    // 標記已使用
    creature.robberyUsedThisPhase = true;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'ROBBERY',
      thiefId: creature.id,
      victimId: targetCreature.id,
      stolenType,
    });

    return {
      success: true,
      gameState,
      message: `從 ${target.ownerName || '對手'} 的生物偷取了 1 個食物`,
    };
  }

  /**
   * 階段開始時重置
   */
  onPhaseStart(context, phase) {
    const { creature, gameState } = context;
    if (creature && phase === 'feeding') {
      creature.robberyUsedThisPhase = false;
    }
    return gameState;
  }
}

module.exports = RobberyHandler;
