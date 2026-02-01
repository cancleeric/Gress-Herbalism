/**
 * 擴充包載入器測試
 *
 * @module expansions/__tests__/loader.test
 */

const {
  MANIFEST_VERSION,
  EXPANSION_TYPE,
  EXPANSION_STATUS,
  validateManifest,
  BASE_MANIFEST,
} = require('../manifest');

const {
  LoadResult,
  ExpansionLoader,
  expansionLoader,
} = require('../loader');

// === Manifest 測試 ===

describe('manifest.js', () => {
  describe('MANIFEST_VERSION', () => {
    it('should be defined', () => {
      expect(MANIFEST_VERSION).toBeDefined();
      expect(MANIFEST_VERSION).toBe('1.0.0');
    });
  });

  describe('EXPANSION_TYPE', () => {
    it('should have all expansion types', () => {
      expect(EXPANSION_TYPE.BASE).toBe('base');
      expect(EXPANSION_TYPE.EXPANSION).toBe('expansion');
      expect(EXPANSION_TYPE.PROMO).toBe('promo');
      expect(EXPANSION_TYPE.FAN_MADE).toBe('fan_made');
    });
  });

  describe('EXPANSION_STATUS', () => {
    it('should have all status types', () => {
      expect(EXPANSION_STATUS.NOT_LOADED).toBe('not_loaded');
      expect(EXPANSION_STATUS.LOADING).toBe('loading');
      expect(EXPANSION_STATUS.LOADED).toBe('loaded');
      expect(EXPANSION_STATUS.ENABLED).toBe('enabled');
      expect(EXPANSION_STATUS.DISABLED).toBe('disabled');
      expect(EXPANSION_STATUS.ERROR).toBe('error');
    });
  });

  describe('validateManifest', () => {
    it('should accept valid manifest', () => {
      const manifest = {
        id: 'test',
        name: '測試',
        version: '1.0.0',
        type: EXPANSION_TYPE.EXPANSION,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should accept valid manifest with all optional fields', () => {
      const manifest = {
        id: 'test-expansion',
        name: '測試擴充包',
        nameEn: 'Test Expansion',
        version: '1.2.3',
        type: EXPANSION_TYPE.EXPANSION,
        description: '這是測試用擴充包',
        authors: ['Author1', 'Author2'],
        dependencies: { base: '>=1.0.0' },
        conflicts: {},
        minPlayers: 2,
        maxPlayers: 4,
        contents: { cards: 10, traits: 5 },
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('should reject null manifest', () => {
      const result = validateManifest(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest is null or undefined');
    });

    it('should reject missing required field: id', () => {
      const manifest = {
        name: 'Test',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: id');
    });

    it('should reject missing required field: name', () => {
      const manifest = {
        id: 'test',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: name');
    });

    it('should reject missing required field: version', () => {
      const manifest = {
        id: 'test',
        name: 'Test',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: version');
    });

    it('should reject missing required field: type', () => {
      const manifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: type');
    });

    it('should reject invalid id format - uppercase', () => {
      const manifest = {
        id: 'Test',
        name: 'Test',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid id format'))).toBe(true);
    });

    it('should reject invalid id format - starts with number', () => {
      const manifest = {
        id: '123test',
        name: 'Test',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
    });

    it('should accept valid id with hyphens and underscores', () => {
      const manifest = {
        id: 'test-expansion_v2',
        name: 'Test',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid version format', () => {
      const manifest = {
        id: 'test',
        name: 'Test',
        version: '1.0',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid version format'))).toBe(true);
    });

    it('should accept version with prerelease tag', () => {
      const manifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0-beta.1',
        type: EXPANSION_TYPE.BASE,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid type', () => {
      const manifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        type: 'invalid_type',
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid type'))).toBe(true);
    });

    it('should reject minPlayers > maxPlayers', () => {
      const manifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
        minPlayers: 5,
        maxPlayers: 2,
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('minPlayers cannot be greater than maxPlayers'))).toBe(true);
    });

    it('should reject non-object dependencies', () => {
      const manifest = {
        id: 'test',
        name: 'Test',
        version: '1.0.0',
        type: EXPANSION_TYPE.BASE,
        dependencies: 'invalid',
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('dependencies must be an object');
    });
  });

  describe('BASE_MANIFEST', () => {
    it('should be valid', () => {
      const result = validateManifest(BASE_MANIFEST);
      expect(result.valid).toBe(true);
    });

    it('should have correct id', () => {
      expect(BASE_MANIFEST.id).toBe('base');
    });

    it('should have correct type', () => {
      expect(BASE_MANIFEST.type).toBe(EXPANSION_TYPE.BASE);
    });

    it('should have 84 cards', () => {
      expect(BASE_MANIFEST.contents.cards).toBe(84);
    });

    it('should have 19 traits', () => {
      expect(BASE_MANIFEST.contents.traits).toBe(19);
    });
  });
});

// === LoadResult 測試 ===

describe('LoadResult', () => {
  it('should create with default values', () => {
    const result = new LoadResult('test');
    expect(result.expansionId).toBe('test');
    expect(result.success).toBe(false);
    expect(result.status).toBe(EXPANSION_STATUS.NOT_LOADED);
    expect(result.manifest).toBeNull();
    expect(result.module).toBeNull();
    expect(result.error).toBeNull();
    expect(result.loadTime).toBe(0);
  });

  it('should create success result', () => {
    const manifest = { id: 'test', name: 'Test', version: '1.0.0', type: 'base' };
    const module = { manifest };
    const result = LoadResult.success('test', manifest, module, 100);

    expect(result.success).toBe(true);
    expect(result.status).toBe(EXPANSION_STATUS.LOADED);
    expect(result.manifest).toBe(manifest);
    expect(result.module).toBe(module);
    expect(result.loadTime).toBe(100);
    expect(result.error).toBeNull();
  });

  it('should create failure result', () => {
    const result = LoadResult.failure('test', 'Module not found');

    expect(result.success).toBe(false);
    expect(result.status).toBe(EXPANSION_STATUS.ERROR);
    expect(result.error).toBe('Module not found');
    expect(result.manifest).toBeNull();
    expect(result.module).toBeNull();
  });
});

// === ExpansionLoader 測試 ===

describe('ExpansionLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new ExpansionLoader();
  });

  describe('registerPath', () => {
    it('should register single path', () => {
      loader.registerPath('test', './test/index.js');
      expect(loader.expansionPaths.get('test')).toBe('./test/index.js');
    });

    it('should override existing path', () => {
      loader.registerPath('test', './old/index.js');
      loader.registerPath('test', './new/index.js');
      expect(loader.expansionPaths.get('test')).toBe('./new/index.js');
    });
  });

  describe('registerPaths', () => {
    it('should register multiple paths', () => {
      loader.registerPaths({
        'base': './base/index.js',
        'flight': './flight/index.js',
      });

      expect(loader.expansionPaths.get('base')).toBe('./base/index.js');
      expect(loader.expansionPaths.get('flight')).toBe('./flight/index.js');
    });
  });

  describe('registerModule', () => {
    it('should register module directly', () => {
      const module = {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: 'base' },
      };
      loader.registerModule('test', module);
      expect(loader.registeredModules.get('test')).toBe(module);
    });
  });

  describe('load', () => {
    it('should load registered module', async () => {
      const module = {
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          type: EXPANSION_TYPE.BASE,
        },
      };
      loader.registerModule('test', module);

      const result = await loader.load('test');
      expect(result.success).toBe(true);
      expect(result.manifest.id).toBe('test');
    });

    it('should return same result for already loaded expansion', async () => {
      const module = {
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          type: EXPANSION_TYPE.BASE,
        },
      };
      loader.registerModule('test', module);

      const result1 = await loader.load('test');
      const result2 = await loader.load('test');
      expect(result1).toBe(result2);
    });

    it('should fail for unregistered expansion', async () => {
      const result = await loader.load('nonexistent');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Expansion path not registered');
    });

    it('should fail for module without manifest', async () => {
      loader.registerModule('test', {});

      const result = await loader.load('test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Expansion module missing manifest');
    });

    it('should fail for invalid manifest', async () => {
      loader.registerModule('test', {
        manifest: { id: 'test' }, // missing required fields
      });

      const result = await loader.load('test');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid manifest');
    });

    it('should record load time', async () => {
      const module = {
        manifest: {
          id: 'test',
          name: 'Test',
          version: '1.0.0',
          type: EXPANSION_TYPE.BASE,
        },
      };
      loader.registerModule('test', module);

      const result = await loader.load('test');
      expect(result.loadTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('dependency resolution', () => {
    it('should load dependencies first', async () => {
      const baseModule = {
        manifest: {
          id: 'base',
          name: 'Base',
          version: '1.0.0',
          type: EXPANSION_TYPE.BASE,
        },
      };

      const expansionModule = {
        manifest: {
          id: 'expansion',
          name: 'Expansion',
          version: '1.0.0',
          type: EXPANSION_TYPE.EXPANSION,
          dependencies: { base: '>=1.0.0' },
        },
      };

      loader.registerModule('base', baseModule);
      loader.registerModule('expansion', expansionModule);

      const result = await loader.load('expansion');
      expect(result.success).toBe(true);
      expect(loader.isLoaded('base')).toBe(true);
    });

    it('should fail if dependency not registered', async () => {
      const expansionModule = {
        manifest: {
          id: 'expansion',
          name: 'Expansion',
          version: '1.0.0',
          type: EXPANSION_TYPE.EXPANSION,
          dependencies: { base: '>=1.0.0' },
        },
      };

      loader.registerModule('expansion', expansionModule);

      const result = await loader.load('expansion');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load dependency');
    });

    it('should fail if dependency version mismatch', async () => {
      const baseModule = {
        manifest: {
          id: 'base',
          name: 'Base',
          version: '0.9.0',
          type: EXPANSION_TYPE.BASE,
        },
      };

      const expansionModule = {
        manifest: {
          id: 'expansion',
          name: 'Expansion',
          version: '1.0.0',
          type: EXPANSION_TYPE.EXPANSION,
          dependencies: { base: '>=1.0.0' },
        },
      };

      loader.registerModule('base', baseModule);
      loader.registerModule('expansion', expansionModule);

      const result = await loader.load('expansion');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Dependency version mismatch');
    });
  });

  describe('version checking', () => {
    it('should accept exact version match', () => {
      expect(loader._checkVersion('1.0.0', '1.0.0')).toBe(true);
      expect(loader._checkVersion('1.0.1', '1.0.0')).toBe(false);
    });

    it('should accept >= version', () => {
      expect(loader._checkVersion('1.0.0', '>=1.0.0')).toBe(true);
      expect(loader._checkVersion('1.1.0', '>=1.0.0')).toBe(true);
      expect(loader._checkVersion('2.0.0', '>=1.0.0')).toBe(true);
      expect(loader._checkVersion('0.9.0', '>=1.0.0')).toBe(false);
    });

    it('should accept ^ caret version', () => {
      expect(loader._checkVersion('1.0.0', '^1.0.0')).toBe(true);
      expect(loader._checkVersion('1.5.0', '^1.0.0')).toBe(true);
      expect(loader._checkVersion('2.0.0', '^1.0.0')).toBe(false);
      expect(loader._checkVersion('0.9.0', '^1.0.0')).toBe(false);
    });
  });

  describe('loadMultiple', () => {
    it('should load multiple expansions', async () => {
      loader.registerModule('exp1', {
        manifest: { id: 'exp1', name: 'Exp1', version: '1.0.0', type: EXPANSION_TYPE.BASE },
      });
      loader.registerModule('exp2', {
        manifest: { id: 'exp2', name: 'Exp2', version: '1.0.0', type: EXPANSION_TYPE.EXPANSION },
      });

      const { success, results, failed } = await loader.loadMultiple(['exp1', 'exp2']);
      expect(success).toBe(true);
      expect(results).toHaveLength(2);
      expect(failed).toHaveLength(0);
    });

    it('should report partial failure', async () => {
      loader.registerModule('exp1', {
        manifest: { id: 'exp1', name: 'Exp1', version: '1.0.0', type: EXPANSION_TYPE.BASE },
      });

      const { success, results, failed } = await loader.loadMultiple(['exp1', 'nonexistent']);
      expect(success).toBe(false);
      expect(results).toHaveLength(2);
      expect(failed).toContain('nonexistent');
    });
  });

  describe('unload', () => {
    it('should unload loaded expansion', async () => {
      loader.registerModule('test', {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: EXPANSION_TYPE.BASE },
      });

      await loader.load('test');
      expect(loader.isLoaded('test')).toBe(true);

      const result = loader.unload('test');
      expect(result).toBe(true);
      expect(loader.isLoaded('test')).toBe(false);
    });

    it('should return false for not loaded expansion', () => {
      const result = loader.unload('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getters', () => {
    beforeEach(async () => {
      loader.registerModule('test', {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: EXPANSION_TYPE.BASE },
      });
      await loader.load('test');
    });

    it('should get loaded expansion', () => {
      const result = loader.getLoaded('test');
      expect(result).toBeDefined();
      expect(result.manifest.id).toBe('test');
    });

    it('should return undefined for not loaded', () => {
      expect(loader.getLoaded('nonexistent')).toBeUndefined();
    });

    it('should get all loaded ids', () => {
      const ids = loader.getLoadedIds();
      expect(ids).toContain('test');
    });

    it('should check isLoaded', () => {
      expect(loader.isLoaded('test')).toBe(true);
      expect(loader.isLoaded('nonexistent')).toBe(false);
    });

    it('should get status', () => {
      expect(loader.getStatus('test')).toBe(EXPANSION_STATUS.LOADED);
      expect(loader.getStatus('nonexistent')).toBe(EXPANSION_STATUS.NOT_LOADED);
    });
  });

  describe('callbacks', () => {
    it('should call onLoad callback', async () => {
      const onLoadSpy = jest.fn();
      loader.onLoad(onLoadSpy);

      loader.registerModule('test', {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: EXPANSION_TYPE.BASE },
      });

      await loader.load('test');
      expect(onLoadSpy).toHaveBeenCalledTimes(1);
      expect(onLoadSpy).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should call onError callback', async () => {
      const onErrorSpy = jest.fn();
      loader.onError(onErrorSpy);

      await loader.load('nonexistent');
      expect(onErrorSpy).toHaveBeenCalledTimes(1);
      expect(onErrorSpy).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    });

    it('should unsubscribe callbacks', async () => {
      const onLoadSpy = jest.fn();
      const unsub = loader.onLoad(onLoadSpy);

      unsub();

      loader.registerModule('test', {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: EXPANSION_TYPE.BASE },
      });

      await loader.load('test');
      expect(onLoadSpy).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should clear loaded expansions', async () => {
      loader.registerModule('test', {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: EXPANSION_TYPE.BASE },
      });
      await loader.load('test');

      loader.reset();
      expect(loader.isLoaded('test')).toBe(false);
      expect(loader.registeredModules.size).toBe(0);
    });

    it('should preserve expansion paths', async () => {
      loader.registerPath('test', './test/index.js');
      loader.reset();
      expect(loader.expansionPaths.get('test')).toBe('./test/index.js');
    });
  });
});

// === 預設實例測試 ===

describe('expansionLoader (default instance)', () => {
  it('should be an instance of ExpansionLoader', () => {
    expect(expansionLoader).toBeInstanceOf(ExpansionLoader);
  });
});
