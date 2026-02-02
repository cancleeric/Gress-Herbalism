# 工單報告 0352：遊戲記錄服務

## 基本資訊

- **工單編號**：0352
- **完成日期**：2026-02-02
- **所屬計畫**：P2-C 資料庫統計

---

## 完成內容摘要

### 1. Supabase 客戶端

建立 `backend/services/supabaseClient.js`：

**功能**：
- 使用服務角色金鑰連接 Supabase
- 環境變數檢查（SUPABASE_URL, SUPABASE_SERVICE_KEY）
- 優雅降級（未設定時停用資料庫功能）

**匯出**：
- `supabase` - Supabase 客戶端實例
- `getSupabase()` - 取得客戶端
- `isSupabaseEnabled()` - 檢查是否啟用

### 2. 遊戲記錄服務

建立 `backend/services/evolution/gameRecordService.js`：

**核心功能**：
- `recordGameStart()` - 記錄遊戲開始
- `recordGameEnd()` - 記錄遊戲結束（含分數排名）
- `getPlayerStats()` - 取得玩家統計
- `getPlayerHistory()` - 取得玩家歷史記錄
- `getLeaderboard()` - 取得總排行榜
- `getDailyLeaderboard()` - 取得每日排行榜
- `getWeeklyLeaderboard()` - 取得每週排行榜

**特性**：
- 服務可用性檢查（Supabase 未啟用時優雅降級）
- 完整錯誤處理
- 預設統計資料
- 單例模式匯出

---

## 測試結果

```
Test Suites: 2 passed, 2 total
Tests:       32 passed, 32 total
Time:        2.406 s

覆蓋率：
- supabaseClient.js: 100%
- gameRecordService.js: 92.78%
```

### 測試涵蓋範圍

**supabaseClient.test.js (7 tests)**：
- 環境變數未設定時的行為
- 環境變數設定時的行為
- 模組匯出

**gameRecordService.test.js (25 tests)**：
- isAvailable 檢查
- recordGameStart 成功/失敗/停用場景
- recordGameEnd 成功/失敗/缺少 startedAt
- getPlayerStats 成功/找不到記錄/錯誤
- getPlayerHistory 成功/停用/錯誤/自訂 limit
- getLeaderboard 成功/停用/錯誤
- getDailyLeaderboard 成功/停用
- getWeeklyLeaderboard 成功/停用
- getDefaultStats 格式驗證
- 單例匯出驗證

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 遊戲開始正確記錄 | ✅ |
| 遊戲結束正確記錄 | ✅ |
| 玩家統計正確更新 | ✅ |
| 歷史記錄可查詢 | ✅ |
| 排行榜正常運作 | ✅ |
| 錯誤處理完善 | ✅ |

---

## 新增的檔案

### 服務
- `backend/services/supabaseClient.js`
- `backend/services/evolution/gameRecordService.js`

### 測試
- `backend/services/__tests__/supabaseClient.test.js`
- `backend/services/evolution/__tests__/gameRecordService.test.js`

### 報告
- `reports/演化論/REPORT_0352.md`

---

## 技術決策

### 優雅降級設計

當 Supabase 環境變數未設定時：
- 服務不會拋出錯誤
- 返回空陣列或預設值
- 記錄警告訊息

這允許在沒有資料庫的環境下正常執行遊戲。

### 錯誤處理

所有資料庫操作都包含 try-catch：
- 錯誤會被記錄到 console
- 查詢方法返回預設值
- 寫入方法拋出錯誤供上層處理

### PGRST116 處理

當 Supabase 找不到記錄時返回 code `PGRST116`，
服務會識別此錯誤碼並返回預設值而非拋出錯誤。

---

## 下一步計劃

工單 0352 完成，繼續執行：
- 工單 0353：成就系統服務

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
