# 工作單 0178

**編號**：0178

**日期**：2026-01-27

**工作單標題**：後端 — 搜尋結果過濾優化

**工單主旨**：修復好友搜尋結果包含不應出現的玩家（已加好友、已發送請求、匿名玩家）

---

## 內容

### 背景

`friendService.searchPlayers` 目前只排除搜尋者自己，但未排除：
- 已是好友的玩家
- 已發送 pending 好友請求的玩家
- 匿名玩家（`firebase_uid` 為 NULL）

這導致使用者可能對已是好友的人重複操作，體驗不佳。

### 工作內容

#### 1. 修改 `searchPlayers` — 排除匿名玩家

在查詢中加入 `firebase_uid` 非 NULL 的條件：

```javascript
.not('firebase_uid', 'is', null)
```

#### 2. 排除已加好友

查詢 friendships 表取得已加好友的 ID 列表，在搜尋結果中排除：

```javascript
const { data: friendships } = await supabase
  .from('friendships')
  .select('friend_id')
  .eq('user_id', currentPlayerId);
const friendIds = (friendships || []).map(f => f.friend_id);
// 在搜尋查詢中排除 friendIds
```

#### 3. 排除已發送 pending 請求

查詢 friend_requests 表取得已發送 pending 請求的對象 ID，排除：

```javascript
const { data: pendingRequests } = await supabase
  .from('friend_requests')
  .select('to_user_id')
  .eq('from_user_id', currentPlayerId)
  .eq('status', 'pending');
const pendingIds = (pendingRequests || []).map(r => r.to_user_id);
```

#### 4. 新增後端測試

在 `friendService.test.js` 中新增測試：
- 搜尋結果不包含匿名玩家
- 搜尋結果不包含已加好友的玩家
- 搜尋結果不包含已發送請求的玩家

### 驗收標準

| 標準 | 說明 |
|------|------|
| 排除匿名玩家 | firebase_uid 為 NULL 的玩家不出現在搜尋結果 |
| 排除已加好友 | 已是好友的玩家不出現 |
| 排除已發送請求 | 已發送 pending 請求的對象不出現 |
| 新增測試通過 | 所有新增測試通過 |
| 既有測試通過 | 190/190 後端測試 + 好友前端測試通過 |

---

**相關計畫書**：`docs/TEST_PLAN_FRIENDS_FEATURE.md`

**相關檔案**：
- `backend/services/friendService.js`
- `backend/__tests__/services/friendService.test.js`
