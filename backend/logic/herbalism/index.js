/**
 * 本草遊戲邏輯模組入口
 * 工單 0219 - 遷移本草後端邏輯
 *
 * @module logic/herbalism
 */

const cardLogic = require('./cardLogic');
const gameLogic = require('./gameLogic');
const scoreLogic = require('./scoreLogic');

module.exports = {
  cardLogic,
  gameLogic,
  scoreLogic,
  // 展開匯出以保持向後相容
  ...cardLogic,
  ...gameLogic,
  ...scoreLogic
};
