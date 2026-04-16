-- Supabase 資料表遷移腳本
-- Issue #61 - 每日任務系統（Daily Quest System）
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 每日任務表 ====================
CREATE TABLE IF NOT EXISTS daily_quests (
  id SERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  quest_type VARCHAR(50) NOT NULL,         -- 'play_games' | 'win_games' | 'win_streak'
  difficulty VARCHAR(20) NOT NULL,         -- 'easy' | 'normal' | 'hard'
  target INTEGER NOT NULL,                 -- 完成目標數量
  progress INTEGER DEFAULT 0,             -- 目前進度
  completed BOOLEAN DEFAULT FALSE,        -- 是否已完成
  reward_claimed BOOLEAN DEFAULT FALSE,   -- 是否已領取獎勵
  reward_coins INTEGER NOT NULL,          -- 獎勵金幣
  date DATE NOT NULL,                     -- 任務所屬日期（UTC+8）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 玩家簽到表 ====================
CREATE TABLE IF NOT EXISTS player_checkins (
  id SERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  date DATE NOT NULL,                     -- 簽到日期（UTC+8）
  streak_count INTEGER DEFAULT 1,        -- 連續簽到天數
  reward_coins INTEGER DEFAULT 0,        -- 簽到獎勵金幣
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(player_id, date)
);

-- ==================== 玩家金幣欄位 ====================
-- 新增 coins 欄位到 players 表（如果不存在）
ALTER TABLE players ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;

-- ==================== 建立索引 ====================
CREATE INDEX IF NOT EXISTS idx_daily_quests_player_date ON daily_quests(player_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_quests_completed ON daily_quests(player_id, completed);
CREATE INDEX IF NOT EXISTS idx_player_checkins_player_date ON player_checkins(player_id, date);

-- ==================== RLS 政策 ====================
ALTER TABLE daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read daily_quests" ON daily_quests
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert daily_quests" ON daily_quests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update daily_quests" ON daily_quests
  FOR UPDATE USING (true);

CREATE POLICY "Allow public read player_checkins" ON player_checkins
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert player_checkins" ON player_checkins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update player_checkins" ON player_checkins
  FOR UPDATE USING (true);

-- ==================== 完成 ====================
-- 驗證用：
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('daily_quests', 'player_checkins');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'coins';
