-- Supabase 資料表遷移腳本
-- 工單 0062 - ELO 排行榜
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 新增 ELO 欄位 ====================
ALTER TABLE players ADD COLUMN IF NOT EXISTS elo_score INTEGER DEFAULT 1000;

-- ==================== 新增索引 ====================
CREATE INDEX IF NOT EXISTS idx_players_elo_score ON players(elo_score DESC);

-- ==================== 完成 ====================
-- 執行完成後可驗證
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'elo_score';
