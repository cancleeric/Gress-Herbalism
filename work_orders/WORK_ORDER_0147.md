# 工作單 0147

**日期：** 2026-01-27

**工作單標題：** 修復 4 人房間時部分玩家看不到可用房間的問題

**工單主旨：** BUG 修復 - 4 人房間可用房間列表顯示不完整

**優先級：** 高

**依賴工單：** 無

**計畫書：** `docs/BUG_FIX_PLAN_0147_0148.md`

---

## 一、問題描述

### 現象
創建 4 人房間時，部分玩家無法在大廳看到「可用房間」列表。

### 重現步驟
1. 玩家 A 創建 4 人房間
2. 其他玩家（B、C、D）在大廳頁面
3. 部分玩家看不到可用房間列表

### 期望行為
所有在大廳的玩家都應該能看到可用房間列表。

---

## 二、問題分析

### 2.1 可能原因

#### 原因 1：Socket 連線時序問題
- 玩家連線時，伺服器發送房間列表
- 如果房間列表發送早於前端訂閱完成，會遺漏更新

#### 原因 2：房間列表廣播不完整
- `broadcastRoomList()` 使用 `io.emit()` 應該廣播給所有連線
- 可能有 Socket 連線狀態不正確的情況

#### 原因 3：前端訂閱時機
- Lobby 組件掛載時訂閱 `onRoomList`
- 可能在訂閱前就已經錯過廣播

### 2.2 相關程式碼

**後端 `server.js`:**
```javascript
// 第 432-447 行
function broadcastRoomList() {
  const rooms = [];
  gameRooms.forEach((state, gameId) => {
    if (state.gamePhase === 'waiting') {
      // ...
    }
  });
  io.emit('roomList', rooms);  // 廣播給所有連線
}

// 第 464 行 - 新連線時發送房間列表
socket.emit('roomList', getAvailableRooms());
```

**前端 `Lobby.js`:**
```javascript
// 第 118-120 行
const unsubRooms = onRoomList((updatedRooms) => {
  setRooms(updatedRooms);
});
```

---

## 三、修復方案

### 3.1 方案：加強房間列表同步

1. **前端主動請求房間列表**
   - Lobby 組件掛載後，主動請求一次房間列表
   - 確保不會因時序問題遺漏

2. **後端新增房間列表請求事件**
   - 新增 `requestRoomList` 事件
   - 收到請求時發送房間列表給該 Socket

### 3.2 實施步驟

#### 步驟 1：後端新增房間列表請求處理

**修改 `backend/server.js`:**
```javascript
// 新增房間列表請求事件
socket.on('requestRoomList', () => {
  socket.emit('roomList', getAvailableRooms());
});
```

#### 步驟 2：前端主動請求房間列表

**修改 `frontend/src/services/socketService.js`:**
```javascript
// 新增請求房間列表函數
export function requestRoomList() {
  const s = getSocket();
  s.emit('requestRoomList');
}
```

**修改 `frontend/src/components/Lobby/Lobby.js`:**
```javascript
// 在 useEffect 中，訂閱完成後主動請求一次
useEffect(() => {
  const unsubRooms = onRoomList((updatedRooms) => {
    setRooms(updatedRooms);
  });

  // 主動請求房間列表
  requestRoomList();

  // ...
}, []);
```

---

## 四、修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/server.js` | 新增 `requestRoomList` 事件處理 |
| `frontend/src/services/socketService.js` | 新增 `requestRoomList()` 函數 |
| `frontend/src/components/Lobby/Lobby.js` | 掛載後主動請求房間列表 |

---

## 五、驗收標準

- [ ] 創建 4 人房間後，所有大廳玩家都能看到房間
- [ ] 重新整理頁面後，房間列表正確顯示
- [ ] 不影響現有房間加入功能

---

## 六、測試步驟

1. 開啟 4 個瀏覽器視窗
2. 在視窗 A 創建 4 人房間
3. 確認視窗 B、C、D 都能看到可用房間
4. 在視窗 B 重新整理頁面
5. 確認視窗 B 仍能看到可用房間
6. 在視窗 C 加入房間
7. 確認視窗 D 看到房間人數更新

