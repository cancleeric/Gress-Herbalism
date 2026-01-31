# 工單完成報告 0063

**日期：** 2026-01-25

**工作單標題：** 後端單元測試建置

**工單主旨：** 提升測試覆蓋率 - 建立後端服務層單元測試

**分類：** 測試

---

## 完成項目

### 1. 測試環境設置

#### 1.1 安裝依賴
```bash
npm install --save-dev jest supertest socket.io-client
```

#### 1.2 Jest 配置
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": ["**/*.js", "!node_modules/**", "!coverage/**"],
    "testMatch": ["**/__tests__/**/*.test.js", "**/*.test.js"]
  }
}
```

### 2. 測試檔案結構

```
backend/
├── __tests__/
│   ├── helpers/
│   │   ├── mockSupabase.js       # Supabase Mock 輔助工具
│   │   └── socketClient.js       # Socket.io 測試客戶端輔助
│   └── services/
│       ├── friendService.test.js     # 好友服務測試
│       ├── presenceService.test.js   # 線上狀態服務測試
│       └── invitationService.test.js # 邀請服務測試
```

### 3. 測試案例

#### 3.1 friendService.test.js (16 個測試)
- [x] searchPlayers - 搜尋玩家
- [x] searchPlayers - 搜尋失敗處理
- [x] sendFriendRequest - 發送好友請求
- [x] sendFriendRequest - 已是好友錯誤
- [x] sendFriendRequest - 重複請求錯誤
- [x] acceptFriendRequest - 接受請求
- [x] acceptFriendRequest - 找不到請求錯誤
- [x] rejectFriendRequest - 拒絕請求
- [x] getFriendRequests - 取得待處理請求
- [x] getFriendRequests - 空結果處理
- [x] getFriends - 取得好友列表
- [x] getFriends - 空好友處理
- [x] removeFriend - 刪除好友
- [x] getFriendRequestCount - 取得請求數量
- [x] getFriendRequestCount - 錯誤處理

#### 3.2 presenceService.test.js (9 個測試)
- [x] updatePresence - 更新線上狀態
- [x] updatePresence - 更新遊戲中狀態
- [x] setOffline - 設為離線
- [x] setOnline - 設為線上
- [x] setInGame - 設為遊戲中
- [x] getFriendsPresence - 取得好友狀態
- [x] getFriendsPresence - 空好友列表
- [x] getFriendsPresence - null 處理
- [x] getFriendsPresence - 錯誤處理

#### 3.3 invitationService.test.js (8 個測試)
- [x] sendGameInvitation - 發送邀請
- [x] sendGameInvitation - 非好友錯誤
- [x] sendGameInvitation - 重複邀請錯誤
- [x] respondToInvitation - 接受邀請
- [x] respondToInvitation - 拒絕邀請
- [x] respondToInvitation - 邀請不存在
- [x] getPendingInvitations - 取得待處理邀請
- [x] getPendingInvitations - 錯誤處理

## 測試結果

```
Test Suites: 3 passed, 3 total
Tests:       33 passed, 33 total
Time:        0.888 s
```

## 驗收項目

- [x] 所有服務檔案都有對應的測試檔案
- [x] 所有測試案例通過
- [x] Mock 策略正確實作
- [x] 測試輔助工具建立

---

**狀態：** ✅ 已完成
