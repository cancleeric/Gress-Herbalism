# 工作單 0055

**日期：** 2026-01-24

**工作單標題：** Supabase 資料庫設置

**工單主旨：** 上雲計畫 - 設置免費 PostgreSQL 資料庫

**內容：**

## 目標

使用 Supabase 免費方案建立 PostgreSQL 資料庫，用於儲存玩家分數和遊戲記錄。

## 為什麼選 Supabase

- 免費方案：500 MB 儲存空間、50,000 列
- PostgreSQL 資料庫
- 提供 REST API 和即時訂閱
- 有 Dashboard 方便管理

## 工作項目

### 1. 註冊 Supabase

1. 前往 [supabase.com](https://supabase.com)
2. 用 GitHub 帳號登入
3. 建立新專案（選擇 Asia 區域）

### 2. 建立資料表

```sql
-- 玩家資料
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 遊戲歷史記錄
CREATE TABLE game_history (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  winner_id UUID REFERENCES players(id),
  winner_name VARCHAR(50),
  player_count INTEGER,
  rounds_played INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 遊戲參與記錄
CREATE TABLE game_participants (
  id SERIAL PRIMARY KEY,
  game_history_id INTEGER REFERENCES game_history(id),
  player_id UUID REFERENCES players(id),
  player_name VARCHAR(50),
  final_score INTEGER,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 建立索引
CREATE INDEX idx_players_username ON players(username);
CREATE INDEX idx_game_history_created ON game_history(created_at);
```

### 3. 取得連線資訊

在 Supabase Dashboard → Settings → Database 取得：
- Host
- Database name
- User
- Password
- Connection string

### 4. 後端整合

安裝 Supabase 客戶端：
```bash
cd backend
npm install @supabase/supabase-js
```

建立連線設定：
```javascript
// backend/db/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
```

### 5. 設定 Cloud Run 環境變數

```bash
gcloud run services update gress-backend \
  --set-env-vars="SUPABASE_URL=https://xxxxx.supabase.co,SUPABASE_ANON_KEY=eyJxxxx"
```

## 驗收標準

- [ ] Supabase 專案建立完成
- [ ] 資料表建立完成
- [ ] 後端可連線到資料庫
- [ ] 測試 CRUD 操作正常
- [ ] Cloud Run 環境變數設定完成
