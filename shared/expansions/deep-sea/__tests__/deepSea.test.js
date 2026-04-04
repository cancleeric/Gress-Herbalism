/**
 * 深海生態擴充包單元測試
 *
 * 測試所有深海性狀處理器的邏輯
 */

const {
  deepSeaExpansion,
  DEEP_SEA_TRAIT_TYPES,
  DEEP_SEA_TRAIT_DEFINITIONS,
  getAllDeepSeaTraitTypes,
  getDeepSeaTotalCardCount,
  DEEP_SEA_CARDS,
  getTotalCardCount,
  validateCardDefinitions,
  DeepDiveHandler,
  PressureResistanceHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GulperHandler,
  ElectroreceptionHandler,
} = require('../index');

// ========================= 輔助函數 =========================

/**
 * 建立測試用生物
 */
function createCreature(overrides = {}) {
  return {
    id: overrides.id || 'c1',
    name: overrides.name || '測試生物',
    ownerId: overrides.ownerId || 'player1',
    traits: overrides.traits || [],
    food: overrides.food || { red: 0, blue: 0, yellow: 0 },
    foodNeeded: overrides.foodNeeded || 1,
    ...overrides,
  };
}

/**
 * 建立測試用遊戲狀態
 */
function createGameState(overrides = {}) {
  return {
    foodPool: 5,
    players: [],
    ...overrides,
  };
}

// ========================= 性狀定義測試 =========================

describe('深海擴充包性狀定義', () => {
  test('應有 6 種性狀', () => {
    expect(getAllDeepSeaTraitTypes()).toHaveLength(6);
  });

  test('深潛定義正確', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.DEEP_DIVE];
    expect(def.type).toBe('deepDive');
    expect(def.name).toBe('深潛');
    expect(def.expansion).toBe('deep-sea');
    expect(def.category).toBe('defense');
    expect(def.cardCount).toBe(4);
  });

  test('壓抗定義正確', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.PRESSURE_RESISTANCE];
    expect(def.type).toBe('pressureResistance');
    expect(def.name).toBe('壓抗');
    expect(def.category).toBe('defense');
  });

  test('發光定義正確', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE];
    expect(def.type).toBe('bioluminescence');
    expect(def.name).toBe('發光');
    expect(def.category).toBe('feeding');
  });

  test('群游為互動性狀', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.SCHOOLING];
    expect(def.isInteractive).toBe(true);
    expect(def.category).toBe('interactive');
  });

  test('巨口食量+1', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.GULPER];
    expect(def.foodBonus).toBe(1);
    expect(def.category).toBe('carnivore');
  });

  test('電感為特殊性狀', () => {
    const def = DEEP_SEA_TRAIT_DEFINITIONS[DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION];
    expect(def.category).toBe('special');
  });
});

// ========================= 卡牌定義測試 =========================

describe('深海擴充包卡牌定義', () => {
  test('應有 24 張卡牌', () => {
    expect(getTotalCardCount()).toBe(24);
  });

  test('卡牌定義驗證通過', () => {
    const result = validateCardDefinitions();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('每種性狀應有 4 張卡', () => {
    expect(DEEP_SEA_CARDS).toHaveLength(6);
    DEEP_SEA_CARDS.forEach(card => {
      expect(card.count).toBe(4);
    });
  });
});

// ========================= DeepDiveHandler 測試 =========================

describe('DeepDiveHandler（深潛）', () => {
  let handler;

  beforeEach(() => {
    handler = new DeepDiveHandler();
  });

  test('未深潛時可被攻擊', () => {
    const defender = createCreature({ isDeepDiving: false });
    const result = handler.checkDefense({ defender, attacker: createCreature() });
    expect(result.canAttack).toBe(true);
  });

  test('深潛中無法被攻擊', () => {
    const defender = createCreature({ isDeepDiving: true });
    const result = handler.checkDefense({ defender, attacker: createCreature() });
    expect(result.canAttack).toBe(false);
    expect(result.reason).toContain('深潛');
  });

  test('可以使用深潛能力', () => {
    const creature = createCreature({ hasUsedDeepDiveThisTurn: false, isDeepDiving: false });
    const result = handler.canUseAbility({ creature });
    expect(result.canUse).toBe(true);
  });

  test('本回合已使用深潛則無法再使用', () => {
    const creature = createCreature({ hasUsedDeepDiveThisTurn: true });
    const result = handler.canUseAbility({ creature });
    expect(result.canUse).toBe(false);
  });

  test('已在深潛狀態則無法再使用', () => {
    const creature = createCreature({ isDeepDiving: true, hasUsedDeepDiveThisTurn: false });
    const result = handler.canUseAbility({ creature });
    expect(result.canUse).toBe(false);
  });

  test('使用深潛後生物進入深潛狀態', () => {
    const creature = createCreature();
    const gameState = createGameState();
    const result = handler.useAbility({ creature, gameState });
    expect(result.success).toBe(true);
    expect(creature.isDeepDiving).toBe(true);
    expect(creature.hasUsedDeepDiveThisTurn).toBe(true);
  });

  test('回合開始時解除深潛狀態', () => {
    const creature = createCreature({ isDeepDiving: true, hasUsedDeepDiveThisTurn: true });
    const gameState = createGameState();
    handler.onTurnStart({ creature, gameState });
    expect(creature.isDeepDiving).toBe(false);
    expect(creature.hasUsedDeepDiveThisTurn).toBe(false);
  });
});

// ========================= PressureResistanceHandler 測試 =========================

describe('PressureResistanceHandler（壓抗）', () => {
  let handler;

  beforeEach(() => {
    handler = new PressureResistanceHandler();
  });

  test('普通肉食可以攻擊', () => {
    const attacker = createCreature({
      traits: [{ type: 'carnivore' }],
    });
    const result = handler.checkDefense({ attacker, defender: createCreature() });
    expect(result.canAttack).toBe(true);
  });

  test('巨化非肉食可以攻擊', () => {
    const attacker = createCreature({
      traits: [{ type: 'massive' }],
    });
    const result = handler.checkDefense({ attacker, defender: createCreature() });
    expect(result.canAttack).toBe(true);
  });

  test('巨化肉食無法攻擊', () => {
    const attacker = createCreature({
      traits: [{ type: 'carnivore' }, { type: 'massive' }],
    });
    const result = handler.checkDefense({ attacker, defender: createCreature() });
    expect(result.canAttack).toBe(false);
    expect(result.reason).toContain('壓抗');
  });
});

// ========================= BioluminescenceHandler 測試 =========================

describe('BioluminescenceHandler（發光）', () => {
  let handler;

  beforeEach(() => {
    handler = new BioluminescenceHandler();
  });

  test('可以使用發光能力', () => {
    const creature = createCreature({ hasUsedBioluminescenceThisTurn: false });
    const gameState = createGameState({ foodPool: 3 });
    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(true);
  });

  test('本回合已使用則無法再用', () => {
    const creature = createCreature({ hasUsedBioluminescenceThisTurn: true });
    const gameState = createGameState({ foodPool: 3 });
    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
  });

  test('食物池空時無法使用', () => {
    const creature = createCreature({ hasUsedBioluminescenceThisTurn: false });
    const gameState = createGameState({ foodPool: 0 });
    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
  });

  test('使用發光後獲得 1 個紅色食物', () => {
    const creature = createCreature({ hasUsedBioluminescenceThisTurn: false });
    const gameState = createGameState({ foodPool: 3 });
    const result = handler.useAbility({ creature, gameState });
    expect(result.success).toBe(true);
    expect(creature.food.red).toBe(1);
    expect(gameState.foodPool).toBe(2);
    expect(creature.hasUsedBioluminescenceThisTurn).toBe(true);
  });

  test('回合開始時重置發光使用狀態', () => {
    const creature = createCreature({ hasUsedBioluminescenceThisTurn: true });
    const gameState = createGameState();
    handler.onTurnStart({ creature, gameState });
    expect(creature.hasUsedBioluminescenceThisTurn).toBe(false);
  });
});

// ========================= SchoolingHandler 測試 =========================

describe('SchoolingHandler（群游）', () => {
  let handler;

  beforeEach(() => {
    handler = new SchoolingHandler();
  });

  test('無群游保護時可被攻擊', () => {
    const defender = createCreature({ schoolingProtection: 0 });
    const result = handler.checkDefense({ defender, attacker: createCreature() });
    expect(result.canAttack).toBe(true);
  });

  test('有群游保護時無法被攻擊', () => {
    const defender = createCreature({ schoolingProtection: 1 });
    const result = handler.checkDefense({ defender, attacker: createCreature() });
    expect(result.canAttack).toBe(false);
    expect(result.reason).toContain('群游');
  });

  test('進食時連結生物獲得群游保護', () => {
    const creature1 = createCreature({ id: 'c1', traitLinks: { schooling: 'c2' } });
    const creature2 = createCreature({ id: 'c2', schoolingProtection: 0 });
    const gameState = createGameState({
      players: [{ id: 'p1', creatures: [creature1, creature2] }],
    });

    const processedCreatures = new Set();
    handler.onGainFood({ creature: creature1, gameState }, 'red', processedCreatures);

    expect(creature2.schoolingProtection).toBe(1);
  });

  test('階段結束時清除群游保護', () => {
    const creature = createCreature({ schoolingProtection: 2 });
    const gameState = createGameState();
    handler.onPhaseEnd({ creature, gameState });
    expect(creature.schoolingProtection).toBe(0);
  });

  test('群游為互動性狀', () => {
    expect(handler.isInteractive).toBe(true);
  });
});

// ========================= GulperHandler 測試 =========================

describe('GulperHandler（巨口）', () => {
  let handler;

  beforeEach(() => {
    handler = new GulperHandler();
  });

  test('巨口食量加成為 1', () => {
    expect(handler.foodBonus).toBe(1);
  });

  test('靜態方法：生物有巨口時返回 true', () => {
    const attacker = createCreature({
      traits: [{ type: 'gulper' }],
    });
    expect(GulperHandler.hasGulper(attacker)).toBe(true);
  });

  test('靜態方法：生物無巨口時返回 false', () => {
    const attacker = createCreature({ traits: [] });
    expect(GulperHandler.hasGulper(attacker)).toBe(false);
  });
});

// ========================= ElectroreceptionHandler 測試 =========================

describe('ElectroreceptionHandler（電感）', () => {
  let handler;

  beforeEach(() => {
    handler = new ElectroreceptionHandler();
  });

  test('可以使用電感能力', () => {
    const creature = createCreature({ hasUsedElectroreceptionThisTurn: false });
    const result = handler.canUseAbility({ creature });
    expect(result.canUse).toBe(true);
  });

  test('本回合已使用則無法再用', () => {
    const creature = createCreature({ hasUsedElectroreceptionThisTurn: true });
    const result = handler.canUseAbility({ creature });
    expect(result.canUse).toBe(false);
  });

  test('可以取得目標列表（所有生物）', () => {
    const creature = createCreature({ id: 'c1' });
    const target = createCreature({ id: 'c2' });
    const gameState = createGameState({
      players: [
        { id: 'p1', creatures: [creature] },
        { id: 'p2', creatures: [target] },
      ],
    });
    const targets = handler.getAbilityTargets({ gameState });
    expect(targets).toHaveLength(2);
  });

  test('使用電感干擾目標', () => {
    const creature = createCreature({ id: 'c1', hasUsedElectroreceptionThisTurn: false });
    const targetCreature = createCreature({ id: 'c2' });
    const gameState = createGameState({
      players: [
        { id: 'p1', creatures: [creature] },
        { id: 'p2', creatures: [targetCreature] },
      ],
    });

    const result = handler.useAbility(
      { creature, gameState },
      { creatureId: 'c2' }
    );

    expect(result.success).toBe(true);
    expect(targetCreature.electroReceptionBlocked).toBe(true);
    expect(creature.hasUsedElectroreceptionThisTurn).toBe(true);
  });

  test('目標不存在時返回失敗', () => {
    const creature = createCreature({ id: 'c1' });
    const gameState = createGameState({ players: [] });

    const result = handler.useAbility(
      { creature, gameState },
      { creatureId: 'nonexistent' }
    );

    expect(result.success).toBe(false);
  });

  test('回合開始時重置電感和干擾標記', () => {
    const creature = createCreature({
      hasUsedElectroreceptionThisTurn: true,
      electroReceptionBlocked: true,
    });
    const gameState = createGameState();
    handler.onTurnStart({ creature, gameState });
    expect(creature.hasUsedElectroreceptionThisTurn).toBe(false);
    expect(creature.electroReceptionBlocked).toBe(false);
  });
});

// ========================= 擴充包整合測試 =========================

describe('深海擴充包整合測試', () => {
  test('擴充包定義有效', () => {
    expect(deepSeaExpansion.id).toBe('deep-sea');
    expect(deepSeaExpansion.requires).toContain('base');
    expect(deepSeaExpansion.version).toBe('1.0.0');
  });

  test('擴充包包含所有性狀處理器', () => {
    const traitTypes = getAllDeepSeaTraitTypes();
    for (const traitType of traitTypes) {
      expect(deepSeaExpansion.traits[traitType]).toBeDefined();
    }
  });

  test('擴充包驗證通過', () => {
    const result = deepSeaExpansion.validate();
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('建立牌庫包含 24 張卡', () => {
    const deck = deepSeaExpansion.createDeck();
    expect(deck).toHaveLength(24);
  });

  test('牌庫卡牌含 expansionId', () => {
    const deck = deepSeaExpansion.createDeck();
    deck.forEach(card => {
      expect(card.expansionId).toBe('deep-sea');
    });
  });

  test('深海規則正確設定', () => {
    expect(deepSeaExpansion.rules.deepSeaEnabled).toBe(true);
    expect(deepSeaExpansion.rules.foodPoolBonus).toBe(1);
  });

  test('onGameInit 增加食物池', () => {
    const gameState = {
      foodPool: 10,
      players: [{ id: 'p1' }, { id: 'p2' }],
    };
    deepSeaExpansion.onGameInit(gameState);
    expect(gameState.foodPool).toBe(12); // 10 + 2 players
  });
});

// ========================= ExpansionRegistry 整合測試 =========================

describe('深海擴充包與 ExpansionRegistry 整合', () => {
  const { ExpansionRegistry } = require('../../ExpansionRegistry');
  const { baseExpansion } = require('../../base');

  test('可以在 registry 中註冊並啟用深海擴充包', () => {
    const registry = new ExpansionRegistry();

    // 先註冊並啟用 base
    registry.register(baseExpansion);
    registry.enable('base');

    // 再註冊並啟用 deep-sea
    registry.register(deepSeaExpansion);
    registry.enable('deep-sea');

    expect(registry.isEnabled('deep-sea')).toBe(true);
  });

  test('未啟用 base 時無法啟用 deep-sea', () => {
    const registry = new ExpansionRegistry();
    registry.register(deepSeaExpansion);

    expect(() => registry.enable('deep-sea')).toThrow();
  });

  test('啟用後 registry 包含深海性狀處理器', () => {
    const registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.enable('base');
    registry.register(deepSeaExpansion);
    registry.enable('deep-sea');

    expect(registry.getTraitHandler(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE)).toBeDefined();
    expect(registry.getTraitHandler(DEEP_SEA_TRAIT_TYPES.GULPER)).toBeDefined();
  });

  test('啟用後卡牌池包含深海卡牌', () => {
    const registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.enable('base');
    registry.register(deepSeaExpansion);
    registry.enable('deep-sea');

    const cardPool = registry.getCardPool();
    const deepSeaCards = cardPool.filter(c => c.expansionId === 'deep-sea');
    expect(deepSeaCards).toHaveLength(6);
  });

  test('可以停用 deep-sea 擴充包', () => {
    const registry = new ExpansionRegistry();
    registry.register(baseExpansion);
    registry.enable('base');
    registry.register(deepSeaExpansion);
    registry.enable('deep-sea');
    registry.disable('deep-sea');

    expect(registry.isEnabled('deep-sea')).toBe(false);
    expect(registry.getTraitHandler(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE)).toBeUndefined();
  });
});
