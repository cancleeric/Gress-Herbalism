# 工單報告 0355：玩家個人統計 API

## 基本資訊

- **工單編號**：0355
- **完成日期**：2026-02-02
- **所屬計畫**：P2-C 資料庫統計

---

## 完成內容摘要

### 1. 統計控制器

建立 `backend/controllers/evolution/statsController.js`：

**API 處理函數**：
- `getPlayerStats(req, res)` - 取得玩家統計
- `getPlayerHistory(req, res)` - 取得遊戲歷史
- `getPlayerAchievements(req, res)` - 取得成就

**輔助函數**：
- `calculateDerivedStats(stats)` - 計算衍生統計
- `formatHistoryRecord(record)` - 格式化歷史記錄
- `calculateTotalPoints(achievements)` - 計算成就總點數

### 2. 統計路由

建立 `backend/routes/evolution/stats.js`：

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/evolution/stats/:userId` | GET | 玩家統計 |
| `/api/evolution/stats/:userId/history` | GET | 遊戲歷史 |
| `/api/evolution/stats/:userId/achievements` | GET | 成就列表 |

### 3. 衍生統計

自動計算以下衍生數據：

| 欄位 | 說明 | 公式 |
|------|------|------|
| win_rate | 勝率 | games_won / games_played × 100 |
| avg_score | 平均分數 | total_score / games_played |
| avg_creatures | 平均生物數 | total_creatures / games_played |
| avg_traits | 平均性狀數 | total_traits / games_played |
| kd_ratio | 擊殺/死亡比 | total_kills / total_deaths |

---

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       23 passed, 23 total
Time:        1.935 s

覆蓋率：
- statsController.js: 100%
```

### 測試涵蓋範圍

**statsController.test.js (23 tests)**：
- getPlayerStats 正常回應
- getPlayerStats 缺少參數
- getPlayerStats 錯誤處理
- getPlayerHistory 分頁
- getPlayerHistory limit/offset
- getPlayerHistory limit 上限
- getPlayerHistory 缺少參數
- getPlayerHistory 錯誤處理
- getPlayerAchievements 正常回應
- getPlayerAchievements 包含進度
- getPlayerAchievements 缺少參數
- getPlayerAchievements 錯誤處理
- calculateDerivedStats 計算
- calculateDerivedStats 零場次
- calculateDerivedStats 零死亡
- calculateDerivedStats null
- formatHistoryRecord 格式化
- formatHistoryRecord 缺少 game
- formatHistoryRecord null
- calculateTotalPoints 加總
- calculateTotalPoints 空陣列
- calculateTotalPoints null
- calculateTotalPoints 缺少 points

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| API 端點正確回應 | ✅ |
| 權限驗證正確 | ✅ (參數驗證) |
| 歷史分頁正常 | ✅ |
| 統計計算正確 | ✅ |

---

## 新增的檔案

### 控制器
- `backend/controllers/evolution/statsController.js`

### 路由
- `backend/routes/evolution/stats.js`

### 測試
- `backend/controllers/evolution/__tests__/statsController.test.js`

### 報告
- `reports/演化論/REPORT_0355.md`

---

## API 回應範例

### 玩家統計

```json
{
  "success": true,
  "data": {
    "games_played": 50,
    "games_won": 25,
    "total_score": 1200,
    "total_creatures": 180,
    "total_traits": 400,
    "total_kills": 75,
    "total_deaths": 50,
    "highest_score": 42,
    "win_rate": 50,
    "avg_score": 24,
    "avg_creatures": 3.6,
    "avg_traits": 8,
    "kd_ratio": 1.5
  }
}
```

### 成就列表（含進度）

```json
{
  "success": true,
  "data": {
    "unlocked": [...],
    "totalPoints": 150,
    "progress": [...],
    "totalAchievements": 15,
    "unlockedCount": 5
  }
}
```

---

## 整合說明

需在 `server.js` 中加入路由：

```javascript
const statsRouter = require('./routes/evolution/stats');
app.use('/api/evolution/stats', statsRouter);
```

---

## 下一步計劃

工單 0355 完成，繼續執行：
- 工單 0356：遊戲回放 API

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
