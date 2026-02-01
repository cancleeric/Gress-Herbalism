/**
 * 寄生蟲性狀處理器
 * @module expansions/base/traits/handlers/feeding/ParasiteHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 寄生蟲性狀處理器
 *
 * 寄生蟲特性：
 * - 食量 +2
 * - 只能放在對手的生物上
 * - 可疊加
 */
class ParasiteHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.PARASITE]);
    this.isParasite = true; // 覆寫父類別的 isParasite 標記
  }

  /**
   * 寄生蟲只能放在對手生物上
   * 覆寫基礎類別的 canPlace
   */
  canPlace(context) {
    const { creature, player, targetCreature } = context;

    // 寄生蟲必須放在對手生物上
    if (creature.ownerId === player.id) {
      return { valid: false, reason: '寄生蟲只能放在對手的生物上' };
    }

    // 可疊加，不檢查是否已有相同性狀

    // 不需要檢查互斥（寄生蟲沒有互斥）

    return { valid: true, reason: '' };
  }

  /**
   * 放置寄生蟲後增加食量
   */
  onPlace(context) {
    const { creature, gameState } = context;

    // 增加食量
    creature.foodNeeded = (creature.foodNeeded || 1) + this.foodBonus;

    return gameState;
  }

  /**
   * 移除寄生蟲後減少食量
   */
  onRemove(context) {
    const { creature, gameState } = context;

    // 減少食量
    creature.foodNeeded = Math.max(1, (creature.foodNeeded || 1) - this.foodBonus);

    return gameState;
  }
}

module.exports = ParasiteHandler;
