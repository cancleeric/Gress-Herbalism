/**
 * 銳目性狀處理器
 * @module expansions/base/traits/handlers/carnivore/SharpVisionHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 銳目性狀處理器
 *
 * 銳目生物特性：
 * - 可以攻擊具有偽裝性狀的生物
 *
 * 注意：銳目本身沒有特殊邏輯，它的效果是在 CamouflageHandler.checkDefense 中檢查
 */
class SharpVisionHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.SHARP_VISION]);
  }

  // 銳目本身沒有特殊邏輯
  // 它的效果是在 CamouflageHandler.checkDefense 中檢查
  // 這裡保持空實作，作為標記性狀
}

module.exports = SharpVisionHandler;
