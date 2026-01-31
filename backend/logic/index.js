/**
 * 遊戲邏輯模組入口
 * 工單 0219 - 重組為多遊戲架構
 *
 * @module logic
 */

const herbalism = require('./herbalism');

module.exports = {
  herbalism,
  // 向後相容：直接匯出本草邏輯
  ...herbalism
};
