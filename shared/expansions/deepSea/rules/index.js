/**
 * 深海生態擴充包 - 規則定義
 *
 * 深海環境特殊規則：
 * - 深海模式：每回合食物供給階段額外增加 1 個藍色食物
 * - 突破穴居：電感性狀可以突破穴居防禦（由 ElectroreceptionHandler 實作）
 * - 噴墨阻斷：噴墨標記後攻擊者本回合無法再攻擊（由 InkSquirtHandler 實作）
 *
 * @module expansions/deepSea/rules
 */

/**
 * 深海擴充包規則常數
 */
const DEEP_SEA_RULES = {
  /** 每回合額外增加的藍色食物數量（深海模式） */
  deepSeaFoodBonus: 1,
  /** 群游防禦需要的最少生物數量 */
  schoolingMinCreatures: 3,
  /** 噴墨攻擊次數上限（每回合） */
  inkSquirtUsesPerTurn: 1,
  /** 巨口額外進食次數（每回合） */
  gulperBonusFeedsPerTurn: 1,
};

/**
 * 向規則引擎注冊深海特殊規則
 * @param {RuleEngine} engine - 規則引擎實例
 */
function registerDeepSeaRules(engine) {
  if (!engine || typeof engine.registerRule !== 'function') {
    return;
  }

  // 深海食物供給規則：額外增加 1 個藍色食物
  engine.registerRule('deepSea:foodSupplyBonus', {
    description: '深海模式：食物供給階段額外增加 1 個藍色食物',
    execute: async (context) => {
      const { gameState } = context;
      if (!gameState.foodPool) {
        gameState.foodPool = { red: 0, blue: 0, yellow: 0 };
      }
      gameState.foodPool.blue = (gameState.foodPool.blue || 0) + DEEP_SEA_RULES.deepSeaFoodBonus;
      return { ...context, gameState };
    },
  });

  // 墨汁阻斷規則：被噴墨標記的生物無法攻擊
  engine.registerRule('deepSea:inkSprayAttackBlock', {
    description: '噴墨阻斷：被噴墨的生物本回合無法再次發動攻擊',
    execute: async (context) => {
      const { attacker } = context;
      if (attacker && attacker.inkSprayed) {
        return {
          ...context,
          blocked: true,
          reason: '被噴墨阻斷，本回合無法攻擊',
        };
      }
      return context;
    },
  });
}

module.exports = {
  DEEP_SEA_RULES,
  registerDeepSeaRules,
};
