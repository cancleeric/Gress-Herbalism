-- Supabase 資料表遷移腳本
-- 工單 0062 / Issue #60 - 全球排行榜 ELO 與賽季排名

-- ==================== players ELO 欄位 ====================
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_rating INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_current_elo INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_peak_elo INTEGER NOT NULL DEFAULT 1000;
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_season_id VARCHAR(7);
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_games_played INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_games_won INTEGER DEFAULT 0;

-- ==================== seasons 賽季表 ====================
CREATE TABLE IF NOT EXISTS seasons (
  id VARCHAR(7) PRIMARY KEY, -- YYYY-MM
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 玩家 ELO 歷史表 ====================
CREATE TABLE IF NOT EXISTS player_elo_history (
  id BIGSERIAL PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  game_id VARCHAR(100),
  season_id VARCHAR(7) NOT NULL,
  elo_before INTEGER NOT NULL,
  elo_after INTEGER NOT NULL,
  elo_change INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 索引 ====================
CREATE INDEX IF NOT EXISTS idx_players_elo_rating ON players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_season_elo ON players(current_season_id, season_current_elo DESC);
CREATE INDEX IF NOT EXISTS idx_player_elo_history_player_created ON player_elo_history(player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_player_elo_history_season ON player_elo_history(season_id, elo_after DESC);

-- ==================== seasons updated_at 觸發器 ====================
CREATE OR REPLACE FUNCTION update_seasons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seasons_updated_at ON seasons;
CREATE TRIGGER seasons_updated_at
  BEFORE UPDATE ON seasons
  FOR EACH ROW
  EXECUTE FUNCTION update_seasons_updated_at();

-- ==================== 當前賽季初始化 ====================
INSERT INTO seasons (id, start_date, end_date, status)
VALUES (
  TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM'),
  DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC'),
  (DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month' - INTERVAL '1 second'),
  'active'
)
ON CONFLICT (id) DO NOTHING;
