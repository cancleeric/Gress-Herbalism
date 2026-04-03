/**
 * 深海生態擴充包 - 性狀模組匯出
 * @module expansions/deepSea/traits
 */

const {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
} = require('./definitions');

const {
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
  DeepDiveHandler,
  SchoolingHandler,
  InkSquirtHandler,
  BioluminescenceHandler,
  ElectroreceptionHandler,
  GulperHandler,
} = require('./handlers');

module.exports = {
  // 定義
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,

  // 處理器
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
  DeepDiveHandler,
  SchoolingHandler,
  InkSquirtHandler,
  BioluminescenceHandler,
  ElectroreceptionHandler,
  GulperHandler,
};
