/**
 * 深海生態擴充包規則
 *
 * 深海環境特殊規則：
 * 1. 發光照亮：使目標的偽裝/穴居防禦在本階段失效
 * 2. 巨口攻擊：允許攻擊者無需巨化即可攻擊巨化生物
 * 3. 電感知穿透：允許攻擊者攻擊已飽食的穴居生物
 * 4. 深淵適應存活：滅絕階段食物不足時可觸發一次存活
 *
 * @module expansions/deepSea/rules
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');

/**
 * 深海攻擊驗證規則 ID
 */
const DEEP_SEA_RULE_IDS = {
  ATTACK_CHECK_DEEP_SEA: 'deepsea.attack.check',
  BIOLUMINESCENCE_APPLY: 'deepsea.bioluminescence.apply',
};

/**
 * 將深海規則注入現有的防禦檢查邏輯。
 *
 * 這些規則作為防禦修飾符運作：
 * - 如果目標被「發光」照亮，忽略其偽裝和穴居防禦
 * - 如果攻擊者有「巨口」，可以攻擊巨化生物
 * - 如果攻擊者有「電感知」，可以攻擊已飽食的穴居生物
 *
 * @param {Object} engine - 規則引擎
 */
function registerDeepSeaRules(engine) {
  /**
   * 合併防禦覆蓋物件到 context
   * @param {Object} ctx - 當前 context
   * @param {Object} overrides - 要合併的覆蓋物件
   * @returns {Object} 更新後的 context
   */
  function mergeDefenseOverride(ctx, overrides) {
    return {
      ...ctx,
      defenseOverrides: {
        ...(ctx.defenseOverrides || {}),
        ...overrides,
      },
    };
  }

  /**
   * 深海攻擊修飾符：在防禦性狀結果前套用深海特殊規則
   */
  engine.registerRule(DEEP_SEA_RULE_IDS.ATTACK_CHECK_DEEP_SEA, {
    description: '深海生態擴充包攻擊特殊規則',
    expansion: 'deep-sea',
    execute: (context) => {
      const { attacker, target } = context;

      // --- 規則 1：發光照亮 ---
      // 若目標被照亮，清除其偽裝和穴居的防禦效果
      if (target.isIlluminated) {
        context = mergeDefenseOverride(context, {
          camouflage: { bypass: true, reason: '目標被發光照亮，偽裝失效' },
          burrowing: { bypass: true, reason: '目標被發光照亮，穴居失效' },
        });
      }

      // --- 規則 2：巨口攻擊 ---
      // 若攻擊者有巨口，可以攻擊巨化生物
      const attackerHasGapingMaw = attacker.traits?.some(
        t => t.type === DEEP_SEA_TRAIT_TYPES.GAPING_MAW
      );
      if (attackerHasGapingMaw) {
        context = mergeDefenseOverride(context, {
          massive: { bypass: true, reason: '攻擊者有巨口，可攻擊巨化生物' },
        });
      }

      // --- 規則 3：電感知穿透 ---
      // 若攻擊者有電感知，可以攻擊已飽食的穴居生物
      const attackerHasElectroreception = attacker.traits?.some(
        t => t.type === DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION
      );
      if (attackerHasElectroreception) {
        context = mergeDefenseOverride(context, {
          burrowing: { bypass: true, reason: '攻擊者有電感知，可攻擊穴居生物' },
        });
      }

      return context;
    },
  });
}

/**
 * 深海規則設定
 */
const DEEP_SEA_RULES = {
  /** 深海食物池預設加成（深海環境食物較少） */
  foodPoolModifier: -1,
  /** 深潛保護激活距離（象徵意義） */
  deepDiveDepth: 'abyss',
};

module.exports = {
  registerDeepSeaRules,
  DEEP_SEA_RULE_IDS,
  DEEP_SEA_RULES,
};
