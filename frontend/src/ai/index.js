/**
 * AI 模組入口
 *
 * 此模組提供電腦玩家（AI）功能，讓單人也能玩本草推理遊戲。
 * 支援三種難度：簡單、中等、困難
 *
 * @module ai
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

// 決策模組
export { default as QuestionDecision } from './decisions/QuestionDecision';
export { default as GuessDecision } from './decisions/GuessDecision';
export { default as FollowGuessDecision } from './decisions/FollowGuessDecision';
export { default as PredictionDecision } from './decisions/PredictionDecision';
export { default as ExpectedValueCalculator } from './decisions/ExpectedValueCalculator';

// 工廠函數
export { createAIPlayer } from './AIPlayer';
