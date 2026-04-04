/**
 * 墨汁性狀處理器
 * @module expansions/deep-sea/traits/handlers/InkCloudHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 墨汁性狀處理器
 *
 * 墨汁生物特性：
 * - 每回合一次，被攻擊時可噴出墨汁取消攻擊
 * - 不需棄置性狀（與斷尾不同）
 * - 每回合重置
 */
class InkCloudHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.INK_CLOUD]);
  }

  /**
   * 取得防禦回應選項（墨汁取消攻擊）
   */
  getDefenseResponse(context) {
    const { defender } = context;

    if (defender.inkCloudUsed) {
      return { canRespond: false, responseType: null, options: null };
    }

    return {
      canRespond: true,
      responseType: 'cancel_attack',
      options: { description: '墨汁：取消此次攻擊（每回合限一次）' },
    };
  }

  /**
   * 處理墨汁取消攻擊
   */
  handleDefenseResponse(context, response) {
    const { defender, gameState } = context;

    if (!response?.useInkCloud) {
      return {
        success: true,
        gameState,
        attackCancelled: false,
      };
    }

    if (defender.inkCloudUsed) {
      return {
        success: false,
        gameState,
        attackCancelled: false,
        message: '本回合已使用墨汁',
      };
    }

    return {
      success: true,
      gameState,
      attackCancelled: true,
      inkCloudConsumed: true,
      message: '墨汁：攻擊已取消',
    };
  }

  /**
   * 回合開始時重置墨汁使用狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;
    if (creature) {
      creature.inkCloudUsed = false;
    }
    return gameState;
  }
}

module.exports = InkCloudHandler;
