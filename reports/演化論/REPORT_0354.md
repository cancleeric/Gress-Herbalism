# 工單報告 0354：排行榜 API

## 基本資訊

- **工單編號**：0354
- **完成日期**：2026-02-02
- **所屬計畫**：P2-C 資料庫統計

---

## 完成內容摘要

### 1. 排行榜控制器

建立 `backend/controllers/evolution/leaderboardController.js`：

**API 處理函數**：
- `getLeaderboard(req, res)` - 總排行榜
- `getDailyLeaderboard(req, res)` - 每日排行榜
- `getWeeklyLeaderboard(req, res)` - 每週排行榜
- `clearCache(req, res)` - 清除快取

**快取機制**：
- 簡易記憶體快取（Map + TTL）
- 總排行榜：60 秒
- 每日排行榜：30 秒
- 每週排行榜：60 秒

### 2. 排行榜路由

建立 `backend/routes/evolution/leaderboard.js`：

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/evolution/leaderboard` | GET | 總排行榜 |
| `/api/evolution/leaderboard/daily` | GET | 每日排行榜 |
| `/api/evolution/leaderboard/weekly` | GET | 每週排行榜 |
| `/api/evolution/leaderboard/cache/clear` | POST | 清除快取 |

**Query 參數**：
- `limit` - 限制筆數（預設 100/50）
- `offset` - 跳過筆數（分頁用）

**回應格式**：
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "limit": 100,
  "offset": 0,
  "cached": false
}
```

---

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       19 passed, 19 total
Time:        1.923 s

覆蓋率：
- leaderboardController.js: 100%
```

### 測試涵蓋範圍

**leaderboardController.test.js (19 tests)**：
- getLeaderboard 正常回應
- getLeaderboard 分頁參數（limit, offset）
- getLeaderboard limit 上限（500）
- getLeaderboard 快取使用
- getLeaderboard 錯誤處理
- getDailyLeaderboard 正常回應
- getDailyLeaderboard limit 上限（200）
- getDailyLeaderboard 快取使用
- getDailyLeaderboard 錯誤處理
- getWeeklyLeaderboard 正常回應
- getWeeklyLeaderboard limit 上限（200）
- getWeeklyLeaderboard 快取使用
- getWeeklyLeaderboard 錯誤處理
- clearCache 清除功能
- cache 存取測試
- cache 過期測試
- cache 不存在 key 測試
- cache 清除所有值測試

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| API 端點正確回應 | ✅ |
| 分頁功能正常 | ✅ |
| 快取機制（記憶體）| ✅ |
| 錯誤處理完善 | ✅ |

---

## 新增的檔案

### 控制器
- `backend/controllers/evolution/leaderboardController.js`

### 路由
- `backend/routes/evolution/leaderboard.js`

### 測試
- `backend/controllers/evolution/__tests__/leaderboardController.test.js`

### 報告
- `reports/演化論/REPORT_0354.md`

---

## 技術決策

### 記憶體快取 vs Redis

選擇記憶體快取的原因：
1. 簡單實作，無外部依賴
2. 單一實例部署足夠
3. 排行榜資料量小
4. 未來可輕易替換為 Redis

### 快取 TTL 設計

| 排行榜 | TTL | 原因 |
|--------|-----|------|
| 總排行榜 | 60s | 變化慢，可較長 |
| 每日排行榜 | 30s | 需較即時更新 |
| 每週排行榜 | 60s | 變化慢，可較長 |

### Limit 上限

設定 limit 上限防止濫用：
- 總排行榜：500
- 每日/每週：200

---

## 整合說明

需在 `server.js` 中加入路由：

```javascript
const leaderboardRouter = require('./routes/evolution/leaderboard');
app.use('/api/evolution/leaderboard', leaderboardRouter);
```

---

## 下一步計劃

工單 0354 完成，繼續執行：
- 工單 0355：玩家統計 API

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
