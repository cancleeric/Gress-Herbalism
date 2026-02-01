/**
 * 規則引擎模組統一匯出
 *
 * @module logic/evolution/rules
 */

const RuleEngine = require('./RuleEngine');
const { RULE_IDS } = require('./ruleIds');
const { HOOK_NAMES } = require('./hookNames');
const { createRuleEngine, createRuleEngineWithDefaults } = require('./createRuleEngine');

module.exports = {
  RuleEngine,
  RULE_IDS,
  HOOK_NAMES,
  createRuleEngine,
  createRuleEngineWithDefaults,
};
