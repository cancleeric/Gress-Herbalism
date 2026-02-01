/**
 * 擴充包驗證器測試
 *
 * @module expansions/__tests__/validator.test
 */

const { ValidationResult, ExpansionValidator, expansionValidator } = require('../validator');
const { EXPANSION_TYPE } = require('../manifest');

// === ValidationResult 測試 ===

describe('ValidationResult', () => {
  describe('constructor', () => {
    it('should be valid by default', () => {
      const result = new ValidationResult();
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.info).toEqual([]);
    });
  });

  describe('addError', () => {
    it('should become invalid on error', () => {
      const result = new ValidationResult();
      result.addError('Test error');
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toBe('Test error');
    });

    it('should include context', () => {
      const result = new ValidationResult();
      result.addError('Error with context', { field: 'test' });
      expect(result.errors[0].context).toEqual({ field: 'test' });
    });
  });

  describe('addWarning', () => {
    it('should not affect validity', () => {
      const result = new ValidationResult();
      result.addWarning('Test warning');
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(1);
    });
  });

  describe('addInfo', () => {
    it('should not affect validity', () => {
      const result = new ValidationResult();
      result.addInfo('Test info');
      expect(result.valid).toBe(true);
      expect(result.info).toHaveLength(1);
    });
  });

  describe('merge', () => {
    it('should merge errors from another result', () => {
      const r1 = new ValidationResult();
      r1.addError('Error 1');

      const r2 = new ValidationResult();
      r2.addWarning('Warning 1');

      r1.merge(r2);

      expect(r1.valid).toBe(false);
      expect(r1.errors).toHaveLength(1);
      expect(r1.warnings).toHaveLength(1);
    });

    it('should become invalid when merging invalid result', () => {
      const r1 = new ValidationResult();
      const r2 = new ValidationResult();
      r2.addError('Error from r2');

      r1.merge(r2);
      expect(r1.valid).toBe(false);
    });

    it('should combine all arrays', () => {
      const r1 = new ValidationResult();
      r1.addError('E1');
      r1.addWarning('W1');
      r1.addInfo('I1');

      const r2 = new ValidationResult();
      r2.addError('E2');
      r2.addWarning('W2');
      r2.addInfo('I2');

      r1.merge(r2);

      expect(r1.errors).toHaveLength(2);
      expect(r1.warnings).toHaveLength(2);
      expect(r1.info).toHaveLength(2);
    });
  });

  describe('toJSON', () => {
    it('should include summary', () => {
      const result = new ValidationResult();
      result.addError('E1');
      result.addWarning('W1');
      result.addInfo('I1');

      const json = result.toJSON();

      expect(json.valid).toBe(false);
      expect(json.summary.errorCount).toBe(1);
      expect(json.summary.warningCount).toBe(1);
      expect(json.summary.infoCount).toBe(1);
    });
  });
});

// === ExpansionValidator 測試 ===

describe('ExpansionValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new ExpansionValidator();
  });

  describe('validateManifest', () => {
    it('should reject missing manifest', () => {
      const result = validator.validateManifest({});
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toBe('Missing manifest');
    });

    it('should accept valid manifest', () => {
      const expansion = {
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          type: EXPANSION_TYPE.EXPANSION,
        },
      };
      const result = validator.validateManifest(expansion);
      expect(result.valid).toBe(true);
    });

    it('should report invalid manifest fields', () => {
      const expansion = {
        manifest: {
          id: 'INVALID_ID', // 大寫無效
          name: 'Test',
          version: '1.0.0',
          type: EXPANSION_TYPE.EXPANSION,
        },
      };
      const result = validator.validateManifest(expansion);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateStructure', () => {
    it('should report missing required exports', () => {
      const result = validator.validateStructure({});
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('manifest'))).toBe(true);
    });

    it('should warn about missing recommended exports', () => {
      const expansion = { manifest: {} };
      const result = validator.validateStructure(expansion);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should require more exports for base expansion', () => {
      const expansion = {
        manifest: { type: EXPANSION_TYPE.BASE },
      };
      const result = validator.validateStructure(expansion);
      expect(result.errors.some(e => e.message.includes('traits'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('cards'))).toBe(true);
      expect(result.errors.some(e => e.message.includes('createDeck'))).toBe(true);
    });
  });

  describe('validateTraits', () => {
    it('should validate trait definitions', () => {
      const traits = {
        TEST_TRAIT: {
          type: 'TEST_TRAIT',
          name: 'Test',
          foodBonus: 1,
        },
      };
      const result = validator.validateTraits(traits, 'test');
      expect(result.valid).toBe(true);
    });

    it('should report missing name', () => {
      const traits = {
        TEST_TRAIT: { type: 'TEST_TRAIT' },
      };
      const result = validator.validateTraits(traits, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('missing name'))).toBe(true);
    });

    it('should report missing type', () => {
      const traits = {
        TEST_TRAIT: { name: 'Test' },
      };
      const result = validator.validateTraits(traits, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('missing type'))).toBe(true);
    });

    it('should warn about type mismatch', () => {
      const traits = {
        TEST_TRAIT: { type: 'OTHER_TYPE', name: 'Test' },
      };
      const result = validator.validateTraits(traits, 'test');
      expect(result.warnings.some(e => e.message.includes('mismatch'))).toBe(true);
    });

    it('should report invalid foodBonus type', () => {
      const traits = {
        TEST_TRAIT: { type: 'TEST_TRAIT', name: 'Test', foodBonus: 'invalid' },
      };
      const result = validator.validateTraits(traits, 'test');
      expect(result.valid).toBe(false);
    });

    it('should warn about unknown category', () => {
      const traits = {
        TEST_TRAIT: { type: 'TEST_TRAIT', name: 'Test', category: 'unknown' },
      };
      const result = validator.validateTraits(traits, 'test');
      expect(result.warnings.some(e => e.message.includes('Unknown trait category'))).toBe(true);
    });

    it('should reject invalid traits object', () => {
      const result = validator.validateTraits(null, 'test');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateCards', () => {
    const validTraits = {
      TRAIT_A: { type: 'TRAIT_A', name: 'A' },
      TRAIT_B: { type: 'TRAIT_B', name: 'B' },
    };

    it('should validate card definitions', () => {
      const cards = [
        { id: 'CARD_1', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 4 },
      ];
      const result = validator.validateCards(cards, validTraits, 'test');
      expect(result.valid).toBe(true);
    });

    it('should report unknown traits', () => {
      const cards = [
        { id: 'CARD_1', frontTrait: 'UNKNOWN', backTrait: 'ALSO_UNKNOWN', count: 4 },
      ];
      const result = validator.validateCards(cards, {}, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });

    it('should report missing card id', () => {
      const cards = [
        { frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 4 },
      ];
      const result = validator.validateCards(cards, validTraits, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('missing id'))).toBe(true);
    });

    it('should report duplicate card ids', () => {
      const cards = [
        { id: 'CARD_1', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 4 },
        { id: 'CARD_1', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 4 },
      ];
      const result = validator.validateCards(cards, validTraits, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('Duplicate'))).toBe(true);
    });

    it('should report missing frontTrait', () => {
      const cards = [
        { id: 'CARD_1', backTrait: 'TRAIT_B', count: 4 },
      ];
      const result = validator.validateCards(cards, validTraits, 'test');
      expect(result.valid).toBe(false);
    });

    it('should report missing backTrait', () => {
      const cards = [
        { id: 'CARD_1', frontTrait: 'TRAIT_A', count: 4 },
      ];
      const result = validator.validateCards(cards, validTraits, 'test');
      expect(result.valid).toBe(false);
    });

    it('should report invalid count', () => {
      const cards = [
        { id: 'CARD_1', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 0 },
      ];
      const result = validator.validateCards(cards, validTraits, 'test');
      expect(result.valid).toBe(false);
    });

    it('should warn if base expansion does not have 84 cards', () => {
      const cards = [
        { id: 'CARD_1', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 10 },
      ];
      const result = validator.validateCards(cards, validTraits, 'base');
      expect(result.warnings.some(e => e.message.includes('84 cards'))).toBe(true);
    });

    it('should add info about total cards', () => {
      const cards = [
        { id: 'CARD_1', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 4 },
        { id: 'CARD_2', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 6 },
      ];
      const result = validator.validateCards(cards, validTraits, 'test');
      expect(result.info.some(e => e.message.includes('Total cards: 10'))).toBe(true);
    });

    it('should reject non-array cards', () => {
      const result = validator.validateCards({}, validTraits, 'test');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateHandlers', () => {
    it('should warn about no handlers', () => {
      const result = validator.validateHandlers(null, {});
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about missing handlers for traits', () => {
      const traits = {
        TRAIT_A: { type: 'TRAIT_A', name: 'A' },
      };
      const handlers = {};
      const result = validator.validateHandlers(handlers, traits);
      expect(result.warnings.some(e => e.message.includes('No handler for trait'))).toBe(true);
    });

    it('should warn about missing canPlace method', () => {
      const traits = {
        TRAIT_A: { type: 'TRAIT_A', name: 'A' },
      };
      const handlers = {
        TRAIT_A: {},
      };
      const result = validator.validateHandlers(handlers, traits);
      expect(result.warnings.some(e => e.message.includes('missing method: canPlace'))).toBe(true);
    });

    it('should warn about handlers without trait definition', () => {
      const handlers = {
        UNKNOWN_TRAIT: { canPlace: () => true },
      };
      const result = validator.validateHandlers(handlers, {});
      expect(result.warnings.some(e => e.message.includes('no trait definition'))).toBe(true);
    });

    it('should pass for valid handlers', () => {
      const traits = {
        TRAIT_A: { type: 'TRAIT_A', name: 'A' },
      };
      const handlers = {
        TRAIT_A: { canPlace: () => true },
      };
      const result = validator.validateHandlers(handlers, traits);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validate (full)', () => {
    it('should validate complete expansion', () => {
      const expansion = {
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          type: EXPANSION_TYPE.EXPANSION,
        },
        traits: {
          TEST: { type: 'TEST', name: 'Test' },
        },
        cards: [
          { id: 'C1', frontTrait: 'TEST', backTrait: 'TEST', count: 4 },
        ],
        traitHandlers: {
          TEST: { canPlace: () => true },
        },
      };

      const result = validator.validate(expansion);
      expect(result.valid).toBe(true);
    });

    it('should report all issues in complete validation', () => {
      const expansion = {
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          type: EXPANSION_TYPE.BASE, // Base requires more
        },
        // Missing traits, cards, createDeck
      };

      const result = validator.validate(expansion);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('custom validators', () => {
    it('should run custom trait validators', () => {
      validator.registerTraitValidator((traitType, definition) => {
        const result = new ValidationResult();
        if (!definition.customField) {
          result.addError('Missing customField');
        }
        return result;
      });

      const traits = {
        TEST: { type: 'TEST', name: 'Test' },
      };

      const result = validator.validateTraits(traits, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('customField'))).toBe(true);
    });

    it('should run custom card validators', () => {
      validator.registerCardValidator((card) => {
        const result = new ValidationResult();
        if (card.count > 10) {
          result.addWarning('Too many copies');
        }
        return result;
      });

      const cards = [
        { id: 'C1', frontTrait: 'A', backTrait: 'B', count: 20 },
      ];

      const result = validator.validateCards(cards, { A: {}, B: {} }, 'test');
      expect(result.warnings.some(e => e.message.includes('Too many copies'))).toBe(true);
    });

    it('should reset validators', () => {
      validator.registerTraitValidator(() => new ValidationResult());
      validator.registerCardValidator(() => new ValidationResult());
      validator.registerStructureValidator(() => new ValidationResult());

      expect(validator.traitValidators).toHaveLength(1);
      expect(validator.cardValidators).toHaveLength(1);
      expect(validator.structureValidators).toHaveLength(1);

      validator.reset();

      expect(validator.traitValidators).toHaveLength(0);
      expect(validator.cardValidators).toHaveLength(0);
      expect(validator.structureValidators).toHaveLength(0);
    });
  });
});

// === 預設實例測試 ===

describe('expansionValidator (default instance)', () => {
  it('should be an ExpansionValidator instance', () => {
    expect(expansionValidator).toBeInstanceOf(ExpansionValidator);
  });
});
