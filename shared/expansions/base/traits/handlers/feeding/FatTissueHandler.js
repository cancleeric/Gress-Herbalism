/**
 * 脂肪組織性狀處理器
 * @module expansions/base/traits/handlers/feeding/FatTissueHandler
 */

const TraitHandler = require('../../../../../../backend/logic/evolution/traits/TraitHandler');
const { TRAIT_DEFINITIONS, TRAIT_TYPES } = require('../../definitions');

/**
 * 脂肪組織性狀處理器
 *
 * 脂肪組織生物特性：
 * - 吃飽後可繼續獲得食物，儲存為黃色脂肪標記
 * - 每張脂肪組織卡可儲存 1 個脂肪
 * - 可在進食階段消耗脂肪滿足食量
 * - 可疊加
 */
class FatTissueHandler extends TraitHandler {
  constructor() {
    super(TRAIT_DEFINITIONS[TRAIT_TYPES.FAT_TISSUE]);
  }

  /**
   * 進食時可以儲存脂肪
   */
  onFeed(context) {
    const { creature, gameState, foodType } = context;

    // 檢查是否吃飽
    const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
    const isFed = currentFood >= (creature.foodNeeded || 1);

    if (isFed && foodType) {
      // 計算可以儲存的脂肪數量（根據脂肪組織數量）
      const fatTissueCount = creature.traits?.filter(t => t.type === TRAIT_TYPES.FAT_TISSUE).length || 0;
      const currentFat = creature.food?.yellow || 0;
      const maxFat = fatTissueCount;

      if (currentFat < maxFat) {
        // 儲存為脂肪
        if (!creature.food) {
          creature.food = { red: 0, blue: 0, yellow: 0 };
        }
        creature.food.yellow += 1;

        if (!gameState.actionLog) {
          gameState.actionLog = [];
        }
        gameState.actionLog.push({
          type: 'FAT_STORED',
          creatureId: creature.id,
          fatAmount: creature.food.yellow,
        });
      }
    }

    return gameState;
  }

  /**
   * 檢查是否可以使用脂肪
   */
  canUseAbility(context) {
    const { creature } = context;

    const currentFat = creature.food?.yellow || 0;
    if (currentFat <= 0) {
      return { canUse: false, reason: '沒有儲存的脂肪' };
    }

    // 檢查是否還需要食物
    const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
    if (currentFood >= (creature.foodNeeded || 1)) {
      return { canUse: false, reason: '已經吃飽' };
    }

    return { canUse: true, reason: '' };
  }

  /**
   * 使用脂肪
   */
  useAbility(context, target) {
    const { creature, gameState } = context;

    if (!creature.food || creature.food.yellow <= 0) {
      return {
        success: false,
        gameState,
        message: '沒有脂肪可以使用',
      };
    }

    // 消耗脂肪，轉換為藍色食物
    creature.food.yellow -= 1;
    creature.food.blue += 1;

    if (!gameState.actionLog) {
      gameState.actionLog = [];
    }
    gameState.actionLog.push({
      type: 'FAT_USED',
      creatureId: creature.id,
      remainingFat: creature.food.yellow,
    });

    return {
      success: true,
      gameState,
      message: '消耗脂肪獲得食物',
    };
  }

  /**
   * 滅絕檢查時，可以使用脂肪存活
   */
  checkExtinction(context) {
    const { creature } = context;

    const currentFood = (creature.food?.red || 0) + (creature.food?.blue || 0);
    const currentFat = creature.food?.yellow || 0;

    // 如果有足夠的脂肪補充，可以存活
    if (currentFood + currentFat >= (creature.foodNeeded || 1)) {
      return {
        shouldSurvive: true,
        reason: '使用脂肪存活',
      };
    }

    return { shouldSurvive: false, reason: '' };
  }
}

module.exports = FatTissueHandler;
