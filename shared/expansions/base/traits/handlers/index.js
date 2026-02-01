/**
 * 基礎擴充包性狀處理器總匯出
 * @module expansions/base/traits/handlers
 */

const { CarnivoreHandler, ScavengerHandler, SharpVisionHandler } = require('./carnivore');
const {
  CamouflageHandler,
  BurrowingHandler,
  PoisonousHandler,
  AquaticHandler,
  AgileHandler,
  MassiveHandler,
  TailLossHandler,
  MimicryHandler,
} = require('./defense');
const {
  FatTissueHandler,
  HibernationHandler,
  ParasiteHandler,
  RobberyHandler,
} = require('./feeding');
const {
  CommunicationHandler,
  CooperationHandler,
  SymbiosisHandler,
} = require('./interactive');
const { TramplingHandler } = require('./special');

const { TRAIT_TYPES } = require('../definitions');

/**
 * 所有性狀處理器映射
 */
const TRAIT_HANDLERS = {
  // 肉食相關
  [TRAIT_TYPES.CARNIVORE]: CarnivoreHandler,
  [TRAIT_TYPES.SCAVENGER]: ScavengerHandler,
  [TRAIT_TYPES.SHARP_VISION]: SharpVisionHandler,

  // 防禦相關
  [TRAIT_TYPES.CAMOUFLAGE]: CamouflageHandler,
  [TRAIT_TYPES.BURROWING]: BurrowingHandler,
  [TRAIT_TYPES.POISONOUS]: PoisonousHandler,
  [TRAIT_TYPES.AQUATIC]: AquaticHandler,
  [TRAIT_TYPES.AGILE]: AgileHandler,
  [TRAIT_TYPES.MASSIVE]: MassiveHandler,
  [TRAIT_TYPES.TAIL_LOSS]: TailLossHandler,
  [TRAIT_TYPES.MIMICRY]: MimicryHandler,

  // 進食相關
  [TRAIT_TYPES.FAT_TISSUE]: FatTissueHandler,
  [TRAIT_TYPES.HIBERNATION]: HibernationHandler,
  [TRAIT_TYPES.PARASITE]: ParasiteHandler,
  [TRAIT_TYPES.ROBBERY]: RobberyHandler,

  // 互動相關
  [TRAIT_TYPES.COMMUNICATION]: CommunicationHandler,
  [TRAIT_TYPES.COOPERATION]: CooperationHandler,
  [TRAIT_TYPES.SYMBIOSIS]: SymbiosisHandler,

  // 特殊能力
  [TRAIT_TYPES.TRAMPLING]: TramplingHandler,
};

/**
 * 建立處理器實例
 * @param {string} traitType - 性狀類型
 * @returns {TraitHandler|null} 處理器實例
 */
function createHandler(traitType) {
  const HandlerClass = TRAIT_HANDLERS[traitType];
  if (!HandlerClass) {
    return null;
  }
  return new HandlerClass();
}

/**
 * 取得所有處理器類別
 * @returns {Object} 處理器類別映射
 */
function getAllHandlerClasses() {
  return { ...TRAIT_HANDLERS };
}

/**
 * 註冊所有處理器到 TraitRegistry
 * @param {TraitRegistry} registry - 性狀註冊表
 */
function registerAllHandlers(registry) {
  for (const [traitType, HandlerClass] of Object.entries(TRAIT_HANDLERS)) {
    const handler = new HandlerClass();
    registry.register(traitType, handler);
  }
}

module.exports = {
  // 處理器類別
  CarnivoreHandler,
  ScavengerHandler,
  SharpVisionHandler,
  CamouflageHandler,
  BurrowingHandler,
  PoisonousHandler,
  AquaticHandler,
  AgileHandler,
  MassiveHandler,
  TailLossHandler,
  MimicryHandler,
  FatTissueHandler,
  HibernationHandler,
  ParasiteHandler,
  RobberyHandler,
  CommunicationHandler,
  CooperationHandler,
  SymbiosisHandler,
  TramplingHandler,

  // 輔助函數
  TRAIT_HANDLERS,
  createHandler,
  getAllHandlerClasses,
  registerAllHandlers,
};
