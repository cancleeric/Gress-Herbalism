/**
 * 巨口性狀處理器
 * @module expansions/deep-sea/traits/handlers/GiantMawHandler
 */

const TraitHandler = require('../../../../../backend/logic/evolution/traits/TraitHandler');
const { DEEP_SEA_TRAIT_DEFINITIONS, DEEP_SEA_TRAIT_TYPES } = require('../definitions');

// 肉食性狀類型（從基礎版定義取得）
const CARNIVORE_TYPE = 'carnivore';

/**
 * 巨口性狀處理器
 *
 * 巨口生物特性：
 * - 攻擊成功時獲得 3 個藍色食物（標準為 2 個）
 * - 只能放在有肉食的生物上
 */
class GiantMawHandler extends TraitHandler {
  constructor() {
    super(DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GIANT_MAW]);
  }

  /**
   * 驗證放置：只能放在有肉食的生物上
   */
  canPlace(context) {
    const result = super.canPlace(context);
    if (!result.valid) return result;

    const { creature } = context;
    const hasCarnivore = creature.traits?.some(t => t.type === CARNIVORE_TYPE);
    if (!hasCarnivore) {
      return { valid: false, reason: '巨口只能放在已有肉食性狀的生物上' };
    }

    return { valid: true, reason: '' };
  }
}

module.exports = GiantMawHandler;
