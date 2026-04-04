/**
 * 巨口性狀處理器
 * @module expansions/deep-sea/traits/handlers/MegamouthHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 巨口性狀處理器
 *
 * 巨口生物特性：
 * - 食量 +1
 * - 不能從食物池進食
 * - 必須透過攻擊其他生物獲得食物
 * - 攻擊成功獲得 3 個藍色食物（比普通肉食多 1 個）
 * - 與肉食（carnivore）互斥
 */
class MegamouthHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.MEGAMOUTH]);
  }

  /**
   * 巨口生物不能從食物池進食
   * @returns {{ canFeed: boolean, reason: string }}
   */
  checkCanFeed() {
    return {
      canFeed: false,
      reason: '巨口生物必須透過攻擊獲得食物',
    };
  }

  /**
   * 巨口生物可以發動攻擊
   * @param {Object} context
   * @returns {{ canUse: boolean, reason: string }}
   */
  canUseAbility(context) {
    const { creature } = context;

    if (creature.hasAttackedThisTurn) {
      return { canUse: false, reason: '本回合已經攻擊過' };
    }

    if (this._isFed(creature)) {
      return { canUse: false, reason: '已經吃飽，不需要攻擊' };
    }

    const targets = this.getAbilityTargets(context);
    if (targets.length === 0) {
      return { canUse: false, reason: '沒有可攻擊的目標' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 取得可攻擊的目標（對手的所有生物）
   * @param {Object} context
   * @returns {Array}
   */
  getAbilityTargets(context) {
    const { creature, gameState } = context;
    const targets = [];

    for (const player of gameState.players || []) {
      for (const target of player.creatures || []) {
        if (target.id === creature.id) continue;
        if (player.id === creature.ownerId) continue;

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
   * 執行攻擊，成功時獲得 3 個藍色食物
   * @param {Object} context
   * @param {Object} target
   * @returns {{ success: boolean, gameState: Object, message: string, attackIntent: Object }}
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    creature.hasAttackedThisTurn = true;

    return {
      success: true,
      gameState,
      message: '巨口發動攻擊',
      attackIntent: {
        attackerId: creature.id,
        targetId: target.creatureId,
        foodReward: 3,
      },
    };
  }

  /**
   * 回合開始重置攻擊狀態
   * @param {Object} context
   * @returns {Object} gameState
   */
  onTurnStart(context) {
    const { creature, gameState } = context;
    if (creature) {
      creature.hasAttackedThisTurn = false;
    }
    return gameState;
  }

  /**
   * 檢查生物是否吃飽
   * @private
   */
  _isFed(creature) {
    const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
    return currentFood >= (creature.foodNeeded || 1);
  }
}

module.exports = MegamouthHandler;
