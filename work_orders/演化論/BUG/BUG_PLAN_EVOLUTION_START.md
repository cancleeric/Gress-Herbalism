# BUG 修復計畫書：演化論遊戲無法開始

## 問題描述

房主創建房間後，在等待頁面看到的是「準備」按鈕而不是「開始遊戲」按鈕，導致遊戲無法開始。

## 問題截圖分析

- 房間 ID: `evo_1769858393786_upqaep`
- 玩家：ccc (房主) 和 aaa
- 房主 ccc 看到的是「準備」按鈕和提示「點擊「準備」按鈕表示您已準備好開始遊戲」
- 這表示系統沒有識別出 ccc 是房主

## 根本原因分析

### 問題 1：玩家識別 ID 不一致

**EvolutionLobbyPage.js** 創建房間時（第 159-164 行）：
```javascript
const player = {
  id: playerId,           // playerId = `player_${Date.now()}_xxx` 格式
  name: nickname.trim(),
  firebaseUid: user?.uid, // Firebase UID
  photoURL: user?.photoURL || null,
};
```

**EvolutionLobby.js** 查找當前玩家時（第 46-47 行）：
```javascript
const currentPlayer = room?.players?.find(p => p.id === user?.uid);
const isHost = currentPlayer?.isHost;
```

問題：`p.id` 是 `player_xxx_xxx` 格式，但 `user?.uid` 是 Firebase UID，兩者不匹配，導致 `currentPlayer` 為 `undefined`，`isHost` 為 `false`。

### 問題 2：setReady 使用錯誤的 ID

**EvolutionLobby.js**（第 104-107 行）：
```javascript
const handleToggleReady = useCallback(() => {
  if (!roomId || !user?.uid) return;
  evoSetReady(roomId, user.uid, !isReady);  // 發送 Firebase UID
}, [roomId, user?.uid, isReady]);
```

後端 `evolutionRoomManager.setReady()` 期望接收 `player_xxx` 格式的 ID，但前端發送的是 Firebase UID。

### 問題 3：startGame 使用錯誤的 ID

**EvolutionLobby.js**（第 109-113 行）：
```javascript
const handleStartGame = useCallback(() => {
  if (!roomId || !user?.uid) return;
  evoStartGame(roomId, user.uid);  // 發送 Firebase UID
}, [roomId, user?.uid]);
```

後端 `evolutionRoomManager.startGame()` 驗證房主時使用 `room.hostPlayerId`（`player_xxx` 格式），但收到的是 Firebase UID，永遠不會匹配。

### 問題 4：leaveRoom 使用錯誤的 ID

**EvolutionLobby.js**（第 115-121 行）：
```javascript
const handleLeaveRoom = useCallback(() => {
  if (!roomId || !user?.uid) return;
  evoLeaveRoom(roomId, user.uid);  // 發送 Firebase UID
  navigate('/lobby/evolution');
}, [roomId, user?.uid, navigate]);
```

後端 `evolutionRoomManager.leaveRoom()` 使用 `player.id` 查找玩家，但收到的是 Firebase UID。

### 問題 5：EvolutionRoom.js 中的 ID 不一致

**第 101 行：**
```javascript
if (isCreator || (room && room.players?.some(p => p.id === user.uid))) {
```

**第 108-111 行：**
```javascript
evoJoinRoom(roomId, {
  id: user.uid,  // 這裡用 Firebase UID 作為 player ID
  name: user.displayName || user.email?.split('@')[0] || '玩家'
});
```

這造成了更大的不一致：
- 創建房間時：`id = player_xxx_xxx`，`firebaseUid = s6q3jhV...`
- 加入房間時：`id = s6q3jhV...`（Firebase UID）

### 與本草遊戲的比較

本草遊戲 **GameRoom.js** 的做法：
1. 將 `currentPlayerId` 存儲在遊戲狀態中
2. 使用 `getMyPlayer()` 函數，通過 `gameState.currentPlayerId` 查找玩家
3. 整個流程中 ID 保持一致

## 解決方案

### 方案：統一使用 firebaseUid 進行玩家識別

這是最簡潔的解決方案，因為：
1. `firebaseUid` 已經存儲在每個玩家物件中
2. 前端可以直接從 `user.uid` 取得
3. 不需要額外傳遞或存儲生成的 `player_xxx` ID

## 實施計畫

### 工單 0283：修復 EvolutionLobby.js 玩家識別

**修改內容：**
1. 修改第 46 行，使用 `firebaseUid` 查找當前玩家：
   ```javascript
   const currentPlayer = room?.players?.find(p => p.firebaseUid === user?.uid);
   ```
2. 修改第 74 行，playerReady 事件處理中的比對：
   ```javascript
   if (playerId === currentPlayer?.id) {
     setIsReady(ready);
   }
   ```
3. 修改第 104-107 行 handleToggleReady：
   ```javascript
   evoSetReady(roomId, currentPlayer?.id, !isReady);
   ```
4. 修改第 109-113 行 handleStartGame：
   ```javascript
   evoStartGame(roomId, currentPlayer?.id);
   ```
5. 修改第 115-121 行 handleLeaveRoom：
   ```javascript
   evoLeaveRoom(roomId, currentPlayer?.id);
   ```
6. 修改第 155 行 player-card 的 current-player 樣式判斷：
   ```javascript
   className={`player-card ${player.firebaseUid === user?.uid ? 'current-player' : ''}`}
   ```

### 工單 0284：修復 EvolutionRoom.js 玩家識別與加入邏輯

**修改內容：**
1. 修改第 101 行，使用 `firebaseUid` 判斷是否在房間中：
   ```javascript
   if (isCreator || (room && room.players?.some(p => p.firebaseUid === user.uid))) {
   ```
2. 修改第 108-111 行加入房間時的玩家物件，加入 `firebaseUid`：
   ```javascript
   evoJoinRoom(roomId, {
     id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
     name: user.displayName || user.email?.split('@')[0] || '玩家',
     firebaseUid: user.uid,
     photoURL: user?.photoURL || null
   });
   ```
3. 使用 `firebaseUid` 進行所有玩家相關操作的 ID 傳遞

### 工單 0285：後端支援 firebaseUid 查找

**修改內容：**
在 `evolutionRoomManager.js` 中：
1. 修改 `setReady` 方法，支援使用 `id` 或 `firebaseUid` 查找玩家：
   ```javascript
   const player = room.players.find(p => p.id === playerId || p.firebaseUid === playerId);
   ```
2. 修改 `startGame` 方法，支援使用 `firebaseUid` 驗證房主
3. 修改 `leaveRoom` 方法，支援使用 `firebaseUid` 查找玩家

### 工單 0286：驗證與測試

**驗證項目：**
1. 房主創建房間後看到「開始遊戲」按鈕
2. 非房主看到「準備」按鈕
3. 準備/取消準備功能正常
4. 開始遊戲功能正常
5. 離開房間功能正常
6. 玩家列表正確顯示「我」和「房主」標記

## 修改檔案清單

| 檔案 | 修改類型 |
|------|----------|
| `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js` | 玩家識別邏輯 |
| `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js` | 加入房間邏輯 |
| `backend/services/evolutionRoomManager.js` | 玩家查找支援 |

## 預期結果

修復後：
1. 房主創建房間進入等待頁面，應看到「開始遊戲」按鈕
2. 其他玩家加入後看到「準備」按鈕
3. 當所有玩家準備後，房主可以點擊「開始遊戲」開始遊戲
4. 離開房間功能正常運作
5. 房間狀態正確同步

## 建立日期

2026-01-31
