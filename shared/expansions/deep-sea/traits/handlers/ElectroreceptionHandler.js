/**
 * 電感性狀處理器
 * @module expansions/deep-sea/traits/handlers/ElectroreceptionHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 電感性狀處理器
 *
 * 電感生物特性：
 * - 每回合開始時可使用一次
 * - 指定任意一隻生物，使其本回合無法從食物池進食
 */
class ElectroreceptionHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]);
  }

  /**
   * 可以使用電感能力
   */
  canUseAbility(context) {
    const { creature } = context;

    if (creature.hasUsedElectroreceptionThisTurn) {
      return { canUse: false, reason: '本回合已使用電感' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 取得可以電感干擾的目標（所有生物，包含自己）
   */
  getAbilityTargets(context) {
    const { gameState } = context;
    const targets = [];

    for (const player of gameState.players || []) {
      for (const target of player.creatures || []) {
        targets.push({
          creatureId: target.id,
          ownerId: player.id,
          ownerName: player.name,
        });
      }
    }

    return targets;
  }

  /**
   * 使用電感，標記目標本回合無法從食物池進食
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    creature.hasUsedElectroreceptionThisTurn = true;

    // 找到目標生物並標記
    for (const player of gameState.players || []) {
      const targetCreature = player.creatures?.find(c => c.id === target.creatureId);
      if (targetCreature) {
        targetCreature.electroReceptionBlocked = true;
        return {
          success: true,
          gameState,
          message: `電感干擾：${targetCreature.name || '生物'} 本回合無法從食物池進食`,
        };
      }
    }

    return {
      success: false,
      gameState,
      message: '找不到目標生物',
    };
  }

  /**
   * 目標生物嘗試從食物池進食時的檢查（由進食邏輯調用）
   * 若生物被電感干擾，無法進食
   */
  checkCanFeed(context) {
    const { creature } = context;

    // 此方法只在此生物本身有電感性狀時被調用
    // 電感干擾效果應用於被標記的生物（electroReceptionBlocked）
    // 由規則引擎在進食前檢查 creature.electroReceptionBlocked
    return { canFeed: true, reason: '' };
  }

  /**
   * 回合開始時重置電感使用狀態
   */
  onTurnStart(context) {
    const { creature, gameState } = context;

    if (creature) {
      creature.hasUsedElectroreceptionThisTurn = false;
      // 解除電感干擾（標記在回合開始重置）
      creature.electroReceptionBlocked = false;
    }

    return gameState;
  }
}

module.exports = ElectroreceptionHandler;
