/**
 * Hooks 統一匯出
 * 工單 0225 - 遷移 Hooks 和 Controllers
 * Issue #7  - 新增 useSocketConnection hook
 *
 * @module hooks
 */

export * as herbalism from './herbalism';

// 向後相容
export { useAIPlayers } from './herbalism';

// Issue #7：Socket 連線 hook
export { useSocketConnection } from './useSocketConnection';
