/**
 * 計分邏輯 - 純函數
 *
 * 負責猜牌、跟猜、預測的分數計算。
 * 工單 0164：從 server.js 提取
 *
 * @module logic/scoreLogic
 */

const GUESS_CORRECT_POINTS = 3;
const FOLLOW_CORRECT_POINTS = 1;
const FOLLOW_WRONG_POINTS = -1;

/**
 * 計算猜牌得分
 * @param {boolean} isCorrect - 是否猜對
 * @returns {number} 得分變化
 */
function calculateGuessScore(isCorrect) {
  return isCorrect ? GUESS_CORRECT_POINTS : 0;
}

/**
 * 計算跟猜得分
 * @param {boolean} isCorrect - 是否跟對
 * @returns {number} 得分變化
 */
function calculateFollowGuessScore(isCorrect) {
  return isCorrect ? FOLLOW_CORRECT_POINTS : FOLLOW_WRONG_POINTS;
}

/**
 * 應用分數變化（確保不低於 0）
 * @param {number} currentScore - 當前分數
 * @param {number} change - 分數變化
 * @returns {number} 新分數
 */
function applyScoreChange(currentScore, change) {
  return Math.max(0, currentScore + change);
}

/**
 * 計算回合結束時所有玩家的分數變化
 * @param {Object} roundResult - 回合結果
 * @param {string} roundResult.guessingPlayerId - 猜牌者 ID
 * @param {boolean} roundResult.isCorrect - 是否猜對
 * @param {string[]} roundResult.followingPlayers - 跟猜者 ID 陣列
 * @returns {Object} { playerId: scoreChange }
 */
function calculateRoundScores(roundResult) {
  const scoreChanges = {};
  const {
    guessingPlayerId,
    isCorrect,
    followingPlayers = []
  } = roundResult;

  // 猜牌者得分
  if (guessingPlayerId) {
    scoreChanges[guessingPlayerId] = calculateGuessScore(isCorrect);
  }

  // 跟猜者得分
  for (const fpId of followingPlayers) {
    scoreChanges[fpId] = calculateFollowGuessScore(isCorrect);
  }

  return scoreChanges;
}

module.exports = {
  GUESS_CORRECT_POINTS,
  FOLLOW_CORRECT_POINTS,
  FOLLOW_WRONG_POINTS,
  calculateGuessScore,
  calculateFollowGuessScore,
  applyScoreChange,
  calculateRoundScores
};
