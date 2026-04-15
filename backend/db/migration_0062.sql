-- Supabase 資料表遷移腳本
-- 工單 0062 - 全球排行榜 ELO + 賽季系統

-- 玩家 ELO 欄位
-- 1000 為 ELO 常見初始基準分，讓新玩家可從中性位置開始評分
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1000;
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_peak_elo INTEGER DEFAULT 1000;

-- 賽季表
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 玩家 ELO 歷史
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_players_elo_rating ON players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_season_peak_elo ON players(season_peak_elo DESC);
CREATE INDEX IF NOT EXISTS idx_player_elo_history_player_created ON player_elo_history(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);

-- RLS
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
