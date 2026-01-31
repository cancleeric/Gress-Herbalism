# 演化論遊戲房間功能修復計畫書

## 建立日期
2026-01-31

## 計畫概述
使演化論遊戲的房間創建、加入、遊戲流程與本草遊戲達到相同的功能完整度。

## 現況分析

### 本草遊戲（正常運作）
1. 大廳 (`/lobby/herbalism`) - 可以創建、加入房間
2. 房間使用 `game_` 前綴的 ID
3. Socket 事件：`createRoom`, `joinRoom`, `roomCreated`, `joinedRoom`
4. 房間等待頁面有完整 UI
5. 離開房間返回本草大廳

### 演化論遊戲（需修復）
1. 大廳 (`/lobby/evolution`) - 創建房間無響應
2. 房間使用 `evo_` 前綴的 ID
3. Socket 事件：`evo:createRoom`, `evo:joinRoom`, `evo:roomCreated`, `evo:joinedRoom`
4. 創建房間後無法進入遊戲房間頁面
5. 離開房間路由已修復

## 問題診斷

### 症狀
- 在演化論大廳點擊「創建房間」後，UI 顯示載入中但無響應
- 控制台可能沒有顯示 `[EvoLobby] 房間創建成功` 的日誌

### 可能原因
1. **Socket 連線問題**：事件監聽器可能在 Socket 連線前設置
2. **事件回應問題**：後端可能有錯誤導致無法回應
3. **前端監聽器問題**：`onEvoRoomCreated` 回調可能未正確觸發
4. **房間資料問題**：創建的房間資料格式可能不正確

## 實施計畫

### 階段一：診斷與調試（工單 0276-0277）
1. 在後端 `evo:createRoom` 事件處理器添加詳細日誌
2. 在前端 `evoCreateRoom` 函數添加發送確認日誌
3. 確認 Socket 連線狀態與事件監聽順序

### 階段二：修復房間創建流程（工單 0278-0279）
1. 修復前端 EvolutionLobbyPage 的 Socket 事件監聽邏輯
2. 確保 `onEvoRoomCreated` 回調正確處理房間資料
3. 驗證房間創建後的頁面導航

### 階段三：修復房間等待頁面（工單 0280-0281）
1. 檢查 EvolutionRoom 組件在 waiting 階段的渲染
2. 確保玩家列表正確顯示
3. 驗證準備狀態和開始遊戲功能

### 階段四：整合測試（工單 0282）
1. 完整流程測試：創建房間 → 等待 → 開始 → 遊戲
2. 多玩家測試：房主創建，其他玩家加入
3. 離開房間測試：確認返回正確大廳

## 驗收標準

1. ✅ 可以在演化論大廳創建房間
2. ✅ 創建房間後自動進入房間等待頁面
3. ✅ 房間列表正確顯示演化論房間
4. ✅ 其他玩家可以加入房間
5. ✅ 房主可以開始遊戲
6. ✅ 離開房間返回演化論大廳

## 工單清單

| 工單編號 | 標題 | 優先級 |
|---------|------|--------|
| 0276 | 演化論 Socket 事件調試 | 高 |
| 0277 | 演化論後端日誌增強 | 高 |
| 0278 | 修復 EvolutionLobbyPage Socket 監聽 | 高 |
| 0279 | 修復房間創建後導航邏輯 | 高 |
| 0280 | 修復 EvolutionRoom 等待頁面 | 中 |
| 0281 | 修復準備與開始遊戲功能 | 中 |
| 0282 | 演化論房間功能整合測試 | 中 |

## 預估影響範圍

### 需修改的檔案
- `frontend/src/components/common/EvolutionLobbyPage/EvolutionLobbyPage.js`
- `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`
- `frontend/src/components/games/evolution/EvolutionLobby/EvolutionLobby.js`
- `frontend/src/services/socketService.js`
- `backend/server.js`
- `backend/services/evolutionRoomManager.js`

### 不受影響的部分
- 本草遊戲所有功能
- 使用者認證系統
- 好友系統
- 排行榜系統

## 備註
此計畫書依據工單規則 `WORK_ORDER_RULES.md` 制定，所有工單將依序建立並執行。
