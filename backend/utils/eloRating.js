/**
 * ELO 積分工具
 * issue #60
 */

const INITIAL_ELO_RATING = 1000;
const NOVICE_GAMES_THRESHOLD = 30;
const K_FACTOR_NOVICE = 32;
const K_FACTOR_EXPERIENCED = 16;

function getKFactor(gamesPlayed = 0) {
  return gamesPlayed < NOVICE_GAMES_THRESHOLD ? K_FACTOR_NOVICE : K_FACTOR_EXPERIENCED;
}

function calculateExpectedScore(playerRating, opponentRating) {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

function calculateMultiplayerEloChanges(players = []) {
  if (!Array.isArray(players) || players.length < 2) {
    return [];
  }

  const deltas = players.map(() => 0);

  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const playerA = players[i];
      const playerB = players[j];

      const ratingA = Number(playerA.rating ?? INITIAL_ELO_RATING);
      const ratingB = Number(playerB.rating ?? INITIAL_ELO_RATING);
      const kA = getKFactor(Number(playerA.gamesPlayed || 0));
      const kB = getKFactor(Number(playerB.gamesPlayed || 0));
      const scoreA = Number(playerA.score || 0);
      const scoreB = Number(playerB.score || 0);

      let actualA = 0.5;
      let actualB = 0.5;
      if (scoreA > scoreB) {
        actualA = 1;
        actualB = 0;
      } else if (scoreB > scoreA) {
        actualA = 0;
        actualB = 1;
      }

      const expectedA = calculateExpectedScore(ratingA, ratingB);
      const expectedB = calculateExpectedScore(ratingB, ratingA);

      deltas[i] += kA * (actualA - expectedA);
      deltas[j] += kB * (actualB - expectedB);
    }
  }

  const opponentCount = Math.max(1, players.length - 1);
  const results = players.map((player, index) => {
    const oldRating = Number(player.rating ?? INITIAL_ELO_RATING);
    const normalizedDelta = deltas[index] / opponentCount;
    const change = Math.round(normalizedDelta);
    const newRating = Math.max(100, oldRating + change);

    return {
      playerId: player.playerId,
      oldRating,
      newRating,
      change: newRating - oldRating,
    };
  });

  const drift = results.reduce((acc, item) => acc + item.change, 0);
  if (drift !== 0) {
    const topRankedIndex = players.reduce((bestIndex, player, index) => (
      Number(player.score || 0) > Number(players[bestIndex].score || 0) ? index : bestIndex
    ), 0);

    const topResult = results[topRankedIndex];
    topResult.newRating = Math.max(100, topResult.newRating - drift);
    topResult.change = topResult.newRating - topResult.oldRating;
  }

  return results;
}

module.exports = {
  INITIAL_ELO_RATING,
  NOVICE_GAMES_THRESHOLD,
  K_FACTOR_NOVICE,
  K_FACTOR_EXPERIENCED,
  getKFactor,
  calculateExpectedScore,
  calculateMultiplayerEloChanges,
};
