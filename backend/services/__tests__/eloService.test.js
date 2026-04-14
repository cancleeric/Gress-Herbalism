const {
  getKFactor,
  calculateExpectedScore,
  calculateMultiplayerEloChanges,
  getCurrentSeasonId,
} = require('../eloService');

describe('eloService', () => {
  test('getKFactor should use 32 for new players and 16 for experienced players', () => {
    expect(getKFactor(0)).toBe(32);
    expect(getKFactor(29)).toBe(32);
    expect(getKFactor(30)).toBe(16);
  });

  test('calculateExpectedScore should be symmetric around equal ratings', () => {
    expect(calculateExpectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
    expect(calculateExpectedScore(1200, 1000)).toBeGreaterThan(0.5);
    expect(calculateExpectedScore(800, 1000)).toBeLessThan(0.5);
  });

  test('calculateMultiplayerEloChanges should increase winner rating and decrease loser rating', () => {
    const changes = calculateMultiplayerEloChanges([
      { playerId: 'p1', eloRating: 1000, gamesPlayed: 10 },
      { playerId: 'p2', eloRating: 1000, gamesPlayed: 10 },
      { playerId: 'p3', eloRating: 1000, gamesPlayed: 10 },
    ], 'p1');

    expect(changes.p1.delta).toBeGreaterThan(0);
    expect(changes.p2.delta).toBeLessThan(0);
    expect(changes.p3.delta).toBeLessThan(0);
    expect(changes.p1.afterRating).toBe(1000 + changes.p1.delta);
  });

  test('getCurrentSeasonId should return YYYY-MM format', () => {
    const seasonId = getCurrentSeasonId(new Date('2026-04-14T00:00:00Z'));
    expect(seasonId).toBe('2026-04');
  });
});
