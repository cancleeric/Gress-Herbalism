# 工單 0276

## 日期
2026-01-31

## 工作單標題
演化論 Socket 事件調試

## 工單主旨
診斷演化論遊戲房間創建功能無法運作的問題

## 內容

### 問題描述
在演化論大廳點擊「創建房間」後，UI 顯示載入中但無響應，房間未成功創建。

### 要執行的任務

1. **前端調試**
   - 在 `EvolutionLobbyPage.js` 的 `handleCreateRoom` 函數添加日誌
   - 確認 `evoCreateRoom` 函數被正確呼叫
   - 確認傳遞的參數格式正確

2. **Socket 連線狀態確認**
   - 檢查 `isConnected` 狀態是否為 true
   - 確認 Socket 連線在創建房間前已建立

3. **事件監聽器確認**
   - 確認 `onEvoRoomCreated` 監聽器已正確註冊
   - 添加監聽器註冊的日誌

### 涉及檔案
- `frontend/src/components/common/EvolutionLobbyPage/EvolutionLobbyPage.js`
- `frontend/src/services/socketService.js`

### 驗收標準
- 控制台可以看到房間創建請求的日誌
- 可以確認 Socket 事件是否正確發送
- 可以確認事件監聯器是否正確接收
