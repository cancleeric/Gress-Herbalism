const {
  DEFAULT_ELO,
  getKFactor,
  calculateExpectedScore,
  calculateMultiplayerEloDeltas,
} = require('../eloService');

describe('eloService', () => {
  test('getKFactor 應依場次回傳 K 值', () => {
    expect(getKFactor(0)).toBe(32);
    expect(getKFactor(29)).toBe(32);
    expect(getKFactor(30)).toBe(16);
    expect(getKFactor(120)).toBe(16);
  });

  test('calculateExpectedScore 同分時約為 0.5', () => {
    expect(calculateExpectedScore(DEFAULT_ELO, DEFAULT_ELO)).toBeCloseTo(0.5, 5);
  });

  test('calculateMultiplayerEloDeltas 兩人對局應一增一減', () => {
    const players = [
      { playerId: 'a', rating: 1000, gamesPlayed: 10 },
      { playerId: 'b', rating: 1000, gamesPlayed: 10 },
    ];

    const deltas = calculateMultiplayerEloDeltas(players, 'a');
    expect(deltas.a).toBe(16);
    expect(deltas.b).toBe(-16);
  });

  test('calculateMultiplayerEloDeltas 三人對局應回傳每位玩家變化', () => {
    const players = [
      { playerId: 'a', rating: 1200, gamesPlayed: 40 },
      { playerId: 'b', rating: 1000, gamesPlayed: 2 },
      { playerId: 'c', rating: 900, gamesPlayed: 8 },
    ];

    const deltas = calculateMultiplayerEloDeltas(players, 'b');
    expect(Object.keys(deltas)).toHaveLength(3);
    expect(deltas.b).toBeGreaterThan(0);
    expect(deltas.a).toBeLessThanOrEqual(0);
    expect(deltas.c).toBeLessThanOrEqual(0);
  });

  test('無 winner 或玩家不足應回傳空物件', () => {
    expect(calculateMultiplayerEloDeltas([{ playerId: 'a', rating: 1000, gamesPlayed: 0 }], 'a')).toEqual({});
    expect(
      calculateMultiplayerEloDeltas(
        [
          { playerId: 'a', rating: 1000, gamesPlayed: 0 },
          { playerId: 'b', rating: 1000, gamesPlayed: 0 },
        ],
        null
      )
    ).toEqual({});
  });
});
