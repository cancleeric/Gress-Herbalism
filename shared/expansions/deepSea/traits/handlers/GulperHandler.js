/**
 * 巨口性狀處理器
 * @module expansions/deepSea/traits/handlers/GulperHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 巨口性狀處理器
 *
 * 巨口生物特性：
 * - 食量 +1
 * - 進食階段可額外從食物池取得 1 個藍色食物（每回合一次）
 */
class GulperHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GULPER]);
  }

  /**
   * 巨口可以發動特殊進食能力
   */
  canUseAbility(context) {
    const { creature, gameState } = context;
    const gulperTrait = creature.traits?.find(t => t.type === DEEP_SEA_TRAIT_TYPES.GULPER);

    // 每回合只能使用一次
    if (gulperTrait?.usedThisTurn) {
      return { canUse: false, reason: '本回合已使用過巨口進食' };
    }

    // 食物池需要有藍色食物
    if ((gameState.foodPool?.blue || 0) <= 0) {
      return { canUse: false, reason: '食物池中沒有藍色食物' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 執行巨口進食：額外取得 1 個藍色食物
   */
  useAbility(context) {
    const { creature, gameState } = context;

    const gulperTrait = creature.traits?.find(t => t.type === DEEP_SEA_TRAIT_TYPES.GULPER);
    if (gulperTrait) {
      gulperTrait.usedThisTurn = true;
    }

    // 從食物池取得 1 個藍色食物
    gameState.foodPool.blue -= 1;
    if (!creature.food) {
      creature.food = { red: 0, blue: 0, yellow: 0 };
    }
    creature.food.blue += 1;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'GULPER_FEED',
      creatureId: creature.id,
      foodType: 'blue',
      amount: 1,
    });

    return {
      success: true,
      gameState,
      message: '巨口額外進食：獲得 1 個藍色食物',
    };
  }

  /**
   * 回合開始重置進食狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;
    if (creature) {
      const gulperTrait = creature.traits?.find(t => t.type === DEEP_SEA_TRAIT_TYPES.GULPER);
      if (gulperTrait) {
        gulperTrait.usedThisTurn = false;
      }
    }
    return gameState;
  }
}

module.exports = GulperHandler;
