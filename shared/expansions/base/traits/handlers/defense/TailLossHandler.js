/**
 * 斷尾性狀處理器
 * @module expansions/base/traits/handlers/defense/TailLossHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 斷尾性狀處理器
 *
 * 斷尾生物特性：
 * - 被攻擊時可棄置一張性狀卡來取消攻擊
 * - 攻擊者獲得 1 個藍色食物
 */
class TailLossHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.TAIL_LOSS]);
  }

  /**
   * 取得防禦回應選項
   */
  getDefenseResponse(context) {
    const { defender } = context;

    // 檢查是否有其他性狀可以棄置
    const otherTraits = defender.traits?.filter(t => t.type !== TRAIT_TYPES.TAIL_LOSS) || [];

    if (otherTraits.length === 0) {
      return { canRespond: false, responseType: null, options: null };
    }

    return {
      canRespond: true,
      responseType: 'SELECT_TRAIT',
      options: {
        description: '選擇一個性狀棄置以取消攻擊',
        traits: otherTraits.map(t => ({
          id: t.id,
          type: t.type,
          name: t.name,
        })),
        optional: true,
      },
    };
  }

  /**
   * 處理防禦回應
   */
  handleDefenseResponse(context, response) {
    const { defender, attacker, gameState } = context;

    if (!response.selectedTraitId) {
      // 選擇不使用斷尾
      return {
        success: false,
        gameState,
        attackCancelled: false,
      };
    }

    // 移除選擇的性狀
    const traitIndex = defender.traits?.findIndex(t => t.id === response.selectedTraitId);
    if (traitIndex === undefined || traitIndex === -1) {
      return {
        success: false,
        gameState,
        attackCancelled: false,
        message: '找不到指定的性狀',
      };
    }

    const removedTrait = defender.traits.splice(traitIndex, 1)[0];

    // 攻擊者獲得 1 個藍色食物
    if (!attacker.food) {
      attacker.food = { red: 0, blue: 0, yellow: 0 };
    }
    attacker.food.blue += 1;

    // 記錄日誌
    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'TAIL_LOSS',
      defenderId: defender.id,
      attackerId: attacker.id,
      removedTrait: removedTrait.type,
      attackerGainedFood: 1,
    });

    return {
      success: true,
      gameState,
      attackCancelled: true,
      message: `棄置${removedTrait.name || removedTrait.type}，攻擊取消`,
    };
  }
}

module.exports = TailLossHandler;
