# 工作單 0158

**日期**：2026-01-27

**工作單標題**：單元測試 - 後端系統服務與重連機制

**工單主旨**：測試 - 重連服務、好友服務、邀請服務、出席服務的單元測試

**優先級**：中

**依賴工單**：0153

**計畫書**：`docs/TEST_PLAN.md`

---

## 一、測試範圍

### 1.1 測試目標

| 服務模組 | 檔案 | 測試案例數 |
|---------|------|-----------|
| 重連服務 | `reconnectionService.test.js` | 10 |
| 好友服務 | `friendService.test.js` | 8 |
| 邀請服務 | `invitationService.test.js` | 5 |
| 出席服務 | `presenceService.test.js` | 5 |
| **小計** | | **28** |

### 1.2 覆蓋率目標
- 目標覆蓋率：80%

---

## 二、測試案例清單

### 2.1 重連服務測試 (UT-BE-08)
**檔案**：`backend/__tests__/services/reconnectionService.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-BE-08-01 | 保存斷線玩家 | 正確記錄玩家資訊和時間戳 |
| UT-BE-08-02 | 檢查重連有效性 | 有效期內返回 true |
| UT-BE-08-03 | 重連超時 | 超過時間返回 false |
| UT-BE-08-04 | 執行重連 | 成功恢復玩家狀態 |
| UT-BE-08-05 | 清除重連記錄 | 重連成功後清除記錄 |
| UT-BE-08-06 | 等待階段重連 | 使用較短超時時間 |
| UT-BE-08-07 | 遊戲中重連 | 使用較長超時時間 |
| UT-BE-08-08 | 重整寬限期 | 10秒內重連成功 |
| UT-BE-08-09 | 多人同時斷線 | 各自獨立處理 |
| UT-BE-08-10 | 房間不存在時重連 | 返回失敗並清除記錄 |

### 2.2 好友服務測試 (UT-BE-09)
**檔案**：`backend/__tests__/services/friendService.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-BE-09-01 | 搜尋玩家 | 返回匹配的玩家列表 |
| UT-BE-09-02 | 搜尋無結果 | 返回空陣列 |
| UT-BE-09-03 | 發送好友請求 | 成功創建請求記錄 |
| UT-BE-09-04 | 重複發送請求 | 返回已存在錯誤 |
| UT-BE-09-05 | 接受好友請求 | 建立好友關係 |
| UT-BE-09-06 | 拒絕好友請求 | 刪除請求記錄 |
| UT-BE-09-07 | 獲取好友列表 | 返回所有好友 |
| UT-BE-09-08 | 刪除好友 | 移除好友關係 |

### 2.3 邀請服務測試 (UT-BE-10)
**檔案**：`backend/__tests__/services/invitationService.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-BE-10-01 | 發送遊戲邀請 | 成功創建邀請記錄 |
| UT-BE-10-02 | 獲取待處理邀請 | 返回未過期邀請 |
| UT-BE-10-03 | 邀請過期 | 不返回過期邀請 |
| UT-BE-10-04 | 接受邀請 | 更新邀請狀態 |
| UT-BE-10-05 | 拒絕邀請 | 更新邀請狀態 |

### 2.4 出席服務測試 (UT-BE-11)
**檔案**：`backend/__tests__/services/presenceService.test.js`

| 編號 | 測試案例 | 預期結果 |
|------|---------|---------|
| UT-BE-11-01 | 更新在線狀態 | 成功更新為在線 |
| UT-BE-11-02 | 更新離線狀態 | 成功更新為離線 |
| UT-BE-11-03 | 獲取好友在線狀態 | 返回好友的在線資訊 |
| UT-BE-11-04 | 心跳更新 | 更新最後活動時間 |
| UT-BE-11-05 | 清除過期狀態 | 移除長時間無活動的記錄 |

---

## 三、測試程式碼範例

### 3.1 重連服務測試

```javascript
// backend/__tests__/services/reconnectionService.test.js
const ReconnectionService = require('../../services/reconnectionService');

describe('重連服務測試', () => {
  let reconnectionService;
  let mockGameRooms;

  beforeEach(() => {
    mockGameRooms = new Map();
    reconnectionService = new ReconnectionService(mockGameRooms);
  });

  afterEach(() => {
    jest.clearAllTimers();
    reconnectionService.clearAll();
  });

  describe('保存斷線玩家', () => {
    test('UT-BE-08-01: 正確記錄玩家資訊和時間戳', () => {
      const gameId = 'game-1';
      const playerId = 'player-1';
      const playerData = { name: '玩家1', isActive: true };

      reconnectionService.saveDisconnectedPlayer(gameId, playerId, playerData);

      const record = reconnectionService.getDisconnectedPlayer(gameId, playerId);

      expect(record).toBeDefined();
      expect(record.playerData).toEqual(playerData);
      expect(record.disconnectedAt).toBeDefined();
      expect(Date.now() - record.disconnectedAt).toBeLessThan(1000);
    });
  });

  describe('重連有效性檢查', () => {
    test('UT-BE-08-02: 有效期內返回 true', () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      reconnectionService.saveDisconnectedPlayer(gameId, playerId, {});

      const isValid = reconnectionService.isReconnectionValid(gameId, playerId);

      expect(isValid).toBe(true);
    });

    test('UT-BE-08-03: 超過時間返回 false', () => {
      jest.useFakeTimers();

      const gameId = 'game-1';
      const playerId = 'player-1';

      reconnectionService.saveDisconnectedPlayer(gameId, playerId, {});

      // 前進超過超時時間
      jest.advanceTimersByTime(120000); // 2分鐘

      const isValid = reconnectionService.isReconnectionValid(gameId, playerId);

      expect(isValid).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('執行重連', () => {
    test('UT-BE-08-04: 成功恢復玩家狀態', () => {
      const gameId = 'game-1';
      const playerId = 'player-1';
      const playerData = {
        id: playerId,
        name: '玩家1',
        hand: [{ id: 'c1', color: 'red' }],
        score: 5,
        isActive: true
      };

      // 設置遊戲房間
      mockGameRooms.set(gameId, {
        players: [
          { id: playerId, name: '玩家1', isActive: false },
          { id: 'player-2', name: '玩家2', isActive: true }
        ]
      });

      // 保存斷線資料
      reconnectionService.saveDisconnectedPlayer(gameId, playerId, playerData);

      // 執行重連
      const result = reconnectionService.executeReconnection(gameId, playerId, 'new-socket-id');

      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
    });

    test('UT-BE-08-10: 房間不存在時返回失敗', () => {
      const gameId = 'non-existent-game';
      const playerId = 'player-1';

      reconnectionService.saveDisconnectedPlayer(gameId, playerId, {});

      const result = reconnectionService.executeReconnection(gameId, playerId, 'socket-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('不存在');
    });
  });

  describe('等待階段 vs 遊戲中', () => {
    test('UT-BE-08-06: 等待階段使用較短超時', () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      mockGameRooms.set(gameId, {
        gamePhase: 'waiting',
        players: []
      });

      reconnectionService.saveDisconnectedPlayer(gameId, playerId, {}, 'waiting');

      const timeout = reconnectionService.getTimeout(gameId, playerId);

      expect(timeout).toBeLessThan(30000); // 小於 30 秒
    });

    test('UT-BE-08-07: 遊戲中使用較長超時', () => {
      const gameId = 'game-1';
      const playerId = 'player-1';

      mockGameRooms.set(gameId, {
        gamePhase: 'playing',
        players: []
      });

      reconnectionService.saveDisconnectedPlayer(gameId, playerId, {}, 'playing');

      const timeout = reconnectionService.getTimeout(gameId, playerId);

      expect(timeout).toBeGreaterThanOrEqual(60000); // 至少 60 秒
    });
  });
});
```

### 3.2 好友服務測試

```javascript
// backend/__tests__/services/friendService.test.js
const FriendService = require('../../services/friendService');

// Mock Supabase
jest.mock('../../db/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    single: jest.fn()
  }
}));

describe('好友服務測試', () => {
  let friendService;
  const { supabase } = require('../../db/supabase');

  beforeEach(() => {
    friendService = new FriendService();
    jest.clearAllMocks();
  });

  describe('搜尋玩家', () => {
    test('UT-BE-09-01: 返回匹配的玩家列表', async () => {
      const mockPlayers = [
        { uid: 'user-1', display_name: '測試玩家1' },
        { uid: 'user-2', display_name: '測試玩家2' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockResolvedValue({ data: mockPlayers, error: null })
        })
      });

      const result = await friendService.searchPlayers('測試');

      expect(result).toHaveLength(2);
      expect(result[0].display_name).toContain('測試');
    });

    test('UT-BE-09-02: 無結果時返回空陣列', async () => {
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      });

      const result = await friendService.searchPlayers('不存在的名字');

      expect(result).toEqual([]);
    });
  });

  describe('好友請求', () => {
    test('UT-BE-09-03: 成功創建請求記錄', async () => {
      supabase.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ data: { id: 'request-1' }, error: null })
      });

      const result = await friendService.sendFriendRequest('user-1', 'user-2');

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('friend_requests');
    });

    test('UT-BE-09-05: 接受請求建立好友關係', async () => {
      // Mock 更新請求狀態
      supabase.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: {}, error: null })
        })
      });

      // Mock 建立好友關係
      supabase.from.mockReturnValueOnce({
        insert: jest.fn().mockResolvedValue({ data: {}, error: null })
      });

      const result = await friendService.acceptFriendRequest('request-1');

      expect(result.success).toBe(true);
    });
  });

  describe('好友列表', () => {
    test('UT-BE-09-07: 返回所有好友', async () => {
      const mockFriends = [
        { friend_uid: 'user-2', created_at: '2026-01-01' },
        { friend_uid: 'user-3', created_at: '2026-01-02' }
      ];

      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockFriends, error: null })
        })
      });

      const result = await friendService.getFriends('user-1');

      expect(result).toHaveLength(2);
    });
  });
});
```

### 3.3 出席服務測試

```javascript
// backend/__tests__/services/presenceService.test.js
const PresenceService = require('../../services/presenceService');

describe('出席服務測試', () => {
  let presenceService;

  beforeEach(() => {
    presenceService = new PresenceService();
  });

  afterEach(() => {
    presenceService.clearAll();
  });

  describe('在線狀態管理', () => {
    test('UT-BE-11-01: 成功更新為在線', () => {
      const userId = 'user-1';

      presenceService.setOnline(userId, 'socket-1');

      const status = presenceService.getStatus(userId);

      expect(status.online).toBe(true);
      expect(status.socketId).toBe('socket-1');
    });

    test('UT-BE-11-02: 成功更新為離線', () => {
      const userId = 'user-1';

      presenceService.setOnline(userId, 'socket-1');
      presenceService.setOffline(userId);

      const status = presenceService.getStatus(userId);

      expect(status.online).toBe(false);
    });
  });

  describe('心跳機制', () => {
    test('UT-BE-11-04: 更新最後活動時間', () => {
      jest.useFakeTimers();

      const userId = 'user-1';
      presenceService.setOnline(userId, 'socket-1');

      const initialTime = presenceService.getStatus(userId).lastActivity;

      jest.advanceTimersByTime(5000);
      presenceService.heartbeat(userId);

      const newTime = presenceService.getStatus(userId).lastActivity;

      expect(newTime).toBeGreaterThan(initialTime);

      jest.useRealTimers();
    });
  });

  describe('好友在線查詢', () => {
    test('UT-BE-11-03: 返回好友的在線資訊', () => {
      presenceService.setOnline('user-1', 'socket-1');
      presenceService.setOnline('user-2', 'socket-2');
      presenceService.setOffline('user-3');

      const friendIds = ['user-1', 'user-2', 'user-3'];
      const statuses = presenceService.getFriendsStatus(friendIds);

      expect(statuses['user-1'].online).toBe(true);
      expect(statuses['user-2'].online).toBe(true);
      expect(statuses['user-3'].online).toBe(false);
    });
  });
});
```

---

## 四、驗收標準

- [ ] 所有 28 個測試案例通過
- [ ] 覆蓋率達到 80%
- [ ] Mock 正確模擬外部依賴
- [ ] 邊界情況正確處理

---

## 五、執行命令

```bash
# 執行服務測試
cd backend && npm test -- --testPathPattern="services/"

# 執行重連測試
cd backend && npm test -- --testPathPattern="reconnection"

# 查看覆蓋率
cd backend && npm test -- --coverage --collectCoverageFrom="services/**/*.js"
```

---

## 六、測試檔案清單

| 檔案路徑 | 狀態 |
|---------|------|
| `backend/__tests__/services/reconnectionService.test.js` | 已存在，需補充 |
| `backend/__tests__/services/friendService.test.js` | 已存在，需補充 |
| `backend/__tests__/services/invitationService.test.js` | 已存在，需補充 |
| `backend/__tests__/services/presenceService.test.js` | 已存在，需補充 |
