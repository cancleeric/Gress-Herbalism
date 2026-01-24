-- Supabase 資料表遷移腳本
-- 工單 0060 - 分數保存與排行榜
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 新增玩家欄位 ====================
-- 新增 highest_score 欄位（如果不存在）
ALTER TABLE players ADD COLUMN IF NOT EXISTS highest_score INTEGER DEFAULT 0;

-- 新增 win_rate 欄位（如果不存在）
ALTER TABLE players ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0;

-- 新增 last_played_at 欄位（如果不存在）
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_played_at TIMESTAMP WITH TIME ZONE;

-- ==================== 新增索引 ====================
CREATE INDEX IF NOT EXISTS idx_players_games_won ON players(games_won DESC);
CREATE INDEX IF NOT EXISTS idx_players_win_rate ON players(win_rate DESC);
CREATE INDEX IF NOT EXISTS idx_players_highest_score ON players(highest_score DESC);

-- ==================== 更新勝率觸發器 ====================
CREATE OR REPLACE FUNCTION update_win_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.games_played > 0 THEN
    NEW.win_rate = ROUND((NEW.games_won::DECIMAL / NEW.games_played) * 100, 2);
  ELSE
    NEW.win_rate = 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除舊觸發器（如果存在）
DROP TRIGGER IF EXISTS players_win_rate ON players;

-- 建立新觸發器
CREATE TRIGGER players_win_rate
  BEFORE INSERT OR UPDATE OF games_played, games_won ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_win_rate();

-- ==================== 更新時間戳觸發器 ====================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除舊觸發器（如果存在）
DROP TRIGGER IF EXISTS players_updated_at ON players;

-- 建立新觸發器
CREATE TRIGGER players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ==================== 完成 ====================
-- 執行完成後，可以用以下 SQL 驗證
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'players';
