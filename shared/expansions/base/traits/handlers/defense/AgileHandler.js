/**
 * 敏捷性狀處理器
 * @module expansions/base/traits/handlers/defense/AgileHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 敏捷性狀處理器
 *
 * 敏捷生物特性：
 * - 被攻擊時擲骰
 * - 4-6 逃脫成功
 * - 1-3 逃脫失敗
 */
class AgileHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.AGILE]);
  }

  /**
   * 取得防禦回應選項
   */
  getDefenseResponse(context) {
    return {
      canRespond: true,
      responseType: 'DICE_ROLL',
      options: {
        description: '擲骰逃脫：4-6 成功，1-3 失敗',
        autoRoll: true,
      },
    };
  }

  /**
   * 處理防禦回應
   */
  handleDefenseResponse(context, response) {
    const { gameState } = context;

    // 擲骰
    const diceResult = response.diceResult !== undefined ? response.diceResult : this._rollDice();

    // 4-6 逃脫成功
    const escaped = diceResult >= 4;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'AGILE_ROLL',
      diceResult,
      escaped,
    });

    return {
      success: true,
      gameState,
      attackCancelled: escaped,
      message: escaped
        ? `擲出 ${diceResult}，逃脫成功！`
        : `擲出 ${diceResult}，逃脫失敗`,
    };
  }

  /**
   * 擲骰
   * @private
   */
  _rollDice() {
    return Math.floor(Math.random() * 6) + 1;
  }
}

module.exports = AgileHandler;
