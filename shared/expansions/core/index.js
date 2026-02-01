/**
 * 擴充包核心模組
 *
 * 提供效果系統、效果佇列、效果類型等核心功能
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

  // 工具函數
  findCreature,
};
