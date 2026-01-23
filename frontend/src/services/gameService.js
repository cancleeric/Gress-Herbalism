/**
 * 遊戲服務
 *
 * 此檔案包含遊戲狀態管理的核心功能
 *
 * @module gameService
 */

import { createDeck, shuffleDeck, dealCards } from '../utils/cardUtils.js';
import { validatePlayerCount } from '../utils/gameRules.js';
import {
  GAME_PHASE_WAITING,
  GAME_PHASE_PLAYING
} from '../../../shared/constants.js';

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
