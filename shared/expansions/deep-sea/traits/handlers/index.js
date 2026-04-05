/**
 * 深海擴充包性狀處理器總匯出
 * @module expansions/deep-sea/traits/handlers
 */

const DeepDiveHandler = require('./DeepDiveHandler');
const BioluminescenceHandler = require('./BioluminescenceHandler');
const SchoolingHandler = require('./SchoolingHandler');
const GiantMawHandler = require('./GiantMawHandler');
const ElectroreceptionHandler = require('./ElectroreceptionHandler');
const InkCloudHandler = require('./InkCloudHandler');

const { DEEP_SEA_TRAIT_TYPES } = require('../definitions');

/**
 * 深海擴充包性狀處理器映射
 */
const DEEP_SEA_TRAIT_HANDLERS = {
  [DEEP_SEA_TRAIT_TYPES.DEEP_DIVE]: DeepDiveHandler,
  [DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE]: BioluminescenceHandler,
  [DEEP_SEA_TRAIT_TYPES.SCHOOLING]: SchoolingHandler,
  [DEEP_SEA_TRAIT_TYPES.GIANT_MAW]: GiantMawHandler,
  [DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION]: ElectroreceptionHandler,
  [DEEP_SEA_TRAIT_TYPES.INK_CLOUD]: InkCloudHandler,
};

/**
 * 建立處理器實例
 * @param {string} traitType - 性狀類型
 * @returns {TraitHandler|null}
 */
function createHandler(traitType) {
  const HandlerClass = DEEP_SEA_TRAIT_HANDLERS[traitType];
  if (!HandlerClass) return null;
  return new HandlerClass();
}

/**
 * 建立所有處理器實例
 * @returns {Object<string, TraitHandler>}
 */
function createAllHandlerInstances() {
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
  GiantMawHandler,
  ElectroreceptionHandler,
  InkCloudHandler,
  DEEP_SEA_TRAIT_HANDLERS,
  createHandler,
  createAllHandlerInstances,
};
