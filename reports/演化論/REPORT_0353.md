# 工單報告 0353：成就系統

## 基本資訊

- **工單編號**：0353
- **完成日期**：2026-02-02
- **所屬計畫**：P2-C 資料庫統計

---

## 完成內容摘要

### 1. 成就定義常數

建立 `shared/constants/evolutionAchievements.js`：

**成就類別**：
- `MILESTONE` - 里程碑（初試啼聲、老手、冠軍等）
- `GAMEPLAY` - 遊戲玩法（肉食之王、和平主義者、生物大師等）
- `COLLECTION` - 收集類（性狀收藏家、生物繁殖者、連環殺手）
- `SPECIAL` - 特殊成就（完美遊戲、常勝將軍）

**成就總數**：15 個
- 可見成就：11 個
- 隱藏成就：4 個（和平主義者、閃電戰、完美遊戲）

**輔助函數**：
- `getAchievementById(id)` - 依 ID 取得成就
- `getVisibleAchievements()` - 取得可見成就
- `getAchievementsByCategory(category)` - 依類別取得成就

### 2. 成就服務

建立 `backend/services/evolution/achievementService.js`：

**核心功能**：
- `checkAndUnlock(userId, gameResult, stats)` - 檢查並解鎖成就
- `checkCondition(condition, stats, gameResult)` - 檢查條件
- `unlockAchievement(userId, achievementId, gameId)` - 解鎖成就
- `getPlayerAchievements(userId)` - 取得玩家成就
- `getAchievementProgress(userId, stats)` - 取得成就進度

**支援的條件類型**：

| 類型 | 說明 |
|------|------|
| games_played | 累計遊戲場次 |
| games_won | 累計勝場數 |
| total_creatures | 累計生物數 |
| total_traits | 累計性狀數 |
| total_kills | 累計擊殺數 |
| win_rate | 勝率（含最低場次門檻）|
| score_in_game | 單場分數 |
| creatures_in_game | 單場生物數 |
| kills_in_game | 單場擊殺數 |
| win_in_rounds | N 回合內獲勝 |
| all_survived | 所有生物存活 |
| win_without_kills | 無擊殺獲勝 |
| perfect_game | 完美遊戲 |

---

## 測試結果

```
Test Suites: 2 passed, 2 total
Tests:       52 passed, 52 total
Time:        1.884 s

覆蓋率：
- achievementService.js: 90.74%
- evolutionAchievements.js: 100%
```

### 測試涵蓋範圍

**achievementService.test.js (39 tests)**：
- isAvailable 檢查
- checkCondition 累計統計類（5 tests）
- checkCondition 勝率類（2 tests）
- checkCondition 單場遊戲類（4 tests）
- checkCondition 布林條件類（3 tests）
- checkCondition 邊界情況（3 tests）
- checkAndUnlock 成功/失敗場景
- unlockAchievement 成功/重複/失敗
- getPlayerAchievements 查詢
- getAchievementProgress 進度計算
- calculateProgress/getCurrentValue 輔助函數

**evolutionAchievements.test.js (13 tests)**：
- 類別定義驗證
- 成就結構驗證
- 成就 ID 唯一性
- getAchievementById 查詢
- getVisibleAchievements 過濾
- getAchievementsByCategory 分類
- 條件類型驗證
- 點數範圍驗證

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 成就定義完整 | ✅ |
| 條件檢查正確 | ✅ |
| 解鎖邏輯正確 | ✅ |
| 進度計算正確 | ✅ |
| 不重複解鎖 | ✅ |
| 隱藏成就正確處理 | ✅ |

---

## 新增的檔案

### 常數
- `shared/constants/evolutionAchievements.js`

### 服務
- `backend/services/evolution/achievementService.js`

### 測試
- `shared/constants/__tests__/evolutionAchievements.test.js`
- `backend/services/evolution/__tests__/achievementService.test.js`

### 報告
- `reports/演化論/REPORT_0353.md`

---

## 技術決策

### 條件設計

使用 `{ type, value, ...options }` 格式：
- `type` 決定檢查邏輯
- `value` 是數值門檻
- 額外選項如 `minGames` 用於複合條件

### 隱藏成就

使用 `hidden: true` 標記隱藏成就：
- 不顯示在成就列表
- 解鎖後才顯示
- 增加驚喜感

### 重複解鎖處理

資料庫使用 unique constraint，
服務端識別錯誤碼 `23505` 並視為成功。

---

## 下一步計劃

工單 0353 完成，繼續執行：
- 工單 0354：統計 API 端點

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
