/**
 * 遊戲服務
 *
 * 此檔案包含遊戲狀態管理的核心功能
 *
 * @module gameService
 */

import {
  createDeck,
  shuffleDeck,
  dealCards,
  getCardsByColor,
  removeCard,
  addCard
} from '../utils/cardUtils.js';
import {
  validatePlayerCount,
  validateQuestionType,
  validateGuess,
  getNextPlayerIndex,
  mustGuess
} from '../utils/gameRules.js';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  GAME_PHASE_FINISHED,
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS
} from '../shared/constants';

// ==================== 遊戲狀態儲存 ====================

/**
 * 遊戲狀態儲存（記憶體）
 * TODO: 可擴展點 - 未來可替換為資料庫儲存
 * @type {Map<string, Object>}
 */
const gameStore = new Map();

/**
 * 產生唯一遊戲 ID
 * @returns {string} 唯一遊戲 ID
 */
function generateGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ==================== 遊戲狀態管理函數 ====================

/**
 * 遊戲狀態資料結構
 * @typedef {Object} GameState
 * @property {string} gameId - 唯一遊戲 ID
 * @property {Array} players - 玩家陣列
 * @property {Card[]} hiddenCards - 蓋牌陣列
 * @property {number} currentPlayerIndex - 當前玩家索引
 * @property {string} gamePhase - 遊戲階段
 * @property {string|null} winner - 獲勝者 ID
 * @property {Array} gameHistory - 遊戲歷史記錄
 */

/**
 * 玩家資料結構
 * @typedef {Object} Player
 * @property {string} id - 玩家 ID
 * @property {string} name - 玩家名稱
 * @property {Card[]} hand - 手牌
 * @property {boolean} isActive - 是否仍在遊戲中
 * @property {boolean} isCurrentTurn - 是否為當前回合
 */

/**
 * 創建遊戲房間（等待玩家加入）
 *
 * @param {Object} hostPlayer - 房主玩家資訊
 * @param {string} hostPlayer.id - 玩家 ID
 * @param {string} hostPlayer.name - 玩家名稱
 * @param {number} maxPlayers - 最大玩家數量（3 或 4）
 * @returns {Object} 房間狀態物件
 *
 * @example
 * const room = createGameRoom({ id: 'p1', name: '玩家1' }, 4);
 */
export function createGameRoom(hostPlayer, maxPlayers = 4) {
  const gameId = generateGameId();

  const roomState = {
    gameId,
    players: [{
      id: hostPlayer.id,
      name: hostPlayer.name,
      hand: [],
      isActive: true,
      isCurrentTurn: false,
      isHost: true
    }],
    hiddenCards: [],
    currentPlayerIndex: 0,
    gamePhase: GAME_PHASE_WAITING,
    winner: null,
    gameHistory: [],
    maxPlayers
  };

  // 儲存房間狀態
  gameStore.set(gameId, roomState);

  return roomState;
}

/**
 * 建立新遊戲
 *
 * @param {Array<{id: string, name: string}>} players - 玩家陣列
 * @returns {GameState} 遊戲狀態物件
 * @throws {Error} 當玩家數量無效時拋出錯誤
 *
 * @example
 * const gameState = createGame([
 *   { id: 'p1', name: '玩家1' },
 *   { id: 'p2', name: '玩家2' },
 *   { id: 'p3', name: '玩家3' }
 * ]);
 */
export function createGame(players) {
  // 驗證玩家數量
  if (!validatePlayerCount(players.length)) {
    throw new Error('玩家數量必須在 3-4 人之間');
  }

  // 建立牌組、洗牌、發牌
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  const { hiddenCards, playerHands } = dealCards(shuffledDeck, players.length);

  // 建立玩家狀態
  const gamePlayers = players.map((player, index) => ({
    id: player.id,
    name: player.name,
    hand: playerHands[index],
    isActive: true,
    isCurrentTurn: index === 0
  }));

  // 建立遊戲狀態
  const gameId = generateGameId();
  const gameState = {
    gameId,
    players: gamePlayers,
    hiddenCards,
    currentPlayerIndex: 0,
    gamePhase: GAME_PHASE_PLAYING,
    winner: null,
    gameHistory: []
  };

  // 儲存遊戲狀態
  gameStore.set(gameId, gameState);

  return gameState;
}

/**
 * 取得遊戲狀態
 *
 * @param {string} gameId - 遊戲 ID
 * @returns {GameState|null} 遊戲狀態物件，如果不存在則返回 null
 *
 * @example
 * const gameState = getGameState('game_123');
 */
export function getGameState(gameId) {
  return gameStore.get(gameId) || null;
}

/**
 * 開始遊戲（從等待狀態轉為進行中）
 *
 * @param {string} gameId - 遊戲 ID
 * @returns {Object} 開始結果
 *
 * @example
 * const result = startGame('game_123');
 */
export function startGame(gameId) {
  const gameState = getGameState(gameId);

  if (!gameState) {
    return {
      success: false,
      gameState: null,
      message: '遊戲不存在'
    };
  }

  // 驗證玩家數量
  if (!validatePlayerCount(gameState.players.length)) {
    return {
      success: false,
      gameState,
      message: '玩家數量必須在 3-4 人之間'
    };
  }

  // 驗證遊戲是否處於等待狀態
  if (gameState.gamePhase !== GAME_PHASE_WAITING) {
    return {
      success: false,
      gameState,
      message: '遊戲已經開始或已結束'
    };
  }

  // 建立牌組、洗牌、發牌
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  const { hiddenCards, playerHands } = dealCards(shuffledDeck, gameState.players.length);

  // 更新玩家狀態，分配手牌
  const updatedPlayers = gameState.players.map((player, index) => ({
    ...player,
    hand: playerHands[index],
    isActive: true,
    isCurrentTurn: index === 0
  }));

  // 更新遊戲狀態
  const updatedGameState = updateGameState(gameId, {
    players: updatedPlayers,
    hiddenCards,
    currentPlayerIndex: 0,
    gamePhase: GAME_PHASE_PLAYING
  });

  return {
    success: true,
    gameState: updatedGameState,
    message: '遊戲開始！'
  };
}

/**
 * 更新遊戲狀態
 *
 * @param {string} gameId - 遊戲 ID
 * @param {Object} updates - 要更新的屬性
 * @returns {GameState|null} 更新後的遊戲狀態，如果遊戲不存在則返回 null
 *
 * @example
 * const updatedState = updateGameState('game_123', {
 *   currentPlayerIndex: 1,
 *   gameHistory: [...currentHistory, newAction]
 * });
 */
export function updateGameState(gameId, updates) {
  const currentState = gameStore.get(gameId);

  if (!currentState) {
    return null;
  }

  // 合併更新
  const updatedState = {
    ...currentState,
    ...updates
  };

  // 儲存更新後的狀態
  gameStore.set(gameId, updatedState);

  return updatedState;
}

/**
 * 刪除遊戲狀態
 *
 * @param {string} gameId - 遊戲 ID
 * @returns {boolean} 是否成功刪除
 */
export function deleteGame(gameId) {
  return gameStore.delete(gameId);
}

/**
 * 清除所有遊戲狀態（用於測試）
 */
export function clearAllGames() {
  gameStore.clear();
}

// ==================== 問牌動作處理 ====================

/**
 * 問牌動作結果資料結構
 * @typedef {Object} QuestionResult
 * @property {Card[]} cardsGiven - 發起玩家給出的牌（類型3時使用）
 * @property {Card[]} cardsReceived - 發起玩家收到的牌
 * @property {boolean} hasCards - 目標玩家是否有牌可給
 */

/**
 * 處理類型1：兩個顏色各一張
 * @param {Card[]} targetHand - 目標玩家手牌
 * @param {string} color1 - 顏色1
 * @param {string} color2 - 顏色2
 * @returns {QuestionResult} 處理結果
 */
function handleQuestionType1(targetHand, color1, color2) {
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
 * @param {Card[]} targetHand - 目標玩家手牌
 * @param {string} color1 - 顏色1
 * @param {string} color2 - 顏色2
 * @param {string} selectedColor - 選擇的顏色（可選，如未指定則自動選擇有牌的顏色）
 * @returns {QuestionResult} 處理結果
 */
function handleQuestionType2(targetHand, color1, color2, selectedColor = null) {
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
 * @param {Card[]} playerHand - 發起玩家手牌
 * @param {Card[]} targetHand - 目標玩家手牌
 * @param {string} giveColor - 要給的顏色
 * @param {string} getColor - 要拿的顏色
 * @returns {QuestionResult} 處理結果
 */
function handleQuestionType3(playerHand, targetHand, giveColor, getColor) {
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
 * 處理問牌動作
 *
 * @param {string} gameId - 遊戲 ID
 * @param {Object} action - 問牌動作物件
 * @param {string} action.playerId - 發起玩家 ID
 * @param {string} action.targetPlayerId - 目標玩家 ID
 * @param {string[]} action.colors - 選定的兩個顏色
 * @param {number} action.questionType - 問牌類型（1, 2, 3）
 * @param {string} [action.selectedColor] - 類型2時選擇的顏色
 * @param {string} [action.giveColor] - 類型3時要給的顏色
 * @param {string} [action.getColor] - 類型3時要拿的顏色
 * @returns {Object} 處理結果
 *
 * @example
 * const result = processQuestionAction('game_123', {
 *   playerId: 'p1',
 *   targetPlayerId: 'p2',
 *   colors: ['red', 'blue'],
 *   questionType: 1
 * });
 */
export function processQuestionAction(gameId, action) {
  const gameState = getGameState(gameId);

  if (!gameState) {
    return {
      success: false,
      gameState: null,
      result: null,
      message: '遊戲不存在'
    };
  }

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

  // 根據問牌類型處理
  let result;
  switch (questionType) {
    case QUESTION_TYPE_ONE_EACH:
      result = handleQuestionType1(targetPlayer.hand, color1, color2);
      break;
    case QUESTION_TYPE_ALL_ONE_COLOR:
      result = handleQuestionType2(
        targetPlayer.hand,
        color1,
        color2,
        action.selectedColor
      );
      break;
    case QUESTION_TYPE_GIVE_ONE_GET_ALL:
      const giveColor = action.giveColor || color1;
      const getColor = action.getColor || color2;
      result = handleQuestionType3(
        player.hand,
        targetPlayer.hand,
        giveColor,
        getColor
      );
      break;
    default:
      return {
        success: false,
        gameState,
        result: null,
        message: '未知的問牌類型'
      };
  }

  // 更新手牌
  let updatedPlayerHand = [...player.hand];
  let updatedTargetHand = [...targetPlayer.hand];

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

  // 更新玩家狀態
  const updatedPlayers = gameState.players.map((p, index) => {
    if (index === playerIndex) {
      return { ...p, hand: updatedPlayerHand, isCurrentTurn: false };
    }
    if (index === targetIndex) {
      return { ...p, hand: updatedTargetHand };
    }
    return p;
  });

  // 取得下一個玩家
  const nextPlayerIndex = getNextPlayerIndex(playerIndex, updatedPlayers);
  updatedPlayers[nextPlayerIndex] = {
    ...updatedPlayers[nextPlayerIndex],
    isCurrentTurn: true
  };

  // 記錄歷史
  const historyEntry = {
    type: ACTION_TYPE_QUESTION,
    playerId,
    targetPlayerId,
    colors,
    questionType,
    result: {
      cardsGiven: result.cardsGiven.map(c => c.id),
      cardsReceived: result.cardsReceived.map(c => c.id),
      hasCards: result.hasCards
    },
    timestamp: Date.now()
  };

  // 更新遊戲狀態
  const updatedGameState = updateGameState(gameId, {
    players: updatedPlayers,
    currentPlayerIndex: nextPlayerIndex,
    gameHistory: [...gameState.gameHistory, historyEntry]
  });

  // 產生結果訊息
  let message;
  if (!result.hasCards) {
    message = '目標玩家沒有該顏色的牌';
  } else {
    message = `收到 ${result.cardsReceived.length} 張牌`;
  }

  return {
    success: true,
    gameState: updatedGameState,
    result,
    message
  };
}

// ==================== 猜牌動作處理 ====================

/**
 * 處理猜牌動作
 *
 * @param {string} gameId - 遊戲 ID
 * @param {Object} action - 猜牌動作物件
 * @param {string} action.playerId - 發起玩家 ID
 * @param {string[]} action.guessedColors - 猜測的兩個顏色
 * @returns {Object} 處理結果
 *
 * @example
 * const result = processGuessAction('game_123', {
 *   playerId: 'p1',
 *   guessedColors: ['red', 'blue']
 * });
 */
export function processGuessAction(gameId, action) {
  const gameState = getGameState(gameId);

  if (!gameState) {
    return {
      success: false,
      gameState: null,
      isCorrect: false,
      revealedCards: null,
      message: '遊戲不存在'
    };
  }

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

  // 驗證猜牌
  const guessResult = validateGuess(guessedColors, gameState.hiddenCards);

  // 記錄歷史
  const historyEntry = {
    type: ACTION_TYPE_GUESS,
    playerId,
    guessedColors,
    isCorrect: guessResult.isCorrect,
    timestamp: Date.now()
  };

  if (guessResult.isCorrect) {
    // 猜對：遊戲結束，該玩家獲勝
    const revealedCards = gameState.hiddenCards.map(card => ({
      ...card,
      isHidden: false
    }));

    const updatedPlayers = gameState.players.map((p, index) => ({
      ...p,
      isCurrentTurn: false
    }));

    const updatedGameState = updateGameState(gameId, {
      players: updatedPlayers,
      hiddenCards: revealedCards,
      gamePhase: GAME_PHASE_FINISHED,
      winner: playerId,
      gameHistory: [...gameState.gameHistory, historyEntry]
    });

    return {
      success: true,
      gameState: updatedGameState,
      isCorrect: true,
      revealedCards,
      message: '恭喜猜對了！你獲勝了！'
    };
  } else {
    // 猜錯：該玩家退出遊戲
    let updatedPlayers = gameState.players.map((p, index) => {
      if (index === playerIndex) {
        return { ...p, isActive: false, isCurrentTurn: false };
      }
      return p;
    });

    // 計算剩餘活躍玩家數
    const activePlayers = updatedPlayers.filter(p => p.isActive);

    if (activePlayers.length === 0) {
      // 沒有活躍玩家了：遊戲結束，沒有獲勝者
      const updatedGameState = updateGameState(gameId, {
        players: updatedPlayers,
        gamePhase: GAME_PHASE_FINISHED,
        winner: null,
        gameHistory: [...gameState.gameHistory, historyEntry]
      });

      return {
        success: true,
        gameState: updatedGameState,
        isCorrect: false,
        revealedCards: null,
        message: '猜錯了！遊戲結束，沒有獲勝者。'
      };
    }

    // 還有其他玩家：繼續遊戲，切換到下一個玩家
    const nextPlayerIndex = getNextPlayerIndex(playerIndex, updatedPlayers);
    updatedPlayers = updatedPlayers.map((p, index) => ({
      ...p,
      isCurrentTurn: index === nextPlayerIndex
    }));

    const updatedGameState = updateGameState(gameId, {
      players: updatedPlayers,
      currentPlayerIndex: nextPlayerIndex,
      gameHistory: [...gameState.gameHistory, historyEntry]
    });

    return {
      success: true,
      gameState: updatedGameState,
      isCorrect: false,
      revealedCards: null,
      message: '猜錯了！你已退出遊戲。'
    };
  }
}

/**
 * 取得蓋牌顏色（猜牌者查看答案用）
 *
 * @param {string} gameId - 遊戲 ID
 * @param {string} playerId - 玩家 ID
 * @returns {Object} 查看結果
 */
export function revealHiddenCards(gameId, playerId) {
  const gameState = getGameState(gameId);

  if (!gameState) {
    return {
      success: false,
      cards: null,
      message: '遊戲不存在'
    };
  }

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
