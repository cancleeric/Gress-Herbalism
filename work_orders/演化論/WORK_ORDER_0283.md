# 工作單 0283

## 編號
0283

## 日期
2026-01-31

## 工作單標題
修復 EvolutionLobby.js 玩家識別問題

## 工單主旨
BUG 修復 - 演化論遊戲無法開始（玩家 ID 不一致）

## 內容

### 問題描述
房主創建房間後看到「準備」按鈕而不是「開始遊戲」按鈕，原因是玩家識別邏輯使用錯誤的 ID 進行比對。

### 根本原因
- `room.players[].id` 是 `player_xxx_xxx` 格式
- 程式碼使用 `user?.uid`（Firebase UID）進行比對
- 兩者不匹配，導致 `currentPlayer` 為 `undefined`

### 修改項目

1. **修改玩家查找邏輯（第 46 行）**
   - 原：`const currentPlayer = room?.players?.find(p => p.id === user?.uid);`
   - 新：`const currentPlayer = room?.players?.find(p => p.firebaseUid === user?.uid);`

2. **修改 playerReady 事件處理（第 74 行）**
   - 使用 `currentPlayer?.id` 而非 `user?.uid` 進行比對

3. **修改 handleToggleReady（第 104-107 行）**
   - 使用 `currentPlayer?.id` 發送準備請求

4. **修改 handleStartGame（第 109-113 行）**
   - 使用 `currentPlayer?.id` 發送開始遊戲請求

5. **修改 handleLeaveRoom（第 115-121 行）**
   - 使用 `currentPlayer?.id` 發送離開房間請求

6. **修改 player-card 樣式判斷（第 155 行）**
   - 使用 `player.firebaseUid === user?.uid` 判斷當前玩家

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`

### 驗收標準
- [ ] 房主創建房間後看到「開始遊戲」按鈕
- [ ] 非房主看到「準備」按鈕
- [ ] 玩家卡片正確顯示「我」標記
- [ ] 房主標記正確顯示

### 參考文件
- `work_orders/演化論/BUG/BUG_PLAN_EVOLUTION_START.md`
