/**
 * 演化論 AI 模組入口
 *
 * 提供演化論遊戲的電腦玩家（AI）功能。
 * 支援四種策略：基礎隨機、策略型、肉食攻擊、防禦型。
 *
 * @module ai/evolution
 */

// 核心 AI 玩家
export { default as EvolutionAIPlayer, EVOLUTION_AI_STRATEGY, createEvolutionAIPlayer } from './EvolutionAIPlayer';

// 策略類別
export { default as BasicStrategy, EVOLUTION_ACTION, FEEDING_ACTION, createBasicStrategy } from './BasicStrategy';
export { default as StrategicStrategy, createStrategicStrategy } from './StrategicStrategy';
export { default as CarnivoreStrategy, createCarnivoreStrategy } from './CarnivoreStrategy';
export { default as DefenseStrategy, createDefenseStrategy } from './DefenseStrategy';
