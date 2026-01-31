/**
 * 常數統一匯出
 * 工單 0221 - 重組共用常數目錄結構
 *
 * @module constants
 */

const common = require('./common');
const herbalism = require('./herbalism');
const evolution = require('./evolution');

module.exports = {
  // 共用常數
  ...common,
  // 遊戲模組
  herbalism,
  evolution,
  // 向後相容：直接匯出本草常數
  ...herbalism
};
