/**
 * 共生性狀處理器
 * @module expansions/base/traits/handlers/interactive/SymbiosisHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 共生性狀處理器
 *
 * 共生特性（互動性狀）：
 * - 指定代表動物與被保護者
 * - 代表吃飽前被保護者不能獲得食物
 * - 肉食只能攻擊代表（被保護者受到保護）
 */
class SymbiosisHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.SYMBIOSIS]);
  }

  /**
   * 放置時需要指定代表與被保護者
   */
  onPlace(context) {
    const { creature, targetCreature, gameState } = context;

    if (!targetCreature) {
      return gameState;
    }

    // creature 是代表，targetCreature 是被保護者
    const thisTrait = creature.traits?.find(t =>
      t.type === TRAIT_TYPES.SYMBIOSIS && !t.protectedCreatureId
    );
    if (thisTrait) {
      thisTrait.protectedCreatureId = targetCreature.id;
      thisTrait.isRepresentative = true;
    }

    // 標記被保護者
    targetCreature.symbiosisRepresentativeId = creature.id;

    return gameState;
  }

  /**
   * 被保護者在代表吃飽前不能進食
   */
  checkCanFeed(context) {
    const { creature, gameState } = context;

    // 檢查是否是被保護者
    if (!creature.symbiosisRepresentativeId) {
      return { canFeed: true, reason: '' };
    }

    // 找到代表
    let representative = null;
    for (const player of gameState.players || []) {
      representative = player.creatures?.find(c => c.id === creature.symbiosisRepresentativeId);
      if (representative) break;
    }

    if (!representative) {
      // 代表不存在，解除保護
      creature.symbiosisRepresentativeId = null;
      return { canFeed: true, reason: '' };
    }

    // 檢查代表是否吃飽
    const repFood = (representative.food?.red || 0) + (representative.food?.blue || 0);
    const repIsFed = repFood >= (representative.foodNeeded || 1);

    if (!repIsFed) {
      return {
        canFeed: false,
        reason: '共生代表尚未吃飽，被保護者不能進食',
      };
    }

    return { canFeed: true, reason: '' };
  }

  /**
   * 被保護者受到保護，不能被攻擊
   */
  checkDefense(context) {
    const { defender, gameState } = context;

    // 檢查是否是被保護者
    if (!defender.symbiosisRepresentativeId) {
      return { canAttack: true, reason: '' };
    }

    // 找到代表
    let representative = null;
    for (const player of gameState.players || []) {
      representative = player.creatures?.find(c => c.id === defender.symbiosisRepresentativeId);
      if (representative) break;
    }

    if (representative) {
      return {
        canAttack: false,
        reason: '受共生保護，只能攻擊代表',
      };
    }

    // 代表不存在，解除保護
    defender.symbiosisRepresentativeId = null;
    return { canAttack: true, reason: '' };
  }

  /**
   * 移除時解除共生關係
   */
  onRemove(context) {
    const { creature, gameState } = context;

    // 找到被保護者並解除保護
    const protectedId = creature.traits?.find(t => t.type === TRAIT_TYPES.SYMBIOSIS)?.protectedCreatureId;
    if (protectedId) {
      for (const player of gameState.players || []) {
        const protectedCreature = player.creatures?.find(c => c.id === protectedId);
        if (protectedCreature) {
          protectedCreature.symbiosisRepresentativeId = null;
        }
      }
    }

    return gameState;
  }
}

module.exports = SymbiosisHandler;
