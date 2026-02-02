# 工單報告 0351：Supabase 資料庫結構設計

## 基本資訊

- **工單編號**：0351
- **完成日期**：2026-02-02
- **所屬計畫**：P2-C 資料庫統計

---

## 完成內容摘要

### 1. SQL 遷移腳本

建立完整的資料庫結構，包含：

**主要資料表**：
- `evolution_games` - 遊戲記錄
- `evolution_participants` - 遊戲參與者
- `evolution_player_stats` - 玩家統計
- `evolution_achievements` - 成就定義
- `evolution_player_achievements` - 玩家成就
- `evolution_game_replays` - 遊戲回放

**視圖**：
- `evolution_leaderboard` - 總排行榜
- `evolution_daily_leaderboard` - 每日排行榜
- `evolution_weekly_leaderboard` - 每週排行榜

**觸發器與函數**：
- `update_evolution_stats_timestamp()` - 自動更新時間戳
- `update_player_stats_after_game()` - 遊戲結束自動更新統計

**RLS 政策**：
- 遊戲記錄：公開讀取，服務角色寫入
- 參與者：公開讀取，服務角色寫入
- 統計：公開讀取，用戶可更新自己
- 成就：用戶只能讀取自己的
- 回放：參與者可讀取

### 2. 初始資料

預載 10 個成就：
| 成就 | 類別 | 條件 |
|------|------|------|
| 初次勝利 | 里程碑 | 獲勝 1 場 |
| 老手 | 里程碑 | 完成 10 場 |
| 冠軍 | 里程碑 | 獲勝 10 場 |
| 肉食之王 | 遊戲 | 單場擊殺 5 隻 |
| 和平主義者 | 遊戲 | 無擊殺獲勝（隱藏）|
| 生物大師 | 遊戲 | 單場 8 隻生物 |
| 性狀收藏家 | 收集 | 累計 100 性狀 |
| 完美得分 | 遊戲 | 單場 40 分 |
| 生存者 | 遊戲 | 全員存活 |
| 閃電戰 | 遊戲 | 5 回合獲勝（隱藏）|

### 3. 資料庫文件

完整的資料庫結構文件，包含：
- 表結構說明
- 視圖說明
- RLS 政策說明
- 觸發器說明
- ER 圖

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 所有表結構正確建立 | ✅ |
| 索引正確設定 | ✅ |
| 外鍵約束正確 | ✅ |
| RLS 政策正確 | ✅ |
| 視圖正常運作 | ✅ |
| 遷移腳本可重複執行 | ✅ |

---

## 新增的檔案

### 遷移腳本
- `database/supabase/migrations/001_evolution_tables.sql`

### 文件
- `docs/演化論/DATABASE_SCHEMA.md`

### 報告
- `reports/演化論/REPORT_0351.md`

---

## 技術決策

### 使用 UUID 主鍵

所有表使用 UUID 作為主鍵，與 Supabase Auth 整合，
避免序號洩露資訊。

### 統計自動更新

使用觸發器在遊戲結束時自動更新玩家統計，
確保數據一致性，減少應用層邏輯。

### RLS 分層設計

- 公開資料（排行榜）：所有認證用戶可讀
- 私人資料（成就）：僅自己可讀
- 系統資料（遊戲記錄）：僅服務角色可寫

### 可重複執行

遷移腳本使用：
- `CREATE TABLE IF NOT EXISTS`
- `DROP TRIGGER IF EXISTS`
- `INSERT ... ON CONFLICT DO UPDATE`

確保腳本可安全重複執行。

---

## 執行說明

```bash
# 方法 1: Supabase CLI
supabase db push

# 方法 2: Dashboard SQL Editor
# 複製 001_evolution_tables.sql 內容執行

# 方法 3: psql
psql $DATABASE_URL < database/supabase/migrations/001_evolution_tables.sql
```

---

## 下一步計劃

工單 0351 完成，繼續執行：
- 工單 0352：後端統計 API

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
