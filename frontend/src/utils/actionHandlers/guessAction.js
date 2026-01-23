/**
 * 猜牌動作處理器
 *
 * @module actionHandlers/guessAction
 * @description 處理猜牌動作的核心邏輯，包含猜對和猜錯的處理
 */

import { validateGuess, getNextPlayerIndex } from '../gameRules.js';
import {
  GAME_PHASE_FINISHED,
  ACTION_TYPE_GUESS
} from '../../shared/constants';

// ==================== 類型定義 ====================

/**
 * 猜牌動作資料結構
 * @typedef {Object} GuessAction
 * @property {string} playerId - 發起玩家 ID
 * @property {string[]} guessedColors - 猜測的兩個顏色
 */

/**
 * 猜牌處理結果
 * @typedef {Object} GuessHandlerResult
 * @property {boolean} success - 是否成功執行
 * @property {Object} gameState - 更新後的遊戲狀態
 * @property {boolean} isCorrect - 是否猜對
 * @property {Card[]|null} revealedCards - 揭示的蓋牌（猜對時）
 * @property {string} message - 處理訊息
 */

// ==================== 輔助函數 ====================

/**
 * 檢查是否只剩一個活躍玩家
 *
 * @param {Array} players - 玩家陣列
 * @returns {boolean} 是否只剩一個活躍玩家
 */
export function hasOnlyOneActivePlayer(players) {
  const activePlayers = players.filter(p => p.isActive !== false);
  return activePlayers.length <= 1;
}

/**
 * 取得活躍玩家數量
 *
 * @param {Array} players - 玩家陣列
 * @returns {number} 活躍玩家數量
 */
export function getActivePlayerCount(players) {
  return players.filter(p => p.isActive !== false).length;
}

/**
 * 檢查玩家是否必須猜牌（只剩一個活躍玩家）
 *
 * @param {Array} players - 玩家陣列
 * @returns {boolean} 是否必須猜牌
 */
export function mustGuess(players) {
  return hasOnlyOneActivePlayer(players);
}

/**
 * 建立猜牌歷史記錄條目
 *
 * @param {GuessAction} action - 猜牌動作
 * @param {boolean} isCorrect - 是否猜對
 * @returns {Object} 歷史記錄條目
 */
function createHistoryEntry(action, isCorrect) {
  return {
    type: ACTION_TYPE_GUESS,
    playerId: action.playerId,
    guessedColors: action.guessedColors,
    isCorrect,
    timestamp: Date.now()
  };
}

/**
 * 揭示蓋牌（猜對時公布答案）
 *
 * @param {Card[]} hiddenCards - 蓋牌陣列
 * @returns {Card[]} 揭示後的蓋牌
 */
function revealCards(hiddenCards) {
  return hiddenCards.map(card => ({
    ...card,
    isHidden: false
  }));
}

// ==================== 猜對處理 ====================

/**
 * 處理猜對的情況
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 猜牌玩家 ID
 * @param {Object} historyEntry - 歷史記錄條目
 * @returns {Object} 更新後的遊戲狀態
 */
function handleCorrectGuess(gameState, playerId, historyEntry) {
  // 揭示蓋牌（公布正確答案給所有玩家）
  const revealedCards = revealCards(gameState.hiddenCards);

  // 更新所有玩家狀態，結束回合
  const updatedPlayers = gameState.players.map(p => ({
    ...p,
    isCurrentTurn: false
  }));

  return {
    ...gameState,
    players: updatedPlayers,
    hiddenCards: revealedCards,
    gamePhase: GAME_PHASE_FINISHED,
    winner: playerId,
    gameHistory: [...gameState.gameHistory, historyEntry]
  };
}

// ==================== 猜錯處理 ====================

/**
 * 處理猜錯的情況
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {number} playerIndex - 猜牌玩家索引
 * @param {Object} historyEntry - 歷史記錄條目
 * @returns {Object} 更新後的遊戲狀態和結果資訊
 */
function handleIncorrectGuess(gameState, playerIndex, historyEntry) {
  // 標記玩家為非活躍狀態（退出遊戲）
  let updatedPlayers = gameState.players.map((p, index) => {
    if (index === playerIndex) {
      return { ...p, isActive: false, isCurrentTurn: false };
    }
    return p;
  });

  // 蓋牌保持隱藏狀態（不揭示顏色）
  // hiddenCards 保持原樣，不修改 isHidden 屬性

  // 計算剩餘活躍玩家數
  const activePlayers = updatedPlayers.filter(p => p.isActive);

  if (activePlayers.length === 0) {
    // 沒有活躍玩家了：遊戲結束，沒有獲勝者
    return {
      gameState: {
        ...gameState,
        players: updatedPlayers,
        gamePhase: GAME_PHASE_FINISHED,
        winner: null, // 沒有獲勝者
        gameHistory: [...gameState.gameHistory, historyEntry]
      },
      gameEnded: true,
      hasWinner: false
    };
  }

  // 還有其他玩家：繼續遊戲，切換到下一個玩家
  const nextPlayerIndex = getNextPlayerIndex(playerIndex, updatedPlayers);
  updatedPlayers = updatedPlayers.map((p, index) => ({
    ...p,
    isCurrentTurn: index === nextPlayerIndex
  }));

  return {
    gameState: {
      ...gameState,
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      gameHistory: [...gameState.gameHistory, historyEntry]
    },
    gameEnded: false,
    hasWinner: false
  };
}

// ==================== 主要處理函數 ====================

/**
 * 處理猜牌動作
 *
 * @param {Object} gameState - 當前遊戲狀態
 * @param {GuessAction} action - 猜牌動作
 * @returns {GuessHandlerResult} 處理結果
 *
 * @example
 * const result = handleGuessAction(gameState, {
 *   playerId: 'p1',
 *   guessedColors: ['red', 'blue']
 * });
 */
export function handleGuessAction(gameState, action) {
  const { playerId, guessedColors } = action;

  // 找到玩家
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);

  if (playerIndex === -1) {
    return {
      success: false,
      gameState,
      isCorrect: false,
      revealedCards: null,
      message: '玩家不存在'
    };
  }

  // 驗證是否為當前玩家的回合
  if (gameState.currentPlayerIndex !== playerIndex) {
    return {
      success: false,
      gameState,
      isCorrect: false,
      revealedCards: null,
      message: '不是你的回合'
    };
  }

  // 驗證玩家是否為活躍狀態
  const player = gameState.players[playerIndex];
  if (player.isActive === false) {
    return {
      success: false,
      gameState,
      isCorrect: false,
      revealedCards: null,
      message: '你已經退出遊戲'
    };
  }

  // 驗證猜牌
  const guessResult = validateGuess(guessedColors, gameState.hiddenCards);

  // 建立歷史記錄
  const historyEntry = createHistoryEntry(action, guessResult.isCorrect);

  if (guessResult.isCorrect) {
    // 猜對：遊戲結束，該玩家獲勝
    const updatedGameState = handleCorrectGuess(gameState, playerId, historyEntry);

    return {
      success: true,
      gameState: updatedGameState,
      isCorrect: true,
      revealedCards: updatedGameState.hiddenCards, // 公布正確答案
      message: '恭喜猜對了！你獲勝了！'
    };
  } else {
    // 猜錯：該玩家退出遊戲
    const { gameState: updatedGameState, gameEnded, hasWinner } = handleIncorrectGuess(
      gameState,
      playerIndex,
      historyEntry
    );

    let message;
    if (gameEnded && !hasWinner) {
      message = '猜錯了！遊戲結束，沒有獲勝者。';
    } else {
      message = '猜錯了！你已退出遊戲。';
    }

    return {
      success: true,
      gameState: updatedGameState,
      isCorrect: false,
      revealedCards: null, // 猜錯時蓋牌保持隱藏
      message
    };
  }
}

/**
 * 取得蓋牌答案（供猜牌者查看）
 *
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @returns {Object} 查看結果
 *
 * @example
 * const result = getHiddenCardsForPlayer(gameState, 'p1');
 * // { success: true, cards: [...] }
 */
export function getHiddenCardsForPlayer(gameState, playerId) {
  const playerIndex = gameState.players.findIndex(p => p.id === playerId);

  if (playerIndex === -1) {
    return {
      success: false,
      cards: null,
      message: '玩家不存在'
    };
  }

  // 驗證是否為當前玩家的回合
  if (gameState.currentPlayerIndex !== playerIndex) {
    return {
      success: false,
      cards: null,
      message: '不是你的回合'
    };
  }

  // 返回蓋牌顏色（但不修改遊戲狀態）
  return {
    success: true,
    cards: gameState.hiddenCards.map(card => ({
      id: card.id,
      color: card.color
    })),
    message: '這是蓋牌的顏色'
  };
}

// TODO: 可擴展點 - 未來可添加：
// 1. 猜牌次數限制
// 2. 猜牌時間限制
// 3. 猜牌提示功能
// 4. 猜牌歷史分析
