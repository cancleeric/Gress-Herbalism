/**
 * ELO 計算服務
 * 工單 0060 / Issue #60
 */

const DEFAULT_ELO_RATING = 1000;
const NEW_PLAYER_K_FACTOR = 32;
const EXPERIENCED_PLAYER_K_FACTOR = 16;
const EXPERIENCED_GAMES_THRESHOLD = 30;

function getCurrentSeasonId(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getKFactor(gamesPlayed = 0) {
  return gamesPlayed < EXPERIENCED_GAMES_THRESHOLD
    ? NEW_PLAYER_K_FACTOR
    : EXPERIENCED_PLAYER_K_FACTOR;
}

function calculateExpectedScore(playerRating, opponentRating) {
  return 1 / (1 + 10 ** ((opponentRating - playerRating) / 400));
}

function calculateMultiplayerEloChanges(players, winnerPlayerId) {
  if (!Array.isArray(players) || players.length < 2) {
    return {};
  }

  const changes = {};

  for (const player of players) {
    const opponents = players.filter(p => p.playerId !== player.playerId);
    const expected = opponents.reduce((sum, opponent) => {
      return sum + calculateExpectedScore(player.eloRating, opponent.eloRating);
    }, 0) / opponents.length;

    const actual = player.playerId === winnerPlayerId ? 1 : 0;
    const kFactor = getKFactor(player.gamesPlayed);
    const delta = Math.round(kFactor * (actual - expected));

    changes[player.playerId] = {
      expectedScore: Number(expected.toFixed(4)),
      actualScore: actual,
      kFactor,
      delta,
      beforeRating: player.eloRating,
      afterRating: Math.max(0, player.eloRating + delta),
    };
  }

  return changes;
}

module.exports = {
  DEFAULT_ELO_RATING,
  NEW_PLAYER_K_FACTOR,
  EXPERIENCED_PLAYER_K_FACTOR,
  EXPERIENCED_GAMES_THRESHOLD,
  getCurrentSeasonId,
  getKFactor,
  calculateExpectedScore,
  calculateMultiplayerEloChanges,
};
