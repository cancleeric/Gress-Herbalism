-- Supabase 資料表建立腳本
-- 工單 0055
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 玩家資料表 ====================
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE,
  display_name VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,

  -- 統計數據
  total_score INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  elo_rating INTEGER DEFAULT 1000,
  season_peak_elo INTEGER DEFAULT 1000,

  -- 時間戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_players_display_name ON players(display_name);
CREATE INDEX IF NOT EXISTS idx_players_firebase_uid ON players(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_players_elo_rating ON players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_season_peak_elo ON players(season_peak_elo DESC);

-- ==================== 遊戲歷史記錄表 ====================
CREATE TABLE IF NOT EXISTS game_history (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) NOT NULL,
  winner_id UUID REFERENCES players(id),
  winner_name VARCHAR(50),
  player_count INTEGER,
  rounds_played INTEGER DEFAULT 1,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_game_history_created ON game_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_history_winner ON game_history(winner_id);

-- ==================== 遊戲參與者表 ====================
CREATE TABLE IF NOT EXISTS game_participants (
  id SERIAL PRIMARY KEY,
  game_history_id INTEGER REFERENCES game_history(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  player_name VARCHAR(50),
  final_score INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_game_participants_game ON game_participants(game_history_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_player ON game_participants(player_id);

-- ==================== 賽季與 ELO 歷史表 ====================
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_elo_history (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  game_history_id INTEGER REFERENCES game_history(id) ON DELETE SET NULL,
  season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_elo_history_player_created ON player_elo_history(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);

-- ==================== 啟用 Row Level Security ====================
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_elo_history ENABLE ROW LEVEL SECURITY;

-- ==================== RLS 政策（允許匿名讀取和插入） ====================
-- 玩家表：允許讀取和插入
CREATE POLICY "Allow public read players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert players" ON players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update players" ON players
  FOR UPDATE USING (true);

-- 遊戲歷史表：允許讀取和插入
CREATE POLICY "Allow public read game_history" ON game_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert game_history" ON game_history
  FOR INSERT WITH CHECK (true);

-- 遊戲參與者表：允許讀取和插入
CREATE POLICY "Allow public read game_participants" ON game_participants
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert game_participants" ON game_participants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read seasons" ON seasons
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert seasons" ON seasons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update seasons" ON seasons
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read player_elo_history" ON player_elo_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert player_elo_history" ON player_elo_history
  FOR INSERT WITH CHECK (true);

-- ==================== 完成 ====================
-- 執行完成後，可以用以下 SQL 驗證
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
