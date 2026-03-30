/**
 * 深海生態擴充包性狀處理器總匯出
 * @module expansions/deepSea/traits/handlers
 */

const DeepDiveHandler = require('./DeepDiveHandler');
const BioluminescenceHandler = require('./BioluminescenceHandler');
const SchoolingHandler = require('./SchoolingHandler');
const GapingMawHandler = require('./GapingMawHandler');
const ElectroreceptionHandler = require('./ElectroreceptionHandler');
const AbyssalAdaptationHandler = require('./AbyssalAdaptationHandler');

const { DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 深海生態所有性狀處理器映射
 */
const DEEP_SEA_TRAIT_HANDLERS = {
  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: DeepDiveHandler,
  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: BioluminescenceHandler,
  [DEEP_SEA_TRAIT_TYPES.SCHOOLING]: SchoolingHandler,
  [DEEP_SEA_TRAIT_TYPES.GAPING_MAW]: GapingMawHandler,
  [DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]: ElectroreceptionHandler,
  [DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION]: AbyssalAdaptationHandler,
};

/**
 * 建立深海處理器實例
 * @param {string} traitType - 性狀類型
 * @returns {TraitHandler|null} 處理器實例
 */
function createDeepSeaHandler(traitType) {
  const HandlerClass = DEEP_SEA_TRAIT_HANDLERS[traitType];
  if (!HandlerClass) {
    return null;
  }
  return new HandlerClass();
}

/**
 * 建立所有深海處理器實例物件
 * @returns {Object<string, TraitHandler>}
 */
function createAllDeepSeaHandlerInstances() {
  const instances = {};
  for (const [traitType, HandlerClass] of Object.entries(DEEP_SEA_TRAIT_HANDLERS)) {
    instances[traitType] = new HandlerClass();
  }
  return instances;
}

module.exports = {
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
