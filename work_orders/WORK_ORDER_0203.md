# 工作單 0203

## 編號
0203

## 日期
2026-01-28

## 工作單標題
撰寫重連場景 E2E 測試、localStorage 重連測試與回歸測試

## 工單主旨
撰寫涵蓋各遊戲階段的重連 E2E 測試、前端 localStorage 重連函數測試，以及回歸測試確認正常流程不受影響

## 內容

### 測試目標

- 涵蓋所有遊戲階段的重連場景
- 測試邊界條件（超時、房間刪除、快速重整）
- 驗證正常遊戲流程的回歸穩定性
- 補齊 localStorage 重連相關函數的測試

### 測試檔案

1. `backend/__tests__/reconnection.test.js`（擴充 — E2E 場景與回歸測試）
2. `frontend/src/utils/localStorage.test.js`（擴充 — 重連函數測試）

---

### Part A：後端 E2E 場景測試

#### TC-0203-01：等待階段重整後恢復

```
describe('E2E 重連場景')
```

- 3 人在等待階段 → 1 人發送 `playerRefreshing` → 斷線 → 重連
- 斷言：
  - 收到 `reconnected` 事件
  - 玩家列表仍為 3 人
  - 房主不變
  - 遊戲階段仍為 `waiting`

#### TC-0203-02：遊戲中重整（輪到自己）

- 建立 3 人房間 → 開始遊戲 → 設定 `currentPlayerIndex = 0`
- 玩家 0 發送 `playerRefreshing` → 斷線 → 重連
- 斷言：
  - `gamePhase` 為 `playing`
  - `currentPlayerIndex` 仍指向該玩家
  - 手牌完整（`player.hand` 不為空）

#### TC-0203-03：遊戲中重整（非自己回合）

- 開始遊戲 → `currentPlayerIndex = 1`（輪到玩家 B）
- 玩家 A（index 0）發送 `playerRefreshing` → 斷線 → 重連
- 斷言：
  - `currentPlayerIndex` 仍指向玩家 B
  - 玩家 A 的手牌完整

---

### Part B：邊界條件測試

#### TC-0203-04：超時被移除後嘗試重連

- 等待階段 → 玩家斷線（不發送 `playerRefreshing`）
- 等待超過 `WAITING_PHASE_DISCONNECT_TIMEOUT`（測試中為 500ms）
- 嘗試重連
- 斷言：
  - 收到 `reconnectFailed`
  - `reason` 為 `'player_not_found'`（玩家已被移除）

#### TC-0203-05：房間已刪除時重連

- 已有此測試（EC-01），確認仍通過
- 額外驗證：`reason` 為 `'room_not_found'`，`message` 為 `'房間已不存在'`

#### TC-0203-06：快速連續重整

- 已有此測試（PF-01），確認仍通過
- 額外驗證：3 次重整後房間狀態一致

---

### Part C：回歸測試

#### TC-0203-07：正常加入離開流程

- 建立房間 → 玩家 B 加入 → 玩家 B 離開
- 斷言：
  - 加入時收到 `joinedRoom`
  - 離開後房間只剩 1 人
  - 房主正確

#### TC-0203-08：正常遊戲開始流程

- 建立房間 → 3 人加入 → 開始遊戲
- 斷言：
  - `gamePhase` 變為 `playing`
  - 每位玩家有手牌
  - `score` 初始化為 0

---

### Part D：前端 localStorage 重連函數測試

#### TC-0203-09：saveCurrentRoom 儲存完整性

```javascript
test('saveCurrentRoom 應儲存完整房間資訊並附加 timestamp', () => {
  saveCurrentRoom({ roomId: 'room1', playerId: 'p1', playerName: '玩家A' });
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM));
  expect(saved.roomId).toBe('room1');
  expect(saved.playerId).toBe('p1');
  expect(saved.playerName).toBe('玩家A');
  expect(saved.timestamp).toBeDefined();
  expect(typeof saved.timestamp).toBe('number');
});
```

#### TC-0203-10：getCurrentRoom 過期機制

```javascript
test('getCurrentRoom 過期機制應在 2 小時後返回 null', () => {
  const expired = {
    roomId: 'room1', playerId: 'p1', playerName: '玩家A',
    timestamp: Date.now() - 3 * 60 * 60 * 1000  // 3 小時前
  };
  localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(expired));
  expect(getCurrentRoom()).toBeNull();
});
```

#### TC-0203-11：getCurrentRoom 未過期資料

```javascript
test('getCurrentRoom 應正常讀取未過期的資料', () => {
  const recent = {
    roomId: 'room1', playerId: 'p1', playerName: '玩家A',
    timestamp: Date.now() - 30 * 60 * 1000  // 30 分鐘前
  };
  localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, JSON.stringify(recent));
  const result = getCurrentRoom();
  expect(result).not.toBeNull();
  expect(result.roomId).toBe('room1');
});
```

#### TC-0203-12：clearCurrentRoom 清除驗證

```javascript
test('clearCurrentRoom 後 getCurrentRoom 應返回 null', () => {
  saveCurrentRoom({ roomId: 'room1', playerId: 'p1', playerName: '玩家A' });
  expect(getCurrentRoom()).not.toBeNull();
  clearCurrentRoom();
  expect(getCurrentRoom()).toBeNull();
});
```

#### TC-0203-13：getCurrentRoom 容錯 — 損壞的 JSON

```javascript
test('getCurrentRoom 應容忍損壞的 JSON', () => {
  localStorage.setItem(STORAGE_KEYS.CURRENT_ROOM, 'not valid json {{{');
  expect(getCurrentRoom()).toBeNull();
});
```

#### TC-0203-14：getCurrentRoom 容錯 — 無資料

```javascript
test('getCurrentRoom 無資料時應返回 null', () => {
  localStorage.removeItem(STORAGE_KEYS.CURRENT_ROOM);
  expect(getCurrentRoom()).toBeNull();
});
```

### 前置條件

- 工單 0199-0202 已完成

### 驗收標準

- [ ] 所有新增測試案例通過
- [ ] 前端 utils 模組覆蓋率維持 ≥ 93%
- [ ] 後端既有測試不受影響
- [ ] 前後端覆蓋率報告已產出

### 相關檔案

- `backend/__tests__/reconnection.test.js` — 修改
- `frontend/src/utils/localStorage.test.js` — 修改
- `frontend/src/utils/localStorage.js` — 參考

### 參考計畫書

`docs/TEST_PLAN_RECONNECTION_V2.md` 第六章
