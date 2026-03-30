/**
 * 深海生態擴充包性狀處理器測試
 * @module expansions/deepSea/__tests__/handlers.test
 */

const {
  DeepDiveHandler,
  BioluminescenceHandler,
  SchoolingHandler,
  GapingMawHandler,
  ElectroreceptionHandler,
  AbyssalAdaptationHandler,
  DEEP_SEA_TRAIT_HANDLERS,
  createDeepSeaHandler,
} = require('../traits/handlers');

const { DEEP_SEA_TRAIT_TYPES } = require('../traits/definitions');

// ===== 測試輔助函數 =====

function createMockGameState(overrides = {}) {
  return {
    players: [
      { id: 'player1', creatures: [] },
      { id: 'player2', creatures: [] },
    ],
    foodPool: { red: 5, blue: 0 },
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

// ===== handlers/index 匯出測試 =====

describe('DeepSea TraitHandler Index Exports', () => {
  test('should export all 6 deep sea handler classes', () => {
    expect(DeepDiveHandler).toBeDefined();
    expect(BioluminescenceHandler).toBeDefined();
    expect(SchoolingHandler).toBeDefined();
    expect(GapingMawHandler).toBeDefined();
    expect(ElectroreceptionHandler).toBeDefined();
    expect(AbyssalAdaptationHandler).toBeDefined();
  });

  test('DEEP_SEA_TRAIT_HANDLERS should have 6 entries', () => {
    expect(Object.keys(DEEP_SEA_TRAIT_HANDLERS).length).toBe(6);
  });

  test('createDeepSeaHandler should create handler instances', () => {
    const handler = createDeepSeaHandler(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
    expect(handler).toBeInstanceOf(DeepDiveHandler);
    expect(handler.definition.type).toBe(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
  });

  test('createDeepSeaHandler should return null for unknown trait', () => {
    const handler = createDeepSeaHandler('unknown-trait');
    expect(handler).toBeNull();
  });
});

// ===== DeepDiveHandler 測試 =====

describe('DeepDiveHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new DeepDiveHandler();
  });

  test('should have correct definition', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.DEEP_DIVE);
    expect(handler.category).toBe('defense');
    expect(handler.expansion).toBe('deep-sea');
    expect(handler.isInteractive).toBe(false);
    expect(handler.isStackable).toBe(false);
  });

  test('should block non-aquatic attacker', () => {
    const attacker = createMockCreature({ traits: [{ type: 'carnivore' }] });
    const defender = createMockCreature({ traits: [{ type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE }] });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ attacker, defender, gameState });

    expect(result.canAttack).toBe(false);
    expect(result.reason).toContain('深潛');
  });

  test('should allow aquatic attacker', () => {
    const attacker = createMockCreature({
      traits: [{ type: 'carnivore' }, { type: 'aquatic' }],
    });
    const defender = createMockCreature({ traits: [{ type: DEEP_SEA_TRAIT_TYPES.DEEP_DIVE }] });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ attacker, defender, gameState });

    expect(result.canAttack).toBe(true);
  });
});

// ===== BioluminescenceHandler 測試 =====

describe('BioluminescenceHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new BioluminescenceHandler();
  });

  test('should have correct definition', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.BIOLUMINESCENCE);
    expect(handler.category).toBe('special');
    expect(handler.expansion).toBe('deep-sea');
  });

  test('should reset ability on feeding phase start', () => {
    const creature = createMockCreature({ bioluminescenceUsed: true });
    const gameState = createMockGameState();

    handler.onPhaseStart({ creature, gameState }, 'feeding');

    expect(creature.bioluminescenceUsed).toBe(false);
  });

  test('should not reset ability on non-feeding phase start', () => {
    const creature = createMockCreature({ bioluminescenceUsed: true });
    const gameState = createMockGameState();

    handler.onPhaseStart({ creature, gameState }, 'evolution');

    expect(creature.bioluminescenceUsed).toBe(true);
  });

  test('should not allow use when already used this phase', () => {
    const creature = createMockCreature({ bioluminescenceUsed: true });
    const gameState = createMockGameState();

    const result = handler.canUseAbility({ creature, gameState });

    expect(result.canUse).toBe(false);
    expect(result.reason).toContain('已使用');
  });

  test('should not allow use when no valid targets', () => {
    const creature = createMockCreature();
    const gameState = createMockGameState();

    const result = handler.canUseAbility({ creature, gameState });

    expect(result.canUse).toBe(false);
    expect(result.reason).toContain('沒有');
  });

  test('should find targets with camouflage or burrowing', () => {
    const sourceCreature = createMockCreature({ id: 'source' });
    const targetCreature = createMockCreature({
      id: 'target',
      ownerId: 'player2',
      traits: [{ type: 'camouflage' }],
    });
    const gameState = createMockGameState({
      players: [
        { id: 'player1', creatures: [sourceCreature] },
        { id: 'player2', creatures: [targetCreature] },
      ],
    });

    const targets = handler.getAbilityTargets({ creature: sourceCreature, gameState });

    expect(targets.length).toBe(1);
    expect(targets[0].creatureId).toBe('target');
    expect(targets[0].hasCamouflage).toBe(true);
  });

  test('should illuminate target and mark as used', () => {
    const sourceCreature = createMockCreature({ id: 'source' });
    const targetCreature = createMockCreature({
      id: 'target',
      ownerId: 'player2',
      traits: [{ type: 'burrowing' }],
    });
    const gameState = createMockGameState({
      players: [
        { id: 'player1', creatures: [sourceCreature] },
        { id: 'player2', creatures: [targetCreature] },
      ],
    });

    const result = handler.useAbility(
      { creature: sourceCreature, gameState },
      { creatureId: 'target' }
    );

    expect(result.success).toBe(true);
    expect(targetCreature.isIlluminated).toBe(true);
    expect(sourceCreature.bioluminescenceUsed).toBe(true);
    expect(gameState.actionLog.some(log => log.type === 'BIOLUMINESCENCE_USED')).toBe(true);
  });

  test('should clear illumination marks on phase end', () => {
    const creature = createMockCreature({ isIlluminated: true });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature] }],
    });

    handler.onPhaseEnd({ creature, gameState }, 'feeding');

    expect(creature.isIlluminated).toBeUndefined();
  });
});

// ===== SchoolingHandler 測試 =====

describe('SchoolingHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new SchoolingHandler();
  });

  test('should have correct definition', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.SCHOOLING);
    expect(handler.category).toBe('interactive');
    expect(handler.isInteractive).toBe(true);
    expect(handler.expansion).toBe('deep-sea');
  });

  test('should grant blue food to linked creature when red food is gained', () => {
    const creature1 = createMockCreature({ id: 'c1' });
    const creature2 = createMockCreature({ id: 'c2', food: { red: 0, blue: 0, yellow: 0 } });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature1, creature2] }],
    });

    handler.onGainFood(
      { creature: creature1, gameState, linkedCreatureId: 'c2' },
      'red'
    );

    expect(creature2.food.blue).toBe(1);
    expect(gameState.actionLog.some(log => log.type === 'SCHOOLING_TRIGGER')).toBe(true);
  });

  test('should not trigger on blue food', () => {
    const creature1 = createMockCreature({ id: 'c1' });
    const creature2 = createMockCreature({ id: 'c2', food: { red: 0, blue: 0, yellow: 0 } });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature1, creature2] }],
    });

    handler.onGainFood(
      { creature: creature1, gameState, linkedCreatureId: 'c2' },
      'blue'
    );

    expect(creature2.food.blue).toBe(0);
  });

  test('should not trigger without linked creature ID', () => {
    const creature1 = createMockCreature({ id: 'c1' });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature1] }],
    });

    const result = handler.onGainFood(
      { creature: creature1, gameState, linkedCreatureId: null },
      'red'
    );

    expect(result).toBe(gameState);
  });

  test('should not trigger when already processed (no infinite loop)', () => {
    const creature1 = createMockCreature({ id: 'c1' });
    const creature2 = createMockCreature({ id: 'c2', food: { red: 0, blue: 0, yellow: 0 } });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature1, creature2] }],
    });

    const processedCreatures = new Set();
    processedCreatures.add('c1-c2-schooling');

    handler.onGainFood(
      { creature: creature1, gameState, linkedCreatureId: 'c2' },
      'red',
      processedCreatures
    );

    expect(creature2.food.blue).toBe(0);
  });

  test('should establish link on place', () => {
    const creature1 = createMockCreature({ id: 'c1', traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING }] });
    const creature2 = createMockCreature({ id: 'c2' });
    const gameState = createMockGameState();

    handler.onPlace({ creature: creature1, targetCreature: creature2, gameState });

    expect(creature1.traits[0].linkedCreatureId).toBe('c2');
    expect(creature2.linkedSchooling).toContain('c1');
  });

  test('should remove link on remove', () => {
    const creature1 = createMockCreature({
      id: 'c1',
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.SCHOOLING, linkedCreatureId: 'c2' }],
    });
    const creature2 = createMockCreature({ id: 'c2', linkedSchooling: ['c1'] });
    const gameState = createMockGameState({
      players: [{ id: 'player1', creatures: [creature1, creature2] }],
    });

    handler.onRemove({ creature: creature1, gameState });

    expect(creature2.linkedSchooling).not.toContain('c1');
  });
});

// ===== GapingMawHandler 測試 =====

describe('GapingMawHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new GapingMawHandler();
  });

  test('should have correct definition', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.GAPING_MAW);
    expect(handler.category).toBe('carnivore');
    expect(handler.expansion).toBe('deep-sea');
  });

  test('canBypassMassiveDefense should return true', () => {
    expect(handler.canBypassMassiveDefense()).toBe(true);
  });
});

// ===== ElectroreceptionHandler 測試 =====

describe('ElectroreceptionHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ElectroreceptionHandler();
  });

  test('should have correct definition', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.ELECTRORECEPTION);
    expect(handler.category).toBe('special');
    expect(handler.expansion).toBe('deep-sea');
  });

  test('canBypassBurrowingDefense should return true', () => {
    expect(handler.canBypassBurrowingDefense()).toBe(true);
  });
});

// ===== AbyssalAdaptationHandler 測試 =====

describe('AbyssalAdaptationHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new AbyssalAdaptationHandler();
  });

  test('should have correct definition', () => {
    expect(handler.type).toBe(DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION);
    expect(handler.category).toBe('feeding');
    expect(handler.expansion).toBe('deep-sea');
  });

  test('should allow survival when food is sufficient', () => {
    const creature = createMockCreature({
      food: { red: 1, blue: 0, yellow: 0 },
      foodNeeded: 1,
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION }],
    });
    const gameState = createMockGameState();

    const result = handler.checkExtinction({ creature, gameState });

    expect(result.shouldSurvive).toBe(true);
  });

  test('should trigger ability when food is insufficient and ability not used', () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 1,
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION, abyssalUsed: false }],
    });
    const gameState = createMockGameState();

    const result = handler.checkExtinction({ creature, gameState });

    expect(result.shouldSurvive).toBe(true);
    expect(result.reason).toContain('深淵適應');
    expect(creature.traits[0].abyssalUsed).toBe(true);
    expect(gameState.actionLog.some(log => log.type === 'ABYSSAL_ADAPTATION_USED')).toBe(true);
  });

  test('should not survive when ability already used', () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 1,
      traits: [{ type: DEEP_SEA_TRAIT_TYPES.ABYSSAL_ADAPTATION, abyssalUsed: true }],
    });
    const gameState = createMockGameState();

    const result = handler.checkExtinction({ creature, gameState });

    expect(result.shouldSurvive).toBe(false);
  });

  test('should not survive when trait is missing', () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 1,
      traits: [],
    });
    const gameState = createMockGameState();

    const result = handler.checkExtinction({ creature, gameState });

    expect(result.shouldSurvive).toBe(false);
  });
});
