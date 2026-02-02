/**
 * 拖放類型定義
 *
 * @module components/games/evolution/dnd/dragTypes
 */

/**
 * 拖放項目類型
 */
export const DRAG_TYPES = {
  /** 手牌 */
  HAND_CARD: 'HAND_CARD',

  /** 食物代幣 */
  FOOD_TOKEN: 'FOOD_TOKEN',

  /** 生物（用於互動性狀連結） */
  CREATURE: 'CREATURE',
};

/**
 * 放置目標類型
 */
export const DROP_TARGETS = {
  /** 生物區域（放置性狀） */
  CREATURE_SLOT: 'CREATURE_SLOT',

  /** 新生物區（創建生物） */
  NEW_CREATURE_ZONE: 'NEW_CREATURE_ZONE',

  /** 生物（餵食、連結） */
  CREATURE: 'CREATURE',

  /** 棄牌區 */
  DISCARD_PILE: 'DISCARD_PILE',
};

/**
 * 拖放動作結果
 */
export const DROP_RESULTS = {
  SUCCESS: 'success',
  INVALID_TARGET: 'invalid_target',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
};
