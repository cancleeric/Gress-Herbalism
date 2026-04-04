/**
 * 發光性狀處理器
 * @module expansions/deep-sea/traits/handlers/BioluminescenceHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 發光性狀處理器
 *
 * 發光生物特性：
 * - 每回合可使用一次，從中央食物池額外取得 1 個紅色食物
 */
class BioluminescenceHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]);
  }

  /**
   * 可以使用發光能力
   */
  canUseAbility(context) {
    const { creature, gameState } = context;

    if (creature.hasUsedBioluminescenceThisTurn) {
      return { canUse: false, reason: '本回合已使用發光' };
    }

    const foodPool = gameState?.foodPool || 0;
    if (foodPool <= 0) {
      return { canUse: false, reason: '食物池已空' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 使用發光，從食物池取得 1 個紅色食物
   */
  useAbility(context) {
    const { creature, gameState } = context;

    creature.hasUsedBioluminescenceThisTurn = true;

    // 從食物池取得食物
    if (gameState.foodPool > 0) {
      gameState.foodPool -= 1;
      if (!creature.food) creature.food = { red: 0, blue: 0, yellow: 0 };
      creature.food.red = (creature.food.red || 0) + 1;
    }

    return {
      success: true,
      gameState,
      message: `${creature.name || '生物'} 發光引誘，獲得 1 個紅色食物`,
    };
  }

  /**
   * 回合開始時重置發光使用狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;

    if (creature) {
      creature.hasUsedBioluminescenceThisTurn = false;
    }

    return gameState;
  }
}

module.exports = BioluminescenceHandler;
