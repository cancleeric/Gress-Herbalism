/**
 * 基礎版性狀定義測試
 */

const {
  TRAIT_CATEGORIES,
  TRAIT_TYPES,
  TRAIT_DEFINITIONS,
  getAllTraitTypes,
  getInteractiveTraits,
  getStackableTraits,
  getTraitsByCategory,
  areTraitsIncompatible,
  getTraitDefinition,
  getTotalCardCount,
} = require('../traits');

const {
  BASE_CARD_POOL,
  BASE_SIMPLE_CARDS,
  EXPECTED_CARD_COUNT,
} = require('../cards');

const { baseExpansion } = require('../index');

describe('TRAIT_CATEGORIES', () => {
  test('should have 5 categories', () => {
    expect(Object.keys(TRAIT_CATEGORIES).length).toBe(5);
  });

  test('should have correct category values', () => {
    expect(TRAIT_CATEGORIES.CARNIVORE).toBe('carnivore');
    expect(TRAIT_CATEGORIES.DEFENSE).toBe('defense');
    expect(TRAIT_CATEGORIES.FEEDING).toBe('feeding');
    expect(TRAIT_CATEGORIES.INTERACTIVE).toBe('interactive');
    expect(TRAIT_CATEGORIES.SPECIAL).toBe('special');
  });
});

describe('TRAIT_TYPES', () => {
  test('should have 19 trait types', () => {
    expect(Object.keys(TRAIT_TYPES).length).toBe(19);
  });

  test('should have all expected trait types', () => {
    // Carnivore related
    expect(TRAIT_TYPES.CARNIVORE).toBe('carnivore');
    expect(TRAIT_TYPES.SCAVENGER).toBe('scavenger');
    expect(TRAIT_TYPES.SHARP_VISION).toBe('sharpVision');

    // Defense related
    expect(TRAIT_TYPES.CAMOUFLAGE).toBe('camouflage');
    expect(TRAIT_TYPES.BURROWING).toBe('burrowing');
    expect(TRAIT_TYPES.POISONOUS).toBe('poisonous');
    expect(TRAIT_TYPES.AQUATIC).toBe('aquatic');
    expect(TRAIT_TYPES.AGILE).toBe('agile');
    expect(TRAIT_TYPES.MASSIVE).toBe('massive');
    expect(TRAIT_TYPES.TAIL_LOSS).toBe('tailLoss');
    expect(TRAIT_TYPES.MIMICRY).toBe('mimicry');

    // Feeding related
    expect(TRAIT_TYPES.FAT_TISSUE).toBe('fatTissue');
    expect(TRAIT_TYPES.HIBERNATION).toBe('hibernation');
    expect(TRAIT_TYPES.PARASITE).toBe('parasite');
    expect(TRAIT_TYPES.ROBBERY).toBe('robbery');

    // Interactive
    expect(TRAIT_TYPES.COMMUNICATION).toBe('communication');
    expect(TRAIT_TYPES.COOPERATION).toBe('cooperation');
    expect(TRAIT_TYPES.SYMBIOSIS).toBe('symbiosis');

    // Special
    expect(TRAIT_TYPES.TRAMPLING).toBe('trampling');
  });
});

describe('TRAIT_DEFINITIONS', () => {
  test('should have 19 trait definitions', () => {
    expect(Object.keys(TRAIT_DEFINITIONS).length).toBe(19);
  });

  test('each trait should have required fields', () => {
    for (const [type, def] of Object.entries(TRAIT_DEFINITIONS)) {
      expect(def.type).toBe(type);
      expect(typeof def.name).toBe('string');
      expect(typeof def.nameEn).toBe('string');
      expect(typeof def.foodBonus).toBe('number');
      expect(typeof def.description).toBe('string');
      expect(typeof def.category).toBe('string');
      expect(Array.isArray(def.incompatible)).toBe(true);
      expect(typeof def.isInteractive).toBe('boolean');
      expect(typeof def.isStackable).toBe('boolean');
      expect(def.expansion).toBe('base');
      expect(typeof def.icon).toBe('string');
      expect(typeof def.cardCount).toBe('number');
      expect(def.cardCount).toBeGreaterThan(0);
    }
  });

  test('carnivore should have foodBonus of 1', () => {
    expect(TRAIT_DEFINITIONS.carnivore.foodBonus).toBe(1);
  });

  test('massive should have foodBonus of 1', () => {
    expect(TRAIT_DEFINITIONS.massive.foodBonus).toBe(1);
  });

  test('parasite should have foodBonus of 2', () => {
    expect(TRAIT_DEFINITIONS.parasite.foodBonus).toBe(2);
  });

  test('carnivore and scavenger should be incompatible', () => {
    expect(TRAIT_DEFINITIONS.carnivore.incompatible).toContain('scavenger');
    expect(TRAIT_DEFINITIONS.scavenger.incompatible).toContain('carnivore');
  });

  test('interactive traits should be marked correctly', () => {
    expect(TRAIT_DEFINITIONS.communication.isInteractive).toBe(true);
    expect(TRAIT_DEFINITIONS.cooperation.isInteractive).toBe(true);
    expect(TRAIT_DEFINITIONS.symbiosis.isInteractive).toBe(true);
    expect(TRAIT_DEFINITIONS.carnivore.isInteractive).toBe(false);
  });

  test('stackable traits should be marked correctly', () => {
    expect(TRAIT_DEFINITIONS.fatTissue.isStackable).toBe(true);
    expect(TRAIT_DEFINITIONS.parasite.isStackable).toBe(true);
    expect(TRAIT_DEFINITIONS.carnivore.isStackable).toBe(false);
  });

  test('parasite should have isParasite flag', () => {
    expect(TRAIT_DEFINITIONS.parasite.isParasite).toBe(true);
  });

  test('symbiosis should have hasRepresentative flag', () => {
    expect(TRAIT_DEFINITIONS.symbiosis.hasRepresentative).toBe(true);
  });
});

describe('getAllTraitTypes', () => {
  test('should return 19 trait types', () => {
    const types = getAllTraitTypes();
    expect(types.length).toBe(19);
  });

  test('should return array of strings', () => {
    const types = getAllTraitTypes();
    types.forEach(type => {
      expect(typeof type).toBe('string');
    });
  });
});

describe('getInteractiveTraits', () => {
  test('should return 3 interactive traits', () => {
    const interactive = getInteractiveTraits();
    expect(interactive.length).toBe(3);
  });

  test('should include communication, cooperation, symbiosis', () => {
    const interactive = getInteractiveTraits();
    expect(interactive).toContain('communication');
    expect(interactive).toContain('cooperation');
    expect(interactive).toContain('symbiosis');
  });
});

describe('getStackableTraits', () => {
  test('should return 2 stackable traits', () => {
    const stackable = getStackableTraits();
    expect(stackable.length).toBe(2);
  });

  test('should include fatTissue and parasite', () => {
    const stackable = getStackableTraits();
    expect(stackable).toContain('fatTissue');
    expect(stackable).toContain('parasite');
  });
});

describe('getTraitsByCategory', () => {
  test('should return 3 carnivore traits', () => {
    const carnivore = getTraitsByCategory(TRAIT_CATEGORIES.CARNIVORE);
    expect(carnivore.length).toBe(3);
    expect(carnivore).toContain('carnivore');
    expect(carnivore).toContain('scavenger');
    expect(carnivore).toContain('sharpVision');
  });

  test('should return 8 defense traits', () => {
    const defense = getTraitsByCategory(TRAIT_CATEGORIES.DEFENSE);
    expect(defense.length).toBe(8);
  });

  test('should return 4 feeding traits', () => {
    const feeding = getTraitsByCategory(TRAIT_CATEGORIES.FEEDING);
    expect(feeding.length).toBe(4);
  });

  test('should return 3 interactive traits', () => {
    const interactive = getTraitsByCategory(TRAIT_CATEGORIES.INTERACTIVE);
    expect(interactive.length).toBe(3);
  });

  test('should return 1 special trait', () => {
    const special = getTraitsByCategory(TRAIT_CATEGORIES.SPECIAL);
    expect(special.length).toBe(1);
    expect(special).toContain('trampling');
  });
});

describe('areTraitsIncompatible', () => {
  test('carnivore and scavenger should be incompatible', () => {
    expect(areTraitsIncompatible('carnivore', 'scavenger')).toBe(true);
    expect(areTraitsIncompatible('scavenger', 'carnivore')).toBe(true);
  });

  test('carnivore and camouflage should be compatible', () => {
    expect(areTraitsIncompatible('carnivore', 'camouflage')).toBe(false);
  });

  test('should return false for unknown traits', () => {
    expect(areTraitsIncompatible('unknown', 'carnivore')).toBe(false);
    expect(areTraitsIncompatible('carnivore', 'unknown')).toBe(false);
  });
});

describe('getTraitDefinition', () => {
  test('should return trait definition', () => {
    const def = getTraitDefinition('carnivore');
    expect(def).not.toBeNull();
    expect(def.name).toBe('肉食');
  });

  test('should return null for unknown trait', () => {
    expect(getTraitDefinition('unknown')).toBeNull();
  });
});

describe('getTotalCardCount', () => {
  test('should return 84', () => {
    expect(getTotalCardCount()).toBe(84);
  });
});

describe('Card Pool', () => {
  test('BASE_CARD_POOL should have 11 card pairs', () => {
    expect(BASE_CARD_POOL.length).toBe(11);
  });

  test('total cards should be 44', () => {
    const total = BASE_CARD_POOL.reduce((sum, card) => sum + card.count, 0);
    expect(total).toBe(EXPECTED_CARD_COUNT);
  });

  test('each card should have required fields', () => {
    for (const card of BASE_CARD_POOL) {
      expect(typeof card.id).toBe('string');
      expect(typeof card.frontTrait).toBe('string');
      expect(typeof card.backTrait).toBe('string');
      expect(typeof card.count).toBe('number');
      expect(card.expansion).toBe('base');
    }
  });
});

describe('baseExpansion', () => {
  test('should have correct id', () => {
    expect(baseExpansion.id).toBe('base');
  });

  test('should have correct name', () => {
    expect(baseExpansion.name).toBe('物種起源');
  });

  test('should have version', () => {
    expect(baseExpansion.version).toBe('1.0.0');
  });

  test('should have no dependencies', () => {
    expect(baseExpansion.requires).toEqual([]);
    expect(baseExpansion.incompatible).toEqual([]);
  });

  test('should have traits', () => {
    expect(Object.keys(baseExpansion.traits).length).toBe(19);
  });

  test('should have cards', () => {
    expect(baseExpansion.cards.length).toBe(21);
  });

  test('should have rules', () => {
    expect(baseExpansion.rules.minPlayers).toBe(2);
    expect(baseExpansion.rules.maxPlayers).toBe(4);
    expect(baseExpansion.rules.initialHandSize).toBe(6);
  });

  test('should have lifecycle hooks', () => {
    expect(typeof baseExpansion.onRegister).toBe('function');
    expect(typeof baseExpansion.onEnable).toBe('function');
    expect(typeof baseExpansion.onDisable).toBe('function');
    expect(typeof baseExpansion.onGameInit).toBe('function');
    expect(typeof baseExpansion.onGameEnd).toBe('function');
  });
});
