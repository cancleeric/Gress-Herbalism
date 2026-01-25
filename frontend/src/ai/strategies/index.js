/**
 * AI 策略模組
 *
 * 包含三種難度的策略實現：
 * - EasyStrategy: 簡單難度（隨機決策）
 * - MediumStrategy: 中等難度（基礎推理）
 * - HardStrategy: 困難難度（完整推理引擎）
 *
 * @module ai/strategies
 */

export { default as BaseStrategy, ACTION_TYPE, validateStrategy } from './BaseStrategy';
export { default as EasyStrategy, createEasyStrategy } from './EasyStrategy';
export { default as MediumStrategy, createMediumStrategy } from './MediumStrategy';
export { default as HardStrategy } from './HardStrategy';
