# 工單 0277

## 日期
2026-01-31

## 工作單標題
演化論後端日誌增強

## 工單主旨
在後端添加演化論房間操作的詳細日誌

## 內容

### 要執行的任務

1. **後端事件處理器日誌**
   - 在 `server.js` 的 `evo:createRoom` 事件處理器添加接收日誌
   - 記錄收到的參數（roomName, maxPlayers, player）
   - 記錄房間創建成功/失敗

2. **evolutionRoomManager 日誌**
   - 確認 `createRoom` 方法的日誌輸出
   - 添加房間創建完成的詳細日誌

3. **錯誤處理**
   - 添加 try-catch 包裹房間創建邏輯
   - 錯誤時發送 `evo:error` 事件給前端

### 涉及檔案
- `backend/server.js`
- `backend/services/evolutionRoomManager.js`

### 驗收標準
- 後端控制台可以看到收到創建房間請求的日誌
- 可以追蹤房間創建的完整流程
- 錯誤情況有明確的錯誤訊息
