const {
  INITIAL_ELO_RATING,
  getKFactor,
  calculateExpectedScore,
  calculateMultiplayerEloChanges,
} = require('./eloRating');

describe('eloRating', () => {
  describe('getKFactor', () => {
    it('uses novice K-factor for new players', () => {
      expect(getKFactor(0)).toBe(32);
      expect(getKFactor(29)).toBe(32);
    });

    it('uses experienced K-factor for veteran players', () => {
      expect(getKFactor(30)).toBe(16);
      expect(getKFactor(100)).toBe(16);
    });
  });

  describe('calculateExpectedScore', () => {
    it('returns 0.5 for equal ratings', () => {
      expect(calculateExpectedScore(1000, 1000)).toBe(0.5);
    });

    it('returns higher expected score for stronger players', () => {
      expect(calculateExpectedScore(1200, 1000)).toBeGreaterThan(0.5);
      expect(calculateExpectedScore(1000, 1200)).toBeLessThan(0.5);
    });
  });

  describe('calculateMultiplayerEloChanges', () => {
    it('calculates rating changes for multi-player game by score ranking', () => {
      const players = [
        { playerId: 'a', rating: 1000, gamesPlayed: 10, score: 7 },
        { playerId: 'b', rating: 1000, gamesPlayed: 10, score: 4 },
        { playerId: 'c', rating: 1000, gamesPlayed: 10, score: 2 },
      ];

      const result = calculateMultiplayerEloChanges(players);
      const playerA = result.find((x) => x.playerId === 'a');
      const playerB = result.find((x) => x.playerId === 'b');
      const playerC = result.find((x) => x.playerId === 'c');

      expect(playerA.change).toBeGreaterThan(0);
      expect(playerC.change).toBeLessThan(0);
      expect(playerA.newRating).toBe(playerA.oldRating + playerA.change);
      expect(playerB.newRating).toBe(playerB.oldRating + playerB.change);
      expect(playerC.newRating).toBe(playerC.oldRating + playerC.change);
    });

    it('keeps rating floor at 100', () => {
      const players = [
        { playerId: 'a', rating: 100, gamesPlayed: 10, score: 0 },
        { playerId: 'b', rating: 2500, gamesPlayed: 10, score: 10 },
      ];

      const result = calculateMultiplayerEloChanges(players);
      const lowPlayer = result.find((x) => x.playerId === 'a');

      expect(lowPlayer.newRating).toBeGreaterThanOrEqual(100);
    });

    it('uses default initial rating when input rating is missing', () => {
      const players = [
        { playerId: 'a', gamesPlayed: 0, score: 5 },
        { playerId: 'b', gamesPlayed: 0, score: 1 },
      ];

      const result = calculateMultiplayerEloChanges(players);
      expect(result[0].oldRating).toBe(INITIAL_ELO_RATING);
      expect(result[1].oldRating).toBe(INITIAL_ELO_RATING);
    });
  });
});
