-- Supabase 資料表遷移腳本
-- Issue #63 - 本草圖鑑收藏系統（Herb Encyclopedia Collection System）
-- 請在 Supabase Dashboard → SQL Editor 執行此腳本

-- ==================== 本草圖鑑表 ====================
CREATE TABLE IF NOT EXISTS herb_encyclopedia (
  id SERIAL PRIMARY KEY,
  herb_id VARCHAR(50) UNIQUE NOT NULL,          -- 對應遊戲卡牌顏色（red/yellow/green/blue）
  name_zh VARCHAR(100) NOT NULL,                -- 中文名稱
  name_latin VARCHAR(150),                      -- 拉丁學名
  effect_desc TEXT,                             -- 功效描述
  game_effect TEXT,                             -- 遊戲效果說明
  history_note TEXT,                            -- 歷史典故（1-2 句）
  rarity VARCHAR(20) DEFAULT 'common',          -- 稀有度（common/rare/epic）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== 玩家收藏表 ====================
CREATE TABLE IF NOT EXISTS player_collection (
  id SERIAL PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  herb_id VARCHAR(50) NOT NULL,                 -- 對應 herb_encyclopedia.herb_id
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,                  -- 使用次數
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

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

-- ==================== Seed Data：本草圖鑑初始資料 ====================
INSERT INTO herb_encyclopedia (herb_id, name_zh, name_latin, effect_desc, game_effect, history_note, rarity)
VALUES
  (
    'red',
    '紅花',
    'Carthamus tinctorius L.',
    '活血通經、散瘀止痛。主治血滯經閉、痛經、跌打損傷。',
    '遊戲中共 2 張。紅花數量最少，是最難猜中的蓋牌之一。',
    '紅花原產於中亞，漢代沿絲路傳入中國。《本草綱目》記載：「紅藍花，活血潤燥，止痛散腫，通經。」',
    'epic'
  ),
  (
    'yellow',
    '黃芪',
    'Astragalus membranaceus (Fisch.) Bge.',
    '補氣升陽、固表止汗、利水消腫、托毒生肌。為補氣要藥。',
    '遊戲中共 3 張。黃芪數量適中，推理時可作為重要參考依據。',
    '黃芪被譽為「補氣聖藥」，在中醫理論中屬於「上品」。《神農本草經》中列為上品，主治癰疽久敗瘡。',
    'rare'
  ),
  (
    'green',
    '艾葉',
    'Artemisia argyi H.Lév. & Vaniot',
    '溫經止血、散寒止痛、祛濕止癢。外用可灸百病。',
    '遊戲中共 4 張。艾葉數量較多，是問牌時常見的答案選項。',
    '艾葉是中國傳統節日端午節的重要植物，古時懸掛門口以驅邪避疫。《本草綱目》稱其「灸百病，散沉寒痼冷」。',
    'common'
  ),
  (
    'blue',
    '板藍根',
    'Isatis indigotica Fortune',
    '清熱解毒、涼血利咽。主治時疫熱毒、發熱咽痛、丹毒等症。',
    '遊戲中共 5 張。板藍根數量最多，是最容易猜中的蓋牌顏色。',
    '板藍根在歷代瘟疫防治中扮演重要角色。近現代研究證實其具有抗病毒作用，是中醫抗疫常備藥材。',
    'common'
  )
ON CONFLICT (herb_id) DO NOTHING;

-- ==================== 完成 ====================
-- 驗證用：
-- SELECT * FROM herb_encyclopedia ORDER BY id;
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('herb_encyclopedia', 'player_collection');
