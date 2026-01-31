# 報告書 0036

**工作單編號：** 0036

**完成日期：** 2026-01-23

## 完成內容摘要

修復創建房間玩家數量驗證錯誤。

### 問題分析

在遊戲大廳頁面，用戶選擇「3人」玩家數量並點擊「創建新房間」按鈕時，系統顯示錯誤訊息：
> 創建房間失敗：玩家數量必須在 3-4 人之間

**根本原因：**
- `Lobby.js` 中的 `handleCreateRoom` 函數呼叫 `gameService.createGame(players)`
- 但 `players` 陣列只包含房主一人（`players.length === 1`）
- `createGame` 函數驗證 `players.length`，而不是預期的 `playerCount`
- 因為 `validatePlayerCount(1)` 回傳 `false`，所以拋出錯誤

**設計問題：**
- `createGame` 函數設計是給遊戲開始時所有玩家都已加入的情況
- 但 Lobby 是先創建房間（只有房主），等其他玩家加入後才開始遊戲

### 修復方案

1. **新增 `createGameRoom` 函數** (`gameService.js`)
   - 專門用於創建等待中的遊戲房間
   - 不驗證玩家數量（因為其他玩家尚未加入）
   - 不發牌（遊戲尚未開始）
   - 設定 `gamePhase: 'waiting'`
   - 儲存 `maxPlayers` 供之後驗證使用

2. **更新 `Lobby.js`**
   - 將 `import { createGame }` 改為 `import { createGameRoom }`
   - `handleCreateRoom` 改用 `createGameRoom(hostPlayer, playerCount)`

3. **更新測試**
   - `Lobby.test.js`：Mock 從 `createGame` 改為 `createGameRoom`
   - `gameService.test.js`：新增 `createGameRoom` 測試案例

### 程式碼變更

**`frontend/src/services/gameService.js`**
```javascript
// 新增函數
export function createGameRoom(hostPlayer, maxPlayers = 4) {
  const gameId = generateGameId();

  const roomState = {
    gameId,
    players: [{
      id: hostPlayer.id,
      name: hostPlayer.name,
      hand: [],
      isActive: true,
      isCurrentTurn: false,
      isHost: true
    }],
    hiddenCards: [],
    currentPlayerIndex: 0,
    gamePhase: GAME_PHASE_WAITING,
    winner: null,
    gameHistory: [],
    maxPlayers
  };

  gameStore.set(gameId, roomState);
  return roomState;
}
```

**`frontend/src/components/Lobby/Lobby.js`**
```javascript
// 變更前
import { createGame, getGameState } from '../../services/gameService';
const newGame = createGame(players);

// 變更後
import { createGameRoom, getGameState } from '../../services/gameService';
const newGame = createGameRoom(hostPlayer, playerCount);
```

## 單元測試

**Tests: 291 passed** (新增 7 個測試)

新增測試：
- `createGameRoom` 函數測試（6 個）
  - 應正確建立 3 人房間
  - 應正確建立 4 人房間
  - 房間應可以被查詢
  - 預設最大玩家數應為 4
  - 房主應有正確的初始狀態
- `Lobby` 測試更新（2 個新增）
  - 選擇 3 人時創建房間應成功
  - 選擇 4 人時創建房間應成功

## 驗收標準完成狀態

- [x] 選擇 3 人時可以成功創建房間
- [x] 選擇 4 人時可以成功創建房間
- [x] 錯誤訊息只在真正無效的情況下顯示
