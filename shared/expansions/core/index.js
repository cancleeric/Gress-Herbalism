/**
 * 擴充包核心模組
 *
 * 提供效果系統、事件系統等核心功能
 *
 * @module expansions/core
 */

const {
  EFFECT_TIMING,
  EFFECT_TYPE,
  EFFECT_PRIORITY,
  EFFECT_RESULT,
} = require('./effectTypes');

const {
  Effect,
  EffectHandler,
} = require('./effectSystem');

const {
  EffectQueue,
  effectQueue,
} = require('./effectQueue');

const {
  GainFoodHandler,
  LoseFoodHandler,
  StoreFatHandler,
  UseFatHandler,
  BlockAttackHandler,
  RedirectAttackHandler,
  DestroyCreatureHandler,
  RemoveTraitHandler,
  ApplyPoisonHandler,
  registerBuiltinHandlers,
  findCreature,
} = require('./handlers/builtinEffectHandlers');

const {
  GAME_EVENTS,
  EventData,
} = require('./gameEvents');

const {
  GameEventEmitter,
  gameEventEmitter,
} = require('./eventEmitter');

const {
  TraitEventBridge,
} = require('./traitEventBridge');

module.exports = {
  // 效果類型常數
  EFFECT_TIMING,
  EFFECT_TYPE,
  EFFECT_PRIORITY,
  EFFECT_RESULT,

  // 效果系統
  Effect,
  EffectHandler,

  // 效果佇列
  EffectQueue,
  effectQueue,

  // 內建處理器
  GainFoodHandler,
  LoseFoodHandler,
  StoreFatHandler,
  UseFatHandler,
  BlockAttackHandler,
  RedirectAttackHandler,
  DestroyCreatureHandler,
  RemoveTraitHandler,
  ApplyPoisonHandler,
  registerBuiltinHandlers,

  // 遊戲事件
  GAME_EVENTS,
  EventData,

  // 事件發射器
  GameEventEmitter,
  gameEventEmitter,

  // 性狀事件橋接
  TraitEventBridge,

  // 工具函數
  findCreature,
};
