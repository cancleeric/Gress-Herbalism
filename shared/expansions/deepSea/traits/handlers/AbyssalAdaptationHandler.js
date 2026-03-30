/**
 * 深淵適應性狀處理器
 * @module expansions/deepSea/traits/handlers/AbyssalAdaptationHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 深淵適應性狀處理器
 *
 * 深淵適應特性：
 * - 每局一次，在滅絕階段食物不足時可以存活
 * - 使用後標記消耗，本局不再生效
 */
class AbyssalAdaptationHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION]);
  }

  /**
   * 滅絕階段：檢查深淵適應是否可以讓生物存活
   */
  checkExtinction(context) {
    const { creature, gameState } = context;

    const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
    const foodNeeded = creature.foodNeeded || 1;

    // 如果食物充足，交給正常邏輯
    if (currentFood >= foodNeeded) {
      return { shouldSurvive: true, reason: '' };
    }

    // 檢查深淵適應能力是否尚未使用
    const abyssalTrait = creature.traits?.find(
      t => t.type === DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION
    );

    if (abyssalTrait && !abyssalTrait.abyssalUsed) {
      // 消耗能力，本局存活
      abyssalTrait.abyssalUsed = true;

      if (!gameState.actionLog) {
        gameState.actionLog = [];
      }
      gameState.actionLog.push({
        type: 'ABYSSAL_ADAPTATION_USED',
        creatureId: creature.id,
        message: '深淵適應：本次滅絕階段存活，能力已消耗',
      });

      return {
        shouldSurvive: true,
        reason: '深淵適應：忍受食物匱乏，在深淵中存活',
      };
    }

    // 能力已用盡，無法存活
    return { shouldSurvive: false, reason: '' };
  }
}

module.exports = AbyssalAdaptationHandler;
