/**
 * ELO 積分計算服務
 */

const DEFAULT_ELO = 1000;

/**
 * 依照對局場次決定 K 值
 * @param {number} gamesPlayed
 * @returns {number}
 */
function getKFactor(gamesPlayed = 0) {
  return gamesPlayed < 30 ? 32 : 16;
}

/**
 * 計算預期得分
 * @param {number} playerRating
 * @param {number} opponentRating
 * @returns {number}
 */
function calculateExpectedScore(playerRating, opponentRating) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

/**
 * 計算多人 ELO 變化（勝者 1，其餘 0）
 * @param {Array<{playerId:string,rating:number,gamesPlayed:number}>} players
 * @param {string|null} winnerPlayerId
 * @returns {Record<string, number>}
 */
function calculateMultiplayerEloDeltas(players, winnerPlayerId) {
  if (!Array.isArray(players) || players.length < 2 || !winnerPlayerId) {
    return {};
  }

  const winnerExists = players.some((player) => player.playerId === winnerPlayerId);
  if (!winnerExists) {
    return {};
  }

  const deltas = {};

  players.forEach((player) => {
    const opponents = players.filter((p) => p.playerId !== player.playerId);
    if (opponents.length === 0) {
      deltas[player.playerId] = 0;
      return;
    }

    const expected = opponents.reduce(
      (sum, opponent) => sum + calculateExpectedScore(player.rating, opponent.rating),
      0
    ) / opponents.length;

    const actual = player.playerId === winnerPlayerId ? 1 : 0;
    const k = getKFactor(player.gamesPlayed || 0);
    deltas[player.playerId] = Math.round(k * (actual - expected));
  });

  return deltas;
}

module.exports = {
  DEFAULT_ELO,
  getKFactor,
  calculateExpectedScore,
  calculateMultiplayerEloDeltas,
};
