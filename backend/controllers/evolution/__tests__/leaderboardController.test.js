/**
 * LeaderboardController 測試
 */

// Mock gameRecordService
jest.mock('../../../services/evolution/gameRecordService', () => ({
  gameRecordService: {
    getLeaderboard: jest.fn(),
    getDailyLeaderboard: jest.fn(),
    getWeeklyLeaderboard: jest.fn(),
  },
}));

const { gameRecordService } = require('../../../services/evolution/gameRecordService');
const {
  getLeaderboard,
  getDailyLeaderboard,
  getWeeklyLeaderboard,
  clearCache,
  cache,
} = require('../leaderboardController');

describe('LeaderboardController', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockReq = {
      query: {},
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn(() => mockRes),
    };

    cache.clear();
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard data', async () => {
      const mockData = [
        { user_id: 'user-1', rank: 1, games_won: 10 },
        { user_id: 'user-2', rank: 2, games_won: 8 },
      ];
      gameRecordService.getLeaderboard.mockResolvedValue(mockData);

      await getLeaderboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        total: 2,
        limit: 100,
        offset: 0,
      });
    });

    it('should respect limit parameter', async () => {
      const mockData = Array(10)
        .fill()
        .map((_, i) => ({ user_id: `user-${i}`, rank: i + 1 }));
      gameRecordService.getLeaderboard.mockResolvedValue(mockData);
      mockReq.query.limit = '5';

      await getLeaderboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockData.slice(0, 5),
          limit: 5,
        })
      );
    });

    it('should respect offset parameter', async () => {
      const mockData = Array(10)
        .fill()
        .map((_, i) => ({ user_id: `user-${i}`, rank: i + 1 }));
      gameRecordService.getLeaderboard.mockResolvedValue(mockData);
      mockReq.query.offset = '3';

      await getLeaderboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockData.slice(3, 103),
          offset: 3,
        })
      );
    });

    it('should cap limit at 500', async () => {
      gameRecordService.getLeaderboard.mockResolvedValue([]);
      mockReq.query.limit = '1000';

      await getLeaderboard(mockReq, mockRes);

      expect(gameRecordService.getLeaderboard).toHaveBeenCalledWith(500);
    });

    it('should use cache on second request', async () => {
      const mockData = [{ user_id: 'user-1', rank: 1 }];
      gameRecordService.getLeaderboard.mockResolvedValue(mockData);

      await getLeaderboard(mockReq, mockRes);
      await getLeaderboard(mockReq, mockRes);

      expect(gameRecordService.getLeaderboard).toHaveBeenCalledTimes(1);
      expect(mockRes.json).toHaveBeenLastCalledWith(
        expect.objectContaining({
          cached: true,
        })
      );
    });

    it('should handle errors', async () => {
      gameRecordService.getLeaderboard.mockRejectedValue(new Error('Database error'));

      await getLeaderboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: '取得排行榜失敗',
        })
      );
    });
  });

  describe('getDailyLeaderboard', () => {
    it('should return daily leaderboard data', async () => {
      const mockData = [{ user_id: 'user-1', rank: 1, games_today: 5 }];
      gameRecordService.getDailyLeaderboard.mockResolvedValue(mockData);

      await getDailyLeaderboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData,
          date: expect.any(String),
        })
      );
    });

    it('should cap limit at 200', async () => {
      gameRecordService.getDailyLeaderboard.mockResolvedValue([]);
      mockReq.query.limit = '500';

      await getDailyLeaderboard(mockReq, mockRes);

      expect(gameRecordService.getDailyLeaderboard).toHaveBeenCalledWith(200);
    });

    it('should use cache', async () => {
      const mockData = [{ user_id: 'user-1', rank: 1 }];
      gameRecordService.getDailyLeaderboard.mockResolvedValue(mockData);

      await getDailyLeaderboard(mockReq, mockRes);
      await getDailyLeaderboard(mockReq, mockRes);

      expect(gameRecordService.getDailyLeaderboard).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      gameRecordService.getDailyLeaderboard.mockRejectedValue(new Error('Error'));

      await getDailyLeaderboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getWeeklyLeaderboard', () => {
    it('should return weekly leaderboard data', async () => {
      const mockData = [{ user_id: 'user-1', rank: 1, games_this_week: 10 }];
      gameRecordService.getWeeklyLeaderboard.mockResolvedValue(mockData);

      await getWeeklyLeaderboard(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockData,
          weekStart: expect.any(String),
        })
      );
    });

    it('should cap limit at 200', async () => {
      gameRecordService.getWeeklyLeaderboard.mockResolvedValue([]);
      mockReq.query.limit = '500';

      await getWeeklyLeaderboard(mockReq, mockRes);

      expect(gameRecordService.getWeeklyLeaderboard).toHaveBeenCalledWith(200);
    });

    it('should use cache', async () => {
      const mockData = [{ user_id: 'user-1', rank: 1 }];
      gameRecordService.getWeeklyLeaderboard.mockResolvedValue(mockData);

      await getWeeklyLeaderboard(mockReq, mockRes);
      await getWeeklyLeaderboard(mockReq, mockRes);

      expect(gameRecordService.getWeeklyLeaderboard).toHaveBeenCalledTimes(1);
    });

    it('should handle errors', async () => {
      gameRecordService.getWeeklyLeaderboard.mockRejectedValue(new Error('Error'));

      await getWeeklyLeaderboard(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('clearCache', () => {
    it('should clear the cache', () => {
      cache.set('test-key', 'test-value');
      expect(cache.get('test-key')).toBe('test-value');

      clearCache(mockReq, mockRes);

      expect(cache.get('test-key')).toBeNull();
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: '快取已清除',
      });
    });
  });

  describe('cache', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1', 10000);
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for expired values', async () => {
      cache.set('key2', 'value2', 1); // 1ms TTL

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(cache.get('key2')).toBeNull();
    });

    it('should return null for non-existent keys', () => {
      expect(cache.get('non-existent')).toBeNull();
    });

    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
    });
  });
});
