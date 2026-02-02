/**
 * evolutionAchievements 測試
 */

const {
  ACHIEVEMENT_CATEGORIES,
  ACHIEVEMENTS,
  getAchievementById,
  getVisibleAchievements,
  getAchievementsByCategory,
} = require('../evolutionAchievements');

describe('evolutionAchievements', () => {
  describe('ACHIEVEMENT_CATEGORIES', () => {
    it('should have all required categories', () => {
      expect(ACHIEVEMENT_CATEGORIES.MILESTONE).toBe('milestone');
      expect(ACHIEVEMENT_CATEGORIES.GAMEPLAY).toBe('gameplay');
      expect(ACHIEVEMENT_CATEGORIES.COLLECTION).toBe('collection');
      expect(ACHIEVEMENT_CATEGORIES.SPECIAL).toBe('special');
    });
  });

  describe('ACHIEVEMENTS', () => {
    it('should have all required achievements', () => {
      expect(ACHIEVEMENTS.FIRST_GAME).toBeDefined();
      expect(ACHIEVEMENTS.FIRST_WIN).toBeDefined();
      expect(ACHIEVEMENTS.VETERAN).toBeDefined();
      expect(ACHIEVEMENTS.CHAMPION).toBeDefined();
      expect(ACHIEVEMENTS.CARNIVORE_KING).toBeDefined();
      expect(ACHIEVEMENTS.PACIFIST).toBeDefined();
      expect(ACHIEVEMENTS.CREATURE_MASTER).toBeDefined();
      expect(ACHIEVEMENTS.PERFECT_SCORE).toBeDefined();
      expect(ACHIEVEMENTS.SURVIVOR).toBeDefined();
      expect(ACHIEVEMENTS.QUICK_WIN).toBeDefined();
      expect(ACHIEVEMENTS.TRAIT_COLLECTOR).toBeDefined();
      expect(ACHIEVEMENTS.CREATURE_BREEDER).toBeDefined();
      expect(ACHIEVEMENTS.SERIAL_KILLER).toBeDefined();
      expect(ACHIEVEMENTS.PERFECT_GAME).toBeDefined();
      expect(ACHIEVEMENTS.HIGH_WIN_RATE).toBeDefined();
    });

    it('should have valid structure for each achievement', () => {
      Object.values(ACHIEVEMENTS).forEach((achievement) => {
        expect(achievement.id).toBeDefined();
        expect(typeof achievement.id).toBe('string');
        expect(achievement.name).toBeDefined();
        expect(typeof achievement.name).toBe('string');
        expect(achievement.nameEn).toBeDefined();
        expect(typeof achievement.nameEn).toBe('string');
        expect(achievement.description).toBeDefined();
        expect(typeof achievement.description).toBe('string');
        expect(achievement.icon).toBeDefined();
        expect(typeof achievement.icon).toBe('string');
        expect(achievement.category).toBeDefined();
        expect(Object.values(ACHIEVEMENT_CATEGORIES)).toContain(achievement.category);
        expect(achievement.condition).toBeDefined();
        expect(typeof achievement.condition).toBe('object');
        expect(achievement.condition.type).toBeDefined();
        expect(achievement.points).toBeDefined();
        expect(typeof achievement.points).toBe('number');
        expect(typeof achievement.hidden).toBe('boolean');
      });
    });

    it('should have unique IDs', () => {
      const ids = Object.values(ACHIEVEMENTS).map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getAchievementById', () => {
    it('should return achievement by id', () => {
      const achievement = getAchievementById('first_win');
      expect(achievement).toBeDefined();
      expect(achievement.id).toBe('first_win');
      expect(achievement.name).toBe('初嚐勝果');
    });

    it('should return null for unknown id', () => {
      const achievement = getAchievementById('unknown_achievement');
      expect(achievement).toBeNull();
    });
  });

  describe('getVisibleAchievements', () => {
    it('should return only visible achievements', () => {
      const visible = getVisibleAchievements();
      expect(visible.length).toBeGreaterThan(0);
      visible.forEach((achievement) => {
        expect(achievement.hidden).toBe(false);
      });
    });

    it('should not include hidden achievements', () => {
      const visible = getVisibleAchievements();
      const hiddenIds = Object.values(ACHIEVEMENTS)
        .filter((a) => a.hidden)
        .map((a) => a.id);

      visible.forEach((achievement) => {
        expect(hiddenIds).not.toContain(achievement.id);
      });
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should return achievements in milestone category', () => {
      const milestones = getAchievementsByCategory(ACHIEVEMENT_CATEGORIES.MILESTONE);
      expect(milestones.length).toBeGreaterThan(0);
      milestones.forEach((achievement) => {
        expect(achievement.category).toBe(ACHIEVEMENT_CATEGORIES.MILESTONE);
      });
    });

    it('should return achievements in gameplay category', () => {
      const gameplay = getAchievementsByCategory(ACHIEVEMENT_CATEGORIES.GAMEPLAY);
      expect(gameplay.length).toBeGreaterThan(0);
      gameplay.forEach((achievement) => {
        expect(achievement.category).toBe(ACHIEVEMENT_CATEGORIES.GAMEPLAY);
      });
    });

    it('should return empty array for unknown category', () => {
      const unknown = getAchievementsByCategory('unknown_category');
      expect(unknown).toEqual([]);
    });
  });

  describe('成就條件類型', () => {
    it('should have valid condition types', () => {
      const validTypes = [
        'games_played',
        'games_won',
        'total_creatures',
        'total_traits',
        'total_kills',
        'win_rate',
        'score_in_game',
        'creatures_in_game',
        'kills_in_game',
        'win_in_rounds',
        'all_survived',
        'win_without_kills',
        'perfect_game',
      ];

      Object.values(ACHIEVEMENTS).forEach((achievement) => {
        expect(validTypes).toContain(achievement.condition.type);
      });
    });
  });

  describe('成就點數', () => {
    it('should have points between 10 and 100', () => {
      Object.values(ACHIEVEMENTS).forEach((achievement) => {
        expect(achievement.points).toBeGreaterThanOrEqual(10);
        expect(achievement.points).toBeLessThanOrEqual(100);
      });
    });
  });
});
