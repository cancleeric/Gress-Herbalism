/**
 * 深海生態擴充包規則
 *
 * 深海環境特殊規則：
 * 1. 巨口攻擊獎勵：攻擊成功時獲得 3 個藍色食物（而非 2 個）
 * 2. 發光吸引食物：在進食階段額外取得 1 個食物
 * 3. 深潛防禦：只有電感可穿透深潛防禦
 * 4. 群游保護：控制 2+ 群游生物時觸發逃脫骰
 * 5. 墨汁防禦：每回合一次免疫攻擊
 *
 * @module expansions/deep-sea/rules
 */

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');

/**
 * 巨口攻擊獎勵（藍色食物數）
 */
const GIANT_MAW_ATTACK_REWARD = 3;

/**
 * 群游逃脫擲骰門檻（>= 此值則逃脫）
 */
const SCHOOLING_ESCAPE_THRESHOLD = 4;

/**
 * 群游觸發所需最低數量
 */
const SCHOOLING_MIN_COUNT = 2;

/**
 * 將深海規則註冊到 RuleEngine
 * @param {Object} engine - 規則引擎
 */
function registerDeepSeaRules(engine) {
  if (!engine || typeof engine.register !== 'function') return;

  // 規則 1：巨口攻擊獎勵
  engine.register('deep-sea:giant-maw-reward', {
    name: '巨口攻擊獎勵',
    description: '擁有巨口的肉食攻擊成功時獲得 3 個藍色食物',
    condition: (context) => {
      const { attacker } = context;
      return attacker?.traits?.some(t => t.type === DEEP_SEA_TRAIT_TYPES.GIANT_MAW);
    },
    apply: (context) => {
      return { ...context, attackReward: GIANT_MAW_ATTACK_REWARD };
    },
  });

  // 規則 2：深潛防禦
  engine.register('deep-sea:deep-dive-defense', {
    name: '深潛防禦',
    description: '只有電感才能攻擊深潛生物',
    condition: (context) => {
      const { defender } = context;
      return defender?.traits?.some(t => t.type === DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
    },
    apply: (context) => {
      const { attacker } = context;
      const hasElectroreception = attacker?.traits?.some(
        t => t.type === DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION
      );
      if (!hasElectroreception) {
        return { ...context, blocked: true, reason: '需要電感才能攻擊深潛生物' };
      }
      return context;
    },
  });
}

module.exports = {
  GIANT_MAW_ATTACK_REWARD,
  SCHOOLING_ESCAPE_THRESHOLD,
  SCHOOLING_MIN_COUNT,
  registerDeepSeaRules,
};
