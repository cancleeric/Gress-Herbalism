/**
 * 演化論 AI 模組入口
 *
 * @module ai/evolution
 */

export { default as EvolutionAIPlayer, createEvolutionAIPlayer, EVOLUTION_AI_NAMES } from './EvolutionAIPlayer';
export { default as BasicStrategy } from './strategies/BasicStrategy';
export { default as CarnivoreStrategy } from './strategies/CarnivoreStrategy';
export { default as DefenseStrategy } from './strategies/DefenseStrategy';
export { default as StrategicStrategy } from './strategies/StrategicStrategy';
