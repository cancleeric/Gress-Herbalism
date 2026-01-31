/**
 * 演化論遊戲 - 邏輯模組統一匯出
 *
 * @module logic/evolution
 */

const cardLogic = require('./cardLogic');
const creatureLogic = require('./creatureLogic');
const feedingLogic = require('./feedingLogic');
const phaseLogic = require('./phaseLogic');
const gameLogic = require('./gameLogic');

module.exports = {
  // 卡牌邏輯
  ...cardLogic,

  // 生物邏輯
  ...creatureLogic,

  // 進食邏輯
  ...feedingLogic,

  // 階段邏輯
  ...phaseLogic,

  // 遊戲主邏輯
  ...gameLogic,

  // 模組分類匯出
  cardLogic,
  creatureLogic,
  feedingLogic,
  phaseLogic,
  gameLogic
};
