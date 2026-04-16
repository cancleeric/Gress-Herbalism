/**
 * seasonLogic 單元測試
 * 工單 0064 - 賽季聯賽系統
 */

const {
  TIER_NAMES,
  TIERS,
  SOFT_RESET_RATIO,
  SOFT_RESET_BASE,
  getTierByElo,
  getTierProgress,
  calculateSoftResetElo,
  getSeasonRemainingSeconds,
  formatSeasonCountdown,
  getSeasonRewards,
} = require('../../logic/common/seasonLogic');

describe('seasonLogic', () => {
  // ==================== 常數 ====================
  describe('常數', () => {
    test('TIER_NAMES 應包含 5 個段位', () => {
      expect(Object.keys(TIER_NAMES)).toHaveLength(5);
      expect(TIER_NAMES.GRASS).toBe('grass');
      expect(TIER_NAMES.APPRENTICE).toBe('apprentice');
      expect(TIER_NAMES.DOCTOR).toBe('doctor');
      expect(TIER_NAMES.PHARMACIST).toBe('pharmacist');
      expect(TIER_NAMES.GRANDMASTER).toBe('grandmaster');
    });

    test('TIERS 應包含 5 個段位配置', () => {
      expect(TIERS).toHaveLength(5);
    });

    test('每個段位應有必要欄位', () => {
      TIERS.forEach(tier => {
        expect(tier).toHaveProperty('id');
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('minElo');
        expect(tier).toHaveProperty('maxElo');
        expect(tier).toHaveProperty('cardBack');
        expect(tier).toHaveProperty('rewards');
        expect(tier).toHaveProperty('icon');
      });
    });

    test('SOFT_RESET_RATIO 應為 0.5', () => {
      expect(SOFT_RESET_RATIO).toBe(0.5);
    });

    test('SOFT_RESET_BASE 應為 1000（DEFAULT_ELO）', () => {
      expect(SOFT_RESET_BASE).toBe(1000);
    });
  });

  // ==================== getTierByElo ====================
  describe('getTierByElo', () => {
    test('ELO < 1100 應為草民', () => {
      expect(getTierByElo(1000).id).toBe(TIER_NAMES.GRASS);
      expect(getTierByElo(0).id).toBe(TIER_NAMES.GRASS);
      expect(getTierByElo(1099).id).toBe(TIER_NAMES.GRASS);
    });

    test('ELO 1100-1299 應為藥童', () => {
      expect(getTierByElo(1100).id).toBe(TIER_NAMES.APPRENTICE);
      expect(getTierByElo(1200).id).toBe(TIER_NAMES.APPRENTICE);
      expect(getTierByElo(1299).id).toBe(TIER_NAMES.APPRENTICE);
    });

    test('ELO 1300-1499 應為醫師', () => {
      expect(getTierByElo(1300).id).toBe(TIER_NAMES.DOCTOR);
      expect(getTierByElo(1400).id).toBe(TIER_NAMES.DOCTOR);
      expect(getTierByElo(1499).id).toBe(TIER_NAMES.DOCTOR);
    });

    test('ELO 1500-1699 應為藥師', () => {
      expect(getTierByElo(1500).id).toBe(TIER_NAMES.PHARMACIST);
      expect(getTierByElo(1600).id).toBe(TIER_NAMES.PHARMACIST);
      expect(getTierByElo(1699).id).toBe(TIER_NAMES.PHARMACIST);
    });

    test('ELO >= 1700 應為本草大師', () => {
      expect(getTierByElo(1700).id).toBe(TIER_NAMES.GRANDMASTER);
      expect(getTierByElo(2000).id).toBe(TIER_NAMES.GRANDMASTER);
    });

    test('非數字應回傳預設段位（草民）', () => {
      expect(getTierByElo(undefined).id).toBe(TIER_NAMES.GRASS);
      expect(getTierByElo(null).id).toBe(TIER_NAMES.GRASS);
    });

    test('段位應有 name 欄位', () => {
      const tier = getTierByElo(1000);
      expect(tier.name).toBe('草民');
    });
  });

  // ==================== getTierProgress ====================
  describe('getTierProgress', () => {
    test('最高段位應回傳 progressPercent 100 且 nextTier null', () => {
      const progress = getTierProgress(1800);
      expect(progress.nextTier).toBeNull();
      expect(progress.progressPercent).toBe(100);
      expect(progress.eloNeeded).toBe(0);
    });

    test('草民升藥童需要 1100 ELO，初始 1000 需要 100 分', () => {
      const progress = getTierProgress(1000);
      expect(progress.nextTier.id).toBe(TIER_NAMES.APPRENTICE);
      expect(progress.eloNeeded).toBe(100);
    });

    test('進度百分比應在 0~100 之間', () => {
      const progress = getTierProgress(1050);
      expect(progress.progressPercent).toBeGreaterThanOrEqual(0);
      expect(progress.progressPercent).toBeLessThanOrEqual(100);
    });

    test('剛升段（段位下限）進度應為 0%', () => {
      const progress = getTierProgress(1100);
      expect(progress.progressPercent).toBe(0);
    });
  });

  // ==================== calculateSoftResetElo ====================
  describe('calculateSoftResetElo', () => {
    test('ELO 1000 軟重置後應仍為 1000', () => {
      expect(calculateSoftResetElo(1000)).toBe(1000);
    });

    test('ELO 2000 軟重置後應為 1500', () => {
      expect(calculateSoftResetElo(2000)).toBe(1500);
    });

    test('ELO 500 軟重置後應為 750', () => {
      expect(calculateSoftResetElo(500)).toBe(750);
    });

    test('ELO 1700 軟重置後應為 1350', () => {
      expect(calculateSoftResetElo(1700)).toBe(1350);
    });

    test('非數字輸入應使用 DEFAULT_ELO 計算', () => {
      expect(calculateSoftResetElo(undefined)).toBe(1000);
      expect(calculateSoftResetElo(null)).toBe(1000);
    });

    test('軟重置後 ELO 應向 1000 靠攏', () => {
      const highElo = calculateSoftResetElo(2000);
      const lowElo = calculateSoftResetElo(200);
      expect(highElo).toBeLessThan(2000);
      expect(lowElo).toBeGreaterThan(200);
    });
  });

  // ==================== getSeasonRemainingSeconds ====================
  describe('getSeasonRemainingSeconds', () => {
    test('未來日期應回傳正數秒數', () => {
      const futureDate = new Date(Date.now() + 3600000); // 1小時後
      const remaining = getSeasonRemainingSeconds(futureDate);
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(3600);
    });

    test('過去日期應回傳負數秒數', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1小時前
      const remaining = getSeasonRemainingSeconds(pastDate);
      expect(remaining).toBeLessThan(0);
    });
  });

  // ==================== formatSeasonCountdown ====================
  describe('formatSeasonCountdown', () => {
    test('負數秒數應回傳 ended: true', () => {
      const result = formatSeasonCountdown(-1);
      expect(result.ended).toBe(true);
      expect(result.days).toBe(0);
    });

    test('0 秒應回傳 ended: true', () => {
      const result = formatSeasonCountdown(0);
      expect(result.ended).toBe(true);
    });

    test('90061 秒應為 1天2時1分1秒', () => {
      // 1 day = 86400, 2 hours = 7200, 1 min = 60, 1 sec = 1 → total = 93661
      const result = formatSeasonCountdown(93661);
      expect(result.days).toBe(1);
      expect(result.hours).toBe(2);
      expect(result.minutes).toBe(1);
      expect(result.seconds).toBe(1);
      expect(result.ended).toBe(false);
    });

    test('3600 秒應為 1小時', () => {
      const result = formatSeasonCountdown(3600);
      expect(result.days).toBe(0);
      expect(result.hours).toBe(1);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });
  });

  // ==================== getSeasonRewards ====================
  describe('getSeasonRewards', () => {
    test('草民應獲得 10 金幣', () => {
      const rewards = getSeasonRewards(TIER_NAMES.GRASS);
      expect(rewards.coins).toBe(10);
      expect(rewards.title).toBe('草民');
    });

    test('本草大師應獲得 200 金幣', () => {
      const rewards = getSeasonRewards(TIER_NAMES.GRANDMASTER);
      expect(rewards.coins).toBe(200);
      expect(rewards.title).toBe('本草大師');
    });

    test('獎勵應包含卡背', () => {
      const rewards = getSeasonRewards(TIER_NAMES.PHARMACIST);
      expect(rewards).toHaveProperty('cardBack');
    });

    test('未知段位應回傳草民獎勵', () => {
      const rewards = getSeasonRewards('unknown_tier');
      expect(rewards.title).toBe('草民');
    });
  });
});
