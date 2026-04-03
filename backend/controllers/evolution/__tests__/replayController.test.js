/**
 * ReplayController 測試
 */

// Mock services
jest.mock('../../../services/evolution/replayService', () => ({
  replayService: {
    getReplay: jest.fn(),
    isAvailable: jest.fn(),
  },
}));

jest.mock('../../../services/evolution/gameRecordService', () => ({
  gameRecordService: {
    getPlayerHistory: jest.fn(),
  },
}));

const { replayService } = require('../../../services/evolution/replayService');
const { gameRecordService } = require('../../../services/evolution/gameRecordService');
const { getReplay, getUserGameHistory } = require('../replayController');

/**
 * 建立 mock req/res
 */
function createMockReq(params = {}, query = {}) {
  return { params, query };
}

function createMockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('ReplayController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getReplay', () => {
    it('should return 400 when gameId is missing', async () => {
      const req = createMockReq({});
      const res = createMockRes();

      await getReplay(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('should return 404 when replay not found', async () => {
      replayService.getReplay.mockResolvedValue(null);

      const req = createMockReq({ gameId: 'test-game-id' });
      const res = createMockRes();

      await getReplay(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('找不到') })
      );
    });

    it('should return replay data on success', async () => {
      const mockReplay = {
        gameId: 'test-game-id',
        events: [{ type: 'game_start', timestamp: 1000 }],
        createdAt: new Date().toISOString(),
      };
      replayService.getReplay.mockResolvedValue(mockReplay);

      const req = createMockReq({ gameId: 'test-game-id' });
      const res = createMockRes();

      await getReplay(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockReplay,
        })
      );
    });

    it('should return 500 on service error', async () => {
      replayService.getReplay.mockRejectedValue(new Error('DB error'));

      const req = createMockReq({ gameId: 'test-game-id' });
      const res = createMockRes();

      await getReplay(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });
  });

  describe('getUserGameHistory', () => {
    it('should return 400 when userId is missing', async () => {
      const req = createMockReq({});
      const res = createMockRes();

      await getUserGameHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return history with replay status', async () => {
      const mockHistory = [
        { id: 'game-1', status: 'finished' },
        { id: 'game-2', status: 'finished' },
      ];
      gameRecordService.getPlayerHistory.mockResolvedValue(mockHistory);
      replayService.isAvailable.mockReturnValue(true);

      const req = createMockReq({ userId: 'user-123' }, { limit: '10' });
      const res = createMockRes();

      await getUserGameHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.arrayContaining([
            expect.objectContaining({ hasReplay: true }),
          ]),
        })
      );
    });

    it('should return empty array when history is empty', async () => {
      gameRecordService.getPlayerHistory.mockResolvedValue([]);
      replayService.isAvailable.mockReturnValue(false);

      const req = createMockReq({ userId: 'user-123' }, {});
      const res = createMockRes();

      await getUserGameHistory(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: [],
        })
      );
    });

    it('should cap limit at 100', async () => {
      gameRecordService.getPlayerHistory.mockResolvedValue([]);
      replayService.isAvailable.mockReturnValue(false);

      const req = createMockReq({ userId: 'user-123' }, { limit: '999' });
      const res = createMockRes();

      await getUserGameHistory(req, res);

      expect(gameRecordService.getPlayerHistory).toHaveBeenCalledWith('user-123', 100);
    });

    it('should return 500 on service error', async () => {
      gameRecordService.getPlayerHistory.mockRejectedValue(new Error('DB error'));

      const req = createMockReq({ userId: 'user-123' }, {});
      const res = createMockRes();

      await getUserGameHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
