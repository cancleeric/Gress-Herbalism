/**
 * 本草 AI 模組入口
 * 工單 0223 - 遷移 AI 模組至 ai/herbalism/
 *
 * 此模組提供電腦玩家（AI）功能，讓單人也能玩本草推理遊戲。
 * 支援三種難度：簡單、中等、困難
 *
 * @module ai/herbalism
 */

// 核心類別
export { default as AIPlayer } from './AIPlayer';
export { default as InformationTracker, EVENT_TYPES, createInformationTracker } from './InformationTracker';
export { default as DecisionMaker, createDecisionMaker } from './DecisionMaker';
export { default as ProbabilityCalculator, createProbabilityCalculator } from './ProbabilityCalculator';

// 策略類別
export { default as BaseStrategy, ACTION_TYPE, validateStrategy } from './strategies/BaseStrategy';
export { default as EasyStrategy } from './strategies/EasyStrategy';
export { default as MediumStrategy } from './strategies/MediumStrategy';
export { default as HardStrategy } from './strategies/HardStrategy';

// 工廠函數
export { createAIPlayer } from './AIPlayer';
