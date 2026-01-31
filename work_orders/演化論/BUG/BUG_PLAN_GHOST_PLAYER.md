# BUG 修復計畫書：演化論房間幽靈玩家問題

## 編號
BUG-EVO-002

## 日期
2026-01-31

## 問題描述

### 現象
用戶在創建演化論房間後，看到不明玩家（如「五蝦咪帶季」）出現在房間玩家列表中，但該玩家實際上已經離開房間。

### 重現步驟
1. 用戶 A 創建本草房間
2. 用戶 A 離開本草房間，回到遊戲選擇頁面
3. 用戶 A 選擇演化論，創建新房間
4. 房間顯示有其他玩家（如「五蝦咪帶季」），但該玩家實際已離開

### 後端日誌分析
```
[演化論] 創建房間: evo_1769857942763_99w1ro, 房主: ccc
[演化論] 房間創建成功: evo_1769857942763_99w1ro
[演化論] 已發送 evo:roomCreated 事件
[演化論] 玩家加入: 五蝦咪帶季 -> evo_1769857942763_99w1ro
[演化論] 玩家離開: 五蝦咪帶季 <- evo_1769857942763_99w1ro
```

日誌顯示「五蝦咪帶季」確實加入後又離開了，但前端顯示該玩家仍在房間中。

## 根本原因分析

### 原因 1：EvolutionLobby 的 initialRoom prop 不會響應式更新

**檔案**: `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`

```javascript
// 第 33 行
const [room, setRoom] = useState(initialRoom);
```

`useState` 的初始值只在組件首次渲染時使用。當 `initialRoom` prop 變化時，`room` 狀態**不會**自動更新。

### 原因 2：競態條件 (Race Condition)

時間線：
1. `EvolutionRoom` 渲染，`room` 狀態為 `null`
2. `EvolutionLobby` 渲染，`initialRoom` 為 `null`，`room` 狀態初始化為 `null`
3. `EvolutionRoom` 的 useEffect 觸發 `evoJoinRoom`
4. 其他用戶（五蝦咪帶季）加入房間
5. 後端發送 `evo:joinedRoom` 事件（包含五蝦咪帶季）
6. `EvolutionRoom` 更新 `room` 狀態，但 `EvolutionLobby` 的 `room` 狀態仍為舊值
7. 五蝦咪帶季離開，後端發送 `evo:playerLeft` 事件
8. 由於 `EvolutionLobby` 的監聽器可能還未正確接收事件，或 `room` 狀態未正確同步，導致顯示錯誤

### 原因 3：EvolutionRoom 自動加入邏輯問題

**檔案**: `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`

```javascript
// 第 90-98 行
useEffect(() => {
  if (!roomId || !user?.uid || isJoined) return;
  evoJoinRoom(roomId, {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0] || '玩家'
  });
}, [roomId, user, isJoined]);
```

當房主從 `EvolutionLobbyPage` 導航到 `EvolutionRoom` 時，會再次呼叫 `evoJoinRoom`，但房主在 `createRoom` 時已經加入房間了。這可能導致狀態不一致。

## 修復計畫

### 修復 1：同步 initialRoom prop 變化 (工單 0279)

在 `EvolutionLobby` 中添加 useEffect 來同步 `initialRoom` prop 的變化：

```javascript
// 同步 initialRoom 變化
useEffect(() => {
  if (initialRoom) {
    setRoom(initialRoom);
  }
}, [initialRoom]);
```

### 修復 2：房主創建房間後直接導航，不需要再次加入 (工單 0280)

修改 `EvolutionRoom` 的加入邏輯，判斷是否已經是房間成員：

```javascript
useEffect(() => {
  if (!roomId || !user?.uid || isJoined) return;

  // 如果已經有 room 資料且當前用戶已在房間中，直接設為已加入
  if (room && room.players?.some(p => p.id === user.uid)) {
    setIsJoined(true);
    return;
  }

  evoJoinRoom(roomId, { ... });
}, [roomId, user, isJoined, room]);
```

### 修復 3：將 room 資料從創建者傳遞到 EvolutionRoom (工單 0281)

在 `EvolutionLobbyPage` 導航時，將房間資料通過 location state 傳遞：

```javascript
navigate(`/game/evolution/${room.id}`, { state: { room, isCreator: true } });
```

在 `EvolutionRoom` 中接收：

```javascript
const location = useLocation();
const initialRoomData = location.state?.room;
const isCreator = location.state?.isCreator;
```

### 修復 4：確保 evo:playerLeft 事件正確處理 (工單 0282)

在後端確保離開事件正確廣播，並在前端確保監聽器設置正確。

## 實施順序

1. **工單 0279** - 修復 EvolutionLobby 的 initialRoom 同步問題
2. **工單 0280** - 修復 EvolutionRoom 重複加入問題
3. **工單 0281** - 優化房間資料傳遞流程
4. **工單 0282** - 確保 playerLeft 事件正確處理

## 驗收標準

1. 創建演化論房間後，房間只顯示房主一人
2. 其他玩家加入/離開時，房間列表即時更新
3. 不會出現「幽靈玩家」（已離開但仍顯示在列表中）
4. 房主創建房間後不會重複發送加入請求

## 相關檔案

- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`
- `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`
- `frontend/src/components/common/EvolutionLobbyPage/EvolutionLobbyPage.js`
- `backend/server.js`
- `backend/services/evolutionRoomManager.js`
