/**
 * 電感性狀處理器
 * @module expansions/deepSea/traits/handlers/ElectroreceptionHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_TYPES, DEEP_SEA_TRAIT_DEFINITIONS } = require('../definitions');

/**
 * 電感性狀處理器
 *
 * 電感特性（輔助肉食性狀）：
 * - 擁有此性狀的肉食生物可突破穴居防禦
 * - 即使穴居生物已吃飽也可以發動攻擊
 * - 注意：此性狀本身不賦予攻擊能力，需搭配肉食性狀使用
 */
class ElectroreceptionHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]);
  }

  /**
   * 電感生物可以突破穴居防禦
   * 此方法在攻擊方的性狀中觸發，用於修改攻擊能力
   */
  canUseAbility(context) {
    const { creature } = context;
    const hasCarnivore = creature.traits?.some(t => t.type === 'carnivore');

    if (!hasCarnivore) {
      return {
        canUse: false,
        reason: '電感需要搭配肉食性狀才能發揮突破穴居的效果',
      };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 取得可攻擊的目標（包含穴居已吃飽的生物）
   */
  getAbilityTargets(context) {
    const { creature, gameState } = context;
    const targets = [];

    for (const player of gameState.players || []) {
      for (const target of player.creatures || []) {
        if (target.id === creature.id) continue;

        // 電感可以攻擊穴居中的生物
        const hasBurrowing = target.traits?.some(t => t.type === 'burrowing');
        const isFed = this._isFed(target);

        if (hasBurrowing && isFed) {
          targets.push({
            creatureId: target.id,
            ownerId: player.id,
            ownerName: player.name,
            bypassBurrowing: true,
          });
        }
      }
    }

    return targets;
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

module.exports = ElectroreceptionHandler;
