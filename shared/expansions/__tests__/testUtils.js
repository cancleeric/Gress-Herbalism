/**
 * 擴充包測試工具函式
 *
 * 提供建立 Mock 物件和測試輔助函數
 *
 * @module expansions/__tests__/testUtils
 */

const { EXPANSION_TYPE } = require('../manifest');

/**
 * 建立 Mock 遊戲狀態
 * @param {Object} overrides - 覆蓋的屬性
 * @returns {Object} Mock 遊戲狀態
 */
function createMockGameState(overrides = {}) {
  return {
    id: 'test-game',
    config: {
      expansions: ['base'],
      variants: {},
      timeouts: {},
      settings: {},
    },
    status: 'playing',
    round: 1,
    currentPhase: 'feeding',
    currentPlayerIndex: 0,
    turnOrder: ['player1', 'player2'],
    players: {
      player1: createMockPlayer('player1'),
      player2: createMockPlayer('player2'),
    },
    deck: [],
    discardPile: [],
    foodPool: 5,
    eventEmitter: createMockEventEmitter(),
    effectQueue: createMockEffectQueue(),
    ...overrides,
  };
}

/**
 * 建立 Mock 玩家
 * @param {string} playerId - 玩家 ID
 * @param {Object} overrides - 覆蓋的屬性
 * @returns {Object} Mock 玩家
 */
function createMockPlayer(playerId, overrides = {}) {
  return {
    id: playerId,
    name: `Player ${playerId}`,
    hand: [],
    creatures: [],
    graveyard: [],
    passed: false,
    connected: true,
    lastAction: Date.now(),
    ...overrides,
  };
}

/**
 * 建立 Mock 生物
 * @param {string} creatureId - 生物 ID
 * @param {string} ownerId - 擁有者 ID
 * @param {Object} overrides - 覆蓋的屬性
 * @returns {Object} Mock 生物
 */
function createMockCreature(creatureId, ownerId, overrides = {}) {
  return {
    id: creatureId,
    ownerId,
    traits: [],
    food: 0,
    maxFood: 1,
    fat: 0,
    ...overrides,
  };
}

/**
 * 為玩家添加生物
 * @param {Object} gameState - 遊戲狀態
 * @param {string} playerId - 玩家 ID
 * @param {Object} creature - 生物
 * @returns {Object} 添加的生物
 */
function addCreatureToPlayer(gameState, playerId, creature) {
  const player = gameState.players[playerId];
  if (!player) throw new Error(`Player ${playerId} not found`);
  player.creatures.push(creature);
  return creature;
}

/**
 * 為生物添加性狀
 * @param {Object} creature - 生物
 * @param {string} traitType - 性狀類型
 * @param {Object} options - 選項
 * @returns {Object} 添加的性狀
 */
function addTraitToCreature(creature, traitType, options = {}) {
  const trait = {
    type: traitType,
    ...options,
  };
  creature.traits.push(trait);

  // 更新食量
  if (options.foodBonus) {
    creature.maxFood += options.foodBonus;
  }

  return trait;
}

/**
 * 建立 Mock 卡牌
 * @param {string} cardId - 卡牌 ID
 * @param {string} frontTrait - 正面性狀
 * @param {string} backTrait - 背面性狀
 * @returns {Object} Mock 卡牌
 */
function createMockCard(cardId, frontTrait, backTrait) {
  return {
    id: cardId,
    instanceId: `${cardId}_${Date.now()}`,
    frontTrait,
    backTrait,
    expansion: 'base',
    selectedSide: null,
    selectSide(side) {
      this.selectedSide = side;
      return this;
    },
    getSelectedTrait() {
      if (!this.selectedSide) return null;
      return this.selectedSide === 'front' ? this.frontTrait : this.backTrait;
    },
  };
}

/**
 * 建立 Mock 事件發射器
 * @returns {Object} Mock 事件發射器
 */
function createMockEventEmitter() {
  return {
    emit: jest.fn().mockResolvedValue([]),
    emitSync: jest.fn().mockReturnValue([]),
    on: jest.fn().mockReturnValue(() => {}),
    off: jest.fn(),
    once: jest.fn().mockReturnValue(() => {}),
    getHistory: jest.fn().mockReturnValue([]),
  };
}

/**
 * 建立 Mock 效果佇列
 * @returns {Object} Mock 效果佇列
 */
function createMockEffectQueue() {
  return {
    enqueue: jest.fn(),
    enqueueBatch: jest.fn(),
    resolveAll: jest.fn().mockReturnValue([]),
    resolveNext: jest.fn().mockReturnValue(null),
    cancel: jest.fn().mockReturnValue(true),
    isEmpty: jest.fn().mockReturnValue(true),
    length: 0,
  };
}

/**
 * 建立 Mock 擴充包
 * @param {string} id - 擴充包 ID
 * @param {Object} overrides - 覆蓋的屬性
 * @returns {Object} Mock 擴充包
 */
function createMockExpansion(id, overrides = {}) {
  return {
    manifest: {
      id,
      name: `Mock ${id}`,
      nameEn: `Mock ${id}`,
      version: '1.0.0',
      type: EXPANSION_TYPE.EXPANSION,
      dependencies: {},
      conflicts: {},
      minPlayers: 2,
      maxPlayers: 4,
      ...overrides.manifest,
    },
    traits: overrides.traits || {},
    cards: overrides.cards || [],
    traitHandlers: overrides.traitHandlers || {},
    createDeck: jest.fn().mockReturnValue([]),
    ...overrides,
  };
}

/**
 * 建立 Mock TraitHandler
 * @param {string} traitType - 性狀類型
 * @param {Object} overrides - 覆蓋的屬性
 * @returns {Object} Mock TraitHandler
 */
function createMockTraitHandler(traitType, overrides = {}) {
  return {
    traitType,
    canPlace: jest.fn().mockReturnValue({ allowed: true }),
    onPlace: jest.fn(),
    checkDefense: jest.fn().mockReturnValue({ blocked: false }),
    getDefenseResponse: jest.fn().mockReturnValue(null),
    onFeed: jest.fn(),
    useAbility: jest.fn(),
    onRoundStart: jest.fn(),
    onRoundEnd: jest.fn(),
    getFoodBonus: jest.fn().mockReturnValue(0),
    getDefinition: jest.fn().mockReturnValue({ type: traitType, name: traitType }),
    ...overrides,
  };
}

/**
 * 設定遊戲進入特定階段
 * @param {Object} gameState - 遊戲狀態
 * @param {string} phase - 階段
 * @returns {Object} 遊戲狀態
 */
function setGamePhase(gameState, phase) {
  gameState.currentPhase = phase;
  return gameState;
}

/**
 * 模擬進食行動
 * @param {Object} gameState - 遊戲狀態
 * @param {string} creatureId - 生物 ID
 * @param {number} amount - 數量
 * @returns {Object} 結果
 */
function simulateFeed(gameState, creatureId, amount = 1) {
  for (const player of Object.values(gameState.players)) {
    const creature = player.creatures.find(c => c.id === creatureId);
    if (creature) {
      const available = creature.maxFood - creature.food;
      const gained = Math.min(amount, available);
      creature.food += gained;
      gameState.foodPool -= gained;
      return { creature, gained };
    }
  }
  throw new Error(`Creature ${creatureId} not found`);
}

/**
 * 測試斷言輔助
 */
const assertHelpers = {
  /**
   * 斷言生物存活
   * @param {Object} gameState - 遊戲狀態
   * @param {string} creatureId - 生物 ID
   * @returns {boolean}
   */
  assertCreatureAlive(gameState, creatureId) {
    for (const player of Object.values(gameState.players)) {
      if (player.creatures.some(c => c.id === creatureId)) {
        return true;
      }
    }
    throw new Error(`Expected creature ${creatureId} to be alive`);
  },

  /**
   * 斷言生物死亡
   * @param {Object} gameState - 遊戲狀態
   * @param {string} creatureId - 生物 ID
   * @returns {boolean}
   */
  assertCreatureDead(gameState, creatureId) {
    for (const player of Object.values(gameState.players)) {
      if (player.graveyard.some(c => c.id === creatureId)) {
        return true;
      }
    }
    throw new Error(`Expected creature ${creatureId} to be dead`);
  },

  /**
   * 斷言生物有指定性狀
   * @param {Object} gameState - 遊戲狀態
   * @param {string} creatureId - 生物 ID
   * @param {string} traitType - 性狀類型
   * @returns {boolean}
   */
  assertCreatureHasTrait(gameState, creatureId, traitType) {
    for (const player of Object.values(gameState.players)) {
      const creature = player.creatures.find(c => c.id === creatureId);
      if (creature && creature.traits.some(t => t.type === traitType)) {
        return true;
      }
    }
    throw new Error(`Expected creature ${creatureId} to have trait ${traitType}`);
  },

  /**
   * 斷言食物池數量
   * @param {Object} gameState - 遊戲狀態
   * @param {number} expectedAmount - 預期數量
   * @returns {boolean}
   */
  assertFoodPool(gameState, expectedAmount) {
    if (gameState.foodPool !== expectedAmount) {
      throw new Error(`Expected food pool ${expectedAmount}, got ${gameState.foodPool}`);
    }
    return true;
  },
};

module.exports = {
  // 建立函數
  createMockGameState,
  createMockPlayer,
  createMockCreature,
  createMockCard,
  createMockEventEmitter,
  createMockEffectQueue,
  createMockExpansion,
  createMockTraitHandler,

  // 操作函數
  addCreatureToPlayer,
  addTraitToCreature,
  setGamePhase,
  simulateFeed,

  // 斷言輔助
  assertHelpers,
};
