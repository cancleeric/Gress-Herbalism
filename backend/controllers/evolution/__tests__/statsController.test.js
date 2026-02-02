/**
 * StatsController 測試
 */

// Mock services
jest.mock('../../../services/evolution/gameRecordService', () => ({
  gameRecordService: {
    getPlayerStats: jest.fn(),
    getPlayerHistory: jest.fn(),
  },
}));

jest.mock('../../../services/evolution/achievementService', () => ({
  achievementService: {
    getPlayerAchievements: jest.fn(),
    getAchievementProgress: jest.fn(),
  },
}));

const { gameRecordService } = require('../../../services/evolution/gameRecordService');
const { achievementService } = require('../../../services/evolution/achievementService');
const {
  getPlayerStats,
  getPlayerHistory,
  getPlayerAchievements,
  calculateDerivedStats,
  formatHistoryRecord,
  calculateTotalPoints,
} = require('../statsController');

describe('StatsController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      params: { userId: 'user-123' },
      query: {},
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn(() => mockRes),
    };

    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getPlayerStats', () => {
    it('should return player stats with derived stats', async () => {
      const mockStats = {
        games_played: 10,
        games_won: 5,
        total_score: 200,
        total_creatures: 40,
        total_traits: 80,
        total_kills: 15,
        total_deaths: 10,
      };
      gameRecordService.getPlayerStats.mockResolvedValue(mockStats);

      await getPlayerStats(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          games_played: 10,
          games_won: 5,
          win_rate: 50,
          avg_score: 20,
        }),
      });
    });

    it('should return 400 if userId is missing', async () => {
      mockReq.params = {};

      await getPlayerStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: '缺少 userId 參數',
      });
    });

    it('should handle errors', async () => {
      gameRecordService.getPlayerStats.mockRejectedValue(new Error('Database error'));

      await getPlayerStats(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPlayerHistory', () => {
    it('should return paginated history', async () => {
      const mockHistory = Array(30)
        .fill()
        .map((_, i) => ({
          id: `record-${i}`,
          game_id: `game-${i}`,
          final_score: 20 + i,
          final_rank: (i % 4) + 1,
          is_winner: i % 4 === 0,
          creatures_count: 3,
          traits_count: 5,
          food_bonus: 2,
          game: { ended_at: '2026-01-01T00:00:00Z', duration_seconds: 600, rounds: 5 },
        }));
      gameRecordService.getPlayerHistory.mockResolvedValue(mockHistory);

      await getPlayerHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Array),
        total: 30,
        limit: 20,
        offset: 0,
      });
      expect(mockRes.json.mock.calls[0][0].data.length).toBe(20);
    });

    it('should respect limit and offset', async () => {
      const mockHistory = Array(50).fill().map((_, i) => ({ id: `record-${i}` }));
      gameRecordService.getPlayerHistory.mockResolvedValue(mockHistory);
      mockReq.query.limit = '10';
      mockReq.query.offset = '5';

      await getPlayerHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 10,
          offset: 5,
        })
      );
    });

    it('should cap limit at 100', async () => {
      gameRecordService.getPlayerHistory.mockResolvedValue([]);
      mockReq.query.limit = '200';

      await getPlayerHistory(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
        })
      );
    });

    it('should return 400 if userId is missing', async () => {
      mockReq.params = {};

      await getPlayerHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      gameRecordService.getPlayerHistory.mockRejectedValue(new Error('Error'));

      await getPlayerHistory(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPlayerAchievements', () => {
    it('should return unlocked achievements', async () => {
      const mockAchievements = [
        { id: 'first_win', name: '初嚐勝果', points: 10 },
        { id: 'veteran', name: '老手', points: 20 },
      ];
      achievementService.getPlayerAchievements.mockResolvedValue(mockAchievements);

      await getPlayerAchievements(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          unlocked: mockAchievements,
          totalPoints: 30,
        },
      });
    });

    it('should include progress when requested', async () => {
      const mockAchievements = [{ id: 'first_win', points: 10 }];
      const mockProgress = [
        { id: 'first_win', unlocked: true, progress: 100 },
        { id: 'veteran', unlocked: false, progress: 50 },
      ];
      achievementService.getPlayerAchievements.mockResolvedValue(mockAchievements);
      achievementService.getAchievementProgress.mockResolvedValue(mockProgress);
      gameRecordService.getPlayerStats.mockResolvedValue({});
      mockReq.query.progress = 'true';

      await getPlayerAchievements(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          unlocked: mockAchievements,
          progress: mockProgress,
          totalAchievements: 2,
          unlockedCount: 1,
        }),
      });
    });

    it('should return 400 if userId is missing', async () => {
      mockReq.params = {};

      await getPlayerAchievements(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle errors', async () => {
      achievementService.getPlayerAchievements.mockRejectedValue(new Error('Error'));

      await getPlayerAchievements(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('calculateDerivedStats', () => {
    it('should calculate win rate', () => {
      const result = calculateDerivedStats({
        games_played: 10,
        games_won: 6,
        total_score: 200,
        total_creatures: 40,
        total_traits: 80,
        total_kills: 15,
        total_deaths: 10,
      });

      expect(result.win_rate).toBe(60);
      expect(result.avg_score).toBe(20);
      expect(result.avg_creatures).toBe(4);
      expect(result.avg_traits).toBe(8);
      expect(result.kd_ratio).toBe(1.5);
    });

    it('should handle zero games', () => {
      const result = calculateDerivedStats({
        games_played: 0,
        games_won: 0,
      });

      expect(result.win_rate).toBe(0);
      expect(result.avg_score).toBe(0);
    });

    it('should handle zero deaths', () => {
      const result = calculateDerivedStats({
        games_played: 5,
        total_kills: 10,
        total_deaths: 0,
      });

      expect(result.kd_ratio).toBe(10);
    });

    it('should handle null stats', () => {
      const result = calculateDerivedStats(null);
      expect(result).toEqual({});
    });
  });

  describe('formatHistoryRecord', () => {
    it('should format history record correctly', () => {
      const record = {
        id: 'record-1',
        game_id: 'game-1',
        final_score: 25,
        final_rank: 1,
        is_winner: true,
        creatures_count: 4,
        traits_count: 6,
        food_bonus: 3,
        created_at: '2026-01-01T00:00:00Z',
        game: {
          ended_at: '2026-01-01T01:00:00Z',
          duration_seconds: 3600,
          rounds: 8,
        },
      };

      const result = formatHistoryRecord(record);

      expect(result).toEqual({
        id: 'record-1',
        gameId: 'game-1',
        playedAt: '2026-01-01T01:00:00Z',
        duration: 3600,
        rounds: 8,
        score: 25,
        rank: 1,
        isWinner: true,
        creatures: 4,
        traits: 6,
        foodBonus: 3,
      });
    });

    it('should handle missing game data', () => {
      const record = {
        id: 'record-1',
        game_id: 'game-1',
        final_score: 20,
        created_at: '2026-01-01T00:00:00Z',
      };

      const result = formatHistoryRecord(record);

      expect(result.playedAt).toBe('2026-01-01T00:00:00Z');
      expect(result.duration).toBeUndefined();
    });

    it('should return null for null record', () => {
      expect(formatHistoryRecord(null)).toBeNull();
    });
  });

  describe('calculateTotalPoints', () => {
    it('should sum achievement points', () => {
      const achievements = [
        { points: 10 },
        { points: 20 },
        { points: 30 },
      ];

      expect(calculateTotalPoints(achievements)).toBe(60);
    });

    it('should handle empty array', () => {
      expect(calculateTotalPoints([])).toBe(0);
    });

    it('should handle null', () => {
      expect(calculateTotalPoints(null)).toBe(0);
    });

    it('should handle missing points', () => {
      const achievements = [{ points: 10 }, {}, { points: 20 }];
      expect(calculateTotalPoints(achievements)).toBe(30);
    });
  });
});
