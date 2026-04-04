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
 * - 若擁有者控制 2 隻以上群游生物，被攻擊時擲骰 4-6 逃脫
 */
class SchoolingHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.SCHOOLING]);
  }

  /**
   * 取得防禦回應選項（群游擲骰逃脫）
   */
  getDefenseResponse(context) {
    const { defender, gameState } = context;

    const ownerPlayer = gameState?.players?.find(p => p.id === defender.ownerId);
    const schoolingCount = (ownerPlayer?.creatures || []).filter(
      c => c.traits?.some(t => t.type === DEEP_SEA_TRAIT_TYPES.SCHOOLING)
    ).length;

    if (schoolingCount < 2) {
      return { canRespond: false, responseType: null, options: null };
    }

    return {
      canRespond: true,
      responseType: 'dice_escape',
      options: { threshold: 4, description: '群游：擲骰 4-6 逃脫' },
    };
  }

  /**
   * 處理群游擲骰逃脫
   */
  handleDefenseResponse(context, response) {
    const { gameState } = context;
    const roll = response?.roll;
    if (roll === undefined || roll === null) {
      return {
        success: false,
        gameState,
        attackCancelled: false,
        message: '群游：未提供擲骰結果',
      };
    }
    const escaped = roll >= 4;

    return {
      success: true,
      gameState,
      attackCancelled: escaped,
      roll,
      message: escaped
        ? `群游逃脫成功（擲出 ${roll}）`
        : `群游逃脫失敗（擲出 ${roll}）`,
    };
  }
}

module.exports = SchoolingHandler;
