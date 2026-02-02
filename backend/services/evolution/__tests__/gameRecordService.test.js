/**
 * GameRecordService 測試
 */

// Mock supabaseClient
jest.mock('../../supabaseClient', () => ({
  getSupabase: jest.fn(),
  isSupabaseEnabled: jest.fn(),
}));

const { getSupabase, isSupabaseEnabled } = require('../../supabaseClient');
const {
  GameRecordService,
  gameRecordService,
} = require('../gameRecordService');

describe('GameRecordService', () => {
  let service;
  let mockSupabase;

  beforeEach(() => {
    service = new GameRecordService();

    // 建立 mock Supabase 客戶端
    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
      limit: jest.fn(() => mockSupabase),
      single: jest.fn(),
    };

    getSupabase.mockReturnValue(mockSupabase);
    isSupabaseEnabled.mockReturnValue(true);

    // 清除 console 警告
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

  describe('recordGameStart', () => {
    const mockGameState = {
      id: 'game-123',
      config: { playerCount: 2 },
      turnOrder: ['player-1', 'player-2'],
    };

    it('should record game start successfully', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'game-123', status: 'playing' },
        error: null,
      });
      mockSupabase.insert.mockImplementation(() => ({
        ...mockSupabase,
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: 'game-123', status: 'playing' },
              error: null,
            }),
        }),
      }));

      // 重設 mock 鏈
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'evolution_games') {
          return {
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: 'game-123', status: 'playing' },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'evolution_participants') {
          return {
            insert: () => Promise.resolve({ error: null }),
          };
        }
        return mockSupabase;
      });

      const result = await service.recordGameStart(mockGameState);

      expect(result).toEqual({ id: 'game-123', status: 'playing' });
    });

    it('should return null when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.recordGameStart(mockGameState);

      expect(result).toBeNull();
      expect(console.warn).toHaveBeenCalled();
    });

    it('should throw error when game insert fails', async () => {
      mockSupabase.from.mockImplementation(() => ({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: 'Insert failed' },
              }),
          }),
        }),
      }));

      await expect(service.recordGameStart(mockGameState)).rejects.toEqual({
        message: 'Insert failed',
      });
    });

    it('should throw error when participants insert fails', async () => {
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'evolution_games') {
          return {
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: 'game-123' },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'evolution_participants') {
          return {
            insert: () =>
              Promise.resolve({ error: { message: 'Participants failed' } }),
          };
        }
        return mockSupabase;
      });

      await expect(service.recordGameStart(mockGameState)).rejects.toEqual({
        message: 'Participants failed',
      });
    });
  });

  describe('recordGameEnd', () => {
    const mockGameState = {
      id: 'game-123',
      round: 5,
      winner: 'player-1',
      startedAt: new Date(Date.now() - 600000).toISOString(), // 10 分鐘前
    };

    const mockScores = {
      'player-1': { total: 25, creatures: 4, traits: 5, foodBonus: 8 },
      'player-2': { total: 18, creatures: 3, traits: 4, foodBonus: 5 },
    };

    it('should record game end successfully', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }));

      const result = await service.recordGameEnd(mockGameState, mockScores);

      expect(result).toEqual({ success: true });
    });

    it('should return null when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.recordGameEnd(mockGameState, mockScores);

      expect(result).toBeNull();
    });

    it('should handle missing startedAt', async () => {
      const gameStateNoStart = { ...mockGameState, startedAt: null };

      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      }));

      const result = await service.recordGameEnd(gameStateNoStart, mockScores);

      expect(result).toEqual({ success: true });
    });

    it('should throw error when game update fails', async () => {
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: () => Promise.resolve({ error: { message: 'Update failed' } }),
        }),
      }));

      await expect(
        service.recordGameEnd(mockGameState, mockScores)
      ).rejects.toEqual({ message: 'Update failed' });
    });
  });

  describe('getPlayerStats', () => {
    it('should return player stats', async () => {
      const mockStats = {
        user_id: 'player-1',
        games_played: 10,
        games_won: 5,
        total_score: 200,
      };

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: mockStats, error: null }),
          }),
        }),
      }));

      const result = await service.getPlayerStats('player-1');

      expect(result).toEqual(mockStats);
    });

    it('should return default stats when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getPlayerStats('player-1');

      expect(result).toEqual(service.getDefaultStats());
    });

    it('should return default stats when player not found', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: 'PGRST116' },
              }),
          }),
        }),
      }));

      const result = await service.getPlayerStats('player-1');

      expect(result).toEqual(service.getDefaultStats());
    });

    it('should return default stats on error', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: 'OTHER_ERROR', message: 'Database error' },
              }),
          }),
        }),
      }));

      const result = await service.getPlayerStats('player-1');

      expect(result).toEqual(service.getDefaultStats());
    });
  });

  describe('getPlayerHistory', () => {
    it('should return player history', async () => {
      const mockHistory = [
        { id: 'game-1', final_score: 25 },
        { id: 'game-2', final_score: 18 },
      ];

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => Promise.resolve({ data: mockHistory, error: null }),
            }),
          }),
        }),
      }));

      const result = await service.getPlayerHistory('player-1');

      expect(result).toEqual(mockHistory);
    });

    it('should return empty array when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getPlayerHistory('player-1');

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () =>
                Promise.resolve({ data: null, error: { message: 'Error' } }),
            }),
          }),
        }),
      }));

      const result = await service.getPlayerHistory('player-1');

      expect(result).toEqual([]);
    });

    it('should use custom limit', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: (n) => {
                expect(n).toBe(50);
                return Promise.resolve({ data: [], error: null });
              },
            }),
          }),
        }),
      }));

      await service.getPlayerHistory('player-1', 50);
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard', async () => {
      const mockLeaderboard = [
        { user_id: 'player-1', rank: 1, games_won: 10 },
        { user_id: 'player-2', rank: 2, games_won: 8 },
      ];

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          limit: () =>
            Promise.resolve({ data: mockLeaderboard, error: null }),
        }),
      }));

      const result = await service.getLeaderboard();

      expect(result).toEqual(mockLeaderboard);
    });

    it('should return empty array when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getLeaderboard();

      expect(result).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          limit: () =>
            Promise.resolve({ data: null, error: { message: 'Error' } }),
        }),
      }));

      const result = await service.getLeaderboard();

      expect(result).toEqual([]);
    });
  });

  describe('getDailyLeaderboard', () => {
    it('should return daily leaderboard', async () => {
      const mockLeaderboard = [{ user_id: 'player-1', rank: 1 }];

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          limit: () =>
            Promise.resolve({ data: mockLeaderboard, error: null }),
        }),
      }));

      const result = await service.getDailyLeaderboard();

      expect(result).toEqual(mockLeaderboard);
    });

    it('should return empty array when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getDailyLeaderboard();

      expect(result).toEqual([]);
    });
  });

  describe('getWeeklyLeaderboard', () => {
    it('should return weekly leaderboard', async () => {
      const mockLeaderboard = [{ user_id: 'player-1', rank: 1 }];

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          limit: () =>
            Promise.resolve({ data: mockLeaderboard, error: null }),
        }),
      }));

      const result = await service.getWeeklyLeaderboard();

      expect(result).toEqual(mockLeaderboard);
    });

    it('should return empty array when Supabase is disabled', async () => {
      isSupabaseEnabled.mockReturnValue(false);

      const result = await service.getWeeklyLeaderboard();

      expect(result).toEqual([]);
    });
  });

  describe('getDefaultStats', () => {
    it('should return default stats object', () => {
      const stats = service.getDefaultStats();

      expect(stats).toEqual({
        games_played: 0,
        games_won: 0,
        total_score: 0,
        total_creatures: 0,
        total_traits: 0,
        total_kills: 0,
        total_deaths: 0,
        highest_score: 0,
        longest_game_rounds: 0,
        favorite_trait: null,
        last_played_at: null,
      });
    });
  });

  describe('singleton export', () => {
    it('should export gameRecordService instance', () => {
      expect(gameRecordService).toBeInstanceOf(GameRecordService);
    });
  });
});
