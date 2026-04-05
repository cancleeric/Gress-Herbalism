-- Supabase 資料表遷移腳本
-- Issue #6 - 本草遊戲回放系統
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 本草遊戲回放表 ====================
CREATE TABLE IF NOT EXISTS herbalism_game_replays (
  id SERIAL PRIMARY KEY,
  game_id VARCHAR(100) UNIQUE NOT NULL,
  events JSONB NOT NULL DEFAULT '[]',
  player_names TEXT[] DEFAULT '{}',
  winner_name VARCHAR(50),
  rounds_played INTEGER DEFAULT 1,
  size_bytes INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_herbalism_replays_game_id ON herbalism_game_replays(game_id);
CREATE INDEX IF NOT EXISTS idx_herbalism_replays_created_at ON herbalism_game_replays(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_herbalism_replays_player_names ON herbalism_game_replays USING GIN(player_names);

-- ==================== 啟用 Row Level Security ====================
ALTER TABLE herbalism_game_replays ENABLE ROW LEVEL SECURITY;

-- ==================== RLS 政策（允許匿名讀取和插入） ====================
CREATE POLICY "Allow public read herbalism_replays" ON herbalism_game_replays
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert herbalism_replays" ON herbalism_game_replays
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public upsert herbalism_replays" ON herbalism_game_replays
  FOR UPDATE USING (true);

-- ==================== 完成 ====================
-- 執行完成後，可以用以下 SQL 驗證
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'herbalism_game_replays';
