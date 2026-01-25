/**
 * 線上狀態服務單元測試
 * 工單 0063
 */

jest.mock('../../db/supabase', () => {
  const createMockChain = () => ({
    select: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockResolvedValue({ error: null }),
    in: jest.fn().mockResolvedValue({ data: [], error: null }),
  });

  return {
    supabase: {
      from: jest.fn(() => createMockChain()),
      _createMockChain: createMockChain,
    },
  };
});

const { supabase } = require('../../db/supabase');
const presenceService = require('../../services/presenceService');

describe('presenceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updatePresence', () => {
    test('應正確更新線上狀態', async () => {
      const mockChain = supabase._createMockChain();
      supabase.from.mockReturnValue(mockChain);

      await presenceService.updatePresence('user-1', 'online', null);

      expect(supabase.from).toHaveBeenCalledWith('user_presence');
      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'online',
          current_room_id: null,
        })
      );
    });

    test('應正確更新遊戲中狀態', async () => {
      const mockChain = supabase._createMockChain();
      supabase.from.mockReturnValue(mockChain);

      await presenceService.updatePresence('user-1', 'in_game', 'room-123');

      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'in_game',
          current_room_id: 'room-123',
        })
      );
    });
  });

  describe('setOffline', () => {
    test('應將使用者設為離線', async () => {
      const mockChain = supabase._createMockChain();
      supabase.from.mockReturnValue(mockChain);

      await presenceService.setOffline('user-1');

      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'offline',
          current_room_id: null,
        })
      );
    });
  });

  describe('setOnline', () => {
    test('應將使用者設為線上', async () => {
      const mockChain = supabase._createMockChain();
      supabase.from.mockReturnValue(mockChain);

      await presenceService.setOnline('user-1');

      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'online',
        })
      );
    });
  });

  describe('setInGame', () => {
    test('應將使用者設為遊戲中', async () => {
      const mockChain = supabase._createMockChain();
      supabase.from.mockReturnValue(mockChain);

      await presenceService.setInGame('user-1', 'room-123');

      expect(mockChain.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-1',
          status: 'in_game',
          current_room_id: 'room-123',
        })
      );
    });
  });

  describe('getFriendsPresence', () => {
    test('應返回好友的線上狀態', async () => {
      const mockPresence = [
        { user_id: 'user-1', status: 'online', current_room_id: null },
        { user_id: 'user-2', status: 'in_game', current_room_id: 'room-1' },
      ];

      const mockChain = supabase._createMockChain();
      mockChain.in.mockResolvedValue({ data: mockPresence, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await presenceService.getFriendsPresence(['user-1', 'user-2']);

      expect(supabase.from).toHaveBeenCalledWith('user_presence');
      expect(result).toEqual(mockPresence);
    });

    test('空好友列表應返回空陣列', async () => {
      const result = await presenceService.getFriendsPresence([]);

      expect(result).toEqual([]);
    });

    test('null 好友列表應返回空陣列', async () => {
      const result = await presenceService.getFriendsPresence(null);

      expect(result).toEqual([]);
    });

    test('查詢錯誤時應返回空陣列', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.in.mockResolvedValue({ data: null, error: { message: 'Error' } });
      supabase.from.mockReturnValue(mockChain);

      const result = await presenceService.getFriendsPresence(['user-1']);

      expect(result).toEqual([]);
    });
  });
});
