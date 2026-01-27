/**
 * 好友服務單元測試
 * 工單 0063
 */

// Mock supabase before requiring the service
jest.mock('../../db/supabase', () => {
  const mockData = {};

  const createMockChain = () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    return chain;
  };

  const supabase = {
    from: jest.fn(() => createMockChain()),
    _mockData: mockData,
    _createMockChain: createMockChain,
  };

  return { supabase };
});

const { supabase } = require('../../db/supabase');
const friendService = require('../../services/friendService');

describe('friendService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchPlayers', () => {
    // 工單 0178：建立搜尋用 mock 的輔助函數
    function createSearchMocks({ friendIds = [], pendingIds = [], searchResult = [], searchError = null } = {}) {
      const friendshipsChain = supabase._createMockChain();
      friendshipsChain.eq.mockReturnValue({
        ...friendshipsChain,
        then: (resolve) => resolve({ data: friendIds.map(id => ({ friend_id: id })), error: null }),
      });

      const pendingChain = supabase._createMockChain();
      pendingChain.eq.mockReturnValue({
        ...pendingChain,
        then: (resolve) => resolve({ data: pendingIds.map(id => ({ to_user_id: id })), error: null }),
      });

      const playersChain = supabase._createMockChain();
      playersChain.limit.mockResolvedValue({ data: searchResult, error: searchError });

      supabase.from
        .mockReturnValueOnce(friendshipsChain)
        .mockReturnValueOnce(pendingChain)
        .mockReturnValueOnce(playersChain);

      return { friendshipsChain, pendingChain, playersChain };
    }

    test('應返回符合搜尋條件的玩家', async () => {
      const mockPlayers = [
        { id: 'user-1', display_name: '小明', games_played: 10, games_won: 5 },
        { id: 'user-2', display_name: '小明明', games_played: 20, games_won: 15 },
      ];

      const { playersChain } = createSearchMocks({ searchResult: mockPlayers });

      const result = await friendService.searchPlayers('小明', 'current-user-id');

      expect(supabase.from).toHaveBeenCalledWith('friendships');
      expect(supabase.from).toHaveBeenCalledWith('friend_requests');
      expect(supabase.from).toHaveBeenCalledWith('players');
      expect(playersChain.ilike).toHaveBeenCalledWith('display_name', '%小明%');
      expect(result).toEqual(mockPlayers);
    });

    test('搜尋失敗時應返回空陣列', async () => {
      createSearchMocks({ searchError: { message: 'Database error' } });

      const result = await friendService.searchPlayers('test', 'user-id');

      expect(result).toEqual([]);
    });

    // 工單 0178：新增過濾測試
    test('應排除匿名玩家（firebase_uid 為 NULL）', async () => {
      const { playersChain } = createSearchMocks();

      await friendService.searchPlayers('test', 'user-id');

      expect(playersChain.not).toHaveBeenCalledWith('firebase_uid', 'is', null);
    });

    test('應排除已加好友的玩家', async () => {
      const { playersChain } = createSearchMocks({
        friendIds: ['friend-1', 'friend-2'],
      });

      await friendService.searchPlayers('test', 'me-id');

      // 驗證 not('id', 'in', ...) 包含自己和已加好友
      expect(playersChain.not).toHaveBeenCalledWith(
        'id', 'in', expect.stringContaining('me-id')
      );
      expect(playersChain.not).toHaveBeenCalledWith(
        'id', 'in', expect.stringContaining('friend-1')
      );
      expect(playersChain.not).toHaveBeenCalledWith(
        'id', 'in', expect.stringContaining('friend-2')
      );
    });

    test('應排除已發送 pending 請求的玩家', async () => {
      const { playersChain } = createSearchMocks({
        pendingIds: ['pending-1'],
      });

      await friendService.searchPlayers('test', 'me-id');

      expect(playersChain.not).toHaveBeenCalledWith(
        'id', 'in', expect.stringContaining('pending-1')
      );
    });
  });

  describe('sendFriendRequest', () => {
    test('應成功發送好友請求', async () => {
      const mockChain = supabase._createMockChain();
      // 模擬查詢：不是好友、沒有待處理請求、沒有反向請求
      mockChain.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 已是好友？
        .mockResolvedValueOnce({ data: null, error: null }) // 已發送請求？
        .mockResolvedValueOnce({ data: null, error: null }); // 反向請求？

      const newRequest = { id: 1, from_user_id: 'user-1', to_user_id: 'user-2' };
      mockChain.single.mockResolvedValue({ data: newRequest, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.sendFriendRequest('user-1', 'user-2', '你好');

      expect(supabase.from).toHaveBeenCalledWith('friend_requests');
      expect(result).toEqual(newRequest);
    });

    test('已是好友時應拋出錯誤', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.maybeSingle.mockResolvedValueOnce({
        data: { id: 'friendship-1' },
        error: null,
      });
      supabase.from.mockReturnValue(mockChain);

      await expect(
        friendService.sendFriendRequest('user-1', 'user-2')
      ).rejects.toThrow('已經是好友了');
    });

    test('已發送過請求時應拋出錯誤', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null }) // 不是好友
        .mockResolvedValueOnce({ data: { id: 'request-1', status: 'pending' }, error: null }); // 已有請求
      supabase.from.mockReturnValue(mockChain);

      await expect(
        friendService.sendFriendRequest('user-1', 'user-2')
      ).rejects.toThrow('已經發送過好友請求了');
    });

    // 工單 0179：雙向互加自動接受測試
    test('對方已發送 pending 請求時應自動接受並返回 autoAccepted', async () => {
      const mockChain = supabase._createMockChain();
      // 1. 不是好友
      // 2. 我沒有發送過請求
      // 3. 對方已有 pending 請求給我（觸發自動接受）
      mockChain.maybeSingle
        .mockResolvedValueOnce({ data: null, error: null })  // 已是好友？否
        .mockResolvedValueOnce({ data: null, error: null })  // 已發送請求？否
        .mockResolvedValueOnce({ data: { id: 'reverse-req-1' }, error: null }); // 反向請求？有

      // acceptFriendRequest 內部呼叫：取得請求 → 更新狀態 → 插入好友關係
      const mockRequest = {
        id: 'reverse-req-1',
        from_user_id: 'user-2',
        to_user_id: 'user-1',
        status: 'pending',
      };
      mockChain.single.mockResolvedValue({ data: mockRequest, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.sendFriendRequest('user-1', 'user-2');

      expect(result).toEqual({ autoAccepted: true });
      // 驗證呼叫了 friendships 表（建立好友關係）
      expect(supabase.from).toHaveBeenCalledWith('friendships');
    });
  });

  describe('acceptFriendRequest', () => {
    test('應成功接受好友請求', async () => {
      const mockRequest = {
        id: 'request-1',
        from_user_id: 'user-1',
        to_user_id: 'user-2',
        status: 'pending',
      };

      const mockChain = supabase._createMockChain();
      mockChain.single.mockResolvedValue({ data: mockRequest, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.acceptFriendRequest('request-1', 'user-2');

      expect(result).toEqual({ success: true });
    });

    test('找不到請求時應拋出錯誤', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });
      supabase.from.mockReturnValue(mockChain);

      await expect(
        friendService.acceptFriendRequest('invalid-id', 'user-2')
      ).rejects.toThrow('找不到此好友請求');
    });
  });

  describe('rejectFriendRequest', () => {
    test('應成功拒絕好友請求', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.eq.mockReturnValue({
        ...mockChain,
        then: (resolve) => resolve({ error: null }),
      });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.rejectFriendRequest('request-1', 'user-2');

      expect(result).toEqual({ success: true });
    });
  });

  describe('getFriendRequests', () => {
    test('應返回待處理的好友請求', async () => {
      const mockRequests = [
        { id: 'req-1', from_user_id: 'user-1', message: '加我好友' },
      ];
      const mockUsers = [
        { id: 'user-1', display_name: '小明', avatar_url: null },
      ];

      const mockChain = supabase._createMockChain();
      mockChain.order.mockResolvedValueOnce({ data: mockRequests, error: null });
      mockChain.in.mockResolvedValueOnce({ data: mockUsers, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.getFriendRequests('user-2');

      expect(Array.isArray(result)).toBe(true);
    });

    test('沒有請求時應返回空陣列', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.order.mockResolvedValue({ data: [], error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.getFriendRequests('user-2');

      expect(result).toEqual([]);
    });
  });

  describe('getFriends', () => {
    test('應返回好友列表', async () => {
      const mockFriendships = [
        { id: 'fs-1', friend_id: 'user-1', created_at: '2026-01-01' },
      ];
      const mockFriends = [
        { id: 'user-1', display_name: '小明', games_played: 10, games_won: 5 },
      ];
      const mockPresence = [
        { user_id: 'user-1', status: 'online' },
      ];

      const mockChain = supabase._createMockChain();
      mockChain.eq.mockReturnValue({
        ...mockChain,
        then: (resolve) => resolve({ data: mockFriendships, error: null }),
      });
      mockChain.in
        .mockResolvedValueOnce({ data: mockFriends, error: null })
        .mockResolvedValueOnce({ data: mockPresence, error: null });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.getFriends('user-2');

      expect(Array.isArray(result)).toBe(true);
    });

    test('沒有好友時應返回空陣列', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.eq.mockReturnValue({
        ...mockChain,
        then: (resolve) => resolve({ data: [], error: null }),
      });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.getFriends('user-2');

      expect(result).toEqual([]);
    });
  });

  describe('removeFriend', () => {
    test('應成功刪除好友', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.or.mockReturnValue({
        ...mockChain,
        then: (resolve) => resolve({ error: null }),
      });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.removeFriend('user-1', 'user-2');

      expect(supabase.from).toHaveBeenCalledWith('friendships');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getFriendRequestCount', () => {
    test('應返回待處理請求數量', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.eq.mockReturnValue({
        ...mockChain,
        then: (resolve) => resolve({ count: 5, error: null }),
      });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.getFriendRequestCount('user-1');

      expect(typeof result).toBe('number');
    });

    test('錯誤時應返回 0', async () => {
      const mockChain = supabase._createMockChain();
      mockChain.eq.mockReturnValue({
        ...mockChain,
        then: (resolve) => resolve({ count: null, error: { message: 'Error' } }),
      });
      supabase.from.mockReturnValue(mockChain);

      const result = await friendService.getFriendRequestCount('user-1');

      expect(result).toBe(0);
    });
  });
});
