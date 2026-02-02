# 演化論資料庫結構文件

## 概述

本文件描述演化論遊戲的 Supabase (PostgreSQL) 資料庫結構。

---

## 表結構

### 1. evolution_games - 遊戲記錄表

儲存每場遊戲的基本資訊。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| status | VARCHAR(20) | 狀態：waiting/playing/finished/cancelled |
| rounds | INTEGER | 總回合數 |
| winner_id | UUID | 獲勝者 ID（外鍵 → auth.users） |
| config | JSONB | 遊戲設定（玩家數、擴充包等） |
| started_at | TIMESTAMPTZ | 開始時間 |
| ended_at | TIMESTAMPTZ | 結束時間 |
| duration_seconds | INTEGER | 遊戲時長（秒） |
| created_at | TIMESTAMPTZ | 建立時間 |

**索引**：
- `idx_evolution_games_status` - 狀態查詢
- `idx_evolution_games_winner` - 獲勝者查詢
- `idx_evolution_games_started` - 時間排序

---

### 2. evolution_participants - 遊戲參與者表

儲存每場遊戲的參與者資訊與最終成績。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| game_id | UUID | 遊戲 ID（外鍵） |
| user_id | UUID | 用戶 ID（外鍵） |
| player_index | INTEGER | 座位順序（0-3） |
| final_score | INTEGER | 最終得分 |
| final_rank | INTEGER | 最終排名 |
| creatures_count | INTEGER | 生物數量 |
| traits_count | INTEGER | 性狀數量 |
| food_bonus | INTEGER | 食量加成 |
| is_winner | BOOLEAN | 是否獲勝 |
| created_at | TIMESTAMPTZ | 建立時間 |

**約束**：
- `UNIQUE(game_id, user_id)` - 每場遊戲每位玩家只有一筆記錄

---

### 3. evolution_player_stats - 玩家統計表

累積玩家的遊戲統計資料。

| 欄位 | 類型 | 說明 |
|------|------|------|
| user_id | UUID | 主鍵（外鍵 → auth.users） |
| games_played | INTEGER | 遊戲場次 |
| games_won | INTEGER | 勝場數 |
| total_score | INTEGER | 累積總分 |
| total_creatures | INTEGER | 累積生物數 |
| total_traits | INTEGER | 累積性狀數 |
| total_kills | INTEGER | 累積擊殺數 |
| total_deaths | INTEGER | 累積死亡數 |
| highest_score | INTEGER | 最高單場得分 |
| longest_game_rounds | INTEGER | 最長遊戲回合數 |
| favorite_trait | VARCHAR(50) | 最常使用性狀 |
| last_played_at | TIMESTAMPTZ | 最後遊玩時間 |
| created_at | TIMESTAMPTZ | 建立時間 |
| updated_at | TIMESTAMPTZ | 更新時間（自動） |

**觸發器**：
- `evolution_stats_updated` - 自動更新 updated_at

---

### 4. evolution_achievements - 成就定義表

定義所有可獲得的成就。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | VARCHAR(50) | 主鍵（成就代碼） |
| name | VARCHAR(100) | 成就名稱（中文） |
| name_en | VARCHAR(100) | 成就名稱（英文） |
| description | TEXT | 成就描述 |
| icon | VARCHAR(10) | 成就圖示（emoji） |
| category | VARCHAR(30) | 類別：gameplay/collection/social/special/milestone |
| condition | JSONB | 解鎖條件 |
| points | INTEGER | 成就點數 |
| hidden | BOOLEAN | 是否隱藏成就 |
| created_at | TIMESTAMPTZ | 建立時間 |

**預設成就**：
- 初次勝利、老手、冠軍（里程碑類）
- 肉食之王、和平主義者、生物大師（遊戲類）
- 性狀收藏家（收集類）
- 完美得分、生存者、閃電戰（特殊類）

---

### 5. evolution_player_achievements - 玩家成就表

記錄玩家已解鎖的成就。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| user_id | UUID | 用戶 ID（外鍵） |
| achievement_id | VARCHAR(50) | 成就 ID（外鍵） |
| unlocked_at | TIMESTAMPTZ | 解鎖時間 |
| game_id | UUID | 解鎖該成就的遊戲（可選） |

**約束**：
- `UNIQUE(user_id, achievement_id)` - 每位玩家每個成就只能解鎖一次

---

### 6. evolution_game_replays - 遊戲回放表

儲存遊戲回放資料。

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | UUID | 主鍵 |
| game_id | UUID | 遊戲 ID（外鍵） |
| events | JSONB | 事件列表 |
| compressed | BOOLEAN | 是否壓縮 |
| size_bytes | INTEGER | 資料大小 |
| created_at | TIMESTAMPTZ | 建立時間 |

---

## 視圖

### evolution_leaderboard - 總排行榜

顯示遊戲場次 ≥5 的玩家排名。

| 欄位 | 說明 |
|------|------|
| user_id | 用戶 ID |
| display_name | 顯示名稱 |
| games_played | 遊戲場次 |
| games_won | 勝場數 |
| win_rate | 勝率 (%) |
| total_score | 累積總分 |
| highest_score | 最高單場分 |
| total_kills | 累積擊殺 |
| total_creatures | 累積生物 |
| rank | 排名 |

### evolution_daily_leaderboard - 每日排行榜

顯示當日的排名。

| 欄位 | 說明 |
|------|------|
| user_id | 用戶 ID |
| display_name | 顯示名稱 |
| games_today | 今日場次 |
| wins_today | 今日勝場 |
| total_score_today | 今日總分 |
| best_score_today | 今日最高分 |
| rank | 排名 |

### evolution_weekly_leaderboard - 每週排行榜

顯示本週的排名。

---

## Row Level Security (RLS)

### 遊戲記錄 (evolution_games)
- **SELECT**: 所有認證用戶可讀
- **INSERT/UPDATE**: 僅服務角色

### 參與者記錄 (evolution_participants)
- **SELECT**: 所有認證用戶可讀
- **INSERT**: 僅服務角色

### 玩家統計 (evolution_player_stats)
- **SELECT**: 所有認證用戶可讀
- **UPDATE**: 用戶可更新自己的記錄
- **ALL**: 服務角色完整權限

### 成就 (evolution_player_achievements)
- **SELECT**: 用戶只能查看自己的成就
- **ALL**: 服務角色完整權限

### 回放 (evolution_game_replays)
- **SELECT**: 遊戲參與者可查看

---

## 觸發器

### update_stats_on_game_end

當 `evolution_participants.final_score` 更新時，自動更新 `evolution_player_stats`：
- 增加遊戲場次
- 增加勝場數（如果獲勝）
- 累加得分、生物、性狀
- 更新最高分
- 更新最後遊玩時間

---

## 遷移說明

遷移檔案位置：`database/supabase/migrations/001_evolution_tables.sql`

### 執行遷移

```bash
# 使用 Supabase CLI
supabase db push

# 或在 Supabase Dashboard 的 SQL Editor 執行
```

### 注意事項

1. 遷移腳本使用 `IF NOT EXISTS` 和 `ON CONFLICT`，可重複執行
2. 外鍵依賴 `auth.users` 表，需要 Supabase Auth 啟用
3. 服務角色權限需要使用 `service_role` key

---

## ER 圖

```
┌─────────────────┐       ┌─────────────────────┐
│   auth.users    │       │  evolution_games    │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │◄──────│ winner_id (FK)      │
│ email           │       │ id (PK)             │
│ ...             │       │ status              │
└────────┬────────┘       │ rounds              │
         │                │ ...                 │
         │                └──────────┬──────────┘
         │                           │
         │    ┌──────────────────────┼──────────────────────┐
         │    │                      │                      │
         ▼    ▼                      ▼                      ▼
┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│evolution_participants│  │evolution_game_replays│  │    (視圖)           │
├─────────────────────┤  ├─────────────────────┤  │  leaderboard        │
│ id (PK)             │  │ id (PK)             │  │  daily_leaderboard  │
│ game_id (FK)        │  │ game_id (FK)        │  │  weekly_leaderboard │
│ user_id (FK)        │  │ events              │  └─────────────────────┘
│ final_score         │  │ ...                 │
│ ...                 │  └─────────────────────┘
└──────────┬──────────┘
           │
           │ (觸發器更新)
           ▼
┌─────────────────────┐       ┌─────────────────────┐
│evolution_player_stats│       │evolution_achievements│
├─────────────────────┤       ├─────────────────────┤
│ user_id (PK/FK)     │       │ id (PK)             │
│ games_played        │       │ name                │
│ games_won           │       │ condition           │
│ ...                 │       │ ...                 │
└─────────────────────┘       └──────────┬──────────┘
                                         │
                                         ▼
                           ┌─────────────────────────────┐
                           │evolution_player_achievements │
                           ├─────────────────────────────┤
                           │ id (PK)                     │
                           │ user_id (FK)                │
                           │ achievement_id (FK)         │
                           │ unlocked_at                 │
                           └─────────────────────────────┘
```

---

**文件維護者**：Claude Code
**最後更新**：2026-02-02
