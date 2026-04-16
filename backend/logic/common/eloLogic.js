/**
 * ELO 積分計算邏輯 - 純函數
 *
 * 負責 ELO 評分系統的計算，包含：
 * - K-factor 動態調整（新手 32 / 熟練 16）
 * - 預期勝率計算
 * - ELO 分數增減
 *
 * 工單 0060 - 全球排行榜 ELO 積分制
 *
 * @module logic/common/eloLogic
 */

/** 預設初始 ELO 分數 */
const DEFAULT_ELO = 1000;

/** 新手 K 值（遊戲場數 < EXPERIENCED_THRESHOLD） */
const K_FACTOR_NOVICE = 32;

/** 熟練玩家 K 值（遊戲場數 >= EXPERIENCED_THRESHOLD） */
const K_FACTOR_EXPERIENCED = 16;

/** 熟練玩家門檻場數 */
const EXPERIENCED_THRESHOLD = 20;

/** ELO 最低分數下限 */
const MIN_ELO = 100;

/**
 * 取得玩家的 K-factor
 * @param {number} gamesPlayed - 玩家已玩場數
 * @returns {number} K-factor 值
 */
function getKFactor(gamesPlayed = 0) {
  return gamesPlayed >= EXPERIENCED_THRESHOLD ? K_FACTOR_EXPERIENCED : K_FACTOR_NOVICE;
}

/**
 * 計算預期勝率（Logistic 函數）
 * @param {number} ratingA - 玩家 A 的 ELO
 * @param {number} ratingB - 玩家 B 的 ELO
 * @returns {number} 玩家 A 對 B 的預期勝率（0~1）
 */
function expectedScore(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * 計算兩人對局後的 ELO 分數變化
 * @param {number} ratingWinner - 勝者當前 ELO
 * @param {number} ratingLoser - 敗者當前 ELO
 * @param {number} gamesPlayedWinner - 勝者已玩場數
 * @param {number} gamesPlayedLoser - 敗者已玩場數
 * @returns {{ winnerDelta: number, loserDelta: number, newWinnerRating: number, newLoserRating: number }}
 */
function calculateEloChange(ratingWinner, ratingLoser, gamesPlayedWinner = 0, gamesPlayedLoser = 0) {
  const kWinner = getKFactor(gamesPlayedWinner);
  const kLoser = getKFactor(gamesPlayedLoser);

  const expectedWinner = expectedScore(ratingWinner, ratingLoser);
  const expectedLoser = expectedScore(ratingLoser, ratingWinner);

  // 勝者實際得分 = 1，敗者實際得分 = 0
  const winnerDelta = Math.round(kWinner * (1 - expectedWinner));
  const loserDelta = Math.round(kLoser * (0 - expectedLoser));

  const newWinnerRating = Math.max(MIN_ELO, ratingWinner + winnerDelta);
  const newLoserRating = Math.max(MIN_ELO, ratingLoser + loserDelta);

  return {
    winnerDelta,
    loserDelta,
    newWinnerRating,
    newLoserRating,
  };
}

/**
 * 計算多人對局後的 ELO 分數（依名次）
 *
 * 多人場景：以名次作為勝負判斷
 * - 名次較好的玩家視為「勝者」對名次較差的玩家計算
 * - 取所有配對的平均增減
 *
 * @param {Array<{ playerId: string, rating: number, gamesPlayed: number, rank: number }>} players - 玩家列表（包含名次）
 * @returns {Array<{ playerId: string, delta: number, newRating: number }>}
 */
function calculateMultiplayerElo(players) {
  if (!players || players.length < 2) {
    return (players || []).map(p => ({ playerId: p.playerId, delta: 0, newRating: p.rating }));
  }

  // 初始化每位玩家的分數累計
  const deltas = {};
  const pairCounts = {};
  players.forEach(p => {
    deltas[p.playerId] = 0;
    pairCounts[p.playerId] = 0;
  });

  // 對所有配對計算 ELO 增減
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const higher = players[i].rank < players[j].rank ? players[i] : players[j];
      const lower = players[i].rank < players[j].rank ? players[j] : players[i];

      const change = calculateEloChange(
        higher.rating,
        lower.rating,
        higher.gamesPlayed,
        lower.gamesPlayed
      );

      deltas[higher.playerId] += change.winnerDelta;
      deltas[lower.playerId] += change.loserDelta;
      pairCounts[higher.playerId]++;
      pairCounts[lower.playerId]++;
    }
  }

  // 取平均並四捨五入
  return players.map(p => {
    const count = pairCounts[p.playerId] || 1;
    const delta = Math.round(deltas[p.playerId] / count);
    const newRating = Math.max(MIN_ELO, p.rating + delta);
    return { playerId: p.playerId, delta, newRating };
  });
}

module.exports = {
  DEFAULT_ELO,
  K_FACTOR_NOVICE,
  K_FACTOR_EXPERIENCED,
  EXPERIENCED_THRESHOLD,
  MIN_ELO,
  getKFactor,
  expectedScore,
  calculateEloChange,
  calculateMultiplayerElo,
};
