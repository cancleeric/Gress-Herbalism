/**
 * 問牌動作處理器
 *
 * @module actionHandlers/questionAction
 * @description 處理問牌動作的核心邏輯，使用策略模式實作三種問牌類型
 */

import {
  getCardsByColor,
  removeCard,
  addCard
} from '../cardUtils.js';
import { validateQuestionType, getNextPlayerIndex } from '../gameRules.js';
import {
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  ACTION_TYPE_QUESTION
} from '../../shared/constants';

// ==================== 類型定義 ====================

/**
 * 問牌動作資料結構
 * @typedef {Object} QuestionAction
 * @property {string} playerId - 發起玩家 ID
 * @property {string} targetPlayerId - 目標玩家 ID
 * @property {string[]} colors - 選定的兩個顏色
 * @property {number} questionType - 問牌類型（1, 2, 3）
 * @property {string} [selectedColor] - 類型2時選擇的顏色
 * @property {string} [giveColor] - 類型3時要給的顏色
 * @property {string} [getColor] - 類型3時要拿的顏色
 */

/**
 * 問牌結果資料結構
 * @typedef {Object} QuestionResult
 * @property {Card[]} cardsGiven - 發起玩家給出的牌（類型3時使用）
 * @property {Card[]} cardsReceived - 發起玩家收到的牌
 * @property {boolean} hasCards - 目標玩家是否有牌可給
 */

/**
 * 問牌處理結果
 * @typedef {Object} QuestionHandlerResult
 * @property {boolean} success - 是否成功
 * @property {Object} gameState - 更新後的遊戲狀態
 * @property {QuestionResult} result - 問牌結果
 * @property {string} message - 處理訊息
 */

// ==================== 策略模式：問牌類型處理器 ====================

/**
 * 問牌類型處理器介面
 * TODO: 可擴展點 - 新增問牌類型時，只需實作此介面
 * @typedef {Object} QuestionTypeHandler
 * @property {Function} handle - 處理問牌的函數
 */

/**
 * 處理類型1：兩個顏色各一張
 *
 * @param {Card[]} playerHand - 發起玩家手牌
 * @param {Card[]} targetHand - 目標玩家手牌
 * @param {string} color1 - 顏色1
 * @param {string} color2 - 顏色2
 * @param {Object} options - 額外選項
 * @returns {QuestionResult} 處理結果
 */
function handleType1(playerHand, targetHand, color1, color2, options = {}) {
  const color1Cards = getCardsByColor(targetHand, color1);
  const color2Cards = getCardsByColor(targetHand, color2);
  const cardsReceived = [];

  // 各取一張（不是全部）
  if (color1Cards.length > 0) {
    cardsReceived.push(color1Cards[0]);
  }
  if (color2Cards.length > 0) {
    cardsReceived.push(color2Cards[0]);
  }

  return {
    cardsGiven: [],
    cardsReceived,
    hasCards: cardsReceived.length > 0
  };
}

/**
 * 處理類型2：其中一種顏色全部
 *
 * @param {Card[]} playerHand - 發起玩家手牌
 * @param {Card[]} targetHand - 目標玩家手牌
 * @param {string} color1 - 顏色1
 * @param {string} color2 - 顏色2
 * @param {Object} options - 額外選項
 * @param {string} [options.selectedColor] - 選擇的顏色
 * @returns {QuestionResult} 處理結果
 */
function handleType2(playerHand, targetHand, color1, color2, options = {}) {
  const { selectedColor } = options;
  const color1Cards = getCardsByColor(targetHand, color1);
  const color2Cards = getCardsByColor(targetHand, color2);

  let cardsReceived = [];

  if (selectedColor) {
    // 指定了顏色
    cardsReceived = selectedColor === color1 ? color1Cards : color2Cards;
  } else {
    // 自動選擇有牌的顏色（優先選擇 color1）
    if (color1Cards.length > 0) {
      cardsReceived = color1Cards;
    } else if (color2Cards.length > 0) {
      cardsReceived = color2Cards;
    }
  }

  return {
    cardsGiven: [],
    cardsReceived,
    hasCards: cardsReceived.length > 0
  };
}

/**
 * 處理類型3：給一張要全部
 *
 * @param {Card[]} playerHand - 發起玩家手牌
 * @param {Card[]} targetHand - 目標玩家手牌
 * @param {string} color1 - 顏色1（預設為給出的顏色）
 * @param {string} color2 - 顏色2（預設為要拿的顏色）
 * @param {Object} options - 額外選項
 * @param {string} [options.giveColor] - 要給的顏色
 * @param {string} [options.getColor] - 要拿的顏色
 * @returns {QuestionResult} 處理結果
 */
function handleType3(playerHand, targetHand, color1, color2, options = {}) {
  const giveColor = options.giveColor || color1;
  const getColor = options.getColor || color2;

  const giveCards = getCardsByColor(playerHand, giveColor);

  // 如果發起玩家沒有要給的顏色，無法執行
  if (giveCards.length === 0) {
    return {
      cardsGiven: [],
      cardsReceived: [],
      hasCards: false
    };
  }

  // 給一張
  const cardToGive = giveCards[0];
  const cardsGiven = [cardToGive];

  // 要另一個顏色的全部
  const cardsReceived = getCardsByColor(targetHand, getColor);

  return {
    cardsGiven,
    cardsReceived,
    hasCards: cardsReceived.length > 0
  };
}

/**
 * 問牌類型處理器映射
 * TODO: 可擴展點 - 新增問牌類型時，在此添加對應的處理器
 */
const questionTypeHandlers = {
  [QUESTION_TYPE_ONE_EACH]: handleType1,
  [QUESTION_TYPE_ALL_ONE_COLOR]: handleType2,
  [QUESTION_TYPE_GIVE_ONE_GET_ALL]: handleType3
};

// ==================== 主要處理函數 ====================

/**
 * 處理問牌動作
 *
 * @param {Object} gameState - 當前遊戲狀態
 * @param {QuestionAction} action - 問牌動作
 * @returns {QuestionHandlerResult} 處理結果
 *
 * @example
 * const result = handleQuestionAction(gameState, {
 *   playerId: 'p1',
 *   targetPlayerId: 'p2',
 *   colors: ['red', 'blue'],
 *   questionType: 1
 * });
 */
export function handleQuestionAction(gameState, action) {
  const { playerId, targetPlayerId, colors, questionType } = action;
  const [color1, color2] = colors;

  // 找到發起玩家和目標玩家
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);
  const targetIndex = gameState.players.findIndex(p => p.id === targetPlayerId);

  if (playerIndex === -1 || targetIndex === -1) {
    return {
      success: false,
      gameState,
      result: null,
      message: '玩家不存在'
    };
  }

  // 驗證是否為當前玩家的回合
  if (gameState.currentPlayerIndex !== playerIndex) {
    return {
      success: false,
      gameState,
      result: null,
      message: '不是你的回合'
    };
  }

  const player = gameState.players[playerIndex];
  const targetPlayer = gameState.players[targetIndex];

  // 驗證問牌動作
  const validation = validateQuestionType(
    questionType,
    colors,
    player.hand,
    targetPlayer.hand
  );

  if (!validation.isValid) {
    return {
      success: false,
      gameState,
      result: null,
      message: validation.message
    };
  }

  // 取得對應的處理器
  const handler = questionTypeHandlers[questionType];

  if (!handler) {
    return {
      success: false,
      gameState,
      result: null,
      message: '未知的問牌類型'
    };
  }

  // 執行問牌處理
  const result = handler(
    player.hand,
    targetPlayer.hand,
    color1,
    color2,
    {
      selectedColor: action.selectedColor,
      giveColor: action.giveColor,
      getColor: action.getColor
    }
  );

  // 更新手牌
  const { updatedPlayerHand, updatedTargetHand } = updatePlayerHands(
    player.hand,
    targetPlayer.hand,
    result
  );

  // 更新玩家狀態
  const updatedPlayers = updatePlayersState(
    gameState.players,
    playerIndex,
    targetIndex,
    updatedPlayerHand,
    updatedTargetHand
  );

  // 取得下一個玩家
  const nextPlayerIndex = getNextPlayerIndex(playerIndex, updatedPlayers);
  updatedPlayers[nextPlayerIndex] = {
    ...updatedPlayers[nextPlayerIndex],
    isCurrentTurn: true
  };

  // 記錄歷史
  const historyEntry = createHistoryEntry(action, result);

  // 建立更新後的遊戲狀態
  const updatedGameState = {
    ...gameState,
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    gameHistory: [...gameState.gameHistory, historyEntry]
  };

  // 產生結果訊息
  const message = generateResultMessage(result);

  return {
    success: true,
    gameState: updatedGameState,
    result,
    message
  };
}

// ==================== 輔助函數 ====================

/**
 * 更新玩家手牌
 *
 * @param {Card[]} playerHand - 發起玩家手牌
 * @param {Card[]} targetHand - 目標玩家手牌
 * @param {QuestionResult} result - 問牌結果
 * @returns {Object} 更新後的手牌
 */
function updatePlayerHands(playerHand, targetHand, result) {
  let updatedPlayerHand = [...playerHand];
  let updatedTargetHand = [...targetHand];

  // 發起玩家給出的牌（類型3）
  result.cardsGiven.forEach(card => {
    updatedPlayerHand = removeCard(updatedPlayerHand, card.id);
    updatedTargetHand = addCard(updatedTargetHand, card);
  });

  // 發起玩家收到的牌
  result.cardsReceived.forEach(card => {
    updatedTargetHand = removeCard(updatedTargetHand, card.id);
    updatedPlayerHand = addCard(updatedPlayerHand, card);
  });

  return { updatedPlayerHand, updatedTargetHand };
}

/**
 * 更新玩家狀態陣列
 *
 * @param {Array} players - 玩家陣列
 * @param {number} playerIndex - 發起玩家索引
 * @param {number} targetIndex - 目標玩家索引
 * @param {Card[]} updatedPlayerHand - 更新後的發起玩家手牌
 * @param {Card[]} updatedTargetHand - 更新後的目標玩家手牌
 * @returns {Array} 更新後的玩家陣列
 */
function updatePlayersState(players, playerIndex, targetIndex, updatedPlayerHand, updatedTargetHand) {
  return players.map((p, index) => {
    if (index === playerIndex) {
      return { ...p, hand: updatedPlayerHand, isCurrentTurn: false };
    }
    if (index === targetIndex) {
      return { ...p, hand: updatedTargetHand };
    }
    return p;
  });
}

/**
 * 建立歷史記錄條目
 *
 * @param {QuestionAction} action - 問牌動作
 * @param {QuestionResult} result - 問牌結果
 * @returns {Object} 歷史記錄條目
 */
function createHistoryEntry(action, result) {
  return {
    type: ACTION_TYPE_QUESTION,
    playerId: action.playerId,
    targetPlayerId: action.targetPlayerId,
    colors: action.colors,
    questionType: action.questionType,
    result: {
      cardsGiven: result.cardsGiven.map(c => c.id),
      cardsReceived: result.cardsReceived.map(c => c.id),
      hasCards: result.hasCards
    },
    timestamp: Date.now()
  };
}

/**
 * 產生結果訊息
 *
 * @param {QuestionResult} result - 問牌結果
 * @returns {string} 結果訊息
 */
function generateResultMessage(result) {
  if (!result.hasCards) {
    return '目標玩家沒有該顏色的牌';
  }
  return `收到 ${result.cardsReceived.length} 張牌`;
}

// ==================== 匯出 ====================

export {
  handleType1,
  handleType2,
  handleType3,
  questionTypeHandlers
};

// TODO: 可擴展點 - 新增問牌類型處理器時：
// 1. 實作新的 handleTypeX 函數
// 2. 在 questionTypeHandlers 中添加對應的處理器
// 3. 在 constants.js 中添加新的類型常數
