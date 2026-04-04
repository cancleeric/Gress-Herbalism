/**
 * 深海生態擴充包規則
 *
 * 深海環境特殊規則：
 * 1. 深海食物池：若有 >= 1 名玩家控制深海生物（深潛/電擊/發光/群游），
 *    每回合額外投入 1 個藍色食物到食物池
 * 2. 電擊反制：攻擊帶有電擊的生物時，攻擊者損失 1 個藍色食物
 * 3. 巨口獎勵：巨口攻擊成功獲得 3 個藍色食物（規則引擎覆寫）
 *
 * @module expansions/deep-sea/rules
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');
const { ElectricHandler } = require('../traits/handlers');

/**
 * 深海生態擴充包特殊規則常數
 */
const DEEP_SEA_RULES = {
  deepSeaFoodBonus: 1,
  megamouthAttackReward: 3,
  electricFoodPenalty: 1,
};

/**
 * 深海生態的標誌性性狀（決定是否啟用深海規則）
 */
const DEEP_SEA_INDICATOR_TRAITS = [
  DEEP_SEA_TRAIT_TYPES.DEEP_DIVE,
  DEEP_SEA_TRAIT_TYPES.ELECTRIC,
  DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE,
  DEEP_SEA_TRAIT_TYPES.SCHOOLING,
  DEEP_SEA_TRAIT_TYPES.MEGAMOUTH,
  DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION,
];

/**
 * 檢查遊戲中是否有深海生物
 * @param {Object} gameState - 遊戲狀態
 * @returns {boolean}
 */
function hasDeepSeaCreatures(gameState) {
  for (const player of gameState.players || []) {
    for (const creature of player.creatures || []) {
      const hasDeepSeaTrait = creature.traits?.some(
        t => DEEP_SEA_INDICATOR_TRAITS.includes(t.type)
      );
      if (hasDeepSeaTrait) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 深海食物補充規則：若有深海生物，每輪額外補充 1 個藍色食物
 * @param {Object} gameState - 遊戲狀態
 * @returns {Object} 修改後的 gameState
 */
function applyDeepSeaFoodBonus(gameState) {
  if (hasDeepSeaCreatures(gameState) && gameState.foodPool) {
    gameState.foodPool.blue = (gameState.foodPool.blue || 0) + DEEP_SEA_RULES.deepSeaFoodBonus;
  }
  return gameState;
}

/**
 * 電擊反制規則：攻擊帶有電擊性狀的生物時，攻擊者損失 1 個藍色食物
 * @param {Object} attacker - 攻擊方生物
 * @param {Object} defender - 防禦方生物
 * @returns {boolean} 是否觸發電擊效果
 */
function applyElectricEffect(attacker, defender) {
  const hasElectric = defender.traits?.some(
    t => t.type === DEEP_SEA_TRAIT_TYPES.ELECTRIC
  );

  if (hasElectric) {
    return ElectricHandler.applyElectricEffect(attacker);
  }

  return false;
}

/**
 * 巨口攻擊獎勵規則：攻擊成功時取得的食物獎勵
 * @param {Object} attacker - 攻擊方生物
 * @returns {number} 食物獎勵數量
 */
function getMegamouthFoodReward(attacker) {
  const hasMegamouth = attacker.traits?.some(
    t => t.type === DEEP_SEA_TRAIT_TYPES.MEGAMOUTH
  );
  return hasMegamouth ? DEEP_SEA_RULES.megamouthAttackReward : null;
}

/**
 * 註冊深海生態規則到規則引擎
 * @param {Object} engine - 規則引擎實例
 */
function registerDeepSeaRules(engine) {
  if (!engine) return;

  // 食物補充階段：深海食物加成
  if (typeof engine.on === 'function') {
    engine.on('food:supply', (gameState) => {
      return applyDeepSeaFoodBonus(gameState);
    });

    // 攻擊階段：電擊效果
    engine.on('attack:before', (context) => {
      const { attacker, defender } = context;
      if (attacker && defender) {
        applyElectricEffect(attacker, defender);
      }
      return context;
    });

    // 攻擊成功：巨口額外食物
    engine.on('attack:success', (context) => {
      const { attacker } = context;
      const megamouthReward = getMegamouthFoodReward(attacker);
      if (megamouthReward !== null) {
        context.foodReward = megamouthReward;
      }
      return context;
    });
  }
}

module.exports = {
  DEEP_SEA_RULES,
  DEEP_SEA_INDICATOR_TRAITS,
  hasDeepSeaCreatures,
  applyDeepSeaFoodBonus,
  applyElectricEffect,
  getMegamouthFoodReward,
  registerDeepSeaRules,
};
