/**
 * 遊戲邏輯模組入口
 * 工單 0164
 *
 * @module logic
 */

const cardLogic = require('./cardLogic');
const gameLogic = require('./gameLogic');
const scoreLogic = require('./scoreLogic');

module.exports = {
  ...cardLogic,
  ...gameLogic,
  ...scoreLogic
};
