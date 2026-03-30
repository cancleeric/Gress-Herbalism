/**
 * AI 模組統一入口
 * 工單 0223 - 遷移 AI 模組至 ai/herbalism/
 *
 * @module ai
 */

// 匯出 herbalism 模組
export * as herbalism from './herbalism';

// 向後相容：直接匯出本草 AI
export * from './herbalism';

// 匯出 evolution 模組
export * as evolution from './evolution';
export { createEvolutionAIPlayer } from './evolution';
