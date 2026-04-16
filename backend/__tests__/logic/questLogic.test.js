/**
 * questLogic 單元測試
 * Issue #61 - 每日任務系統
 */

const {
  QUEST_TYPES,
  QUEST_TEMPLATES,
  CHECKIN_REWARDS,
  getTodayUTC8,
  getYesterdayUTC8,
  generateDailyQuests,
  calculateProgressIncrement,
  calculateCheckinReward,
} = require('../../logic/herbalism/questLogic');

describe('questLogic', () => {
  // ==================== 常數測試 ====================

  describe('QUEST_TYPES', () => {
    test('包含必要的任務類型', () => {
      expect(QUEST_TYPES.PLAY_GAMES).toBe('play_games');
      expect(QUEST_TYPES.WIN_GAMES).toBe('win_games');
      expect(QUEST_TYPES.WIN_STREAK).toBe('win_streak');
    });
  });

  describe('QUEST_TEMPLATES', () => {
    test('包含簡單、普通、困難難度各至少一個', () => {
      const difficulties = QUEST_TEMPLATES.map(t => t.difficulty);
      expect(difficulties).toContain('easy');
      expect(difficulties).toContain('normal');
      expect(difficulties).toContain('hard');
    });

    test('每個模板都有必要欄位', () => {
      QUEST_TEMPLATES.forEach(t => {
        expect(t).toHaveProperty('quest_type');
        expect(t).toHaveProperty('difficulty');
        expect(t).toHaveProperty('target');
        expect(t).toHaveProperty('reward_coins');
        expect(t.target).toBeGreaterThan(0);
        expect(t.reward_coins).toBeGreaterThan(0);
      });
    });
  });

  // ==================== 日期工具測試 ====================

  describe('getTodayUTC8', () => {
    test('回傳 YYYY-MM-DD 格式', () => {
      const today = getTodayUTC8();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('回傳有效日期', () => {
      const today = getTodayUTC8();
      const parsed = new Date(today);
      expect(isNaN(parsed.getTime())).toBe(false);
    });
  });

  describe('getYesterdayUTC8', () => {
    test('回傳 YYYY-MM-DD 格式', () => {
      const yesterday = getYesterdayUTC8();
      expect(yesterday).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('昨天比今天早 1 天', () => {
      const today = getTodayUTC8();
      const yesterday = getYesterdayUTC8();
      const todayDate = new Date(today);
      const yesterdayDate = new Date(yesterday);
      const diff = todayDate.getTime() - yesterdayDate.getTime();
      expect(diff).toBe(24 * 60 * 60 * 1000);
    });
  });

  // ==================== 任務生成測試 ====================

  describe('generateDailyQuests', () => {
    test('生成 3 個任務', () => {
      const quests = generateDailyQuests();
      expect(quests).toHaveLength(3);
    });

    test('包含簡單、普通、困難各 1 個', () => {
      const quests = generateDailyQuests();
      const difficulties = quests.map(q => q.difficulty);
      expect(difficulties).toContain('easy');
      expect(difficulties).toContain('normal');
      expect(difficulties).toContain('hard');
    });

    test('每個任務都有必要欄位', () => {
      const quests = generateDailyQuests();
      quests.forEach(q => {
        expect(q).toHaveProperty('quest_type');
        expect(q).toHaveProperty('difficulty');
        expect(q).toHaveProperty('target');
        expect(q).toHaveProperty('reward_coins');
      });
    });
  });

  // ==================== 進度計算測試 ====================

  describe('calculateProgressIncrement', () => {
    test('PLAY_GAMES：無論輸贏都加 1', () => {
      expect(calculateProgressIncrement(QUEST_TYPES.PLAY_GAMES, { isWinner: true })).toBe(1);
      expect(calculateProgressIncrement(QUEST_TYPES.PLAY_GAMES, { isWinner: false })).toBe(1);
    });

    test('WIN_GAMES：贏加 1，輸加 0', () => {
      expect(calculateProgressIncrement(QUEST_TYPES.WIN_GAMES, { isWinner: true })).toBe(1);
      expect(calculateProgressIncrement(QUEST_TYPES.WIN_GAMES, { isWinner: false })).toBe(0);
    });

    test('WIN_STREAK：贏加 1，輸回傳 null（重置信號）', () => {
      expect(calculateProgressIncrement(QUEST_TYPES.WIN_STREAK, { isWinner: true })).toBe(1);
      expect(calculateProgressIncrement(QUEST_TYPES.WIN_STREAK, { isWinner: false })).toBeNull();
    });

    test('未知類型回傳 0', () => {
      expect(calculateProgressIncrement('unknown_type', { isWinner: true })).toBe(0);
    });
  });

  // ==================== 簽到獎勵計算測試 ====================

  describe('calculateCheckinReward', () => {
    test('第 1 天簽到獎勵為基礎值', () => {
      const reward = calculateCheckinReward(1);
      expect(reward).toBe(CHECKIN_REWARDS.base);
    });

    test('連續簽到天數越多，獎勵越高', () => {
      const reward1 = calculateCheckinReward(1);
      const reward3 = calculateCheckinReward(3);
      const reward7 = calculateCheckinReward(7);
      expect(reward3).toBeGreaterThan(reward1);
      expect(reward7).toBeGreaterThan(reward3);
    });

    test('第 7 天包含週獎勵', () => {
      const reward7 = calculateCheckinReward(7);
      const expectedBase = CHECKIN_REWARDS.base + 6 * CHECKIN_REWARDS.streakBonus;
      expect(reward7).toBe(expectedBase + CHECKIN_REWARDS.weekBonus);
    });

    test('超過 7 天連續後再次達到 7 的倍數時發放週獎勵', () => {
      const reward14 = calculateCheckinReward(14);
      expect(reward14).toBeGreaterThanOrEqual(CHECKIN_REWARDS.weekBonus);
    });

    test('連續天數超過 7 天後不再累加加碼（上限）', () => {
      const reward7 = calculateCheckinReward(7);
      const reward8 = calculateCheckinReward(8);
      // 第 8 天基礎不應超過第 7 天的加碼部分（週獎勵除外）
      expect(reward8).toBeLessThan(reward7);
    });
  });
});
