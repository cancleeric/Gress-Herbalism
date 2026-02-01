/**
 * 踐踏性狀處理器
 * @module expansions/base/traits/handlers/special/TramplingHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 踐踏性狀處理器
 *
 * 踐踏特性：
 * - 進食階段輪到自己時，可將桌面一個現有食物移除
 */
class TramplingHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.TRAMPLING]);
  }

  /**
   * 檢查是否可以使用踐踏
   */
  canUseAbility(context) {
    const { creature, gameState } = context;

    // 檢查是否已使用
    if (creature.tramplingUsedThisPhase) {
      return { canUse: false, reason: '本階段已使用踐踏' };
    }

    // 檢查食物池是否有食物
    if ((gameState.foodPool?.red || 0) <= 0) {
      return { canUse: false, reason: '食物池沒有食物' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 使用踐踏
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    // 移除食物池中的一個紅色食物
    if (!gameState.foodPool || gameState.foodPool.red <= 0) {
      return {
        success: false,
        gameState,
        message: '食物池沒有食物可移除',
      };
    }

    gameState.foodPool.red -= 1;
    creature.tramplingUsedThisPhase = true;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'TRAMPLING',
      creatureId: creature.id,
      ownerId: creature.ownerId,
      remainingFood: gameState.foodPool.red,
    });

    return {
      success: true,
      gameState,
      message: '踐踏移除了 1 個食物',
    };
  }

  /**
   * 階段開始時重置
   */
  onPhaseStart(context, phase) {
    const { creature, gameState } = context;
    if (creature && phase === 'feeding') {
      creature.tramplingUsedThisPhase = false;
    }
    return gameState;
  }
}

module.exports = TramplingHandler;
