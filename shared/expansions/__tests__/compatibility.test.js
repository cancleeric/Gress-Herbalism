/**
 * 擴充包相容性檢查器測試
 *
 * @module expansions/__tests__/compatibility.test
 */

const { CompatibilityResult, CompatibilityChecker, compatibilityChecker } = require('../compatibility');
const { expansionLoader } = require('../loader');
const { BASE_MANIFEST } = require('../manifest');

// 確保 base 擴充包已經預先註冊（透過 index.js）
require('../index');

// === CompatibilityResult 測試 ===

describe('CompatibilityResult', () => {
  describe('constructor', () => {
    it('should be compatible by default', () => {
      const result = new CompatibilityResult();
      expect(result.compatible).toBe(true);
      expect(result.issues).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });
  });

  describe('addIssue', () => {
    it('should become incompatible on issue', () => {
      const result = new CompatibilityResult();
      result.addIssue('test_issue', 'Test issue message');
      expect(result.compatible).toBe(false);
      expect(result.issues).toHaveLength(1);
    });

    it('should include type and details', () => {
      const result = new CompatibilityResult();
      result.addIssue('test_type', 'Test message', { foo: 'bar' });
      expect(result.issues[0].type).toBe('test_type');
      expect(result.issues[0].message).toBe('Test message');
      expect(result.issues[0].details).toEqual({ foo: 'bar' });
    });
  });

  describe('addSuggestion', () => {
    it('should not affect compatibility', () => {
      const result = new CompatibilityResult();
      result.addSuggestion('Test suggestion');
      expect(result.compatible).toBe(true);
      expect(result.suggestions).toHaveLength(1);
    });
  });

  describe('toJSON', () => {
    it('should return all fields', () => {
      const result = new CompatibilityResult();
      result.addIssue('test', 'Issue');
      result.addSuggestion('Suggestion');

      const json = result.toJSON();
      expect(json.compatible).toBe(false);
      expect(json.issues).toHaveLength(1);
      expect(json.suggestions).toHaveLength(1);
    });
  });
});

// === CompatibilityChecker 測試 ===

describe('CompatibilityChecker', () => {
  let checker;

  beforeEach(() => {
    checker = new CompatibilityChecker();
  });

  describe('check', () => {
    it('should require base expansion', async () => {
      const result = await checker.check([]);
      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'missing_base')).toBe(true);
    });

    it('should pass with base expansion only', async () => {
      const result = await checker.check(['base']);
      expect(result.compatible).toBe(true);
    });

    it('should report load failure for unknown expansion', async () => {
      const result = await checker.check(['base', 'unknown']);
      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'load_failed')).toBe(true);
    });
  });

  describe('_checkDependencies', () => {
    it('should report missing dependency', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['test', {
          manifest: {
            id: 'test',
            dependencies: { 'required-dep': '>=1.0.0' },
          },
        }],
      ]);

      checker._checkDependencies(expansions, result);
      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'missing_dependency')).toBe(true);
    });

    it('should report version mismatch', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base', version: '0.5.0' } }],
        ['test', {
          manifest: {
            id: 'test',
            dependencies: { 'base': '>=1.0.0' },
          },
        }],
      ]);

      checker._checkDependencies(expansions, result);
      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'version_mismatch')).toBe(true);
    });

    it('should pass when dependencies are satisfied', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base', version: '1.0.0' } }],
        ['test', {
          manifest: {
            id: 'test',
            dependencies: { 'base': '>=1.0.0' },
          },
        }],
      ]);

      checker._checkDependencies(expansions, result);
      expect(result.compatible).toBe(true);
    });
  });

  describe('_checkConflicts', () => {
    it('should report conflict', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base' } }],
        ['test', {
          manifest: {
            id: 'test',
            conflicts: { 'base': 'Incompatible with base' },
          },
        }],
      ]);

      checker._checkConflicts(expansions, result);
      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'conflict')).toBe(true);
    });

    it('should pass with no conflicts', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base' } }],
        ['test', { manifest: { id: 'test' } }],
      ]);

      checker._checkConflicts(expansions, result);
      expect(result.compatible).toBe(true);
    });
  });

  describe('_checkPlayerRange', () => {
    it('should report incompatible player range', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base', minPlayers: 3, maxPlayers: 4 } }],
        ['test', { manifest: { id: 'test', minPlayers: 5, maxPlayers: 6 } }],
      ]);

      checker._checkPlayerRange(expansions, result);
      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'player_range')).toBe(true);
    });

    it('should pass with compatible player range', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base', minPlayers: 2, maxPlayers: 4 } }],
        ['test', { manifest: { id: 'test', minPlayers: 2, maxPlayers: 6 } }],
      ]);

      checker._checkPlayerRange(expansions, result);
      expect(result.compatible).toBe(true);
    });
  });

  describe('_checkTraitConflicts', () => {
    it('should report trait conflict between non-base expansions', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['ext1', {
          manifest: { id: 'ext1' },
          module: { traits: { 'shared_trait': {} } },
        }],
        ['ext2', {
          manifest: { id: 'ext2' },
          module: { traits: { 'shared_trait': {} } },
        }],
      ]);

      checker._checkTraitConflicts(expansions, result);
      expect(result.compatible).toBe(false);
      expect(result.issues.some(i => i.type === 'trait_conflict')).toBe(true);
    });

    it('should allow base trait to be overridden', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', {
          manifest: { id: 'base' },
          module: { traits: { 'carnivore': {} } },
        }],
        ['ext', {
          manifest: { id: 'ext' },
          module: { traits: { 'carnivore': {} } },
        }],
      ]);

      checker._checkTraitConflicts(expansions, result);
      expect(result.compatible).toBe(true);
      expect(result.suggestions.some(s => s.includes('overridden'))).toBe(true);
    });
  });

  describe('_generateSuggestions', () => {
    it('should suggest longer sessions for high card count', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base', contents: { cards: 84 } } }],
        ['ext', { manifest: { id: 'ext', contents: { cards: 100 } } }],
      ]);

      checker._generateSuggestions(expansions, result);
      expect(result.suggestions.some(s => s.includes('Total cards'))).toBe(true);
    });

    it('should not suggest for normal card count', () => {
      const result = new CompatibilityResult();
      const expansions = new Map([
        ['base', { manifest: { id: 'base', contents: { cards: 84 } } }],
      ]);

      checker._generateSuggestions(expansions, result);
      expect(result.suggestions.some(s => s.includes('Total cards'))).toBe(false);
    });
  });

  describe('_matchVersion', () => {
    it('should match exact version', () => {
      expect(checker._matchVersion('1.0.0', '1.0.0')).toBe(true);
      expect(checker._matchVersion('1.0.0', '1.0.1')).toBe(false);
    });

    it('should match >= version', () => {
      expect(checker._matchVersion('1.0.0', '>=1.0.0')).toBe(true);
      expect(checker._matchVersion('1.1.0', '>=1.0.0')).toBe(true);
      expect(checker._matchVersion('0.9.0', '>=1.0.0')).toBe(false);
    });

    it('should match ^ version', () => {
      expect(checker._matchVersion('1.0.0', '^1.0.0')).toBe(true);
      expect(checker._matchVersion('1.9.9', '^1.0.0')).toBe(true);
      expect(checker._matchVersion('2.0.0', '^1.0.0')).toBe(false);
      expect(checker._matchVersion('0.9.0', '^1.0.0')).toBe(false);
    });
  });

  describe('_compareVersions', () => {
    it('should compare major versions', () => {
      expect(checker._compareVersions('2.0.0', '1.0.0')).toBe(1);
      expect(checker._compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should compare minor versions', () => {
      expect(checker._compareVersions('1.2.0', '1.1.0')).toBe(1);
      expect(checker._compareVersions('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should compare patch versions', () => {
      expect(checker._compareVersions('1.0.2', '1.0.1')).toBe(1);
      expect(checker._compareVersions('1.0.1', '1.0.2')).toBe(-1);
    });

    it('should return 0 for equal versions', () => {
      expect(checker._compareVersions('1.0.0', '1.0.0')).toBe(0);
    });
  });

  describe('getPlayerRange', () => {
    it('should return default range', async () => {
      const range = await checker.getPlayerRange([]);
      expect(range.minPlayers).toBe(2);
      expect(range.maxPlayers).toBe(4);
    });
  });
});

// === 預設實例測試 ===

describe('compatibilityChecker (default instance)', () => {
  it('should be a CompatibilityChecker instance', () => {
    expect(compatibilityChecker).toBeInstanceOf(CompatibilityChecker);
  });
});
