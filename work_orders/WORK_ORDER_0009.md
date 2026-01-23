# 工作單 0009

**日期：** 2026-01-23

**工作單標題：** 建立遊戲服務 - 遊戲狀態管理

**工單主旨：** 服務層 - 建立遊戲狀態管理核心功能

**內容：**

## 工作內容

1. **建立 `frontend/src/services/gameService.js` 檔案**

2. **實作 `createGame(players)` 函數**
   - 建立新遊戲
   - 接收玩家陣列作為參數（每個玩家物件包含 id 和 name）
   - 驗證玩家數量（3-4人）
   - 建立牌組、洗牌、發牌
   - 建立遊戲狀態物件：
     ```javascript
     {
       gameId: string,              // 唯一遊戲ID
       players: [
         {
           id: string,
           name: string,
           hand: Card[],
           isActive: boolean,        // 預設為 true
           isCurrentTurn: boolean    // 預設第一個玩家為 true
         }
       ],
       hiddenCards: Card[],
       currentPlayerIndex: number,   // 預設為 0
       gamePhase: 'waiting' | 'playing' | 'finished',
       winner: null,
       gameHistory: []
     }
     ```
   - 返回遊戲狀態物件

3. **實作 `getGameState(gameId)` 函數**
   - 取得遊戲狀態（目前可以是從記憶體中取得，未來可擴展為從資料庫取得）
   - 接收遊戲ID作為參數
   - 返回遊戲狀態物件

4. **實作 `updateGameState(gameId, updates)` 函數**
   - 更新遊戲狀態
   - 接收遊戲ID和更新物件作為參數
   - 合併更新到現有遊戲狀態
   - 返回更新後的遊戲狀態

5. **建立遊戲狀態儲存機制**
   - 使用 Map 或物件在記憶體中暫存遊戲狀態
   - 為未來擴展到資料庫預留接口

6. **使用 JSDoc 註解**
   - 為所有函數添加完整的 JSDoc 註解

## 驗收標準

- [ ] `gameService.js` 檔案已建立
- [ ] `createGame()` 可以正確建立遊戲狀態
- [ ] `getGameState()` 可以正確取得遊戲狀態
- [ ] `updateGameState()` 可以正確更新遊戲狀態
- [ ] 遊戲狀態資料結構符合設計規範
- [ ] 函數有完整的 JSDoc 註解
