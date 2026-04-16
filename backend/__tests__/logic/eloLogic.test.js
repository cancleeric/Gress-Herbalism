/**
 * eloLogic 單元測試
 * 工單 0060 - 全球排行榜 ELO 積分制
 */

const {
  DEFAULT_ELO,
  K_FACTOR_NOVICE,
  K_FACTOR_EXPERIENCED,
  EXPERIENCED_THRESHOLD,
  MIN_ELO,
  getKFactor,
  expectedScore,
  calculateEloChange,
  calculateMultiplayerElo,
} = require('../../logic/common/eloLogic');

describe('eloLogic', () => {
  describe('常數', () => {
    test('DEFAULT_ELO 應為 1000', () => {
      expect(DEFAULT_ELO).toBe(1000);
    });

    test('K_FACTOR_NOVICE 應為 32', () => {
      expect(K_FACTOR_NOVICE).toBe(32);
    });

    test('K_FACTOR_EXPERIENCED 應為 16', () => {
      expect(K_FACTOR_EXPERIENCED).toBe(16);
    });

    test('EXPERIENCED_THRESHOLD 應為 20', () => {
      expect(EXPERIENCED_THRESHOLD).toBe(20);
    });

    test('MIN_ELO 應為 100', () => {
      expect(MIN_ELO).toBe(100);
    });
  });

  describe('getKFactor', () => {
    test('場數 < 20 應返回新手 K 值 32', () => {
      expect(getKFactor(0)).toBe(32);
      expect(getKFactor(1)).toBe(32);
      expect(getKFactor(19)).toBe(32);
    });

    test('場數 >= 20 應返回熟練 K 值 16', () => {
      expect(getKFactor(20)).toBe(16);
      expect(getKFactor(50)).toBe(16);
      expect(getKFactor(100)).toBe(16);
    });

    test('省略場數應使用 0（新手 K 值）', () => {
      expect(getKFactor()).toBe(32);
    });
  });

  describe('expectedScore', () => {
    test('相同積分預期勝率應為 0.5', () => {
      expect(expectedScore(1000, 1000)).toBeCloseTo(0.5, 5);
    });

    test('積分較高預期勝率應 > 0.5', () => {
      expect(expectedScore(1200, 1000)).toBeGreaterThan(0.5);
    });

    test('積分較低預期勝率應 < 0.5', () => {
      expect(expectedScore(800, 1000)).toBeLessThan(0.5);
    });

    test('預期勝率應在 0~1 之間', () => {
      const score = expectedScore(1500, 1000);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });
  });

  describe('calculateEloChange', () => {
    test('積分相同時勝者應得約 16 分（新手）', () => {
      const result = calculateEloChange(1000, 1000, 0, 0);
      expect(result.winnerDelta).toBe(16);
      expect(result.loserDelta).toBe(-16);
    });

    test('勝者積分較高時獲得分數應較少', () => {
      const highVsLow = calculateEloChange(1200, 1000, 0, 0);
      const sameRating = calculateEloChange(1000, 1000, 0, 0);
      expect(highVsLow.winnerDelta).toBeLessThan(sameRating.winnerDelta);
    });

    test('勝者積分較低時獲得分數應較多', () => {
      const lowVsHigh = calculateEloChange(800, 1000, 0, 0);
      const sameRating = calculateEloChange(1000, 1000, 0, 0);
      expect(lowVsHigh.winnerDelta).toBeGreaterThan(sameRating.winnerDelta);
    });

    test('熟練玩家 K 值應較小', () => {
      const novice = calculateEloChange(1000, 1000, 0, 0);
      const experienced = calculateEloChange(1000, 1000, 20, 20);
      expect(Math.abs(experienced.winnerDelta)).toBeLessThan(Math.abs(novice.winnerDelta));
    });

    test('新積分應正確計算', () => {
      const result = calculateEloChange(1000, 1000, 0, 0);
      expect(result.newWinnerRating).toBe(1000 + result.winnerDelta);
      expect(result.newLoserRating).toBe(Math.max(MIN_ELO, 1000 + result.loserDelta));
    });

    test('積分不應低於 MIN_ELO', () => {
      const result = calculateEloChange(1000, 100, 0, 0);
      expect(result.newLoserRating).toBeGreaterThanOrEqual(MIN_ELO);
    });

    test('勝者 delta 應為正數', () => {
      const result = calculateEloChange(1000, 1000, 0, 0);
      expect(result.winnerDelta).toBeGreaterThan(0);
    });

    test('敗者 delta 應為負數', () => {
      const result = calculateEloChange(1000, 1000, 0, 0);
      expect(result.loserDelta).toBeLessThan(0);
    });
  });

  describe('calculateMultiplayerElo', () => {
    const players = [
      { playerId: 'p1', rating: 1000, gamesPlayed: 0, rank: 1 },
      { playerId: 'p2', rating: 1000, gamesPlayed: 0, rank: 2 },
      { playerId: 'p3', rating: 1000, gamesPlayed: 0, rank: 3 },
    ];

    test('應返回所有玩家的 ELO 變化', () => {
      const results = calculateMultiplayerElo(players);
      expect(results).toHaveLength(3);
      results.forEach(r => {
        expect(r).toHaveProperty('playerId');
        expect(r).toHaveProperty('delta');
        expect(r).toHaveProperty('newRating');
      });
    });

    test('名次第一的玩家 delta 應為正', () => {
      const results = calculateMultiplayerElo(players);
      const first = results.find(r => r.playerId === 'p1');
      expect(first.delta).toBeGreaterThan(0);
    });

    test('名次最後的玩家 delta 應為負', () => {
      const results = calculateMultiplayerElo(players);
      const last = results.find(r => r.playerId === 'p3');
      expect(last.delta).toBeLessThan(0);
    });

    test('少於 2 名玩家應返回 delta 為 0', () => {
      const single = [{ playerId: 'p1', rating: 1000, gamesPlayed: 0, rank: 1 }];
      const results = calculateMultiplayerElo(single);
      expect(results[0].delta).toBe(0);
      expect(results[0].newRating).toBe(1000);
    });

    test('null 或空陣列應返回空結果', () => {
      expect(calculateMultiplayerElo(null)).toEqual([]);
      expect(calculateMultiplayerElo([])).toEqual([]);
    });

    test('新積分不應低於 MIN_ELO', () => {
      const lowPlayers = [
        { playerId: 'p1', rating: 1000, gamesPlayed: 0, rank: 1 },
        { playerId: 'p2', rating: MIN_ELO, gamesPlayed: 0, rank: 2 },
      ];
      const results = calculateMultiplayerElo(lowPlayers);
      results.forEach(r => {
        expect(r.newRating).toBeGreaterThanOrEqual(MIN_ELO);
      });
    });
  });
});
