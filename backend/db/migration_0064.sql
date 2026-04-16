-- Supabase 資料表遷移腳本
-- 工單 0064 - 賽季聯賽系統
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本
-- 依賴：migration_elo.sql（seasons 表、elo_rating 欄位）

-- ==================== 賽季結果表 ====================

CREATE TABLE IF NOT EXISTS season_results (
  id SERIAL PRIMARY KEY,
  season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  final_elo INTEGER NOT NULL DEFAULT 1000,
  tier VARCHAR(20) NOT NULL DEFAULT 'grass',
  rewards_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(season_id, player_id)
);

-- ==================== 建立索引 ====================

CREATE INDEX IF NOT EXISTS idx_season_results_season ON season_results(season_id);
CREATE INDEX IF NOT EXISTS idx_season_results_player ON season_results(player_id);
CREATE INDEX IF NOT EXISTS idx_season_results_tier ON season_results(tier);
CREATE INDEX IF NOT EXISTS idx_season_results_claimed ON season_results(rewards_claimed);

-- ==================== RLS 政策 ====================

ALTER TABLE season_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read season_results" ON season_results
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert season_results" ON season_results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update season_results" ON season_results
  FOR UPDATE USING (true);

-- ==================== 更新時間戳觸發器 ====================

CREATE OR REPLACE FUNCTION update_season_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS season_results_updated_at ON season_results;

CREATE TRIGGER season_results_updated_at
  BEFORE UPDATE ON season_results
  FOR EACH ROW
  EXECUTE FUNCTION update_season_results_updated_at();

-- ==================== 完成 ====================
-- 執行完成後，可以用以下 SQL 驗證
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'season_results';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'season_results';
