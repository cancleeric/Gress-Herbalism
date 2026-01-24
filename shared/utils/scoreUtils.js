/**
 * 計分工具函數
 *
 * @module scoreUtils
 */

import {
  WINNING_SCORE,
  MIN_SCORE,
  GUESS_CORRECT_POINTS,
  FOLLOW_CORRECT_POINTS,
  FOLLOW_WRONG_POINTS
} from '../constants.js';

/**
 * 加分（考慮最低分數限制）
 * @param {number} currentScore - 當前分數
 * @param {number} points - 要加減的分數
 * @returns {number} 新的分數（不會低於 MIN_SCORE）
 */
export function addScore(currentScore, points) {
  const newScore = currentScore + points;
  return Math.max(newScore, MIN_SCORE);
}

/**
 * 檢查是否有玩家達到勝利條件
 * @param {Object} scores - 所有玩家的分數 { playerId: score }
 * @param {number} winningScore - 勝利所需分數（預設 WINNING_SCORE）
 * @returns {string|null} 達到勝利分數的玩家 ID，若無則返回 null
 */
export function checkWinCondition(scores, winningScore = WINNING_SCORE) {
  for (const [playerId, score] of Object.entries(scores)) {
    if (score >= winningScore) {
      return playerId;
    }
  }
  return null;
}

/**
 * 取得排名
 * @param {Object} scores - 所有玩家的分數 { playerId: score }
 * @returns {Array} 排名陣列 [{ playerId, score, rank }]，依分數由高到低排序
 */
export function getLeaderboard(scores) {
  const entries = Object.entries(scores).map(([playerId, score]) => ({
    playerId,
    score
  }));

  // 依分數由高到低排序
  entries.sort((a, b) => b.score - a.score);

  // 加入排名（同分同名次）
  let currentRank = 1;
  let previousScore = null;

  return entries.map((entry, index) => {
    if (previousScore !== null && entry.score < previousScore) {
      currentRank = index + 1;
    }
    previousScore = entry.score;
    return {
      ...entry,
      rank: currentRank
    };
  });
}

/**
 * 計算猜牌結果的分數變化
 * @param {boolean} isCorrect - 猜測是否正確
 * @param {Array} followingPlayers - 跟猜的玩家 ID 列表
 * @param {string} guessingPlayerId - 猜牌的玩家 ID
 * @returns {Object} 分數變化 { playerId: pointChange }
 */
export function calculateGuessScoreChanges(isCorrect, followingPlayers, guessingPlayerId) {
  const changes = {};

  if (isCorrect) {
    // 猜對：猜牌者 +3，跟猜者 +1
    changes[guessingPlayerId] = GUESS_CORRECT_POINTS;
    followingPlayers.forEach(playerId => {
      changes[playerId] = FOLLOW_CORRECT_POINTS;
    });
  } else {
    // 猜錯：猜牌者不扣分（0），跟猜者 -1
    changes[guessingPlayerId] = 0;
    followingPlayers.forEach(playerId => {
      changes[playerId] = FOLLOW_WRONG_POINTS;
    });
  }

  return changes;
}

/**
 * 應用分數變化到分數表
 * @param {Object} scores - 當前分數表 { playerId: score }
 * @param {Object} changes - 分數變化 { playerId: pointChange }
 * @returns {Object} 更新後的分數表
 */
export function applyScoreChanges(scores, changes) {
  const newScores = { ...scores };

  for (const [playerId, change] of Object.entries(changes)) {
    const currentScore = newScores[playerId] || 0;
    newScores[playerId] = addScore(currentScore, change);
  }

  return newScores;
}

/**
 * 初始化玩家分數
 * @param {Array} players - 玩家列表
 * @returns {Object} 初始分數表 { playerId: 0 }
 */
export function initializeScores(players) {
  const scores = {};
  players.forEach(player => {
    scores[player.id] = 0;
  });
  return scores;
}
