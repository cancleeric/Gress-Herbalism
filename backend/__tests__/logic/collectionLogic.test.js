/**
 * collectionLogic 單元測試
 * Issue #63 - 本草百科集收藏系統
 */

const {
  HERB_IDS,
  HERB_UNLOCK_CONDITIONS,
  canUnlockHerb,
  getNewlyUnlockedHerbs,
  getCollectionProgress,
} = require('../../logic/herbalism/collectionLogic');

describe('collectionLogic', () => {
  // ==================== 常數測試 ====================

  describe('HERB_IDS', () => {
    test('包含四種草藥 ID', () => {
      expect(HERB_IDS).toHaveLength(4);
      expect(HERB_IDS).toContain('red');
      expect(HERB_IDS).toContain('yellow');
      expect(HERB_IDS).toContain('green');
      expect(HERB_IDS).toContain('blue');
    });
  });

  describe('HERB_UNLOCK_CONDITIONS', () => {
    test('每個草藥都有解鎖條件與門檻', () => {
      for (const herbId of HERB_IDS) {
        const rule = HERB_UNLOCK_CONDITIONS[herbId];
        expect(rule).toBeDefined();
        expect(['games_played', 'games_won']).toContain(rule.condition);
        expect(rule.threshold).toBeGreaterThan(0);
      }
    });
  });

  // ==================== canUnlockHerb ====================

  describe('canUnlockHerb', () => {
    test('red：完成 1 場遊戲即可解鎖', () => {
      expect(canUnlockHerb('red', { games_played: 1, games_won: 0 })).toBe(true);
    });

    test('red：0 場遊戲不能解鎖', () => {
      expect(canUnlockHerb('red', { games_played: 0, games_won: 0 })).toBe(false);
    });

    test('yellow：完成 3 場遊戲可解鎖', () => {
      expect(canUnlockHerb('yellow', { games_played: 3, games_won: 0 })).toBe(true);
    });

    test('yellow：完成 2 場遊戲不能解鎖', () => {
      expect(canUnlockHerb('yellow', { games_played: 2, games_won: 0 })).toBe(false);
    });

    test('green：贏得 3 場可解鎖', () => {
      expect(canUnlockHerb('green', { games_played: 5, games_won: 3 })).toBe(true);
    });

    test('green：贏得 2 場不能解鎖', () => {
      expect(canUnlockHerb('green', { games_played: 5, games_won: 2 })).toBe(false);
    });

    test('blue：贏得 5 場可解鎖', () => {
      expect(canUnlockHerb('blue', { games_played: 10, games_won: 5 })).toBe(true);
    });

    test('blue：贏得 4 場不能解鎖', () => {
      expect(canUnlockHerb('blue', { games_played: 10, games_won: 4 })).toBe(false);
    });

    test('未知草藥 ID 回傳 false', () => {
      expect(canUnlockHerb('purple', { games_played: 100, games_won: 100 })).toBe(false);
    });

    test('playerStats 為 null 回傳 false', () => {
      expect(canUnlockHerb('red', null)).toBe(false);
    });

    test('playerStats 缺少欄位時使用 0 預設值', () => {
      expect(canUnlockHerb('red', {})).toBe(false);
    });
  });

  // ==================== getNewlyUnlockedHerbs ====================

  describe('getNewlyUnlockedHerbs', () => {
    test('全新玩家（0 場）無新解鎖', () => {
      const result = getNewlyUnlockedHerbs({ games_played: 0, games_won: 0 }, []);
      expect(result).toHaveLength(0);
    });

    test('第 1 場遊戲後解鎖 red', () => {
      const result = getNewlyUnlockedHerbs({ games_played: 1, games_won: 0 }, []);
      expect(result).toContain('red');
      expect(result).not.toContain('yellow');
    });

    test('red 已解鎖時不重複解鎖', () => {
      const result = getNewlyUnlockedHerbs({ games_played: 1, games_won: 0 }, ['red']);
      expect(result).not.toContain('red');
    });

    test('達成多個條件時同時解鎖多個', () => {
      const result = getNewlyUnlockedHerbs(
        { games_played: 3, games_won: 3 },
        []
      );
      expect(result).toContain('red');
      expect(result).toContain('yellow');
      expect(result).toContain('green');
      expect(result).not.toContain('blue');
    });

    test('alreadyUnlocked 預設為空陣列', () => {
      const result = getNewlyUnlockedHerbs({ games_played: 1, games_won: 0 });
      expect(result).toContain('red');
    });
  });

  // ==================== getCollectionProgress ====================

  describe('getCollectionProgress', () => {
    test('空陣列：0 / 4，0%', () => {
      const progress = getCollectionProgress([]);
      expect(progress.unlocked).toBe(0);
      expect(progress.total).toBe(4);
      expect(progress.percentage).toBe(0);
    });

    test('解鎖 1 個：1 / 4，25%', () => {
      const progress = getCollectionProgress(['red']);
      expect(progress.unlocked).toBe(1);
      expect(progress.percentage).toBe(25);
    });

    test('解鎖全部：4 / 4，100%', () => {
      const progress = getCollectionProgress(['red', 'yellow', 'green', 'blue']);
      expect(progress.unlocked).toBe(4);
      expect(progress.percentage).toBe(100);
    });

    test('無效的 herb_id 不計入', () => {
      const progress = getCollectionProgress(['red', 'invalid_herb']);
      expect(progress.unlocked).toBe(1);
    });
  });
});
