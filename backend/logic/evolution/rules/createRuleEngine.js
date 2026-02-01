/**
 * 規則引擎工廠
 *
 * @module logic/evolution/rules/createRuleEngine
 */

const RuleEngine = require('./RuleEngine');
const { RULE_IDS } = require('./ruleIds');
const { HOOK_NAMES } = require('./hookNames');

/**
 * 建立並初始化規則引擎
 * @param {Object} [options={}] - 配置選項
 * @param {Object} [options.traitRegistry] - 性狀註冊中心
 * @param {boolean} [options.debug=false] - 是否啟用除錯模式
 * @param {Function} [options.logger] - 自訂日誌函數
 * @returns {RuleEngine} 初始化後的規則引擎
 */
function createRuleEngine(options = {}) {
  const engine = new RuleEngine();

  // 設定性狀註冊中心
  if (options.traitRegistry) {
    engine.setTraitRegistry(options.traitRegistry);
  }

  // 除錯中間件
  if (options.debug) {
    const logger = options.logger || console.log;

    engine.use(async (context, ruleId) => {
      logger(`[RuleEngine] Executing rule: ${ruleId}`);
      return context;
    });
  }

  return engine;
}

/**
 * 建立帶有基礎規則的規則引擎
 * @param {Object} [options={}] - 配置選項
 * @returns {RuleEngine}
 */
function createRuleEngineWithDefaults(options = {}) {
  const engine = createRuleEngine(options);

  // 可在此註冊預設規則
  // 由後續工單實作

  return engine;
}

module.exports = {
  createRuleEngine,
  createRuleEngineWithDefaults,
  RULE_IDS,
  HOOK_NAMES,
};
