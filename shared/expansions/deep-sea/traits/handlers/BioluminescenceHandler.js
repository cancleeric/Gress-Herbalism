/**
 * 發光性狀處理器
 * @module expansions/deep-sea/traits/handlers/BioluminescenceHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 發光性狀處理器
 *
 * 發光生物特性：
 * - 進食階段可額外從食物池取得 1 個食物
 * - 每輪限用一次
 */
class BioluminescenceHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]);
  }

  /**
   * 檢查是否可使用主動能力（吸引食物）
   */
  canUseAbility(context) {
    const { creature, gameState } = context;

    if (creature.bioluminescenceUsed) {
      return { canUse: false, reason: '本回合已使用發光能力' };
    }

    const foodPool = gameState?.foodPool ?? 0;
    if (foodPool <= 0) {
      return { canUse: false, reason: '食物池沒有食物' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 使用主動能力：從食物池取得 1 個額外食物
   */
  useAbility(context) {
    const { creature, gameState } = context;

    creature.bioluminescenceUsed = true;
    const currentFood = creature.food || { red: 0, blue: 0 };
    creature.food = { ...currentFood, red: currentFood.red + 1 };

    const newGameState = {
      ...gameState,
      foodPool: Math.max(0, (gameState?.foodPool ?? 0) - 1),
    };

    return {
      success: true,
      gameState: newGameState,
      message: '發光：從食物池取得 1 個食物',
    };
  }

  /**
   * 回合開始時重置使用狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;
    if (creature) {
      creature.bioluminescenceUsed = false;
    }
    return gameState;
  }
}

module.exports = BioluminescenceHandler;
