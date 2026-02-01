/**
 * Mock 擴充包（用於測試）
 *
 * @module expansions/__tests__/mockExpansion
 */

const { EXPANSION_TYPE } = require('../manifest');

/**
 * 完整的 Mock 基礎版擴充包
 */
const mockBaseExpansion = {
  manifest: {
    id: 'mock-base',
    name: 'Mock 基礎版',
    nameEn: 'Mock Base',
    version: '1.0.0',
    type: EXPANSION_TYPE.BASE,
    dependencies: {},
    conflicts: {},
    minPlayers: 2,
    maxPlayers: 4,
    contents: {
      cards: 12,
      traits: 3,
    },
  },

  traits: {
    MOCK_CARNIVORE: {
      type: 'MOCK_CARNIVORE',
      name: 'Mock 肉食',
      nameEn: 'Mock Carnivore',
      foodBonus: 1,
      category: 'carnivore',
      description: '用於測試的肉食性狀',
    },
    MOCK_DEFENSE: {
      type: 'MOCK_DEFENSE',
      name: 'Mock 防禦',
      nameEn: 'Mock Defense',
      foodBonus: 0,
      category: 'defense',
      description: '用於測試的防禦性狀',
    },
    MOCK_FAT: {
      type: 'MOCK_FAT',
      name: 'Mock 脂肪',
      nameEn: 'Mock Fat',
      foodBonus: 0,
      category: 'feeding',
      description: '用於測試的脂肪性狀',
    },
  },

  cards: [
    { id: 'MOCK_001', frontTrait: 'MOCK_CARNIVORE', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'MOCK_002', frontTrait: 'MOCK_DEFENSE', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'MOCK_003', frontTrait: 'MOCK_FAT', backTrait: 'MOCK_FAT', count: 4 },
  ],

  traitHandlers: {
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
 */
const mockFlightExpansion = {
  manifest: {
    id: 'mock-flight',
    name: 'Mock 飛行',
    nameEn: 'Mock Flight',
    version: '1.0.0',
    type: EXPANSION_TYPE.EXPANSION,
    dependencies: { 'mock-base': '>=1.0.0' },
    conflicts: {},
    minPlayers: 2,
    maxPlayers: 6,
    contents: {
      cards: 8,
      traits: 2,
    },
  },

  traits: {
    MOCK_FLYING: {
      type: 'MOCK_FLYING',
      name: 'Mock 飛行',
      nameEn: 'Mock Flying',
      foodBonus: 0,
      category: 'special',
    },
    MOCK_NESTING: {
      type: 'MOCK_NESTING',
      name: 'Mock 築巢',
      nameEn: 'Mock Nesting',
      foodBonus: 0,
      category: 'special',
    },
  },

  cards: [
    { id: 'FLIGHT_001', frontTrait: 'MOCK_FLYING', backTrait: 'MOCK_FAT', count: 4 },
    { id: 'FLIGHT_002', frontTrait: 'MOCK_NESTING', backTrait: 'MOCK_FAT', count: 4 },
  ],

  traitHandlers: {
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
 */
const mockConflictExpansion = {
  manifest: {
    id: 'mock-conflict',
    name: 'Mock 衝突',
    nameEn: 'Mock Conflict',
    version: '1.0.0',
    type: EXPANSION_TYPE.EXPANSION,
    dependencies: { 'mock-base': '>=1.0.0' },
    conflicts: { 'mock-flight': 'Cannot use with flight expansion' },
    minPlayers: 2,
    maxPlayers: 4,
    contents: {
      cards: 4,
      traits: 1,
    },
  },

  traits: {
    MOCK_GROUND: {
      type: 'MOCK_GROUND',
      name: 'Mock 地面',
      nameEn: 'Mock Ground',
      foodBonus: 0,
      category: 'special',
    },
  },

  cards: [
    { id: 'CONFLICT_001', frontTrait: 'MOCK_GROUND', backTrait: 'MOCK_FAT', count: 4 },
  ],

  traitHandlers: {
    MOCK_GROUND: {
      traitType: 'MOCK_GROUND',
      canPlace: () => ({ allowed: true }),
      getFoodBonus: () => 0,
    },
  },
};

module.exports = {
  mockBaseExpansion,
  mockFlightExpansion,
  mockConflictExpansion,
};
