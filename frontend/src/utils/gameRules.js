/**
 * 遊戲規則驗證函數
 *
 * 此檔案包含遊戲規則相關的驗證函數
 *
 * @module gameRules
 */

import {
  MIN_PLAYERS,
  MAX_PLAYERS,
  ALL_COLORS,
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  isValidColor,
  isValidQuestionType
} from '../../../shared/constants.js';

import { countCardsByColor } from './cardUtils.js';

/**
 * 驗證結果資料結構
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - 是否有效
 * @property {string} message - 錯誤訊息（如無效）
 */

/**
 * 驗證玩家數量是否有效
 *
 * @param {number} count - 玩家數量
 * @returns {boolean} 玩家數量是否在 3-4 人之間
 *
 * @example
 * validatePlayerCount(3); // true
 * validatePlayerCount(5); // false
 */
export function validatePlayerCount(count) {
  return count >= MIN_PLAYERS && count <= MAX_PLAYERS;
}

/**
 * 驗證顏色選擇是否有效
 *
 * 驗證規則：
 * - 必須選擇 2 個顏色
 * - 兩個顏色必須不同
 * - 顏色必須是有效的顏色值（red, yellow, green, blue）
 *
 * @param {string[]} colors - 選擇的顏色陣列
 * @returns {boolean} 顏色選擇是否有效
 *
 * @example
 * validateColorSelection(['red', 'blue']); // true
 * validateColorSelection(['red', 'red']); // false
 * validateColorSelection(['red']); // false
 */
export function validateColorSelection(colors) {
  // 必須是陣列
  if (!Array.isArray(colors)) {
    return false;
  }

  // 必須選擇 2 個顏色
  if (colors.length !== 2) {
    return false;
  }

  // 兩個顏色必須不同
  if (colors[0] === colors[1]) {
    return false;
  }

  // 顏色必須是有效的顏色值
  return colors.every(color => isValidColor(color));
}

/**
 * 驗證問牌類型是否有效
 *
 * 根據問牌類型驗證：
 * - 類型1（兩個顏色各一張）：驗證是否可執行
 * - 類型2（其中一種顏色全部）：驗證是否可執行
 * - 類型3（給一張要全部）：玩家需要有要給的顏色的牌
 *
 * @param {number} questionType - 問牌類型（1, 2, 3）
 * @param {string[]} colors - 選定的兩個顏色
 * @param {Card[]} playerHand - 發起玩家的手牌
 * @param {Card[]} targetPlayerHand - 目標玩家的手牌（用於類型3驗證）
 * @returns {ValidationResult} 驗證結果
 *
 * @example
 * const result = validateQuestionType(1, ['red', 'blue'], playerHand, targetHand);
 * if (!result.isValid) {
 *   console.log(result.message);
 * }
 */
export function validateQuestionType(questionType, colors, playerHand, targetPlayerHand) {
  // 驗證問牌類型是否有效
  if (!isValidQuestionType(questionType)) {
    return {
      isValid: false,
      message: '無效的問牌類型'
    };
  }

  // 驗證顏色選擇是否有效
  if (!validateColorSelection(colors)) {
    return {
      isValid: false,
      message: '顏色選擇無效：必須選擇兩個不同的有效顏色'
    };
  }

  const [color1, color2] = colors;

  switch (questionType) {
    case QUESTION_TYPE_ONE_EACH:
      // 類型1：兩個顏色各一張
      // 此類型不需要驗證手牌，任何玩家都可以執行
      return {
        isValid: true,
        message: ''
      };

    case QUESTION_TYPE_ALL_ONE_COLOR:
      // 類型2：其中一種顏色全部
      // 此類型不需要驗證手牌，任何玩家都可以執行
      return {
        isValid: true,
        message: ''
      };

    case QUESTION_TYPE_GIVE_ONE_GET_ALL:
      // 類型3：給一張要全部
      // 發起玩家需要有要給的顏色的牌至少一張
      const hasColor1 = countCardsByColor(playerHand, color1) >= 1;
      const hasColor2 = countCardsByColor(playerHand, color2) >= 1;

      if (!hasColor1 && !hasColor2) {
        return {
          isValid: false,
          message: `你沒有 ${color1} 或 ${color2} 的牌可以給出`
        };
      }

      return {
        isValid: true,
        message: ''
      };

    default:
      return {
        isValid: false,
        message: '未知的問牌類型'
      };
  }
}
