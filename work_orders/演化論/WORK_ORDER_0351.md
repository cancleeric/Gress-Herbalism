# 工單 0351：Supabase 資料庫結構設計

## 基本資訊
- **工單編號**：0351
- **所屬計畫**：P2-C 資料庫統計
- **前置工單**：無
- **預計影響檔案**：
  - `database/supabase/migrations/001_evolution_tables.sql`（新增）
  - `docs/演化論/DATABASE_SCHEMA.md`（新增）

---

## 目標

設計演化論遊戲的資料庫結構：
1. 遊戲記錄表
2. 玩家統計表
3. 成就系統表
4. 排行榜視圖

---

## 詳細規格

### SQL 遷移腳本

```sql
-- database/supabase/migrations/001_evolution_tables.sql

-- 啟用必要擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 遊戲記錄表
-- ================================
CREATE TABLE evolution_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL DEFAULT 'playing',
  rounds INTEGER NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id),
  config JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_evolution_games_status ON evolution_games(status);
CREATE INDEX idx_evolution_games_winner ON evolution_games(winner_id);
CREATE INDEX idx_evolution_games_started ON evolution_games(started_at DESC);

-- ================================
-- 遊戲參與者表
-- ================================
CREATE TABLE evolution_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES evolution_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  player_index INTEGER NOT NULL,
  final_score INTEGER,
  final_rank INTEGER,
  creatures_count INTEGER DEFAULT 0,
  traits_count INTEGER DEFAULT 0,
  food_bonus INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- 索引
CREATE INDEX idx_evolution_participants_game ON evolution_participants(game_id);
CREATE INDEX idx_evolution_participants_user ON evolution_participants(user_id);
CREATE INDEX idx_evolution_participants_winner ON evolution_participants(is_winner) WHERE is_winner = TRUE;

-- ================================
-- 玩家統計表
-- ================================
CREATE TABLE evolution_player_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_creatures INTEGER NOT NULL DEFAULT 0,
  total_traits INTEGER NOT NULL DEFAULT 0,
  total_kills INTEGER NOT NULL DEFAULT 0,
  total_deaths INTEGER NOT NULL DEFAULT 0,
  highest_score INTEGER NOT NULL DEFAULT 0,
  longest_game_rounds INTEGER NOT NULL DEFAULT 0,
  favorite_trait VARCHAR(50),
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 觸發器：自動更新 updated_at
CREATE OR REPLACE FUNCTION update_evolution_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evolution_stats_updated
  BEFORE UPDATE ON evolution_player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_evolution_stats_timestamp();

-- ================================
-- 成就定義表
-- ================================
CREATE TABLE evolution_achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT NOT NULL,
  icon VARCHAR(10),
  category VARCHAR(30) NOT NULL,
  condition JSONB NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================
-- 玩家成就表
-- ================================
CREATE TABLE evolution_player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id VARCHAR(50) NOT NULL REFERENCES evolution_achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  game_id UUID REFERENCES evolution_games(id),
  UNIQUE(user_id, achievement_id)
);

-- 索引
CREATE INDEX idx_player_achievements_user ON evolution_player_achievements(user_id);

-- ================================
-- 遊戲回放資料表
-- ================================
CREATE TABLE evolution_game_replays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES evolution_games(id) ON DELETE CASCADE,
  events JSONB NOT NULL DEFAULT '[]',
  compressed BOOLEAN NOT NULL DEFAULT FALSE,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id)
);

-- ================================
-- 排行榜視圖
-- ================================
CREATE OR REPLACE VIEW evolution_leaderboard AS
SELECT
  u.id AS user_id,
  u.raw_user_meta_data->>'name' AS display_name,
  s.games_played,
  s.games_won,
  CASE WHEN s.games_played > 0
    THEN ROUND((s.games_won::DECIMAL / s.games_played) * 100, 1)
    ELSE 0
  END AS win_rate,
  s.total_score,
  s.highest_score,
  RANK() OVER (ORDER BY s.games_won DESC, s.total_score DESC) AS rank
FROM evolution_player_stats s
JOIN auth.users u ON s.user_id = u.id
WHERE s.games_played >= 5
ORDER BY rank;

-- ================================
-- 每日排行榜視圖
-- ================================
CREATE OR REPLACE VIEW evolution_daily_leaderboard AS
SELECT
  p.user_id,
  u.raw_user_meta_data->>'name' AS display_name,
  COUNT(*) AS games_today,
  SUM(CASE WHEN p.is_winner THEN 1 ELSE 0 END) AS wins_today,
  SUM(p.final_score) AS total_score_today,
  RANK() OVER (ORDER BY SUM(CASE WHEN p.is_winner THEN 1 ELSE 0 END) DESC) AS rank
FROM evolution_participants p
JOIN evolution_games g ON p.game_id = g.id
JOIN auth.users u ON p.user_id = u.id
WHERE g.ended_at >= CURRENT_DATE
  AND g.status = 'finished'
GROUP BY p.user_id, u.raw_user_meta_data->>'name'
ORDER BY rank;

-- ================================
-- RLS 政策
-- ================================
ALTER TABLE evolution_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_player_achievements ENABLE ROW LEVEL SECURITY;

-- 遊戲記錄：所有人可讀，系統可寫
CREATE POLICY "Games are viewable by everyone"
  ON evolution_games FOR SELECT
  TO authenticated
  USING (true);

-- 參與者記錄：所有人可讀
CREATE POLICY "Participants are viewable by everyone"
  ON evolution_participants FOR SELECT
  TO authenticated
  USING (true);

-- 玩家統計：自己可讀寫，他人可讀
CREATE POLICY "Stats are viewable by everyone"
  ON evolution_player_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own stats"
  ON evolution_player_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 成就：自己可讀
CREATE POLICY "Achievements viewable by owner"
  ON evolution_player_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

---

## 驗收標準

1. [ ] 所有表結構正確建立
2. [ ] 索引正確設定
3. [ ] 外鍵約束正確
4. [ ] RLS 政策正確
5. [ ] 視圖正常運作
6. [ ] 遷移腳本可重複執行

---

## 備註

- 使用 Supabase (PostgreSQL)
- 需配合後端服務使用
- RLS 確保資料安全
