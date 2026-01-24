# 工作單 0055 完成報告

**日期：** 2026-01-24

**工作單標題：** Supabase 資料庫設置

**工單主旨：** 上雲計畫 - 設置免費 PostgreSQL 資料庫

## 完成內容

### 1. 安裝 Supabase 客戶端

```bash
npm install @supabase/supabase-js
```

### 2. 建立資料表

在 Supabase Dashboard 執行 SQL 建立以下資料表：

- **players** - 玩家資料表
  - id (UUID, 主鍵)
  - firebase_uid (VARCHAR, 唯一)
  - display_name (VARCHAR)
  - total_score, games_played, games_won (統計欄位)
  - created_at, updated_at (時間戳)

- **game_history** - 遊戲歷史記錄表
  - id (SERIAL, 主鍵)
  - game_id, winner_name, player_count, rounds_played, duration_seconds
  - created_at

- **game_participants** - 遊戲參與者表
  - id (SERIAL, 主鍵)
  - game_history_id (外鍵)
  - player_name, final_score, is_winner

### 3. 建立 Supabase 連線模組

**檔案：** `backend/db/supabase.js`

提供功能：
- `testConnection()` - 測試資料庫連線
- `getOrCreatePlayer()` - 建立或取得玩家
- `updatePlayerStats()` - 更新玩家統計
- `saveGameRecord()` - 儲存遊戲記錄
- `saveGameParticipants()` - 儲存遊戲參與者
- `getLeaderboard()` - 取得排行榜

### 4. 後端整合

**檔案：** `backend/server.js`

修改內容：
- 導入 Supabase 模組
- 新增 `saveGameToDatabase()` 函數
- 遊戲結束時自動保存記錄到資料庫
- 新增 `/api/leaderboard` 排行榜 API
- 新增 `/api/health` 健康檢查 API

### 5. SQL Schema 腳本

**檔案：** `backend/db/schema.sql`

完整的資料表建立腳本，包含：
- 資料表定義
- 索引建立
- Row Level Security 設定
- RLS 政策（允許公開讀寫）

## 測試結果

### 連線測試

```
Supabase 連線成功
連線結果: true
```

### API 測試

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/leaderboard` | GET | 取得排行榜 |
| `/api/health` | GET | 健康檢查 |

## 新增/修改檔案

### 新增檔案
- `backend/db/supabase.js` - Supabase 連線模組
- `backend/db/schema.sql` - 資料表建立腳本

### 修改檔案
- `backend/server.js` - 整合 Supabase
- `backend/package.json` - 新增 @supabase/supabase-js 依賴

## 驗收標準完成狀態

- [x] Supabase 專案建立完成
- [x] 資料表建立完成
- [x] 後端可連線到資料庫
- [x] 遊戲結束自動保存記錄
- [x] 排行榜 API 可用

## 設定資訊

```
SUPABASE_URL=https://rvlmpnovbrksqwtihwqi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 備註

- 目前使用公開 RLS 政策，適合開發和測試
- 生產環境建議根據 Firebase Auth 的 UID 設定更嚴格的 RLS 政策
- 資料庫連線資訊已硬編碼在 supabase.js 中作為預設值，生產環境應使用環境變數
