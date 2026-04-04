/**
 * 深海生態擴充包性狀模組匯出
 * @module expansions/deep-sea/traits
 */

const {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitDefinition,
  getTotalDeepSeaCardCount,
} = require('./definitions');

const {
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
  DeepDiveHandler,
  ElectricHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  MegamouthHandler,
  AbyssalAdaptationHandler,
} = require('./handlers');

module.exports = {
  // 性狀定義
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitDefinition,
  getTotalDeepSeaCardCount,

  // 性狀處理器
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
  DeepDiveHandler,
  ElectricHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  MegamouthHandler,
  AbyssalAdaptationHandler,
};
