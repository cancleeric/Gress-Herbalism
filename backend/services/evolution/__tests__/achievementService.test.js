/**
 * AchievementService 測試
 */

// Mock supabaseClient
jest.mock('../../supabaseClient', () => ({
  getSupabase: jest.fn(),
  isSupabaseEnabled: jest.fn(),
}));

const { getSupabase, isSupabaseEnabled } = require('../../supabaseClient');
const {
  AchievementService,
  achievementService,
} = require('../achievementService');

describe('AchievementService', () => {
  let service;
  let mockSupabase;

  beforeEach(() => {
    service = new AchievementService();

    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
    };

    getSupabase.mockReturnValue(mockSupabase);
    isSupabaseEnabled.mockReturnValue(true);

    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isAvailable', () => {
    it('should return true when Supabase is enabled', () => {
      isSupabaseEnabled.mockReturnValue(true);
      expect(service.isAvailable()).toBe(true);
    });

    it('should return false when Supabase is disabled', () => {
      isSupabaseEnabled.mockReturnValue(false);
      expect(service.isAvailable()).toBe(false);
    });
  });

  describe('checkCondition', () => {
    describe('累計統計類', () => {
      it('should check games_played condition', () => {
        const condition = { type: 'games_played', value: 10 };
        expect(service.checkCondition(condition, { games_played: 10 }, null)).toBe(true);
        expect(service.checkCondition(condition, { games_played: 9 }, null)).toBe(false);
      });

      it('should check games_won condition', () => {
        const condition = { type: 'games_won', value: 5 };
        expect(service.checkCondition(condition, { games_won: 5 }, null)).toBe(true);
        expect(service.checkCondition(condition, { games_won: 4 }, null)).toBe(false);
      });

      it('should check total_creatures condition', () => {
        const condition = { type: 'total_creatures', value: 50 };
        expect(service.checkCondition(condition, { total_creatures: 50 }, null)).toBe(true);
      });

      it('should check total_traits condition', () => {
        const condition = { type: 'total_traits', value: 100 };
        expect(service.checkCondition(condition, { total_traits: 100 }, null)).toBe(true);
      });

      it('should check total_kills condition', () => {
        const condition = { type: 'total_kills', value: 25 };
        expect(service.checkCondition(condition, { total_kills: 30 }, null)).toBe(true);
      });
    });

    describe('勝率類', () => {
      it('should check win_rate condition with minGames', () => {
        const condition = { type: 'win_rate', value: 60, minGames: 20 };
        // 12/20 = 60% -> true (meets 60%)
        expect(
          service.checkCondition(condition, { games_played: 20, games_won: 12 }, null)
        ).toBe(true);
        // 11/20 = 55% -> false (below 60%)
        expect(
          service.checkCondition(condition, { games_played: 20, games_won: 11 }, null)
        ).toBe(false);
      });

      it('should return false if minGames not met', () => {
        const condition = { type: 'win_rate', value: 60, minGames: 20 };
        expect(
          service.checkCondition(condition, { games_played: 10, games_won: 10 }, null)
        ).toBe(false);
      });
    });

    describe('單場遊戲類', () => {
      it('should check score_in_game condition', () => {
        const condition = { type: 'score_in_game', value: 40 };
        expect(service.checkCondition(condition, null, { score: 40 })).toBe(true);
        expect(service.checkCondition(condition, null, { score: 39 })).toBe(false);
      });

      it('should check creatures_in_game condition', () => {
        const condition = { type: 'creatures_in_game', value: 8 };
        expect(service.checkCondition(condition, null, { creaturesCount: 8 })).toBe(true);
      });

      it('should check kills_in_game condition', () => {
        const condition = { type: 'kills_in_game', value: 5 };
        expect(service.checkCondition(condition, null, { killsCount: 5 })).toBe(true);
      });

      it('should check win_in_rounds condition', () => {
        const condition = { type: 'win_in_rounds', value: 5 };
        expect(
          service.checkCondition(condition, null, { isWinner: true, rounds: 5 })
        ).toBe(true);
        expect(
          service.checkCondition(condition, null, { isWinner: true, rounds: 6 })
        ).toBe(false);
        expect(
          service.checkCondition(condition, null, { isWinner: false, rounds: 3 })
        ).toBe(false);
      });
    });

    describe('布林條件類', () => {
      it('should check all_survived condition', () => {
        const condition = { type: 'all_survived', value: true };
        expect(service.checkCondition(condition, null, { allSurvived: true })).toBe(true);
        expect(service.checkCondition(condition, null, { allSurvived: false })).toBe(false);
      });

      it('should check win_without_kills condition', () => {
        const condition = { type: 'win_without_kills', value: true };
        expect(
          service.checkCondition(condition, null, { isWinner: true, killsCount: 0 })
        ).toBe(true);
        expect(
          service.checkCondition(condition, null, { isWinner: true, killsCount: 1 })
        ).toBe(false);
      });

      it('should check perfect_game condition', () => {
        const condition = { type: 'perfect_game', value: true };
        expect(
          service.checkCondition(condition, null, { isWinner: true, allFed: true })
        ).toBe(true);
        expect(
          service.checkCondition(condition, null, { isWinner: true, allFed: false })
        ).toBe(false);
      });
    });

    describe('邊界情況', () => {
      it('should return false for null condition', () => {
        expect(service.checkCondition(null, {}, {})).toBe(false);
      });

      it('should return false for unknown condition type', () => {
        expect(service.checkCondition({ type: 'unknown' }, {}, {})).toBe(false);
      });

      it('should handle null stats', () => {
        const condition = { type: 'games_played', value: 1 };
        expect(service.checkCondition(condition, null, null)).toBe(false);
      });
    });
  });

  describe('checkAndUnlock', () => {
    const mockStats = {
      games_played: 15,
      games_won: 8,
      total_creatures: 50,
      total_traits: 100,
      total_kills: 25,
    };

    it('should return empty array when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.checkAndUnlock('user-1', {}, mockStats);

      expect(result).toEqual([]);
    });

    it('should return unlocked achievements', async () => {
      // Mock: 沒有已解鎖的成就
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'evolution_player_achievements') {
          return {
            select: () => ({
              eq: () => Promise.resolve({ data: [], error: null }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return mockSupabase;
      });

      const result = await service.checkAndUnlock('user-1', {}, mockStats);

      // 應該解鎖多個成就
      expect(result.length).toBeGreaterThan(0);
    });

    it('should skip already unlocked achievements', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'evolution_player_achievements') {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [{ achievement_id: 'first_game' }],
                  error: null,
                }),
            }),
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return mockSupabase;
      });

      const result = await service.checkAndUnlock('user-1', {}, mockStats);

      // first_game 不應該在結果中
      expect(result.find((a) => a.id === 'first_game')).toBeUndefined();
    });

    it('should return empty array on fetch error', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
        }),
      }));

      const result = await service.checkAndUnlock('user-1', {}, mockStats);

      expect(result).toEqual([]);
    });
  });

  describe('unlockAchievement', () => {
    it('should return false when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.unlockAchievement('user-1', 'first_win');

      expect(result).toBe(false);
    });

    it('should return true on successful unlock', async () => {
      mockSupabase.from.mockImplementation(() => ({
        insert: () => Promise.resolve({ error: null }),
      }));

      const result = await service.unlockAchievement('user-1', 'first_win', 'game-1');

      expect(result).toBe(true);
    });

    it('should return true on duplicate (23505)', async () => {
      mockSupabase.from.mockImplementation(() => ({
        insert: () => Promise.resolve({ error: { code: '23505' } }),
      }));

      const result = await service.unlockAchievement('user-1', 'first_win');

      expect(result).toBe(true);
    });

    it('should return false on other errors', async () => {
      mockSupabase.from.mockImplementation(() => ({
        insert: () => Promise.resolve({ error: { code: 'OTHER', message: 'Error' } }),
      }));

      const result = await service.unlockAchievement('user-1', 'first_win');

      expect(result).toBe(false);
    });
  });

  describe('getPlayerAchievements', () => {
    it('should return empty array when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getPlayerAchievements('user-1');

      expect(result).toEqual([]);
    });

    it('should return player achievements', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({
                data: [
                  { achievement_id: 'first_win', unlocked_at: '2026-01-01', game_id: 'game-1' },
                ],
                error: null,
              }),
          }),
        }),
      }));

      const result = await service.getPlayerAchievements('user-1');

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('first_win');
      expect(result[0].unlockedAt).toBe('2026-01-01');
    });

    it('should return empty array on error', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: 'Error' } }),
          }),
        }),
      }));

      const result = await service.getPlayerAchievements('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAchievementProgress', () => {
    const mockStats = {
      games_played: 5,
      games_won: 2,
      total_creatures: 25,
    };

    it('should return progress for all achievements', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () =>
            Promise.resolve({
              data: [{ achievement_id: 'first_game' }],
              error: null,
            }),
        }),
      }));

      const result = await service.getAchievementProgress('user-1', mockStats);

      expect(result.length).toBeGreaterThan(0);
      expect(result.find((a) => a.id === 'first_game').unlocked).toBe(true);
    });

    it('should calculate progress correctly', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getAchievementProgress('user-1', mockStats);

      // games_played = 5, target = 10 (veteran) = 50%
      const veteranProgress = result.find((a) => a.id === 'veteran');
      expect(veteranProgress.progress).toBe(50);
    });
  });

  describe('calculateProgress', () => {
    it('should calculate progress percentage', () => {
      expect(service.calculateProgress({ type: 'games_played', value: 10 }, { games_played: 5 })).toBe(50);
      expect(service.calculateProgress({ type: 'games_played', value: 10 }, { games_played: 10 })).toBe(100);
      expect(service.calculateProgress({ type: 'games_played', value: 10 }, { games_played: 15 })).toBe(100);
    });

    it('should return 0 for null condition', () => {
      expect(service.calculateProgress(null, {})).toBe(0);
    });

    it('should return 0 for invalid target', () => {
      expect(service.calculateProgress({ type: 'games_played', value: 0 }, {})).toBe(0);
    });
  });

  describe('getCurrentValue', () => {
    const stats = {
      games_played: 10,
      games_won: 5,
      total_creatures: 50,
      total_traits: 100,
      total_kills: 25,
      highest_score: 45,
    };

    it('should return correct values for each type', () => {
      expect(service.getCurrentValue('games_played', stats)).toBe(10);
      expect(service.getCurrentValue('games_won', stats)).toBe(5);
      expect(service.getCurrentValue('total_creatures', stats)).toBe(50);
      expect(service.getCurrentValue('total_traits', stats)).toBe(100);
      expect(service.getCurrentValue('total_kills', stats)).toBe(25);
      expect(service.getCurrentValue('highest_score', stats)).toBe(45);
    });

    it('should return 0 for unknown type', () => {
      expect(service.getCurrentValue('unknown', stats)).toBe(0);
    });

    it('should return 0 for null stats', () => {
      expect(service.getCurrentValue('games_played', null)).toBe(0);
    });
  });

  describe('singleton export', () => {
    it('should export achievementService instance', () => {
      expect(achievementService).toBeInstanceOf(AchievementService);
    });
  });
});
