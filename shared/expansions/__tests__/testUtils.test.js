/**
 * 測試工具函式測試
 *
 * @module expansions/__tests__/testUtils.test
 */

const {
  createMockGameState,
  createMockPlayer,
  createMockCreature,
  createMockCard,
  createMockEventEmitter,
  createMockEffectQueue,
  createMockExpansion,
  createMockTraitHandler,
  addCreatureToPlayer,
  addTraitToCreature,
  setGamePhase,
  simulateFeed,
  assertHelpers,
} = require('./testUtils');

describe('Test Utilities', () => {
  describe('createMockGameState', () => {
    it('should create valid game state', () => {
      const state = createMockGameState();

      expect(state.id).toBe('test-game');
      expect(state.status).toBe('playing');
      expect(state.round).toBe(1);
      expect(state.players.player1).toBeDefined();
      expect(state.players.player2).toBeDefined();
      expect(state.foodPool).toBe(5);
    });

    it('should accept overrides', () => {
      const state = createMockGameState({
        id: 'custom-game',
        round: 3,
        foodPool: 10,
      });

      expect(state.id).toBe('custom-game');
      expect(state.round).toBe(3);
      expect(state.foodPool).toBe(10);
    });
  });

  describe('createMockPlayer', () => {
    it('should create valid player', () => {
      const player = createMockPlayer('p1');

      expect(player.id).toBe('p1');
      expect(player.name).toBe('Player p1');
      expect(player.hand).toEqual([]);
      expect(player.creatures).toEqual([]);
      expect(player.passed).toBe(false);
    });

    it('should accept overrides', () => {
      const player = createMockPlayer('p1', { name: 'Custom Name', passed: true });

      expect(player.name).toBe('Custom Name');
      expect(player.passed).toBe(true);
    });
  });

  describe('createMockCreature', () => {
    it('should create valid creature', () => {
      const creature = createMockCreature('c1', 'p1');

      expect(creature.id).toBe('c1');
      expect(creature.ownerId).toBe('p1');
      expect(creature.traits).toEqual([]);
      expect(creature.food).toBe(0);
      expect(creature.maxFood).toBe(1);
    });

    it('should accept overrides', () => {
      const creature = createMockCreature('c1', 'p1', { maxFood: 3, food: 2 });

      expect(creature.maxFood).toBe(3);
      expect(creature.food).toBe(2);
    });
  });

  describe('createMockCard', () => {
    it('should create valid card', () => {
      const card = createMockCard('card1', 'TRAIT_A', 'TRAIT_B');

      expect(card.id).toBe('card1');
      expect(card.frontTrait).toBe('TRAIT_A');
      expect(card.backTrait).toBe('TRAIT_B');
      expect(card.instanceId).toContain('card1');
    });

    it('should support side selection', () => {
      const card = createMockCard('card1', 'TRAIT_A', 'TRAIT_B');

      expect(card.selectedSide).toBeNull();
      expect(card.getSelectedTrait()).toBeNull();

      card.selectSide('front');
      expect(card.selectedSide).toBe('front');
      expect(card.getSelectedTrait()).toBe('TRAIT_A');

      card.selectSide('back');
      expect(card.getSelectedTrait()).toBe('TRAIT_B');
    });
  });

  describe('createMockEventEmitter', () => {
    it('should create mock event emitter', () => {
      const emitter = createMockEventEmitter();

      expect(typeof emitter.emit).toBe('function');
      expect(typeof emitter.on).toBe('function');
      expect(typeof emitter.off).toBe('function');
      expect(typeof emitter.once).toBe('function');
    });

    it('should be callable', async () => {
      const emitter = createMockEventEmitter();

      await expect(emitter.emit('test')).resolves.toEqual([]);
      expect(emitter.on('test', () => {})).toBeDefined();
    });
  });

  describe('createMockEffectQueue', () => {
    it('should create mock effect queue', () => {
      const queue = createMockEffectQueue();

      expect(typeof queue.enqueue).toBe('function');
      expect(typeof queue.resolveAll).toBe('function');
      expect(typeof queue.cancel).toBe('function');
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('createMockExpansion', () => {
    it('should create mock expansion', () => {
      const expansion = createMockExpansion('test-exp');

      expect(expansion.manifest.id).toBe('test-exp');
      expect(expansion.manifest.name).toBe('Mock test-exp');
      expect(expansion.manifest.version).toBe('1.0.0');
      expect(typeof expansion.createDeck).toBe('function');
    });

    it('should accept overrides', () => {
      const expansion = createMockExpansion('test-exp', {
        manifest: { minPlayers: 3 },
        traits: { CUSTOM: { type: 'CUSTOM', name: 'Custom' } },
      });

      expect(expansion.manifest.minPlayers).toBe(3);
      expect(expansion.traits.CUSTOM).toBeDefined();
    });
  });

  describe('createMockTraitHandler', () => {
    it('should create mock trait handler', () => {
      const handler = createMockTraitHandler('TEST');

      expect(handler.traitType).toBe('TEST');
      expect(typeof handler.canPlace).toBe('function');
      expect(typeof handler.checkDefense).toBe('function');
    });

    it('should have correct default return values', () => {
      const handler = createMockTraitHandler('TEST');

      expect(handler.canPlace()).toEqual({ allowed: true });
      expect(handler.checkDefense()).toEqual({ blocked: false });
      expect(handler.getFoodBonus()).toBe(0);
    });
  });

  describe('addCreatureToPlayer', () => {
    it('should add creature to player', () => {
      const state = createMockGameState();
      const creature = createMockCreature('c1', 'player1');

      addCreatureToPlayer(state, 'player1', creature);

      expect(state.players.player1.creatures).toHaveLength(1);
      expect(state.players.player1.creatures[0].id).toBe('c1');
    });

    it('should throw for unknown player', () => {
      const state = createMockGameState();
      const creature = createMockCreature('c1', 'unknown');

      expect(() => addCreatureToPlayer(state, 'unknown', creature))
        .toThrow('Player unknown not found');
    });
  });

  describe('addTraitToCreature', () => {
    it('should add trait to creature', () => {
      const creature = createMockCreature('c1', 'p1');

      addTraitToCreature(creature, 'CARNIVORE');

      expect(creature.traits).toHaveLength(1);
      expect(creature.traits[0].type).toBe('CARNIVORE');
    });

    it('should update maxFood with foodBonus', () => {
      const creature = createMockCreature('c1', 'p1');

      addTraitToCreature(creature, 'CARNIVORE', { foodBonus: 1 });

      expect(creature.maxFood).toBe(2);
    });
  });

  describe('setGamePhase', () => {
    it('should set game phase', () => {
      const state = createMockGameState();

      setGamePhase(state, 'evolution');

      expect(state.currentPhase).toBe('evolution');
    });
  });

  describe('simulateFeed', () => {
    it('should feed creature', () => {
      const state = createMockGameState({ foodPool: 5 });
      const creature = createMockCreature('c1', 'player1', { maxFood: 3, food: 0 });
      addCreatureToPlayer(state, 'player1', creature);

      const result = simulateFeed(state, 'c1', 2);

      expect(result.gained).toBe(2);
      expect(result.creature.food).toBe(2);
      expect(state.foodPool).toBe(3);
    });

    it('should not exceed maxFood', () => {
      const state = createMockGameState({ foodPool: 5 });
      const creature = createMockCreature('c1', 'player1', { maxFood: 2, food: 1 });
      addCreatureToPlayer(state, 'player1', creature);

      const result = simulateFeed(state, 'c1', 3);

      expect(result.gained).toBe(1);
      expect(result.creature.food).toBe(2);
    });

    it('should throw for unknown creature', () => {
      const state = createMockGameState();

      expect(() => simulateFeed(state, 'unknown'))
        .toThrow('Creature unknown not found');
    });
  });

  describe('assertHelpers', () => {
    describe('assertCreatureAlive', () => {
      it('should pass for alive creature', () => {
        const state = createMockGameState();
        const creature = createMockCreature('c1', 'player1');
        addCreatureToPlayer(state, 'player1', creature);

        expect(() => assertHelpers.assertCreatureAlive(state, 'c1')).not.toThrow();
      });

      it('should throw for dead creature', () => {
        const state = createMockGameState();

        expect(() => assertHelpers.assertCreatureAlive(state, 'c1'))
          .toThrow('Expected creature c1 to be alive');
      });
    });

    describe('assertCreatureDead', () => {
      it('should pass for dead creature', () => {
        const state = createMockGameState();
        state.players.player1.graveyard.push({ id: 'c1' });

        expect(() => assertHelpers.assertCreatureDead(state, 'c1')).not.toThrow();
      });

      it('should throw for alive creature', () => {
        const state = createMockGameState();

        expect(() => assertHelpers.assertCreatureDead(state, 'c1'))
          .toThrow('Expected creature c1 to be dead');
      });
    });

    describe('assertCreatureHasTrait', () => {
      it('should pass when creature has trait', () => {
        const state = createMockGameState();
        const creature = createMockCreature('c1', 'player1');
        addCreatureToPlayer(state, 'player1', creature);
        addTraitToCreature(creature, 'CARNIVORE');

        expect(() => assertHelpers.assertCreatureHasTrait(state, 'c1', 'CARNIVORE'))
          .not.toThrow();
      });

      it('should throw when creature lacks trait', () => {
        const state = createMockGameState();
        const creature = createMockCreature('c1', 'player1');
        addCreatureToPlayer(state, 'player1', creature);

        expect(() => assertHelpers.assertCreatureHasTrait(state, 'c1', 'CARNIVORE'))
          .toThrow('Expected creature c1 to have trait CARNIVORE');
      });
    });

    describe('assertFoodPool', () => {
      it('should pass when food pool matches', () => {
        const state = createMockGameState({ foodPool: 5 });

        expect(() => assertHelpers.assertFoodPool(state, 5)).not.toThrow();
      });

      it('should throw when food pool does not match', () => {
        const state = createMockGameState({ foodPool: 5 });

        expect(() => assertHelpers.assertFoodPool(state, 10))
          .toThrow('Expected food pool 10, got 5');
      });
    });
  });
});
