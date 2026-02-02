/**
 * 整合測試：擴充包組合
 *
 * 驗證多個擴充包的組合使用
 *
 * @module expansions/__tests__/integration/expansionCombination.test
 */

const { ExpansionRegistry } = require('../../ExpansionRegistry');
const { baseExpansion } = require('../../base');
const {
  mockBaseExpansion,
  mockFlightExpansion,
  mockConflictExpansion,
} = require('../mockExpansion');

describe('Expansion Combination Integration', () => {
  let registry;

  beforeEach(() => {
    registry = new ExpansionRegistry();
  });

  afterEach(() => {
    registry.reset();
  });

  describe('Single Expansion', () => {
    it('should register and enable base expansion', () => {
      registry.register(baseExpansion);
      registry.enable('base');

      expect(registry.isEnabled('base')).toBe(true);
    });

    it('should have traits after enabling base', () => {
      registry.register(baseExpansion);
      registry.enable('base');

      const handlers = registry.getAllTraitHandlers();
      expect(handlers.size).toBeGreaterThan(0);
    });

    it('should have cards after enabling base', () => {
      registry.register(baseExpansion);
      registry.enable('base');

      const cardPool = registry.getCardPool();
      expect(cardPool.length).toBeGreaterThan(0);
    });
  });

  describe('Mock Expansion Combination', () => {
    it('should register mock-base expansion', () => {
      registry.register(mockBaseExpansion);

      expect(registry.getExpansion('mock-base')).toBeDefined();
    });

    it('should enable mock-base expansion', () => {
      registry.register(mockBaseExpansion);
      registry.enable('mock-base');

      expect(registry.isEnabled('mock-base')).toBe(true);
    });

    it('should fail to enable mock-flight without mock-base', () => {
      registry.register(mockFlightExpansion);

      expect(() => {
        registry.enable('mock-flight');
      }).toThrow(/依賴.*未啟用/);
    });

    it('should enable mock-flight after mock-base', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      expect(registry.isEnabled('mock-base')).toBe(true);
      expect(registry.isEnabled('mock-flight')).toBe(true);
    });

    it('should merge traits from multiple expansions', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      const handlers = registry.getAllTraitHandlers();

      expect(handlers.has('MOCK_CARNIVORE')).toBe(true);
      expect(handlers.has('MOCK_FLYING')).toBe(true);
    });

    it('should merge cards from multiple expansions', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      const cardPool = registry.getCardPool();

      // mock-base 有 3 張卡定義，mock-flight 有 2 張
      expect(cardPool.length).toBe(5);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect conflict between mock-flight and mock-conflict', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.register(mockConflictExpansion);

      registry.enable('mock-base');
      registry.enable('mock-flight');

      expect(() => {
        registry.enable('mock-conflict');
      }).toThrow(/不相容/);
    });

    it('should allow mock-conflict if mock-flight is not enabled', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockConflictExpansion);

      registry.enable('mock-base');
      registry.enable('mock-conflict');

      expect(registry.isEnabled('mock-conflict')).toBe(true);
    });
  });

  describe('Dependency Resolution', () => {
    it('should check dependencies before enabling', () => {
      registry.register(mockFlightExpansion);

      const depCheck = registry.checkDependencies('mock-flight');

      expect(depCheck.satisfied).toBe(false);
      expect(depCheck.missing).toContain('mock-base');
    });

    it('should satisfy dependencies when all required are enabled', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');

      const depCheck = registry.checkDependencies('mock-flight');

      expect(depCheck.satisfied).toBe(true);
      expect(depCheck.missing).toHaveLength(0);
    });
  });

  describe('Compatibility Check', () => {
    it('should check compatibility before enabling', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.register(mockConflictExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      const compatCheck = registry.checkCompatibility('mock-conflict');

      expect(compatCheck.compatible).toBe(false);
      expect(compatCheck.conflicts).toContain('mock-flight');
    });

    it('should be compatible when no conflicts', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');

      const compatCheck = registry.checkCompatibility('mock-flight');

      expect(compatCheck.compatible).toBe(true);
      expect(compatCheck.conflicts).toHaveLength(0);
    });
  });

  describe('Deck Creation', () => {
    it('should create deck from single expansion', () => {
      registry.register(mockBaseExpansion);
      registry.enable('mock-base');

      const deck = registry.createDeck();

      // mock-base 有 3 張卡定義，每張 4 張 = 12 張
      expect(deck.length).toBe(12);
    });

    it('should create combined deck from multiple expansions', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      const deck = registry.createDeck();

      // mock-base: 12 張 + mock-flight: 8 張 = 20 張
      expect(deck.length).toBe(20);
    });

    it('should include expansion id in deck cards', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      const deck = registry.createDeck();

      const baseCards = deck.filter(c => c.expansionId === 'mock-base');
      const flightCards = deck.filter(c => c.expansionId === 'mock-flight');

      expect(baseCards.length).toBe(12);
      expect(flightCards.length).toBe(8);
    });
  });

  describe('Disable Expansion', () => {
    it('should disable expansion', () => {
      registry.register(mockBaseExpansion);
      registry.enable('mock-base');

      expect(registry.isEnabled('mock-base')).toBe(true);

      registry.disable('mock-base');

      expect(registry.isEnabled('mock-base')).toBe(false);
    });

    it('should remove traits when disabled', () => {
      registry.register(mockBaseExpansion);
      registry.enable('mock-base');

      expect(registry.getTraitHandler('MOCK_CARNIVORE')).toBeDefined();

      registry.disable('mock-base');

      expect(registry.getTraitHandler('MOCK_CARNIVORE')).toBeUndefined();
    });

    it('should fail to disable if other expansion depends on it', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      expect(() => {
        registry.disable('mock-base');
      }).toThrow(/依賴/);
    });

    it('should allow disable after dependent is disabled first', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      registry.disable('mock-flight');
      registry.disable('mock-base');

      expect(registry.isEnabled('mock-base')).toBe(false);
      expect(registry.isEnabled('mock-flight')).toBe(false);
    });
  });

  describe('Unregister Expansion', () => {
    it('should unregister expansion', () => {
      registry.register(mockBaseExpansion);

      expect(registry.getExpansion('mock-base')).toBeDefined();

      registry.unregister('mock-base');

      expect(registry.getExpansion('mock-base')).toBeUndefined();
    });

    it('should disable before unregistering if enabled', () => {
      registry.register(mockBaseExpansion);
      registry.enable('mock-base');

      registry.unregister('mock-base');

      expect(registry.isEnabled('mock-base')).toBe(false);
      expect(registry.getExpansion('mock-base')).toBeUndefined();
    });
  });

  describe('Reset', () => {
    it('should reset all expansions', () => {
      registry.register(mockBaseExpansion);
      registry.register(mockFlightExpansion);
      registry.enable('mock-base');
      registry.enable('mock-flight');

      registry.reset();

      expect(registry.getAllExpansions()).toHaveLength(0);
      expect(registry.getEnabledExpansions()).toHaveLength(0);
    });
  });
});
