/**
 * 冬眠性狀處理器
 * @module expansions/base/traits/handlers/feeding/HibernationHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 冬眠性狀處理器
 *
 * 冬眠生物特性：
 * - 可跳過整個進食階段視為吃飽
 * - 使用後橫置至下回合
 * - 最後一回合不能使用
 */
class HibernationHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.HIBERNATION]);
  }

  /**
   * 檢查是否可以使用冬眠
   */
  canUseAbility(context) {
    const { creature, gameState } = context;

    // 檢查是否為最後一回合
    if (gameState.isLastRound) {
      return { canUse: false, reason: '最後一回合不能使用冬眠' };
    }

    // 檢查是否已使用（橫置中）
    if (creature.isHibernating) {
      return { canUse: false, reason: '冬眠中' };
    }

    // 檢查此回合是否已使用過冬眠
    if (creature.hibernationUsedThisTurn) {
      return { canUse: false, reason: '本回合已使用冬眠' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 使用冬眠
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    // 標記為冬眠狀態
    creature.isHibernating = true;
    creature.hibernationUsedThisTurn = true;

    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'HIBERNATION',
      creatureId: creature.id,
      ownerId: creature.ownerId,
    });

    return {
      success: true,
      gameState,
      message: '進入冬眠狀態',
    };
  }

  /**
   * 冬眠中視為吃飽
   */
  checkExtinction(context) {
    const { creature } = context;

    if (creature.isHibernating) {
      return {
        shouldSurvive: true,
        reason: '冬眠中視為吃飽',
      };
    }

    return { shouldSurvive: false, reason: '' };
  }

  /**
   * 冬眠生物不能從食物池進食
   */
  checkCanFeed(context) {
    const { creature } = context;

    if (creature.isHibernating) {
      return {
        canFeed: false,
        reason: '冬眠中不能進食',
      };
    }

    return { canFeed: true, reason: '' };
  }

  /**
   * 回合開始重置狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;
    if (creature) {
      creature.isHibernating = false;
      creature.hibernationUsedThisTurn = false;
    }
    return gameState;
  }
}

module.exports = HibernationHandler;
