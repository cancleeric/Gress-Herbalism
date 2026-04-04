/**
 * 深海生態擴充包測試
 * @module expansions/deep-sea/__tests__/deepSea.test
 */

const {
  deepSeaExpansion,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaInteractiveTraits,
  getDeepSeaStackableTraits,
  DEEP_SEA_CARDS,
  DEEP_SEA_EXPECTED_TOTAL,
  getTotalDeepSeaCardCount,
  validateDeepSeaCardDefinitions,
} = require('../index');

const {
  DeepDiveHandler,
  ElectricHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  MegamouthHandler,
  AbyssalAdaptationHandler,
  createAllDeepSeaHandlerInstances,
} = require('../traits/handlers');

const {
  applyDeepSeaFoodBonus,
  applyElectricEffect,
  getMegamouthFoodReward,
  hasDeepSeaCreatures,
} = require('../rules');

// ==================== 測試輔助函數 ====================

function createMockGameState(overrides = {}) {
  return {
    players: [
      { id: 'player1', name: '玩家1', creatures: [] },
      { id: 'player2', name: '玩家2', creatures: [] },
    ],
    foodPool: { red: 5, blue: 3 },
    actionLog: [],
    ...overrides,
  };
}

function createMockCreature(overrides = {}) {
  return {
    id: `creature-${Math.random().toString(36).substr(2, 9)}`,
    ownerId: 'player1',
    traits: [],
    food: { red: 0, blue: 0, yellow: 0 },
    foodNeeded: 1,
    isFed: false,
    ...overrides,
  };
}

// ==================== 擴充包定義測試 ====================

describe('深海生態擴充包定義', () => {
  test('擴充包有正確的 id 和名稱', () => {
    expect(deepSeaExpansion.id).toBe('deep-sea');
    expect(deepSeaExpansion.name).toBe('深海生態');
    expect(deepSeaExpansion.version).toBe('1.0.0');
  });

  test('擴充包需要基礎版', () => {
    expect(deepSeaExpansion.requires).toContain('base');
  });

  test('擴充包無不相容設定', () => {
    expect(deepSeaExpansion.incompatible).toHaveLength(0);
  });

  test('擴充包有 6 種性狀處理器', () => {
    const handlerKeys = Object.keys(deepSeaExpansion.traits);
    expect(handlerKeys).toHaveLength(6);
  });

  test('擴充包驗證通過', () => {
    const result = deepSeaExpansion.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ==================== 性狀定義測試 ====================

describe('深海性狀定義', () => {
  test('共 6 種性狀類型', () => {
    const types = getAllDeepSeaTraitTypes();
    expect(types).toHaveLength(6);
  });

  test('群游為互動性狀', () => {
    const interactive = getDeepSeaInteractiveTraits();
    expect(interactive).toContain(DEEP_SEA_TRAIT_TYPES.SCHOOLING);
    expect(interactive).toHaveLength(1);
  });

  test('深淵適應可疊加', () => {
    const stackable = getDeepSeaStackableTraits();
    expect(stackable).toContain(DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION);
    expect(stackable).toHaveLength(1);
  });

  test('巨口與肉食互斥', () => {
    const megamouthDef = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.MEGAMOUTH];
    expect(megamouthDef.incompatible).toContain('carnivore');
  });

  test('深淵適應食量加成為 -1', () => {
    const abyssalDef = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION];
    expect(abyssalDef.foodBonus).toBe(-1);
  });
});

// ==================== 卡牌定義測試 ====================

describe('深海卡牌定義', () => {
  test('卡牌總數為 28', () => {
    expect(getTotalDeepSeaCardCount()).toBe(DEEP_SEA_EXPECTED_TOTAL);
    expect(DEEP_SEA_EXPECTED_TOTAL).toBe(28);
  });

  test('卡牌定義驗證通過', () => {
    const result = validateDeepSeaCardDefinitions();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('所有卡牌有唯一 ID', () => {
    const ids = DEEP_SEA_CARDS.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('所有卡牌有 frontTrait 和 backTrait', () => {
    for (const card of DEEP_SEA_CARDS) {
      expect(card.frontTrait).toBeTruthy();
      expect(card.backTrait).toBeTruthy();
    }
  });

  test('DS_002 為 deepDive/aquatic 組合', () => {
    const card = DEEP_SEA_CARDS.find(c => c.id === 'DS_002');
    expect(card.frontTrait).toBe(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
    expect(card.backTrait).toBe('aquatic');
  });
});

// ==================== 深潛處理器測試 ====================

describe('DeepDiveHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new DeepDiveHandler();
  });

  test('初始化成功', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
    expect(handler.name).toBe('深潛');
    expect(handler.expansion).toBe('deep-sea');
  });

  test('非水生肉食無法攻擊深潛生物', () => {
    const attacker = createMockCreature({ traits: [] });
    const result = handler.checkDefense({ attacker });
    expect(result.canAttack).toBe(false);
    expect(result.reason).toContain('水生');
  });

  test('水生肉食可以攻擊深潛生物', () => {
    const attacker = createMockCreature({
      traits: [{ type: 'aquatic' }],
    });
    const result = handler.checkDefense({ attacker });
    expect(result.canAttack).toBe(true);
  });
});

// ==================== 電擊處理器測試 ====================

describe('ElectricHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ElectricHandler();
  });

  test('初始化成功', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.ELECTRIC);
    expect(handler.name).toBe('電擊');
    expect(handler.expansion).toBe('deep-sea');
  });

  test('電擊不阻止攻擊', () => {
    const attacker = createMockCreature();
    const result = handler.checkDefense({ attacker });
    expect(result.canAttack).toBe(true);
    expect(result.electricEffect).toBe(true);
  });

  test('電擊靜態方法：攻擊者有藍食物時失去 1 個', () => {
    const attacker = createMockCreature({ food: { red: 0, blue: 2, yellow: 0 } });
    const triggered = ElectricHandler.applyElectricEffect(attacker);
    expect(triggered).toBe(true);
    expect(attacker.food.blue).toBe(1);
  });

  test('電擊靜態方法：攻擊者無藍食物時不觸發', () => {
    const attacker = createMockCreature({ food: { red: 0, blue: 0, yellow: 0 } });
    const triggered = ElectricHandler.applyElectricEffect(attacker);
    expect(triggered).toBe(false);
    expect(attacker.food.blue).toBe(0);
  });
});

// ==================== 發光處理器測試 ====================

describe('BioluminescenceHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new BioluminescenceHandler();
  });

  test('初始化成功', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE);
    expect(handler.name).toBe('發光');
    expect(handler.expansion).toBe('deep-sea');
  });

  test('進食時給予另一隻生物藍色食物', () => {
    const creature1 = createMockCreature({ id: 'c1', ownerId: 'player1', food: { red: 1, blue: 0 }, foodNeeded: 1 });
    const creature2 = createMockCreature({ id: 'c2', ownerId: 'player1', food: { red: 0, blue: 0 }, foodNeeded: 1 });

    const gameState = createMockGameState({
      players: [
        { id: 'player1', creatures: [creature1, creature2] },
      ],
      foodPool: { red: 5, blue: 2 },
    });

    // creature1 已吃飽，creature2 未吃飽
    creature1.food.red = 1; // foodNeeded = 1, 吃飽

    const result = handler.onFeed({
      creature: creature1,
      player: { id: 'player1' },
      gameState,
    });

    expect(result.foodPool.blue).toBe(1); // 減少 1
    expect(creature2.food.blue).toBe(1);  // 增加 1
  });

  test('無其他未吃飽生物時不消耗食物池', () => {
    const creature1 = createMockCreature({ id: 'c1', ownerId: 'player1', food: { red: 1, blue: 0 }, foodNeeded: 1 });

    const gameState = createMockGameState({
      players: [
        { id: 'player1', creatures: [creature1] },
      ],
      foodPool: { red: 5, blue: 2 },
    });

    const result = handler.onFeed({
      creature: creature1,
      player: { id: 'player1' },
      gameState,
    });

    expect(result.foodPool.blue).toBe(2); // 未改變
  });
});

// ==================== 群游處理器測試 ====================

describe('SchoolingHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new SchoolingHandler();
  });

  test('初始化成功', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.SCHOOLING);
    expect(handler.name).toBe('群游');
    expect(handler.isInteractive).toBe(true);
    expect(handler.expansion).toBe('deep-sea');
  });

  test('獲得食物時連結生物也獲得藍色食物', () => {
    const creature1 = createMockCreature({
      id: 'c1',
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING, linkedCreatureId: 'c2' }],
    });
    const creature2 = createMockCreature({ id: 'c2', food: { red: 0, blue: 0 } });

    const gameState = createMockGameState({
      players: [
        { id: 'player1', creatures: [creature1, creature2] },
      ],
      foodPool: { red: 5, blue: 3 },
    });

    handler.onGainFood({ creature: creature1, gameState }, 'red', new Set());

    expect(gameState.foodPool.blue).toBe(2); // 減少 1
    expect(creature2.food.blue).toBe(1);      // 增加 1
  });

  test('無連結生物時不觸發', () => {
    const creature1 = createMockCreature({
      id: 'c1',
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING }], // 無 linkedCreatureId
    });

    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature1] }],
      foodPool: { blue: 3 },
    });

    handler.onGainFood({ creature: creature1, gameState }, 'red', new Set());

    expect(gameState.foodPool.blue).toBe(3); // 未改變
  });

  test('避免無限迴圈（processedCreatures）', () => {
    const creature1 = createMockCreature({
      id: 'c1',
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING, linkedCreatureId: 'c2' }],
    });
    const creature2 = createMockCreature({ id: 'c2', food: { red: 0, blue: 0 } });

    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature1, creature2] }],
      foodPool: { blue: 3 },
    });

    const processedCreatures = new Set(['c1_schooling']); // 已處理
    handler.onGainFood({ creature: creature1, gameState }, 'red', processedCreatures);

    expect(gameState.foodPool.blue).toBe(3); // 未改變（迴圈已阻止）
  });
});

// ==================== 巨口處理器測試 ====================

describe('MegamouthHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new MegamouthHandler();
  });

  test('初始化成功', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.MEGAMOUTH);
    expect(handler.name).toBe('巨口');
    expect(handler.foodBonus).toBe(1);
    expect(handler.expansion).toBe('deep-sea');
  });

  test('巨口不能從食物池進食', () => {
    const result = handler.checkCanFeed();
    expect(result.canFeed).toBe(false);
  });

  test('未攻擊時可以發動攻擊', () => {
    const creature = createMockCreature({
      id: 'c1',
      ownerId: 'player1',
      hasAttackedThisTurn: false,
      food: { red: 0, blue: 0 },
      foodNeeded: 2,
    });
    const opponent = createMockCreature({ id: 'c2', ownerId: 'player2' });

    const gameState = createMockGameState({
      players: [
        { id: 'player1', creatures: [creature] },
        { id: 'player2', creatures: [opponent] },
      ],
    });

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(true);
  });

  test('已攻擊時無法再次攻擊', () => {
    const creature = createMockCreature({
      id: 'c1',
      ownerId: 'player1',
      hasAttackedThisTurn: true,
      food: { red: 0, blue: 0 },
      foodNeeded: 2,
    });

    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature] }],
    });

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
    expect(result.reason).toContain('已經攻擊過');
  });

  test('攻擊意圖包含 foodReward: 3', () => {
    const creature = createMockCreature({ id: 'c1', ownerId: 'player1' });
    const target = { creatureId: 'c2' };
    const gameState = createMockGameState();

    const result = handler.useAbility({ creature, gameState }, target);
    expect(result.success).toBe(true);
    expect(result.attackIntent.foodReward).toBe(3);
  });

  test('回合開始重置攻擊狀態', () => {
    const creature = createMockCreature({ hasAttackedThisTurn: true });
    const gameState = createMockGameState();

    handler.onTurnStart({ creature, gameState });
    expect(creature.hasAttackedThisTurn).toBe(false);
  });
});

// ==================== 深淵適應處理器測試 ====================

describe('AbyssalAdaptationHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new AbyssalAdaptationHandler();
  });

  test('初始化成功', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION);
    expect(handler.name).toBe('深淵適應');
    expect(handler.isStackable).toBe(true);
    expect(handler.expansion).toBe('deep-sea');
  });

  test('放置時減少食量需求', () => {
    const creature = createMockCreature({ foodNeeded: 3 });
    const gameState = createMockGameState();

    handler.onPlace({ creature, gameState });
    expect(creature.foodNeeded).toBe(2);
  });

  test('食量需求最低為 1', () => {
    const creature = createMockCreature({ foodNeeded: 1 });
    const gameState = createMockGameState();

    handler.onPlace({ creature, gameState });
    expect(creature.foodNeeded).toBe(1); // 不低於 1
  });

  test('移除時恢復食量需求', () => {
    const creature = createMockCreature({ foodNeeded: 2 });
    const gameState = createMockGameState();

    handler.onRemove({ creature, gameState });
    expect(creature.foodNeeded).toBe(3);
  });

  test('可疊加：兩張深淵適應累積效果', () => {
    const creature = createMockCreature({ foodNeeded: 4 });
    const gameState = createMockGameState();

    handler.onPlace({ creature, gameState });
    handler.onPlace({ creature, gameState });
    expect(creature.foodNeeded).toBe(2);
  });

  test('計分加成為 0（不影響計分）', () => {
    expect(handler.getScoreBonus()).toBe(0);
  });
});

// ==================== 規則測試 ====================

describe('深海生態規則', () => {
  test('hasDeepSeaCreatures：有深潛生物時返回 true', () => {
    const creature = createMockCreature({
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE }],
    });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature] }],
    });

    expect(hasDeepSeaCreatures(gameState)).toBe(true);
  });

  test('hasDeepSeaCreatures：無深海生物時返回 false', () => {
    const creature = createMockCreature({ traits: [{ type: 'camouflage' }] });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature] }],
    });

    expect(hasDeepSeaCreatures(gameState)).toBe(false);
  });

  test('applyDeepSeaFoodBonus：有深海生物時補充 1 個藍色食物', () => {
    const creature = createMockCreature({
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE }],
    });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature] }],
      foodPool: { red: 5, blue: 2 },
    });

    applyDeepSeaFoodBonus(gameState);
    expect(gameState.foodPool.blue).toBe(3);
  });

  test('applyDeepSeaFoodBonus：無深海生物時不補充', () => {
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [] }],
      foodPool: { red: 5, blue: 2 },
    });

    applyDeepSeaFoodBonus(gameState);
    expect(gameState.foodPool.blue).toBe(2);
  });

  test('applyElectricEffect：目標有電擊時攻擊者失去藍食物', () => {
    const attacker = createMockCreature({ food: { red: 0, blue: 2, yellow: 0 } });
    const defender = createMockCreature({
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.ELECTRIC }],
    });

    const result = applyElectricEffect(attacker, defender);
    expect(result).toBe(true);
    expect(attacker.food.blue).toBe(1);
  });

  test('applyElectricEffect：目標無電擊時不觸發', () => {
    const attacker = createMockCreature({ food: { red: 0, blue: 2, yellow: 0 } });
    const defender = createMockCreature({ traits: [] });

    const result = applyElectricEffect(attacker, defender);
    expect(result).toBe(false);
    expect(attacker.food.blue).toBe(2);
  });

  test('getMegamouthFoodReward：攻擊者有巨口時返回 3', () => {
    const attacker = createMockCreature({
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.MEGAMOUTH }],
    });

    expect(getMegamouthFoodReward(attacker)).toBe(3);
  });

  test('getMegamouthFoodReward：攻擊者無巨口時返回 null', () => {
    const attacker = createMockCreature({ traits: [{ type: 'carnivore' }] });
    expect(getMegamouthFoodReward(attacker)).toBeNull();
  });
});

// ==================== 與 ExpansionRegistry 整合測試 ====================

describe('深海擴充包與 ExpansionRegistry 整合', () => {
  const { ExpansionRegistry } = require('../../ExpansionRegistry');
  const { baseExpansion } = require('../../base');

  test('可以將深海擴充包註冊到 Registry', () => {
    const registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.register(deepSeaExpansion);

    expect(registry.getExpansion('deep-sea')).toBeDefined();
  });

  test('啟用深海擴充包後性狀處理器加入 Registry', () => {
    const registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.register(deepSeaExpansion);
    registry.enable('base');
    registry.enable('deep-sea');

    expect(registry.getTraitHandler(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE)).toBeDefined();
    expect(registry.getTraitHandler(DEEP_SEA_TRAIT_TYPES.MEGAMOUTH)).toBeDefined();
    expect(registry.getTraitHandler(DEEP_SEA_TRAIT_TYPES.ELECTRIC)).toBeDefined();
  });

  test('啟用深海擴充包後卡牌池包含深海卡牌', () => {
    const registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.register(deepSeaExpansion);
    registry.enable('base');
    registry.enable('deep-sea');

    const pool = registry.getCardPool();
    const deepSeaCard = pool.find(c => c.frontTrait === DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
    expect(deepSeaCard).toBeDefined();
    expect(deepSeaCard.expansionId).toBe('deep-sea');
  });

  test('無基礎版時無法啟用深海擴充包', () => {
    const registry = new ExpansionRegistry();
    registry.register(deepSeaExpansion);

    expect(() => registry.enable('deep-sea')).toThrow();
  });

  test('停用深海擴充包後移除深海性狀處理器', () => {
    const registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.register(deepSeaExpansion);
    registry.enable('base');
    registry.enable('deep-sea');
    registry.disable('deep-sea');

    expect(registry.getTraitHandler(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE)).toBeUndefined();
  });

  test('createAllDeepSeaHandlerInstances 建立 6 個處理器', () => {
    const instances = createAllDeepSeaHandlerInstances();
    expect(Object.keys(instances)).toHaveLength(6);
  });
});
