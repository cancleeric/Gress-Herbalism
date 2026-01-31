/**
 * Hooks 統一匯出
 * 工單 0225 - 遷移 Hooks 和 Controllers
 *
 * @module hooks
 */

export * as herbalism from './herbalism';

// 向後相容
export { useAIPlayers } from './herbalism';
