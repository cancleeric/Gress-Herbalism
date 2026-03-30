/**
 * 深海生態性狀模組總匯出
 * @module expansions/deepSea/traits
 */

const {
  DEEP_SEA_TRAIT_CATEGORIES,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitsByCategory,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
} = require('./definitions');

const {
  DeepDiveHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GapingMawHandler,
  ElectroreceptionHandler,
  AbyssalAdaptationHandler,
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
} = require('./handlers');

module.exports = {
  // 定義
  DEEP_SEA_TRAIT_CATEGORIES,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  getDeepSeaTraitsByCategory,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,

  // 處理器
  DeepDiveHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GapingMawHandler,
  ElectroreceptionHandler,
  AbyssalAdaptationHandler,
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
};
