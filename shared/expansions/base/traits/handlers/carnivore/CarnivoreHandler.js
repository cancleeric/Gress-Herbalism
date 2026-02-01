/**
 * 肉食性狀處理器
 * @module expansions/base/traits/handlers/carnivore/CarnivoreHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 肉食性狀處理器
 *
 * 肉食生物特性：
 * - 食量 +1
 * - 不能從食物池進食
 * - 必須透過攻擊其他生物獲得食物
 * - 攻擊成功獲得 2 個藍色食物
 */
class CarnivoreHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.CARNIVORE]);
  }

  /**
   * 肉食生物不能從食物池進食
   */
  checkCanFeed(context) {
    return {
      canFeed: false,
      reason: '肉食生物必須透過攻擊獲得食物',
    };
  }

  /**
   * 肉食生物可以發動攻擊
   */
  canUseAbility(context) {
    const { creature } = context;

    // 檢查是否已經攻擊過
    if (creature.hasAttackedThisTurn) {
      return { canUse: false, reason: '本回合已經攻擊過' };
    }

    // 檢查是否吃飽
    if (this._isFed(creature)) {
      return { canUse: false, reason: '已經吃飽，不需要攻擊' };
    }

    // 檢查是否有可攻擊的目標
    const targets = this.getAbilityTargets(context);
    if (targets.length === 0) {
      return { canUse: false, reason: '沒有可攻擊的目標' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 取得可攻擊的目標
   */
  getAbilityTargets(context) {
    const { creature, gameState } = context;
    const targets = [];

    for (const player of gameState.players || []) {
      for (const target of player.creatures || []) {
        // 跳過自己
        if (target.id === creature.id) continue;

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
   * 執行攻擊
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    // 標記已攻擊
    creature.hasAttackedThisTurn = true;

    // 攻擊結算由規則引擎處理
    // 這裡只返回攻擊意圖
    return {
      success: true,
      gameState,
      message: '發動攻擊',
      attackIntent: {
        attackerId: creature.id,
        targetId: target.creatureId,
      },
    };
  }

  /**
   * 回合開始重置攻擊狀態
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

module.exports = CarnivoreHandler;
