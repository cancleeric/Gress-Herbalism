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
  dealCards
} from '../utils/herbalism/cardUtils';
import {
  validatePlayerCount
} from '../utils/herbalism/gameRules';
import {
  processAction as processActionHandler,
} from '../utils/herbalism/actionHandlers';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING,
  ACTION_TYPE_QUESTION,
  ACTION_TYPE_GUESS
} from '../shared/constants';

// ==================== 遊戲狀態儲存 ====================

const STORAGE_KEY = 'herbalism_game_store';

/**
 * 從 localStorage 載入遊戲狀態
 * @returns {Map<string, Object>} 遊戲狀態 Map
 */
function loadFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Error loading from localStorage:', error);
  }
  return new Map();
}

/**
 * 儲存遊戲狀態到 localStorage
 */
function saveToStorage() {
  try {
    const obj = Object.fromEntries(gameStore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * 遊戲狀態儲存（使用 localStorage 持久化）
 * @type {Map<string, Object>}
 */
const gameStore = loadFromStorage();

/**
 * 房間列表監聯器
 * @type {Set<Function>}
 */
const roomListeners = new Set();

/**
 * 監聽其他分頁的 localStorage 變更
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      // 重新載入遊戲狀態
      const newStore = loadFromStorage();
      gameStore.clear();
      newStore.forEach((value, key) => gameStore.set(key, value));
      // 通知監聽器
      notifyRoomListChange();
    }
  });
}

/**
 * 產生唯一遊戲 ID
 * @returns {string} 唯一遊戲 ID
 */
function generateGameId() {
  return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 通知房間列表變更
 */
function notifyRoomListChange() {
  const rooms = getAvailableRooms();
  roomListeners.forEach(listener => {
    try {
      listener(rooms);
    } catch (error) {
      console.error('Error in room list listener:', error);
    }
  });
}

/**
 * 訂閱房間列表變更
 * @param {Function} listener - 監聽函數
 * @returns {Function} 取消訂閱函數
 */
export function subscribeToRoomList(listener) {
  roomListeners.add(listener);
  // 立即通知當前房間列表
  listener(getAvailableRooms());
  return () => {
    roomListeners.delete(listener);
  };
}

/**
 * 取得可用房間列表
 * @returns {Array} 可用房間列表
 */
export function getAvailableRooms() {
  const rooms = [];
  gameStore.forEach((state, gameId) => {
    // 只返回等待中的房間
    if (state.gamePhase === GAME_PHASE_WAITING) {
      const hostPlayer = state.players.find(p => p.isHost) || state.players[0];
      rooms.push({
        id: gameId,
        name: hostPlayer ? `${hostPlayer.name} 的房間` : `房間 ${gameId.slice(-6)}`,
        playerCount: state.players.length,
        maxPlayers: state.maxPlayers || 4
      });
    }
  });
  return rooms;
}

/**
 * 加入現有房間
 * @param {string} gameId - 遊戲 ID
 * @param {Object} player - 玩家資訊
 * @returns {Object} 加入結果
 */
export function joinRoom(gameId, player) {
  const gameState = gameStore.get(gameId);

  if (!gameState) {
    return {
      success: false,
      gameState: null,
      message: '房間不存在，請確認房間ID是否正確'
    };
  }

  if (gameState.gamePhase !== GAME_PHASE_WAITING) {
    return {
      success: false,
      gameState,
      message: '遊戲已開始，無法加入'
    };
  }

  const maxPlayers = gameState.maxPlayers || 4;
  if (gameState.players.length >= maxPlayers) {
    return {
      success: false,
      gameState,
      message: '房間已滿，無法加入'
    };
  }

  // 檢查玩家是否已存在
  const existingPlayer = gameState.players.find(p => p.id === player.id);
  if (existingPlayer) {
    return {
      success: false,
      gameState,
      message: '玩家已在房間中'
    };
  }

  // 添加玩家到房間
  const updatedPlayers = [...gameState.players, {
    ...player,
    isActive: true,
    isCurrentTurn: false,
    hand: []
  }];

  const updatedState = {
    ...gameState,
    players: updatedPlayers
  };

  gameStore.set(gameId, updatedState);
  saveToStorage();
  notifyRoomListChange();

  return {
    success: true,
    gameState: updatedState,
    message: '成功加入房間'
  };
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
  saveToStorage();

  // 通知房間列表變更
  notifyRoomListChange();

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
  saveToStorage();

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
  saveToStorage();

  return updatedState;
}

/**
 * 刪除遊戲狀態
 *
 * @param {string} gameId - 遊戲 ID
 * @returns {boolean} 是否成功刪除
 */
export function deleteGame(gameId) {
  const result = gameStore.delete(gameId);
  saveToStorage();
  return result;
}

/**
 * 清除所有遊戲狀態（用於測試）
 */
export function clearAllGames() {
  gameStore.clear();
  saveToStorage();
}

// ==================== 動作處理 ====================

/**
 * 統一處理遊戲動作
 * 根據動作類型自動選擇對應的處理器
 *
 * @param {string} gameId - 遊戲 ID
 * @param {Object} action - 動作物件
 * @param {string} action.type - 動作類型
 * @returns {Object} 處理結果
 *
 * @example
 * const result = processAction('game_123', {
 *   type: 'question',
 *   playerId: 'p1',
 *   targetPlayerId: 'p2',
 *   colors: ['red', 'blue'],
 *   questionType: 1
 * });
 */
export function processAction(gameId, action) {
  const gameState = getGameState(gameId);

  if (!gameState) {
    return {
      success: false,
      gameState: null,
      message: '遊戲不存在'
    };
  }

  // 使用動作處理器工廠處理動作
  const result = processActionHandler(gameState, action);

  if (result.success && result.gameState) {
    // 更新遊戲狀態到儲存
    updateGameState(gameId, result.gameState);
  }

  return result;
}

/**
 * 處理問牌動作
 * 向後兼容的包裝函數
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
  // 添加動作類型
  const questionAction = {
    ...action,
    type: ACTION_TYPE_QUESTION
  };

  return processAction(gameId, questionAction);
}

/**
 * 處理猜牌動作
 * 向後兼容的包裝函數
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
  // 添加動作類型
  const guessAction = {
    ...action,
    type: ACTION_TYPE_GUESS
  };

  return processAction(gameId, guessAction);
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
