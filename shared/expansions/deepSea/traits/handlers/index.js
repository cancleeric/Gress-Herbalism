/**
 * 深海生態擴充包 - 性狀處理器總匯出
 * @module expansions/deepSea/traits/handlers
 */

const DeepDiveHandler = require('./DeepDiveHandler');
const SchoolingHandler = require('./SchoolingHandler');
const InkSquirtHandler = require('./InkSquirtHandler');
const BioluminescenceHandler = require('./BioluminescenceHandler');
const ElectroreceptionHandler = require('./ElectroreceptionHandler');
const GulperHandler = require('./GulperHandler');

const { DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 深海擴充包性狀處理器映射
 */
const DEEP_SEA_TRAIT_HANDLERS = {
  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: DeepDiveHandler,
  [DEEP_SEA_TRAIT_TYPES.SCHOOLING]: SchoolingHandler,
  [DEEP_SEA_TRAIT_TYPES.INK_SQUIRT]: InkSquirtHandler,
  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: BioluminescenceHandler,
  [DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]: ElectroreceptionHandler,
  [DEEP_SEA_TRAIT_TYPES.GULPER]: GulperHandler,
};

/**
 * 建立處理器實例
 * @param {string} traitType - 性狀類型
 * @returns {TraitHandler|null}
 */
function createDeepSeaHandler(traitType) {
  const HandlerClass = DEEP_SEA_TRAIT_HANDLERS[traitType];
  if (!HandlerClass) return null;
  return new HandlerClass();
}

/**
 * 建立所有處理器實例
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
  SchoolingHandler,
  InkSquirtHandler,
  BioluminescenceHandler,
  ElectroreceptionHandler,
  GulperHandler,
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
  createAllDeepSeaHandlerInstances,
};
