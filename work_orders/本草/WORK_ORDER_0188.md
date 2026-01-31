# 工作單 0188

## 編號
0188

## 日期
2026-01-28

## 工作單標題
單元測試：localStorage 重連工具函數

## 工單主旨
測試 `frontend/src/utils/localStorage.js` 中與重連相關的函數正確性

## 內容

### 測試範圍
- `saveCurrentRoom(roomInfo)` — 儲存房間資訊
- `getCurrentRoom()` — 讀取房間資訊（含 2 小時過期檢查）
- `clearCurrentRoom()` — 清除房間資訊
- `STORAGE_KEYS.CURRENT_ROOM` 常數定義

### 測試項目

#### TC-0188-01：saveCurrentRoom 正常儲存
- 驗證傳入 `{ roomId, playerId, playerName }` 後能正確存入 localStorage
- 驗證自動附加 `timestamp` 欄位

#### TC-0188-02：getCurrentRoom 正常讀取
- 驗證儲存後能正確讀回完整資料
- 驗證返回物件包含 roomId, playerId, playerName, timestamp

#### TC-0188-03：getCurrentRoom 過期機制
- 驗證 2 小時過期判定邏輯正確性
- 驗證過期後返回 null 且自動清除

#### TC-0188-04：getCurrentRoom 無資料處理
- 驗證 localStorage 無資料時返回 null
- 驗證資料格式錯誤時的容錯處理

#### TC-0188-05：clearCurrentRoom 清除功能
- 驗證清除後 getCurrentRoom 返回 null

### 測試方式
程式碼審查 + 靜態分析（不修改程式碼）

### 驗收標準
- 完成所有測試項目的驗證
- 記錄所有發現的問題
