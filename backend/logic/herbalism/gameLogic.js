/**
 * 遊戲規則邏輯 - 純函數
 *
 * 負責遊戲規則驗證、狀態判斷等操作。
 * 工單 0164：從 server.js 提取
 *
 * @module logic/gameLogic
 */

const MIN_PLAYERS = 3;
const MAX_PLAYERS = 4;
const WINNING_SCORE = 7;

/**
 * 檢查是否可以開始遊戲
 * @param {Object[]} players - 玩家陣列
 * @returns {{ canStart: boolean, reason?: string }}
 */
function canStartGame(players) {
  if (!players || players.length < MIN_PLAYERS) {
    return { canStart: false, reason: `需要至少 ${MIN_PLAYERS} 名玩家` };
  }
  if (players.length > MAX_PLAYERS) {
    return { canStart: false, reason: `最多 ${MAX_PLAYERS} 名玩家` };
  }
  return { canStart: true };
}

/**
 * 檢查猜牌是否正確
 * @param {string[]} guessedColors - 猜測的顏色
 * @param {Object[]} hiddenCards - 實際蓋牌（含 { color } 屬性）
 * @returns {boolean}
 */
function isGuessCorrect(guessedColors, hiddenCards) {
  if (!guessedColors || !hiddenCards) return false;
  if (guessedColors.length !== 2 || hiddenCards.length !== 2) return false;

  const sortedGuess = [...guessedColors].sort();
  const hiddenColors = hiddenCards.map(c => c.color).sort();

  return sortedGuess[0] === hiddenColors[0] && sortedGuess[1] === hiddenColors[1];
}

/**
 * 計算下一個活躍玩家索引
 * @param {number} currentIndex - 當前玩家索引
 * @param {Object[]} players - 玩家陣列
 * @returns {number} 下一個活躍玩家索引
 */
function getNextPlayerIndex(currentIndex, players) {
  if (!players || players.length === 0) return 0;

  const playerCount = players.length;
  let nextIndex = (currentIndex + 1) % playerCount;
  let attempts = 0;

  while (!players[nextIndex].isActive && attempts < playerCount) {
    nextIndex = (nextIndex + 1) % playerCount;
    attempts++;
  }

  return nextIndex;
}

/**
 * 檢查是否只剩一個活躍玩家（或沒有）
 * @param {Object[]} players - 玩家陣列
 * @returns {boolean}
 */
function isOnlyOnePlayerLeft(players) {
  if (!players) return false;
  return players.filter(p => p.isActive).length <= 1;
}

/**
 * 檢查是否有玩家達到勝利分數
 * @param {Object} scores - 分數物件 { playerId: score }
 * @param {number} winningScore - 勝利分數（預設 7）
 * @returns {string|null} 勝利玩家 ID 或 null
 */
function checkWinCondition(scores, winningScore = WINNING_SCORE) {
  if (!scores) return null;
  for (const [playerId, score] of Object.entries(scores)) {
    if (score >= winningScore) {
      return playerId;
    }
  }
  return null;
}

/**
 * 驗證問牌動作
 * @param {Object} action - 動作物件
 * @param {Object} gameState - 遊戲狀態
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateQuestionAction(action, gameState) {
  const { targetPlayerId, colors, questionType } = action;

  if (!targetPlayerId) {
    return { valid: false, reason: '必須指定目標玩家' };
  }

  if (!colors || colors.length !== 2) {
    return { valid: false, reason: '必須選擇兩個顏色' };
  }

  if (![1, 2, 3].includes(questionType)) {
    return { valid: false, reason: '無效的問牌類型' };
  }

  if (gameState && gameState.players) {
    const targetPlayer = gameState.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || !targetPlayer.isActive) {
      return { valid: false, reason: '目標玩家不存在或已退出' };
    }
  }

  return { valid: true };
}

module.exports = {
  MIN_PLAYERS,
  MAX_PLAYERS,
  WINNING_SCORE,
  canStartGame,
  isGuessCorrect,
  getNextPlayerIndex,
  isOnlyOnePlayerLeft,
  checkWinCondition,
  validateQuestionAction
};
