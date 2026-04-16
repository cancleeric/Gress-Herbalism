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
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  GAME_PHASE_FINISHED,
  isValidColor,
  isValidQuestionType
} from '../../shared/constants';

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

// ==================== 猜牌驗證函數 ====================

/**
 * 猜牌結果資料結構
 * @typedef {Object} GuessResult
 * @property {boolean} isCorrect - 猜測是否正確
 * @property {string} message - 結果訊息
 */

/**
 * 驗證猜牌是否正確
 *
 * 驗證邏輯：
 * - 必須猜測 2 個顏色
 * - 顏色可以重複（例如：兩個紅色）
 * - 比對猜測的顏色與蓋牌的顏色（不考慮順序）
 *
 * @param {string[]} guessedColors - 猜測的顏色陣列
 * @param {Card[]} hiddenCards - 蓋牌陣列
 * @returns {GuessResult} 猜牌結果
 *
 * @example
 * const result = validateGuess(['red', 'blue'], hiddenCards);
 * if (result.isCorrect) {
 *   console.log('猜對了！');
 * }
 */
export function validateGuess(guessedColors, hiddenCards) {
  // 驗證猜測數量
  if (!Array.isArray(guessedColors) || guessedColors.length !== 2) {
    return {
      isCorrect: false,
      message: '必須猜測 2 個顏色'
    };
  }

  // 驗證蓋牌數量
  if (!Array.isArray(hiddenCards) || hiddenCards.length !== 2) {
    return {
      isCorrect: false,
      message: '蓋牌數量錯誤'
    };
  }

  // 驗證顏色是否有效
  if (!guessedColors.every(color => isValidColor(color))) {
    return {
      isCorrect: false,
      message: '包含無效的顏色'
    };
  }

  // 取得蓋牌顏色並排序
  const hiddenColors = hiddenCards.map(card => card.color).sort();
  const guessedSorted = [...guessedColors].sort();

  // 比對顏色（不考慮順序）
  const isCorrect = hiddenColors[0] === guessedSorted[0] &&
                    hiddenColors[1] === guessedSorted[1];

  return {
    isCorrect,
    message: isCorrect ? '恭喜猜對了！' : '猜錯了！'
  };
}

/**
 * 檢查遊戲是否結束
 *
 * 遊戲結束條件：
 * - 有玩家猜對（winner 不為 null）
 * - 只剩一個玩家且猜錯（winner 為 null，gamePhase 為 'finished'）
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string|null} gameState.winner - 獲勝者 ID
 * @param {string} gameState.gamePhase - 遊戲階段
 * @returns {boolean} 遊戲是否結束
 *
 * @example
 * if (checkGameEnd(gameState)) {
 *   console.log('遊戲結束');
 * }
 */
export function checkGameEnd(gameState) {
  // 有獲勝者
  if (gameState.winner !== null) {
    return true;
  }

  // 遊戲階段為結束（沒有獲勝者的情況）
  if (gameState.gamePhase === GAME_PHASE_FINISHED) {
    return true;
  }

  return false;
}

/**
 * 檢查當前玩家是否必須執行猜牌動作
 *
 * 當只剩一個玩家仍在遊戲中時，該玩家必須猜牌（不能選擇問牌）
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {Array} gameState.players - 玩家陣列
 * @returns {boolean} 是否必須猜牌
 *
 * @example
 * if (mustGuess(gameState)) {
 *   // 只顯示猜牌按鈕，隱藏問牌按鈕
 * }
 */
export function mustGuess(gameState) {
  if (!gameState.players || !Array.isArray(gameState.players)) {
    return false;
  }

  // 計算仍在遊戲中的玩家數量
  const activePlayers = gameState.players.filter(player => player.isActive);

  // 只剩一個玩家時必須猜牌
  return activePlayers.length === 1;
}

/**
 * 取得下一個輪到的玩家索引
 *
 * 跳過已退出遊戲的玩家（isActive 為 false）
 *
 * @param {number} currentIndex - 當前玩家索引
 * @param {Array} players - 玩家陣列
 * @returns {number} 下一個玩家的索引，如果沒有可用玩家則返回 -1
 *
 * @example
 * const nextIndex = getNextPlayerIndex(0, players);
 */
export function getNextPlayerIndex(currentIndex, players) {
  if (!players || !Array.isArray(players) || players.length === 0) {
    return -1;
  }

  const playerCount = players.length;
  let nextIndex = (currentIndex + 1) % playerCount;
  let checkedCount = 0;

  // 尋找下一個仍在遊戲中的玩家
  while (checkedCount < playerCount) {
    if (players[nextIndex].isActive) {
      return nextIndex;
    }
    nextIndex = (nextIndex + 1) % playerCount;
    checkedCount++;
  }

  // 沒有可用的玩家
  return -1;
}
