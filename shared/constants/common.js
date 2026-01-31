/**
 * 共用常數定義
 * 工單 0221 - 重組共用常數目錄結構
 *
 * @module constants/common
 */

/**
 * 遊戲類型
 * @readonly
 * @enum {string}
 */
const GAME_TYPES = {
  /** 本草遊戲 */
  HERBALISM: 'herbalism',
  /** 演化論遊戲 */
  EVOLUTION: 'evolution'
};

/**
 * 遊戲類型名稱
 * @readonly
 * @type {Object<string, string>}
 */
const GAME_TYPE_NAMES = {
  [GAME_TYPES.HERBALISM]: '本草 Herbalism',
  [GAME_TYPES.EVOLUTION]: '演化論：物種起源'
};

module.exports = {
  GAME_TYPES,
  GAME_TYPE_NAMES
};
