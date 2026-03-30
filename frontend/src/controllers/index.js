/**
 * Controllers 統一匯出
 * 工單 0225 - 遷移 Hooks 和 Controllers
 *
 * @module controllers
 */

export * as herbalism from './herbalism';

// 向後相容
export { LocalGameController } from './herbalism';

// 演化論控制器
export * as evolution from './evolution';
export { LocalEvolutionGameController } from './evolution';
