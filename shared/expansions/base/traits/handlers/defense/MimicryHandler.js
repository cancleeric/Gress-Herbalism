/**
 * 擬態性狀處理器
 * @module expansions/base/traits/handlers/defense/MimicryHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 擬態性狀處理器
 *
 * 擬態生物特性：
 * - 每回合可使用一次
 * - 被攻擊時可將攻擊轉移給自己另一隻一定可以被獵食的生物
 */
class MimicryHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.MIMICRY]);
  }

  /**
   * 取得防禦回應選項
   */
  getDefenseResponse(context) {
    const { defender, gameState } = context;

    // 檢查是否已使用
    if (defender.mimicryUsedThisTurn) {
      return { canRespond: false, responseType: null, options: null };
    }

    // 找到可以轉移攻擊的目標（自己的其他生物）
    const owner = gameState.players?.find(p => p.id === defender.ownerId);
    const validTargets = owner?.creatures?.filter(c => {
      if (c.id === defender.id) return false;
      return true; // 完整檢查由規則引擎處理
    }) || [];

    if (validTargets.length === 0) {
      return { canRespond: false, responseType: null, options: null };
    }

    return {
      canRespond: true,
      responseType: 'SELECT_CREATURE',
      options: {
        description: '選擇一隻生物承受攻擊',
        creatures: validTargets.map(c => ({
          id: c.id,
          traits: c.traits?.map(t => t.type) || [],
        })),
        optional: true,
      },
    };
  }

  /**
   * 處理防禦回應
   */
  handleDefenseResponse(context, response) {
    const { defender, gameState } = context;

    if (!response.selectedCreatureId) {
      return {
        success: false,
        gameState,
        attackCancelled: false,
      };
    }

    // 標記已使用
    defender.mimicryUsedThisTurn = true;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'MIMICRY',
      originalTargetId: defender.id,
      newTargetId: response.selectedCreatureId,
    });

    return {
      success: true,
      gameState,
      attackCancelled: false,
      redirectTarget: response.selectedCreatureId,
    };
  }

  /**
   * 回合開始重置擬態狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;
    if (creature) {
      creature.mimicryUsedThisTurn = false;
    }
    return gameState;
  }
}

module.exports = MimicryHandler;
