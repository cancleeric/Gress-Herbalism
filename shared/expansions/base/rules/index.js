/**
 * 基礎版規則集
 *
 * @module expansions/base/rules
 */

const foodRules = require('./foodRules');
const attackRules = require('./attackRules');
const feedingRules = require('./feedingRules');
const extinctionRules = require('./extinctionRules');
const scoreRules = require('./scoreRules');
const phaseRules = require('./phaseRules');

/**
 * 註冊所有基礎規則到規則引擎
 * @param {RuleEngine} engine - 規則引擎實例
 */
function registerBaseRules(engine) {
  foodRules.register(engine);
  attackRules.register(engine);
  feedingRules.register(engine);
  extinctionRules.register(engine);
  scoreRules.register(engine);
  phaseRules.register(engine);
}

/**
 * 取得所有基礎規則模組
 * @returns {Object} 規則模組映射
 */
function getAllRuleModules() {
  return {
    foodRules,
    attackRules,
    feedingRules,
    extinctionRules,
    scoreRules,
    phaseRules,
  };
}

module.exports = {
  registerBaseRules,
  getAllRuleModules,
  foodRules,
  attackRules,
  feedingRules,
  extinctionRules,
  scoreRules,
  phaseRules,
};
