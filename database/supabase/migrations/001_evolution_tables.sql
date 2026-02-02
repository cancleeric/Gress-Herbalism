-- ================================
-- 演化論遊戲資料庫結構
-- 遷移腳本 001
-- ================================

-- 啟用必要擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 遊戲記錄表
-- ================================
CREATE TABLE IF NOT EXISTS evolution_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL DEFAULT 'playing',
  rounds INTEGER NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES auth.users(id),
  config JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 遊戲表索引
CREATE INDEX IF NOT EXISTS idx_evolution_games_status ON evolution_games(status);
CREATE INDEX IF NOT EXISTS idx_evolution_games_winner ON evolution_games(winner_id);
CREATE INDEX IF NOT EXISTS idx_evolution_games_started ON evolution_games(started_at DESC);

-- 狀態約束
ALTER TABLE evolution_games DROP CONSTRAINT IF EXISTS evolution_games_status_check;
ALTER TABLE evolution_games ADD CONSTRAINT evolution_games_status_check
  CHECK (status IN ('waiting', 'playing', 'finished', 'cancelled'));

-- ================================
-- 遊戲參與者表
-- ================================
CREATE TABLE IF NOT EXISTS evolution_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES evolution_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  player_index INTEGER NOT NULL,
  final_score INTEGER,
  final_rank INTEGER,
  creatures_count INTEGER DEFAULT 0,
  traits_count INTEGER DEFAULT 0,
  food_bonus INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- 參與者表索引
CREATE INDEX IF NOT EXISTS idx_evolution_participants_game ON evolution_participants(game_id);
CREATE INDEX IF NOT EXISTS idx_evolution_participants_user ON evolution_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_participants_winner ON evolution_participants(is_winner) WHERE is_winner = TRUE;

-- ================================
-- 玩家統計表
-- ================================
CREATE TABLE IF NOT EXISTS evolution_player_stats (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  games_played INTEGER NOT NULL DEFAULT 0,
  games_won INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  total_creatures INTEGER NOT NULL DEFAULT 0,
  total_traits INTEGER NOT NULL DEFAULT 0,
  total_kills INTEGER NOT NULL DEFAULT 0,
  total_deaths INTEGER NOT NULL DEFAULT 0,
  highest_score INTEGER NOT NULL DEFAULT 0,
  longest_game_rounds INTEGER NOT NULL DEFAULT 0,
  favorite_trait VARCHAR(50),
  last_played_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 玩家統計表索引
CREATE INDEX IF NOT EXISTS idx_evolution_player_stats_wins ON evolution_player_stats(games_won DESC);
CREATE INDEX IF NOT EXISTS idx_evolution_player_stats_score ON evolution_player_stats(total_score DESC);

-- 觸發器：自動更新 updated_at
CREATE OR REPLACE FUNCTION update_evolution_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS evolution_stats_updated ON evolution_player_stats;
CREATE TRIGGER evolution_stats_updated
  BEFORE UPDATE ON evolution_player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_evolution_stats_timestamp();

-- ================================
-- 成就定義表
-- ================================
CREATE TABLE IF NOT EXISTS evolution_achievements (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description TEXT NOT NULL,
  icon VARCHAR(10),
  category VARCHAR(30) NOT NULL,
  condition JSONB NOT NULL,
  points INTEGER NOT NULL DEFAULT 10,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 成就類別約束
ALTER TABLE evolution_achievements DROP CONSTRAINT IF EXISTS evolution_achievements_category_check;
ALTER TABLE evolution_achievements ADD CONSTRAINT evolution_achievements_category_check
  CHECK (category IN ('gameplay', 'collection', 'social', 'special', 'milestone'));

-- ================================
-- 玩家成就表
-- ================================
CREATE TABLE IF NOT EXISTS evolution_player_achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  achievement_id VARCHAR(50) NOT NULL REFERENCES evolution_achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  game_id UUID REFERENCES evolution_games(id),
  UNIQUE(user_id, achievement_id)
);

-- 玩家成就表索引
CREATE INDEX IF NOT EXISTS idx_player_achievements_user ON evolution_player_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_player_achievements_achievement ON evolution_player_achievements(achievement_id);

-- ================================
-- 遊戲回放資料表
-- ================================
CREATE TABLE IF NOT EXISTS evolution_game_replays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID NOT NULL REFERENCES evolution_games(id) ON DELETE CASCADE,
  events JSONB NOT NULL DEFAULT '[]',
  compressed BOOLEAN NOT NULL DEFAULT FALSE,
  size_bytes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(game_id)
);

-- ================================
-- 排行榜視圖
-- ================================
CREATE OR REPLACE VIEW evolution_leaderboard AS
SELECT
  u.id AS user_id,
  COALESCE(u.raw_user_meta_data->>'name', u.email) AS display_name,
  s.games_played,
  s.games_won,
  CASE WHEN s.games_played > 0
    THEN ROUND((s.games_won::DECIMAL / s.games_played) * 100, 1)
    ELSE 0
  END AS win_rate,
  s.total_score,
  s.highest_score,
  s.total_kills,
  s.total_creatures,
  RANK() OVER (ORDER BY s.games_won DESC, s.total_score DESC) AS rank
FROM evolution_player_stats s
JOIN auth.users u ON s.user_id = u.id
WHERE s.games_played >= 5
ORDER BY rank;

-- ================================
-- 每日排行榜視圖
-- ================================
CREATE OR REPLACE VIEW evolution_daily_leaderboard AS
SELECT
  p.user_id,
  COALESCE(u.raw_user_meta_data->>'name', u.email) AS display_name,
  COUNT(*) AS games_today,
  SUM(CASE WHEN p.is_winner THEN 1 ELSE 0 END) AS wins_today,
  SUM(COALESCE(p.final_score, 0)) AS total_score_today,
  MAX(p.final_score) AS best_score_today,
  RANK() OVER (ORDER BY SUM(CASE WHEN p.is_winner THEN 1 ELSE 0 END) DESC, SUM(COALESCE(p.final_score, 0)) DESC) AS rank
FROM evolution_participants p
JOIN evolution_games g ON p.game_id = g.id
JOIN auth.users u ON p.user_id = u.id
WHERE g.ended_at >= CURRENT_DATE
  AND g.status = 'finished'
GROUP BY p.user_id, u.raw_user_meta_data->>'name', u.email
ORDER BY rank;

-- ================================
-- 每週排行榜視圖
-- ================================
CREATE OR REPLACE VIEW evolution_weekly_leaderboard AS
SELECT
  p.user_id,
  COALESCE(u.raw_user_meta_data->>'name', u.email) AS display_name,
  COUNT(*) AS games_this_week,
  SUM(CASE WHEN p.is_winner THEN 1 ELSE 0 END) AS wins_this_week,
  SUM(COALESCE(p.final_score, 0)) AS total_score_this_week,
  RANK() OVER (ORDER BY SUM(CASE WHEN p.is_winner THEN 1 ELSE 0 END) DESC) AS rank
FROM evolution_participants p
JOIN evolution_games g ON p.game_id = g.id
JOIN auth.users u ON p.user_id = u.id
WHERE g.ended_at >= DATE_TRUNC('week', CURRENT_DATE)
  AND g.status = 'finished'
GROUP BY p.user_id, u.raw_user_meta_data->>'name', u.email
ORDER BY rank;

-- ================================
-- RLS 政策
-- ================================
ALTER TABLE evolution_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_player_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_game_replays ENABLE ROW LEVEL SECURITY;

-- 遊戲記錄：所有認證用戶可讀
DROP POLICY IF EXISTS "Games are viewable by everyone" ON evolution_games;
CREATE POLICY "Games are viewable by everyone"
  ON evolution_games FOR SELECT
  TO authenticated
  USING (true);

-- 遊戲記錄：僅服務角色可寫入
DROP POLICY IF EXISTS "Games can be inserted by service role" ON evolution_games;
CREATE POLICY "Games can be inserted by service role"
  ON evolution_games FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Games can be updated by service role" ON evolution_games;
CREATE POLICY "Games can be updated by service role"
  ON evolution_games FOR UPDATE
  TO service_role
  USING (true);

-- 參與者記錄：所有認證用戶可讀
DROP POLICY IF EXISTS "Participants are viewable by everyone" ON evolution_participants;
CREATE POLICY "Participants are viewable by everyone"
  ON evolution_participants FOR SELECT
  TO authenticated
  USING (true);

-- 參與者記錄：僅服務角色可寫入
DROP POLICY IF EXISTS "Participants can be inserted by service role" ON evolution_participants;
CREATE POLICY "Participants can be inserted by service role"
  ON evolution_participants FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 玩家統計：所有認證用戶可讀
DROP POLICY IF EXISTS "Stats are viewable by everyone" ON evolution_player_stats;
CREATE POLICY "Stats are viewable by everyone"
  ON evolution_player_stats FOR SELECT
  TO authenticated
  USING (true);

-- 玩家統計：用戶可更新自己的統計
DROP POLICY IF EXISTS "Users can update own stats" ON evolution_player_stats;
CREATE POLICY "Users can update own stats"
  ON evolution_player_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 玩家統計：服務角色可完整操作
DROP POLICY IF EXISTS "Service role can manage stats" ON evolution_player_stats;
CREATE POLICY "Service role can manage stats"
  ON evolution_player_stats FOR ALL
  TO service_role
  USING (true);

-- 成就：用戶可讀取自己的成就
DROP POLICY IF EXISTS "Achievements viewable by owner" ON evolution_player_achievements;
CREATE POLICY "Achievements viewable by owner"
  ON evolution_player_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 成就：服務角色可完整操作
DROP POLICY IF EXISTS "Service role can manage achievements" ON evolution_player_achievements;
CREATE POLICY "Service role can manage achievements"
  ON evolution_player_achievements FOR ALL
  TO service_role
  USING (true);

-- 回放：參與者可讀取
DROP POLICY IF EXISTS "Replays viewable by participants" ON evolution_game_replays;
CREATE POLICY "Replays viewable by participants"
  ON evolution_game_replays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM evolution_participants p
      WHERE p.game_id = evolution_game_replays.game_id
        AND p.user_id = auth.uid()
    )
  );

-- ================================
-- 初始成就資料
-- ================================
INSERT INTO evolution_achievements (id, name, name_en, description, icon, category, condition, points, hidden)
VALUES
  ('first_win', '初次勝利', 'First Win', '贏得第一場遊戲', '🏆', 'milestone', '{"type": "wins", "count": 1}', 10, false),
  ('veteran', '老手', 'Veteran', '完成 10 場遊戲', '🎮', 'milestone', '{"type": "games_played", "count": 10}', 20, false),
  ('champion', '冠軍', 'Champion', '贏得 10 場遊戲', '👑', 'milestone', '{"type": "wins", "count": 10}', 50, false),
  ('carnivore_king', '肉食之王', 'Carnivore King', '單場遊戲擊殺 5 隻生物', '🦖', 'gameplay', '{"type": "kills_per_game", "count": 5}', 30, false),
  ('pacifist', '和平主義者', 'Pacifist', '不擊殺任何生物贏得遊戲', '☮️', 'gameplay', '{"type": "win_without_kills"}', 40, true),
  ('creature_master', '生物大師', 'Creature Master', '單場遊戲擁有 8 隻生物', '🦎', 'gameplay', '{"type": "creatures_per_game", "count": 8}', 30, false),
  ('trait_collector', '性狀收藏家', 'Trait Collector', '累計獲得 100 個性狀', '🧬', 'collection', '{"type": "total_traits", "count": 100}', 40, false),
  ('perfect_score', '完美得分', 'Perfect Score', '單場獲得 40 分以上', '💯', 'gameplay', '{"type": "score_per_game", "count": 40}', 50, false),
  ('survivor', '生存者', 'Survivor', '所有生物存活至遊戲結束', '💪', 'gameplay', '{"type": "no_deaths"}', 35, false),
  ('quick_win', '閃電戰', 'Quick Win', '在 5 回合內獲勝', '⚡', 'gameplay', '{"type": "win_in_rounds", "count": 5}', 45, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  condition = EXCLUDED.condition,
  points = EXCLUDED.points;

-- ================================
-- 統計更新函數
-- ================================
CREATE OR REPLACE FUNCTION update_player_stats_after_game()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新或插入玩家統計
  INSERT INTO evolution_player_stats (
    user_id,
    games_played,
    games_won,
    total_score,
    total_creatures,
    total_traits,
    highest_score,
    last_played_at
  )
  VALUES (
    NEW.user_id,
    1,
    CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
    COALESCE(NEW.final_score, 0),
    COALESCE(NEW.creatures_count, 0),
    COALESCE(NEW.traits_count, 0),
    COALESCE(NEW.final_score, 0),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    games_played = evolution_player_stats.games_played + 1,
    games_won = evolution_player_stats.games_won + CASE WHEN NEW.is_winner THEN 1 ELSE 0 END,
    total_score = evolution_player_stats.total_score + COALESCE(NEW.final_score, 0),
    total_creatures = evolution_player_stats.total_creatures + COALESCE(NEW.creatures_count, 0),
    total_traits = evolution_player_stats.total_traits + COALESCE(NEW.traits_count, 0),
    highest_score = GREATEST(evolution_player_stats.highest_score, COALESCE(NEW.final_score, 0)),
    last_played_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 觸發器：遊戲結束時更新統計
DROP TRIGGER IF EXISTS update_stats_on_game_end ON evolution_participants;
CREATE TRIGGER update_stats_on_game_end
  AFTER INSERT OR UPDATE OF final_score ON evolution_participants
  FOR EACH ROW
  WHEN (NEW.final_score IS NOT NULL)
  EXECUTE FUNCTION update_player_stats_after_game();

-- ================================
-- 遷移完成
-- ================================
COMMENT ON TABLE evolution_games IS '演化論遊戲記錄表';
COMMENT ON TABLE evolution_participants IS '遊戲參與者記錄表';
COMMENT ON TABLE evolution_player_stats IS '玩家統計資料表';
COMMENT ON TABLE evolution_achievements IS '成就定義表';
COMMENT ON TABLE evolution_player_achievements IS '玩家成就記錄表';
COMMENT ON TABLE evolution_game_replays IS '遊戲回放資料表';
