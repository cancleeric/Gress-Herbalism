-- Supabase 資料表遷移腳本
-- Issue #63 - 本草百科集收藏系統
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 本草百科表（靜態內容） ====================
CREATE TABLE IF NOT EXISTS herb_encyclopedia (
  id SERIAL PRIMARY KEY,
  herb_id VARCHAR(20) UNIQUE NOT NULL,        -- 對應遊戲牌色：red/yellow/green/blue
  name_zh VARCHAR(100) NOT NULL,              -- 中文名稱
  scientific_name VARCHAR(200),              -- 學名
  description TEXT,                          -- 描述
  properties TEXT,                           -- 藥性
  uses TEXT,                                 -- 用途
  rarity VARCHAR(20) DEFAULT 'common',       -- common / uncommon / rare / legendary
  unlock_condition VARCHAR(50) NOT NULL,     -- 解鎖條件類型：games_played / games_won
  unlock_threshold INT NOT NULL DEFAULT 1,   -- 解鎖所需次數
  image_url VARCHAR(500),                    -- 圖片 URL（可選）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 玩家收藏表 ====================
CREATE TABLE IF NOT EXISTS player_collection (
  id SERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  herb_id VARCHAR(20) NOT NULL,              -- 對應 herb_encyclopedia.herb_id
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  times_seen INT DEFAULT 1,                  -- 在遊戲中見過此草藥的次數
  UNIQUE(player_id, herb_id)
);

-- ==================== 建立索引 ====================
CREATE INDEX IF NOT EXISTS idx_herb_encyclopedia_herb_id ON herb_encyclopedia(herb_id);
CREATE INDEX IF NOT EXISTS idx_player_collection_player ON player_collection(player_id);
CREATE INDEX IF NOT EXISTS idx_player_collection_herb ON player_collection(herb_id);

-- ==================== RLS 政策 ====================
ALTER TABLE herb_encyclopedia ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_collection ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read herb_encyclopedia" ON herb_encyclopedia
  FOR SELECT USING (true);

CREATE POLICY "Allow public read player_collection" ON player_collection
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert player_collection" ON player_collection
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update player_collection" ON player_collection
  FOR UPDATE USING (true);

-- ==================== 初始化本草資料（四色草藥）====================
INSERT INTO herb_encyclopedia
  (herb_id, name_zh, scientific_name, description, properties, uses, rarity, unlock_condition, unlock_threshold)
VALUES
  (
    'red',
    '紅景天',
    'Rhodiola rosea',
    '生長於高山峭壁的珍稀植物，根莖呈紅褐色，具有強大的適應原功效。',
    '性平，味甘、苦；歸肺、心經。',
    '補氣清肺、益智養心、收澀止血。常用於氣虛體弱、病後畏寒。',
    'uncommon',
    'games_played',
    1
  ),
  (
    'yellow',
    '黃連',
    'Coptis chinensis',
    '根莖呈黃色，是中醫最重要的清熱解毒藥之一，苦寒之性極強。',
    '性寒，味苦；歸心、脾、胃、肝、膽、大腸經。',
    '清熱燥濕、瀉火解毒。用於濕熱痞滿、嘔吐吞酸、瀉痢、黃疸。',
    'common',
    'games_played',
    3
  ),
  (
    'green',
    '青蒿',
    'Artemisia annua',
    '芳香型草本植物，枝葉翠綠，是提取青蒿素（治療瘧疾）的重要原料。',
    '性寒，味苦、辛；歸肝、膽經。',
    '清虛熱、除骨蒸、解暑截瘧、退黃。用於溫邪傷陰、夜熱早涼。',
    'rare',
    'games_won',
    3
  ),
  (
    'blue',
    '藍花參',
    'Wahlenbergia marginata',
    '野生草本，花朵呈淡藍紫色，是民間常用的補益草藥，生命力旺盛。',
    '性平，味甘；歸脾、肺經。',
    '益氣補虛、祛痰止咳。用於氣虛乏力、食少便溏、虛咳喘息。',
    'legendary',
    'games_won',
    5
  )
ON CONFLICT (herb_id) DO NOTHING;
