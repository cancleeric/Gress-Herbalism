# 演化論遊戲 Socket 連接 BUG 修復計畫書

## 建立日期
2026-01-31

## 問題描述

### 現象
演化論遊戲頁面顯示為佔位符 UI 狀態：
- 顯示「等待開始」
- 顯示「第 0 回合」
- 顯示「牌庫: 84」
- 顯示「尚無生物」
- 沒有任何玩家資訊
- 所有操作按鈕沒有作用

### 根本原因
前端 `EvolutionRoom.js` 組件完全沒有連接到後端的 Socket.io 事件：

1. **socketService.js 缺少演化論函數**
   - 現有的 `socketService.js` 只有本草遊戲的 Socket 函數
   - 沒有 `evo:` 前綴的事件處理函數

2. **EvolutionRoom.js 未實現 Socket 連接**
   - Line 60-70: TODO 註釋，Socket.io 連接未實現
   - 所有遊戲操作只有 console.log，沒有實際發送事件

3. **缺少房間等待介面**
   - 沒有像本草遊戲那樣的房間等待/準備頁面
   - 用戶進入頁面後無法加入房間

### 後端狀態（已完成）
後端已經完整實現：
- `evolutionRoomManager.js` - 房間管理（創建、加入、離開等）
- `gameLogic.js` - 遊戲邏輯（779 行）
- `server.js` Line 1195-1355 - Socket 事件處理

## 影響範圍
- 演化論遊戲完全無法進行
- 用戶進入演化論遊戲頁面後看到空白的佔位符 UI

## 修復計畫

### 階段一：Socket 服務擴展（工單 0272）
在 `socketService.js` 中添加演化論遊戲的 Socket 函數：

```javascript
// 演化論相關事件
export function evoCreateRoom(roomName, maxPlayers, player) { ... }
export function evoJoinRoom(roomId, player) { ... }
export function evoLeaveRoom(roomId, playerId) { ... }
export function evoSetReady(roomId, playerId, isReady) { ... }
export function evoStartGame(roomId, playerId) { ... }
export function evoCreateCreature(roomId, playerId, cardId) { ... }
export function evoAddTrait(roomId, playerId, cardId, creatureId, targetCreatureId) { ... }
export function evoPassEvolution(roomId, playerId) { ... }
export function evoFeedCreature(roomId, playerId, creatureId) { ... }
export function evoAttack(roomId, playerId, attackerId, defenderId) { ... }
export function evoRespondAttack(roomId, playerId, response) { ... }
export function evoUseTrait(roomId, playerId, creatureId, traitType, targetId) { ... }
export function evoRequestRoomList() { ... }

// 監聽事件
export function onEvoRoomCreated(callback) { ... }
export function onEvoJoinedRoom(callback) { ... }
export function onEvoPlayerJoined(callback) { ... }
export function onEvoPlayerLeft(callback) { ... }
export function onEvoPlayerReady(callback) { ... }
export function onEvoGameStarted(callback) { ... }
export function onEvoGameState(callback) { ... }
export function onEvoError(callback) { ... }
export function onEvoRoomListUpdated(callback) { ... }
// ... 其他事件
```

### 階段二：房間等待介面（工單 0273）
創建演化論房間等待/準備組件：

- 檔案：`frontend/src/components/games/evolution/EvolutionLobby/`
- 功能：
  - 顯示房間內玩家列表
  - 準備/取消準備按鈕
  - 房主開始遊戲按鈕
  - 玩家準備狀態顯示

### 階段三：EvolutionRoom Socket 連接（工單 0274）
修改 `EvolutionRoom.js` 連接 Socket.io：

- 在 `useEffect` 中監聽 Socket 事件
- 實現所有遊戲操作的 Socket 發送
- 處理遊戲狀態同步
- 處理錯誤訊息顯示

### 階段四：整合測試（工單 0275）
測試完整遊戲流程：

- 創建房間
- 加入房間
- 準備/開始遊戲
- 演化階段操作
- 進食階段操作
- 遊戲結束計分

## 預期成果
- 演化論遊戲可以正常創建房間並遊玩
- 多人遊戲功能正常運作
- 遊戲狀態正確同步

## 相關檔案清單

### 需要修改
1. `frontend/src/services/socketService.js`
2. `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`

### 需要新增
1. `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`
2. `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.css`
3. `frontend/src/components/games/evolution/EvolutionLobby/index.js`

### 相關後端檔案（已完成，僅供參考）
1. `backend/services/evolutionRoomManager.js`
2. `backend/logic/evolution/gameLogic.js`
3. `backend/server.js` (Line 1195-1355)

## 工單規劃

| 工單編號 | 標題 | 優先級 |
|---------|------|--------|
| 0272 | 演化論 Socket 服務擴展 | 高 |
| 0273 | 演化論房間等待介面 | 高 |
| 0274 | EvolutionRoom Socket 連接 | 高 |
| 0275 | 演化論遊戲整合測試 | 中 |

## 備註
- 後端已完整實現，此修復僅涉及前端
- 需確保與現有本草遊戲的 Socket 服務共存
- CSS 樣式可參考本草遊戲的 GameRoom 組件
