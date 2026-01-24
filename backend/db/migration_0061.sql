-- Supabase 資料表遷移腳本
-- 工單 0061 - 好友系統
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 好友關係表 ====================
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'accepted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- ==================== 好友請求表 ====================
CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(from_user_id, to_user_id)
);

-- ==================== 遊戲邀請表 ====================
CREATE TABLE IF NOT EXISTS game_invitations (
  id SERIAL PRIMARY KEY,
  from_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES players(id) ON DELETE CASCADE,
  room_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '5 minutes')
);

-- ==================== 線上狀態表 ====================
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'offline',
  current_room_id VARCHAR(100),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 建立索引 ====================
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_game_invitations_to ON game_invitations(to_user_id, status);

-- ==================== RLS 政策 ====================
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- 好友關係表政策
CREATE POLICY "Allow public read friendships" ON friendships
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert friendships" ON friendships
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete friendships" ON friendships
  FOR DELETE USING (true);

-- 好友請求表政策
CREATE POLICY "Allow public read friend_requests" ON friend_requests
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert friend_requests" ON friend_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update friend_requests" ON friend_requests
  FOR UPDATE USING (true);

-- 遊戲邀請表政策
CREATE POLICY "Allow public read game_invitations" ON game_invitations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert game_invitations" ON game_invitations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update game_invitations" ON game_invitations
  FOR UPDATE USING (true);

-- 線上狀態表政策
CREATE POLICY "Allow public read user_presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Allow public upsert user_presence" ON user_presence
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update user_presence" ON user_presence
  FOR UPDATE USING (true);

-- ==================== 自動清理過期邀請 ====================
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE game_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ==================== 完成 ====================
-- 執行完成後可驗證
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
