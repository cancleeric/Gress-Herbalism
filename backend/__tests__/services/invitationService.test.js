/**
 * 遊戲邀請服務單元測試
 * 工單 0063
 */

jest.mock('../../db/supabase', () => {
  const createMockChain = () => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ data: [], error: null }),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  });

  return {
    supabase: {
      from: jest.fn(() => createMockChain()),
      _createMockChain: createMockChain,
    },
  };
});

const { supabase } = require('../../db/supabase');
const invitationService = require('../../services/invitationService');

describe('invitationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendGameInvitation', () => {
    test('應成功發送遊戲邀請', async () => {
      const mockFriendship = { id: 'fs-1' };
      const mockInvitation = {
        id: 'inv-1',
        from_user_id: 'user-1',
        to_user_id: 'user-2',
        room_id: 'room-1',
      };
      const mockFromUser = { display_name: '小明', avatar_url: null };

      const mockChain = supabase._createMockChain();
      mockChain.maybeSingle
        .mockResolvedValueOnce({ data: mockFriendship, error: null }) // 是好友
        .mockResolvedValueOnce({ data: null, error: null }); // 沒有待處理邀請
      mockChain.single
        .mockResolvedValueOnce({ data: mockInvitation, error: null }) // 建立邀請
        .mockResolvedValueOnce({ data: mockFromUser, error: null }); // 取得發送者資訊
      supabase.from.mockReturnValue(mockChain);

      const result = await invitationService.sendGameInvitation('user-1', 'user-2', 'room-1');

      expect(supabase.from).toHaveBeenCalledWith('friendships');
      expect(supabase.from).toHaveBeenCalledWith('game_invitations');
      expect(result).toEqual({
        ...mockInvitation,
        from_user: mockFromUser,
      });
    });

    test('非好友時應拋出錯誤', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      supabase.from.mockReturnValue(mockChain);

      await expect(
        invitationService.sendGameInvitation('user-1', 'user-2', 'room-1')
      ).rejects.toThrow('只能邀請好友');
    });

    test('已發送過邀請時應拋出錯誤', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.maybeSingle
        .mockResolvedValueOnce({ data: { id: 'fs-1' }, error: null }) // 是好友
        .mockResolvedValueOnce({ data: { id: 'inv-1' }, error: null }); // 已有邀請
      supabase.from.mockReturnValue(mockChain);

      await expect(
        invitationService.sendGameInvitation('user-1', 'user-2', 'room-1')
      ).rejects.toThrow('已經發送過邀請了');
    });
  });

  describe('respondToInvitation', () => {
    test('應成功接受邀請', async () => {
      const mockResult = { room_id: 'room-1' };

      const mockChain = supabase._createMockChain();
      mockChain.single.mockResolvedValue({ data: mockResult, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await invitationService.respondToInvitation('inv-1', 'user-2', 'accept');

      expect(supabase.from).toHaveBeenCalledWith('game_invitations');
      expect(result).toEqual(mockResult);
    });

    test('應成功拒絕邀請', async () => {
      const mockResult = { room_id: 'room-1' };

      const mockChain = supabase._createMockChain();
      mockChain.single.mockResolvedValue({ data: mockResult, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await invitationService.respondToInvitation('inv-1', 'user-2', 'reject');

      expect(result).toEqual(mockResult);
    });

    test('邀請不存在時應拋出錯誤', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      supabase.from.mockReturnValue(mockChain);

      await expect(
        invitationService.respondToInvitation('invalid', 'user-2', 'accept')
      ).rejects.toBeDefined();
    });
  });

  describe('getPendingInvitations', () => {
    test('應返回待處理的邀請', async () => {
      const mockInvitations = [
        { id: 'inv-1', room_id: 'room-1', from_user_id: 'user-1', created_at: '2026-01-01' },
      ];
      const mockUsers = [
        { id: 'user-1', display_name: '小明', avatar_url: null },
      ];

      const mockChain = supabase._createMockChain();
      mockChain.order.mockResolvedValue({ data: mockInvitations, error: null });
      mockChain.in.mockResolvedValue({ data: mockUsers, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await invitationService.getPendingInvitations('user-2');

      expect(Array.isArray(result)).toBe(true);
    });

    test('沒有邀請時應返回空陣列', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.order.mockResolvedValue({ data: [], error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await invitationService.getPendingInvitations('user-2');

      expect(result).toEqual([]);
    });

    test('查詢錯誤時應返回空陣列', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.order.mockResolvedValue({ data: null, error: { message: 'Error' } });
      supabase.from.mockReturnValue(mockChain);

      const result = await invitationService.getPendingInvitations('user-2');

      expect(result).toEqual([]);
    });
  });
});
