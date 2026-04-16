-- Supabase 資料表遷移腳本
-- 工單 0060 - ELO 積分制 + 賽季排名
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 新增玩家 ELO 欄位 ====================

-- 新增 elo_rating 欄位（預設 1000）
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_rating INTEGER DEFAULT 1000;

-- 新增 season_peak_elo 欄位（當賽季最高 ELO）
ALTER TABLE players ADD COLUMN IF NOT EXISTS season_peak_elo INTEGER DEFAULT 1000;

-- ==================== 賽季資料表 ====================

CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('upcoming', 'active', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_seasons_status ON seasons(status);
CREATE INDEX IF NOT EXISTS idx_seasons_end_date ON seasons(end_date DESC);

-- ==================== ELO 歷史記錄表 ====================

CREATE TABLE IF NOT EXISTS elo_history (
  id SERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  season_id INTEGER REFERENCES seasons(id) ON DELETE SET NULL,
  game_id VARCHAR(100),
  old_rating INTEGER NOT NULL,
  new_rating INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_elo_history_player ON elo_history(player_id);
CREATE INDEX IF NOT EXISTS idx_elo_history_created ON elo_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_elo_history_season ON elo_history(season_id);

-- ==================== 新增 ELO 索引 ====================

CREATE INDEX IF NOT EXISTS idx_players_elo_rating ON players(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_players_season_peak_elo ON players(season_peak_elo DESC);

-- ==================== RLS 政策 ====================

ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE elo_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read seasons" ON seasons
  FOR SELECT USING (true);

CREATE POLICY "Allow public read elo_history" ON elo_history
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert elo_history" ON elo_history
  FOR INSERT WITH CHECK (true);

-- ==================== 插入預設賽季 ====================

INSERT INTO seasons (name, start_date, end_date, status)
VALUES (
  '第一賽季',
  NOW(),
  NOW() + INTERVAL '90 days',
  'active'
)
ON CONFLICT DO NOTHING;

-- ==================== 完成 ====================
-- 執行完成後，可以用以下 SQL 驗證
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'players' AND column_name IN ('elo_rating', 'season_peak_elo');
-- SELECT * FROM seasons;
