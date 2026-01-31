# 工作單 0264

## 編號
0264

## 日期
2026-01-31

## 工作單標題
建立演化論資料表

## 工單主旨
在 Supabase 建立演化論遊戲所需的資料表 Schema

## 內容

### 任務描述

建立演化論遊戲的資料庫結構，包含遊戲紀錄、參與者資訊和玩家統計。

### 資料表設計

#### 1. evolution_games（遊戲紀錄）

```sql
CREATE TABLE evolution_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id VARCHAR(50) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  rounds_played INTEGER DEFAULT 0,
  winner_id UUID REFERENCES players(id),
  game_data JSONB,  -- 完整遊戲資料快照
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_evolution_games_started_at ON evolution_games(started_at DESC);
CREATE INDEX idx_evolution_games_winner_id ON evolution_games(winner_id);
```

#### 2. evolution_participants（遊戲參與者）

```sql
CREATE TABLE evolution_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES evolution_games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id),
  final_score INTEGER DEFAULT 0,
  creatures_survived INTEGER DEFAULT 0,
  traits_count INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  placement INTEGER,  -- 名次
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_evolution_participants_game_id ON evolution_participants(game_id);
CREATE INDEX idx_evolution_participants_player_id ON evolution_participants(player_id);
```

#### 3. evolution_player_stats（玩家統計）

```sql
CREATE TABLE evolution_player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES players(id) UNIQUE,
  games_played INTEGER DEFAULT 0,
  games_won INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  total_creatures INTEGER DEFAULT 0,
  total_traits INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,
  favorite_trait VARCHAR(50),  -- 最常使用的性狀
  win_streak INTEGER DEFAULT 0,
  max_win_streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_evolution_player_stats_games_won ON evolution_player_stats(games_won DESC);
CREATE INDEX idx_evolution_player_stats_total_score ON evolution_player_stats(total_score DESC);
```

### RLS 政策

```sql
-- evolution_games RLS
ALTER TABLE evolution_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game records"
  ON evolution_games FOR SELECT
  USING (true);

CREATE POLICY "Server can insert game records"
  ON evolution_games FOR INSERT
  WITH CHECK (true);

-- evolution_participants RLS
ALTER TABLE evolution_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read participant records"
  ON evolution_participants FOR SELECT
  USING (true);

-- evolution_player_stats RLS
ALTER TABLE evolution_player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read player stats"
  ON evolution_player_stats FOR SELECT
  USING (true);

CREATE POLICY "Players can update own stats"
  ON evolution_player_stats FOR UPDATE
  USING (auth.uid() = player_id);
```

### 觸發器

```sql
-- 更新玩家統計
CREATE OR REPLACE FUNCTION update_evolution_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO evolution_player_stats (player_id, games_played, games_won, total_score, total_creatures, total_traits)
  VALUES (NEW.player_id, 1, CASE WHEN NEW.is_winner THEN 1 ELSE 0 END, NEW.final_score, NEW.creatures_survived, NEW.traits_count)
  ON CONFLICT (player_id) DO UPDATE SET
    games_played = evolution_player_stats.games_played + 1,
    games_won = evolution_player_stats.games_won + (CASE WHEN NEW.is_winner THEN 1 ELSE 0 END),
    total_score = evolution_player_stats.total_score + NEW.final_score,
    total_creatures = evolution_player_stats.total_creatures + NEW.creatures_survived,
    total_traits = evolution_player_stats.total_traits + NEW.traits_count,
    highest_score = GREATEST(evolution_player_stats.highest_score, NEW.final_score),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_evolution_stats
  AFTER INSERT ON evolution_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_evolution_player_stats();
```

### 前置條件
- Supabase 專案已設定
- players 資料表已存在

### 驗收標準
- [ ] 三個資料表成功建立
- [ ] 索引正確建立
- [ ] RLS 政策正確設定
- [ ] 觸發器正確運作
- [ ] 測試資料寫入成功

### 相關檔案
- `supabase/migrations/` — 新建遷移檔案

### 參考計畫書
`docs/演化論/PLAN_EVOLUTION_DEVELOPMENT.md` 第三章 3.5 節
