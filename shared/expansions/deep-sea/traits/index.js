/**
 * 深海擴充包性狀模組匯出
 * @module expansions/deep-sea/traits
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
  PressureResistanceHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GulperHandler,
  ElectroreceptionHandler,
} = require('./handlers');

module.exports = {
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTraitDefinition,
  getDeepSeaTotalCardCount,
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
  DeepDiveHandler,
  PressureResistanceHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GulperHandler,
  ElectroreceptionHandler,
};
