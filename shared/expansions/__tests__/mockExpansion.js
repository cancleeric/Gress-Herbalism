/**
 * Mock 擴充包（用於測試）
 *
 * @module expansions/__tests__/mockExpansion
 */

/**
 * 完整的 Mock 基礎版擴充包
 * 符合 ExpansionInterface 介面規範
 */
const mockBaseExpansion = {
  // 必要欄位（頂層）
  id: 'mock-base',
  name: 'Mock 基礎版',
  version: '1.0.0',
  description: '用於測試的 Mock 基礎版擴充包',

  // 依賴與不相容（陣列格式）
  requires: [],
  incompatible: [],

  // 性狀處理器（不是性狀定義）
  traits: {
    MOCK_CARNIVORE: {
      traitType: 'MOCK_CARNIVORE',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 1,
      checkDefense: () => ({ blocked: false }),
    },
    MOCK_DEFENSE: {
      traitType: 'MOCK_DEFENSE',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
      checkDefense: (attacker, defender) => ({
        blocked: true,
        reason: 'Mock defense blocks attack',
      }),
    },
    MOCK_FAT: {
      traitType: 'MOCK_FAT',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
  },

  // 卡牌定義
  cards: [
    { id: 'MOCK_001', frontTrait: 'MOCK_CARNIVORE', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'MOCK_002', frontTrait: 'MOCK_DEFENSE', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'MOCK_003', frontTrait: 'MOCK_FAT', backTrait: 'MOCK_FAT', count: 4 },
  ],

  // 規則
  rules: {
    minPlayers: 2,
    maxPlayers: 4,
  },

  /**
   * 建立牌庫
   * @returns {Array}
   */
  createDeck() {
    const deck = [];
    for (const card of this.cards) {
      for (let i = 0; i < card.count; i++) {
        deck.push({
          id: card.id,
          instanceId: `mock-base_${card.id}_${i}`,
          frontTrait: card.frontTrait,
          backTrait: card.backTrait,
          expansion: 'mock-base',
        });
      }
    }
    return deck;
  },
};

/**
 * Mock 飛行擴充包
 * 符合 ExpansionInterface 介面規範
 */
const mockFlightExpansion = {
  // 必要欄位（頂層）
  id: 'mock-flight',
  name: 'Mock 飛行',
  version: '1.0.0',
  description: '用於測試的 Mock 飛行擴充包',

  // 依賴與不相容（陣列格式）
  requires: ['mock-base'],
  incompatible: [],

  // 性狀處理器
  traits: {
    MOCK_FLYING: {
      traitType: 'MOCK_FLYING',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
    MOCK_NESTING: {
      traitType: 'MOCK_NESTING',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
  },

  // 卡牌定義
  cards: [
    { id: 'FLIGHT_001', frontTrait: 'MOCK_FLYING', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'FLIGHT_002', frontTrait: 'MOCK_NESTING', backTrait: 'MOCK_FAT', count: 4 },
  ],

  // 規則
  rules: {
    minPlayers: 2,
    maxPlayers: 6,
  },

  /**
   * 建立牌庫
   * @returns {Array}
   */
  createDeck() {
    const deck = [];
    for (const card of this.cards) {
      for (let i = 0; i < card.count; i++) {
        deck.push({
          id: card.id,
          instanceId: `mock-flight_${card.id}_${i}`,
          frontTrait: card.frontTrait,
          backTrait: card.backTrait,
          expansion: 'mock-flight',
        });
      }
    }
    return deck;
  },
};

/**
 * Mock 衝突擴充包（用於測試衝突檢測）
 * 符合 ExpansionInterface 介面規範
 */
const mockConflictExpansion = {
  // 必要欄位（頂層）
  id: 'mock-conflict',
  name: 'Mock 衝突',
  version: '1.0.0',
  description: '用於測試衝突檢測的 Mock 擴充包',

  // 依賴與不相容（陣列格式）
  requires: ['mock-base'],
  incompatible: ['mock-flight'],

  // 性狀處理器
  traits: {
    MOCK_GROUND: {
      traitType: 'MOCK_GROUND',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
  },

  // 卡牌定義
  cards: [
    { id: 'CONFLICT_001', frontTrait: 'MOCK_GROUND', backTrait: 'MOCK_FAT', count: 4 },
  ],

  // 規則
  rules: {
    minPlayers: 2,
    maxPlayers: 4,
  },
};

module.exports = {
  mockBaseExpansion,
  mockFlightExpansion,
  mockConflictExpansion,
};
