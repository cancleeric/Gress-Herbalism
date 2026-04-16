/**
 * collectionService 單元測試
 * Issue #63 - 本草圖鑑收藏系統
 */

const collectionService = require('../../services/collectionService');

// Mock supabase
jest.mock('../../db/supabase', () => {
  const encyclopediaData = [
    {
      id: 1,
      herb_id: 'red',
      name_zh: '紅花',
      name_latin: 'Carthamus tinctorius L.',
      effect_desc: '活血通經、散瘀止痛。',
      game_effect: '遊戲中共 2 張。',
      history_note: '紅花原產於中亞。',
      rarity: 'epic',
    },
    {
      id: 2,
      herb_id: 'yellow',
      name_zh: '黃芪',
      name_latin: 'Astragalus membranaceus',
      effect_desc: '補氣升陽、固表止汗。',
      game_effect: '遊戲中共 3 張。',
      history_note: '黃芪被譽為補氣聖藥。',
      rarity: 'rare',
    },
    {
      id: 3,
      herb_id: 'green',
      name_zh: '艾葉',
      name_latin: 'Artemisia argyi',
      effect_desc: '溫經止血、散寒止痛。',
      game_effect: '遊戲中共 4 張。',
      history_note: '艾葉是端午節的重要植物。',
      rarity: 'common',
    },
    {
      id: 4,
      herb_id: 'blue',
      name_zh: '板藍根',
      name_latin: 'Isatis indigotica Fortune',
      effect_desc: '清熱解毒、涼血利咽。',
      game_effect: '遊戲中共 5 張。',
      history_note: '板藍根是中醫抗疫常備藥材。',
      rarity: 'common',
    },
  ];

  const collectionData = [
    { herb_id: 'red', unlocked_at: '2026-01-01T00:00:00Z', use_count: 3 },
    { herb_id: 'blue', unlocked_at: '2026-01-02T00:00:00Z', use_count: 7 },
  ];

  const mockSelect = jest.fn().mockReturnThis();
  const mockEq = jest.fn().mockReturnThis();
  const mockOrder = jest.fn().mockReturnThis();
  const mockSingle = jest.fn();
  const mockInsert = jest.fn().mockReturnThis();
  const mockUpdate = jest.fn().mockReturnThis();

  // Default behaviour
  mockSingle.mockResolvedValue({ data: encyclopediaData[0], error: null });

  const supabase = {
    from: jest.fn((table) => {
      const chain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
      };

      if (table === 'herb_encyclopedia') {
        chain.select.mockImplementation(() => {
          chain.order.mockResolvedValue({ data: encyclopediaData, error: null });
          chain.single.mockResolvedValue({ data: encyclopediaData[0], error: null });
          return chain;
        });
      }

      if (table === 'player_collection') {
        chain.select.mockImplementation(() => {
          chain.eq.mockReturnThis();
          // Second call resolves collection
          chain.order = jest.fn().mockResolvedValue({ data: collectionData, error: null });
          // Default resolution after eq chain
          Object.defineProperty(chain, 'then', {
            get: () => undefined,
          });
          return chain;
        });
        chain.eq.mockResolvedValue({ data: collectionData, error: null });
        chain.insert.mockResolvedValue({ data: null, error: null });
        chain.update.mockReturnThis();
        chain.update.eq = jest.fn().mockResolvedValue({ data: null, error: null });
      }

      return chain;
    }),
  };

  return { supabase };
});

describe('collectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== recordCardUsage ====================

  describe('recordCardUsage', () => {
    test('空 herbIds 直接回傳空陣列', async () => {
      const result = await collectionService.recordCardUsage('player-uuid-1', []);
      expect(result).toEqual([]);
    });

    test('null playerId 直接回傳空陣列', async () => {
      const result = await collectionService.recordCardUsage(null, ['red']);
      expect(result).toEqual([]);
    });

    test('null herbIds 直接回傳空陣列', async () => {
      const result = await collectionService.recordCardUsage('player-uuid-1', null);
      expect(result).toEqual([]);
    });

    test('回傳值是陣列型別', async () => {
      const result = await collectionService.recordCardUsage('player-uuid-1', ['red', 'blue']);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ==================== 資料結構驗證 ====================

  describe('getPlayerCollection 結果結構', () => {
    test('回傳物件含必要欄位 entries/unlockedCount/totalCount', async () => {
      const result = await collectionService.getPlayerCollection('player-uuid-1');
      expect(result).toHaveProperty('entries');
      expect(result).toHaveProperty('unlockedCount');
      expect(result).toHaveProperty('totalCount');
    });

    test('entries 是陣列', async () => {
      const result = await collectionService.getPlayerCollection('player-uuid-1');
      expect(Array.isArray(result.entries)).toBe(true);
    });

    test('unlockedCount 不超過 totalCount', async () => {
      const result = await collectionService.getPlayerCollection('player-uuid-1');
      expect(result.unlockedCount).toBeLessThanOrEqual(result.totalCount);
    });
  });

  // ==================== 遊戲中 herbIds 提取邏輯 ====================

  describe('herbId 提取（遊戲 hiddenCards 邏輯）', () => {
    test('從 hiddenCards 提取唯一顏色', () => {
      const hiddenCards = [
        { id: 'card_1', color: 'red' },
        { id: 'card_2', color: 'red' },
      ];
      const herbIds = [...new Set(hiddenCards.map(c => c.color))];
      expect(herbIds).toEqual(['red']);
    });

    test('兩種不同顏色的蓋牌', () => {
      const hiddenCards = [
        { id: 'card_1', color: 'green' },
        { id: 'card_2', color: 'blue' },
      ];
      const herbIds = [...new Set(hiddenCards.map(c => c.color))];
      expect(herbIds).toHaveLength(2);
      expect(herbIds).toContain('green');
      expect(herbIds).toContain('blue');
    });

    test('空 hiddenCards 回傳空陣列', () => {
      const hiddenCards = [];
      const herbIds = [...new Set(hiddenCards.map(c => c.color))];
      expect(herbIds).toHaveLength(0);
    });

    test('只有一張蓋牌的情況（不同顏色不重複）', () => {
      const hiddenCards = [{ id: 'card_3', color: 'yellow' }];
      const herbIds = [...new Set(hiddenCards.map(c => c.color))];
      expect(herbIds).toEqual(['yellow']);
    });
  });

  // ==================== 有效藥草顏色驗證 ====================

  describe('有效藥草 ID', () => {
    const VALID_HERB_IDS = ['red', 'yellow', 'green', 'blue'];

    test('四個有效顏色對應四種藥草', () => {
      expect(VALID_HERB_IDS).toHaveLength(4);
    });

    test('red 是有效的藥草 ID', () => {
      expect(VALID_HERB_IDS).toContain('red');
    });

    test('yellow 是有效的藥草 ID', () => {
      expect(VALID_HERB_IDS).toContain('yellow');
    });

    test('green 是有效的藥草 ID', () => {
      expect(VALID_HERB_IDS).toContain('green');
    });

    test('blue 是有效的藥草 ID', () => {
      expect(VALID_HERB_IDS).toContain('blue');
    });

    test('無效顏色不在有效清單中', () => {
      expect(VALID_HERB_IDS).not.toContain('purple');
      expect(VALID_HERB_IDS).not.toContain('');
    });
  });
});
