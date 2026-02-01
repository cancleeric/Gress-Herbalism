/**
 * 基礎擴充包性狀處理器測試
 * @module expansions/base/traits/handlers/__tests__/handlers.test
 */

const {
  CarnivoreHandler,
  ScavengerHandler,
  SharpVisionHandler,
  CamouflageHandler,
  BurrowingHandler,
  PoisonousHandler,
  AquaticHandler,
  AgileHandler,
  MassiveHandler,
  TailLossHandler,
  MimicryHandler,
  FatTissueHandler,
  HibernationHandler,
  ParasiteHandler,
  RobberyHandler,
  CommunicationHandler,
  CooperationHandler,
  SymbiosisHandler,
  TramplingHandler,
  TRAIT_HANDLERS,
  createHandler,
  getAllHandlerClasses,
} = require('../index');

const { TRAIT_TYPES, TRAIT_DEFINITIONS } = require('../../definitions');

// 測試輔助函數
function createMockGameState(overrides = {}) {
  return {
    players: [
      {
        id: 'player1',
        creatures: [],
      },
      {
        id: 'player2',
        creatures: [],
      },
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

describe('TraitHandler Index Exports', () => {
  test('should export all 19 handler classes', () => {
    expect(CarnivoreHandler).toBeDefined();
    expect(ScavengerHandler).toBeDefined();
    expect(SharpVisionHandler).toBeDefined();
    expect(CamouflageHandler).toBeDefined();
    expect(BurrowingHandler).toBeDefined();
    expect(PoisonousHandler).toBeDefined();
    expect(AquaticHandler).toBeDefined();
    expect(AgileHandler).toBeDefined();
    expect(MassiveHandler).toBeDefined();
    expect(TailLossHandler).toBeDefined();
    expect(MimicryHandler).toBeDefined();
    expect(FatTissueHandler).toBeDefined();
    expect(HibernationHandler).toBeDefined();
    expect(ParasiteHandler).toBeDefined();
    expect(RobberyHandler).toBeDefined();
    expect(CommunicationHandler).toBeDefined();
    expect(CooperationHandler).toBeDefined();
    expect(SymbiosisHandler).toBeDefined();
    expect(TramplingHandler).toBeDefined();
  });

  test('TRAIT_HANDLERS should have 19 entries', () => {
    expect(Object.keys(TRAIT_HANDLERS).length).toBe(19);
  });

  test('createHandler should create handler instances', () => {
    const carnivoreHandler = createHandler(TRAIT_TYPES.CARNIVORE);
    expect(carnivoreHandler).toBeInstanceOf(CarnivoreHandler);
    expect(carnivoreHandler.definition.type).toBe(TRAIT_TYPES.CARNIVORE);
  });

  test('createHandler should return null for unknown trait', () => {
    const handler = createHandler('unknown');
    expect(handler).toBeNull();
  });

  test('getAllHandlerClasses should return all handler classes', () => {
    const classes = getAllHandlerClasses();
    expect(Object.keys(classes).length).toBe(19);
  });
});

describe('CarnivoreHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new CarnivoreHandler();
  });

  test('should have correct definition', () => {
    expect(handler.definition.type).toBe(TRAIT_TYPES.CARNIVORE);
    expect(handler.definition.foodBonus).toBe(1);
  });

  test('checkCanFeed should return false for carnivore', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.CARNIVORE }],
    });
    const gameState = createMockGameState();

    const result = handler.checkCanFeed({ creature, gameState });
    expect(result.canFeed).toBe(false);
    expect(result.reason).toContain('攻擊');
  });

  test('canUseAbility should return false if already attacked', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.CARNIVORE }],
      hasAttackedThisTurn: true,
    });
    const gameState = createMockGameState();

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
    expect(result.reason).toContain('已經攻擊');
  });

  test('getAbilityTargets should return valid targets', () => {
    const attacker = createMockCreature({
      id: 'attacker-1',
      traits: [{ type: TRAIT_TYPES.CARNIVORE }],
    });
    const target = createMockCreature({
      id: 'target-1',
      ownerId: 'player2',
    });
    const gameState = createMockGameState();
    gameState.players[1].creatures = [target];

    const targets = handler.getAbilityTargets({ creature: attacker, gameState });
    expect(targets.length).toBe(1);
    expect(targets[0].creatureId).toBe('target-1');
  });
});

describe('ScavengerHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ScavengerHandler();
  });

  test('should have correct definition', () => {
    expect(handler.definition.type).toBe(TRAIT_TYPES.SCAVENGER);
  });

  test('onOtherExtinct should give blue food when attacker is carnivore', () => {
    const scavenger = createMockCreature({
      traits: [{ type: TRAIT_TYPES.SCAVENGER }],
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const extinctCreature = createMockCreature({ ownerId: 'player2' });
    const attacker = createMockCreature({
      traits: [{ type: TRAIT_TYPES.CARNIVORE }],
    });
    const gameState = createMockGameState();

    handler.onOtherExtinct(
      { creature: scavenger, gameState },
      extinctCreature,
      attacker
    );

    expect(scavenger.food.blue).toBe(1);
  });

  test('onOtherExtinct should not trigger if attacker is not carnivore', () => {
    const scavenger = createMockCreature({
      traits: [{ type: TRAIT_TYPES.SCAVENGER }],
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const extinctCreature = createMockCreature({ ownerId: 'player2' });
    const attacker = createMockCreature({ traits: [] });
    const gameState = createMockGameState();

    handler.onOtherExtinct(
      { creature: scavenger, gameState },
      extinctCreature,
      attacker
    );

    expect(scavenger.food.blue).toBe(0);
  });
});

describe('SharpVisionHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new SharpVisionHandler();
  });

  test('should have correct definition', () => {
    expect(handler.definition.type).toBe(TRAIT_TYPES.SHARP_VISION);
  });

  test('should be a marker trait with no special methods', () => {
    // SharpVision's effect is checked in CamouflageHandler
    expect(handler.checkDefense({ defender: {}, attacker: {}, gameState: {} }))
      .toEqual({ canAttack: true, reason: '' });
  });
});

describe('CamouflageHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new CamouflageHandler();
  });

  test('checkDefense should block attacks from non-sharp-vision', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.CAMOUFLAGE }],
    });
    const attacker = createMockCreature({ traits: [] });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(false);
    expect(result.reason).toContain('偽裝');
  });

  test('checkDefense should allow attacks from sharp-vision', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.CAMOUFLAGE }],
    });
    const attacker = createMockCreature({
      traits: [{ type: TRAIT_TYPES.SHARP_VISION }],
    });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(true);
  });
});

describe('BurrowingHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new BurrowingHandler();
  });

  test('checkDefense should block attacks when fed', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.BURROWING }],
      food: { red: 1, blue: 0, yellow: 0 },
      foodNeeded: 1,
    });
    const attacker = createMockCreature();
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(false);
    expect(result.reason).toContain('穴居');
  });

  test('checkDefense should allow attacks when not fed', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.BURROWING }],
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 1,
    });
    const attacker = createMockCreature();
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(true);
  });
});

describe('PoisonousHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new PoisonousHandler();
  });

  test('onExtinct should mark attacker as poisoned', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.POISONOUS }],
    });
    const attacker = createMockCreature();
    const gameState = createMockGameState();

    handler.onExtinct({ creature: defender, gameState }, attacker);
    expect(attacker.isPoisoned).toBe(true);
  });

  test('onExtinct should not fail without attacker', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.POISONOUS }],
    });
    const gameState = createMockGameState();

    const result = handler.onExtinct({ creature: defender, gameState }, null);
    expect(result).toBe(gameState);
  });
});

describe('AquaticHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new AquaticHandler();
  });

  test('checkDefense should block non-aquatic attackers', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.AQUATIC }],
    });
    const attacker = createMockCreature({ traits: [] });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(false);
  });

  test('checkDefense should allow aquatic attackers', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.AQUATIC }],
    });
    const attacker = createMockCreature({
      traits: [{ type: TRAIT_TYPES.AQUATIC }],
    });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(true);
  });
});

describe('AgileHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new AgileHandler();
  });

  test('getDefenseResponse should return dice roll option', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.AGILE }],
    });
    const gameState = createMockGameState();

    const result = handler.getDefenseResponse({ defender, gameState });
    expect(result.canRespond).toBe(true);
    expect(result.responseType).toBe('DICE_ROLL');
  });

  test('handleDefenseResponse should cancel attack on high roll', () => {
    const defender = createMockCreature();
    const gameState = createMockGameState();

    const result = handler.handleDefenseResponse(
      { defender, gameState },
      { diceResult: 5 }
    );
    expect(result.attackCancelled).toBe(true);
  });

  test('handleDefenseResponse should not cancel attack on low roll', () => {
    const defender = createMockCreature();
    const gameState = createMockGameState();

    const result = handler.handleDefenseResponse(
      { defender, gameState },
      { diceResult: 2 }
    );
    expect(result.attackCancelled).toBe(false);
  });
});

describe('MassiveHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new MassiveHandler();
  });

  test('should have correct food bonus', () => {
    expect(handler.definition.foodBonus).toBe(1);
  });

  test('checkDefense should block non-massive attackers', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.MASSIVE }],
    });
    const attacker = createMockCreature({ traits: [] });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(false);
  });

  test('checkDefense should allow massive attackers', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.MASSIVE }],
    });
    const attacker = createMockCreature({
      traits: [{ type: TRAIT_TYPES.MASSIVE }],
    });
    const gameState = createMockGameState();

    const result = handler.checkDefense({ defender, attacker, gameState });
    expect(result.canAttack).toBe(true);
  });
});

describe('TailLossHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new TailLossHandler();
  });

  test('getDefenseResponse should return select trait option when has other traits', () => {
    const defender = createMockCreature({
      traits: [
        { type: TRAIT_TYPES.TAIL_LOSS, id: 'trait-1' },
        { type: TRAIT_TYPES.CAMOUFLAGE, id: 'trait-2' },
      ],
    });
    const gameState = createMockGameState();

    const result = handler.getDefenseResponse({ defender, gameState });
    expect(result.canRespond).toBe(true);
    expect(result.responseType).toBe('SELECT_TRAIT');
  });

  test('getDefenseResponse should not offer option when no other traits', () => {
    const defender = createMockCreature({
      traits: [{ type: TRAIT_TYPES.TAIL_LOSS, id: 'trait-1' }],
    });
    const gameState = createMockGameState();

    const result = handler.getDefenseResponse({ defender, gameState });
    expect(result.canRespond).toBe(false);
  });

  test('handleDefenseResponse should remove trait and give attacker food', () => {
    const defender = createMockCreature({
      traits: [
        { type: TRAIT_TYPES.TAIL_LOSS, id: 'trait-1' },
        { type: TRAIT_TYPES.CAMOUFLAGE, id: 'trait-2' },
      ],
    });
    const attacker = createMockCreature({
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const gameState = createMockGameState();

    const result = handler.handleDefenseResponse(
      { defender, attacker, gameState },
      { selectedTraitId: 'trait-2' }
    );

    expect(result.attackCancelled).toBe(true);
    expect(defender.traits.length).toBe(1);
    expect(attacker.food.blue).toBe(1);
  });
});

describe('MimicryHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new MimicryHandler();
  });

  test('getDefenseResponse should offer redirect when valid targets exist', () => {
    const defender = createMockCreature({
      id: 'defender-1',
      ownerId: 'player1',
      traits: [{ type: TRAIT_TYPES.MIMICRY }],
    });
    const validTarget = createMockCreature({
      id: 'target-1',
      ownerId: 'player1',
    });
    const gameState = createMockGameState();
    gameState.players[0].creatures = [defender, validTarget];

    const result = handler.getDefenseResponse({ defender, gameState });
    expect(result.canRespond).toBe(true);
    expect(result.responseType).toBe('SELECT_CREATURE');
  });

  test('getDefenseResponse should not offer when already used', () => {
    const defender = createMockCreature({
      id: 'defender-1',
      ownerId: 'player1',
      traits: [{ type: TRAIT_TYPES.MIMICRY }],
      mimicryUsedThisTurn: true,
    });
    const gameState = createMockGameState();

    const result = handler.getDefenseResponse({ defender, gameState });
    expect(result.canRespond).toBe(false);
  });
});

describe('FatTissueHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new FatTissueHandler();
  });

  test('should be stackable', () => {
    expect(handler.definition.isStackable).toBe(true);
  });

  test('canUseAbility should return true when has fat and not fed', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.FAT_TISSUE }],
      food: { red: 0, blue: 0, yellow: 1 },
      foodNeeded: 1,
    });
    const gameState = createMockGameState();

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(true);
  });

  test('canUseAbility should return false when no fat', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.FAT_TISSUE }],
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const gameState = createMockGameState();

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
  });

  test('useAbility should convert fat to blue food', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.FAT_TISSUE }],
      food: { red: 0, blue: 0, yellow: 2 },
    });
    const gameState = createMockGameState();

    const result = handler.useAbility({ creature, gameState });
    expect(result.success).toBe(true);
    expect(creature.food.yellow).toBe(1);
    expect(creature.food.blue).toBe(1);
  });

  test('checkExtinction should allow survival with fat', () => {
    const creature = createMockCreature({
      food: { red: 0, blue: 0, yellow: 1 },
      foodNeeded: 1,
    });
    const gameState = createMockGameState();

    const result = handler.checkExtinction({ creature, gameState });
    expect(result.shouldSurvive).toBe(true);
  });
});

describe('HibernationHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new HibernationHandler();
  });

  test('canUseAbility should return true when not used', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.HIBERNATION }],
    });
    const gameState = createMockGameState();

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(true);
  });

  test('canUseAbility should return false in last round', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.HIBERNATION }],
    });
    const gameState = createMockGameState({ isLastRound: true });

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
  });

  test('useAbility should mark as hibernating', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.HIBERNATION }],
    });
    const gameState = createMockGameState();

    const result = handler.useAbility({ creature, gameState });
    expect(result.success).toBe(true);
    expect(creature.isHibernating).toBe(true);
  });

  test('checkExtinction should prevent extinction when hibernating', () => {
    const creature = createMockCreature({
      isHibernating: true,
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const gameState = createMockGameState();

    const result = handler.checkExtinction({ creature, gameState });
    expect(result.shouldSurvive).toBe(true);
  });

  test('checkCanFeed should block feeding when hibernating', () => {
    const creature = createMockCreature({
      isHibernating: true,
    });
    const gameState = createMockGameState();

    const result = handler.checkCanFeed({ creature, gameState });
    expect(result.canFeed).toBe(false);
  });
});

describe('ParasiteHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new ParasiteHandler();
  });

  test('should have correct food bonus', () => {
    expect(handler.definition.foodBonus).toBe(2);
  });

  test('canPlace should allow placement on enemy creatures', () => {
    const creature = createMockCreature({ ownerId: 'player2' });
    const player = { id: 'player1' };
    const gameState = createMockGameState();

    const result = handler.canPlace({ creature, player, gameState });
    expect(result.valid).toBe(true);
  });

  test('canPlace should block placement on own creatures', () => {
    const creature = createMockCreature({ ownerId: 'player1' });
    const player = { id: 'player1' };
    const gameState = createMockGameState();

    const result = handler.canPlace({ creature, player, gameState });
    expect(result.valid).toBe(false);
  });

  test('onPlace should increase food needed', () => {
    const creature = createMockCreature({ foodNeeded: 1 });
    const gameState = createMockGameState();

    handler.onPlace({ creature, gameState });
    expect(creature.foodNeeded).toBe(3); // 1 + 2 bonus
  });
});

describe('RobberyHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new RobberyHandler();
  });

  test('canUseAbility should return false if already used', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.ROBBERY }],
      robberyUsedThisPhase: true,
    });
    const gameState = createMockGameState();

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
  });

  test('getAbilityTargets should find unfed creatures with food', () => {
    const creature = createMockCreature({
      id: 'thief',
      traits: [{ type: TRAIT_TYPES.ROBBERY }],
    });
    const target = createMockCreature({
      id: 'victim',
      ownerId: 'player2',
      food: { red: 1, blue: 0, yellow: 0 },
      foodNeeded: 2,
    });
    const gameState = createMockGameState();
    gameState.players[1].creatures = [target];

    const targets = handler.getAbilityTargets({ creature, gameState });
    expect(targets.length).toBe(1);
    expect(targets[0].creatureId).toBe('victim');
  });

  test('useAbility should steal food', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.ROBBERY }],
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const target = createMockCreature({
      id: 'victim',
      ownerId: 'player2',
      food: { red: 1, blue: 0, yellow: 0 },
    });
    const gameState = createMockGameState();
    gameState.players[1].creatures = [target];

    const result = handler.useAbility(
      { creature, gameState },
      { creatureId: 'victim' }
    );

    expect(result.success).toBe(true);
    expect(creature.food.blue).toBe(1);
    expect(target.food.red).toBe(0);
  });
});

describe('CommunicationHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new CommunicationHandler();
  });

  test('should be interactive trait', () => {
    expect(handler.definition.isInteractive).toBe(true);
  });

  test('onGainFood should trigger for linked creature', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.COMMUNICATION }],
    });
    const linkedCreature = createMockCreature({
      id: 'linked-1',
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const gameState = createMockGameState({
      foodPool: { red: 5, blue: 0 },
    });
    gameState.players[0].creatures = [creature, linkedCreature];

    handler.onGainFood(
      { creature, gameState, linkedCreatureId: 'linked-1' },
      'red'
    );

    expect(linkedCreature.food.red).toBe(1);
    expect(gameState.foodPool.red).toBe(4);
  });
});

describe('CooperationHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new CooperationHandler();
  });

  test('should be interactive trait', () => {
    expect(handler.definition.isInteractive).toBe(true);
  });

  test('onGainFood should give blue food to linked creature', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.COOPERATION }],
    });
    const linkedCreature = createMockCreature({
      id: 'linked-1',
      food: { red: 0, blue: 0, yellow: 0 },
    });
    const gameState = createMockGameState();
    gameState.players[0].creatures = [creature, linkedCreature];

    handler.onGainFood(
      { creature, gameState, linkedCreatureId: 'linked-1' },
      'red'
    );

    expect(linkedCreature.food.blue).toBe(1);
  });
});

describe('SymbiosisHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new SymbiosisHandler();
  });

  test('should be interactive trait', () => {
    expect(handler.definition.isInteractive).toBe(true);
  });

  test('checkCanFeed should block feeding when representative not fed', () => {
    const representative = createMockCreature({
      id: 'rep-1',
      food: { red: 0, blue: 0, yellow: 0 },
      foodNeeded: 2,
    });
    const protectedCreature = createMockCreature({
      symbiosisRepresentativeId: 'rep-1',
    });
    const gameState = createMockGameState();
    gameState.players[0].creatures = [representative, protectedCreature];

    const result = handler.checkCanFeed({
      creature: protectedCreature,
      gameState,
    });
    expect(result.canFeed).toBe(false);
  });

  test('checkCanFeed should allow feeding when representative is fed', () => {
    const representative = createMockCreature({
      id: 'rep-1',
      food: { red: 2, blue: 0, yellow: 0 },
      foodNeeded: 2,
    });
    const protectedCreature = createMockCreature({
      symbiosisRepresentativeId: 'rep-1',
    });
    const gameState = createMockGameState();
    gameState.players[0].creatures = [representative, protectedCreature];

    const result = handler.checkCanFeed({
      creature: protectedCreature,
      gameState,
    });
    expect(result.canFeed).toBe(true);
  });

  test('checkDefense should block attacks on protected creature', () => {
    const representative = createMockCreature({ id: 'rep-1' });
    const protectedCreature = createMockCreature({
      symbiosisRepresentativeId: 'rep-1',
    });
    const attacker = createMockCreature();
    const gameState = createMockGameState();
    gameState.players[0].creatures = [representative, protectedCreature];

    const result = handler.checkDefense({
      defender: protectedCreature,
      attacker,
      gameState,
    });
    expect(result.canAttack).toBe(false);
  });
});

describe('TramplingHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new TramplingHandler();
  });

  test('canUseAbility should return true when food available', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.TRAMPLING }],
    });
    const gameState = createMockGameState({ foodPool: { red: 3, blue: 0 } });

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(true);
  });

  test('canUseAbility should return false when no food', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.TRAMPLING }],
    });
    const gameState = createMockGameState({ foodPool: { red: 0, blue: 0 } });

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
  });

  test('useAbility should remove food from pool', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.TRAMPLING }],
    });
    const gameState = createMockGameState({ foodPool: { red: 3, blue: 0 } });

    const result = handler.useAbility({ creature, gameState });
    expect(result.success).toBe(true);
    expect(gameState.foodPool.red).toBe(2);
    expect(creature.tramplingUsedThisPhase).toBe(true);
  });

  test('canUseAbility should return false after using', () => {
    const creature = createMockCreature({
      traits: [{ type: TRAIT_TYPES.TRAMPLING }],
      tramplingUsedThisPhase: true,
    });
    const gameState = createMockGameState({ foodPool: { red: 3, blue: 0 } });

    const result = handler.canUseAbility({ creature, gameState });
    expect(result.canUse).toBe(false);
  });

  test('onPhaseStart should reset trampling usage', () => {
    const creature = createMockCreature({
      tramplingUsedThisPhase: true,
    });
    const gameState = createMockGameState();

    handler.onPhaseStart({ creature, gameState }, 'feeding');
    expect(creature.tramplingUsedThisPhase).toBe(false);
  });
});
