-- Supabase 資料表遷移腳本
-- issue #60 - ELO 全球排行榜 + 賽季排名
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== players 新增欄位 ====================
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1000;
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_peak_elo INTEGER DEFAULT 1000;

UPDATE players
SET
  elo_rating = COALESCE(elo_rating, 1000),
  season_peak_elo = COALESCE(season_peak_elo, COALESCE(elo_rating, 1000))
WHERE elo_rating IS NULL OR season_peak_elo IS NULL;

-- ==================== 賽季表 ====================
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  season_name VARCHAR(50) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ELO 歷史表 ====================
CREATE TABLE IF NOT EXISTS player_elo_history (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_history_id INTEGER REFERENCES game_history(id) ON DELETE SET NULL,
  season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
  old_elo INTEGER NOT NULL,
  new_elo INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 索引優化 ====================
CREATE INDEX IF NOT EXISTS idx_players_elo_rating ON players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_season_peak_elo ON players(season_peak_elo DESC);
CREATE INDEX IF NOT EXISTS idx_seasons_status_dates ON seasons(status, start_date DESC, end_date DESC);
CREATE INDEX IF NOT EXISTS idx_player_elo_history_player_created ON player_elo_history(player_id, created_at DESC);

-- ==================== RLS ====================
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_elo_history ENABLE ROW LEVEL SECURITY;

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
