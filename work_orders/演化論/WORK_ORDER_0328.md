# 工單 0328：建立擴充包驗證系統

## 基本資訊
- **工單編號**：0328
- **所屬計畫**：P2-A 可擴充架構
- **前置工單**：0326（擴充包載入機制）、0327（遊戲初始化）
- **預計影響檔案**：
  - `shared/expansions/validator.js`（新增）
  - `shared/expansions/compatibility.js`（新增）
  - `tests/unit/expansions/validator.test.js`（新增）

---

## 目標

建立完整的擴充包驗證系統，確保：
1. 擴充包結構完整性
2. 性狀定義正確性
3. 卡牌配置有效性
4. 擴充包間相容性

---

## 詳細規格

### 1. 擴充包驗證器

```javascript
// shared/expansions/validator.js

import { validateManifest, EXPANSION_TYPE } from './manifest.js';

/**
 * 驗證結果
 */
export class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  addError(message, context = null) {
    this.valid = false;
    this.errors.push({ message, context });
  }

  addWarning(message, context = null) {
    this.warnings.push({ message, context });
  }

  addInfo(message, context = null) {
    this.info.push({ message, context });
  }

  merge(other) {
    if (!other.valid) this.valid = false;
    this.errors.push(...other.errors);
    this.warnings.push(...other.warnings);
    this.info.push(...other.info);
  }

  toJSON() {
    return {
      valid: this.valid,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      summary: {
        errorCount: this.errors.length,
        warningCount: this.warnings.length,
        infoCount: this.info.length,
      },
    };
  }
}

/**
 * 擴充包驗證器
 */
export class ExpansionValidator {
  constructor() {
    this.traitValidators = [];
    this.cardValidators = [];
    this.structureValidators = [];
  }

  /**
   * 註冊自訂性狀驗證器
   */
  registerTraitValidator(validator) {
    this.traitValidators.push(validator);
  }

  /**
   * 註冊自訂卡牌驗證器
   */
  registerCardValidator(validator) {
    this.cardValidators.push(validator);
  }

  /**
   * 完整驗證擴充包
   */
  validate(expansion) {
    const result = new ValidationResult();

    // 1. 驗證 Manifest
    result.merge(this.validateManifest(expansion));

    // 2. 驗證模組結構
    result.merge(this.validateStructure(expansion));

    // 3. 驗證性狀定義
    if (expansion.traits) {
      result.merge(this.validateTraits(expansion.traits, expansion.manifest?.id));
    }

    // 4. 驗證卡牌定義
    if (expansion.cards) {
      result.merge(this.validateCards(expansion.cards, expansion.traits, expansion.manifest?.id));
    }

    // 5. 驗證處理器
    if (expansion.traitHandlers) {
      result.merge(this.validateHandlers(expansion.traitHandlers, expansion.traits));
    }

    // 6. 執行自訂驗證器
    for (const validator of this.structureValidators) {
      result.merge(validator(expansion));
    }

    return result;
  }

  /**
   * 驗證 Manifest
   */
  validateManifest(expansion) {
    const result = new ValidationResult();

    if (!expansion.manifest) {
      result.addError('Missing manifest');
      return result;
    }

    const manifestValidation = validateManifest(expansion.manifest);
    if (!manifestValidation.valid) {
      for (const error of manifestValidation.errors) {
        result.addError(error, { field: 'manifest' });
      }
    }

    return result;
  }

  /**
   * 驗證模組結構
   */
  validateStructure(expansion) {
    const result = new ValidationResult();

    // 檢查必要匯出
    const requiredExports = ['manifest'];
    for (const exportName of requiredExports) {
      if (!(exportName in expansion)) {
        result.addError(`Missing required export: ${exportName}`);
      }
    }

    // 檢查建議匯出
    const recommendedExports = ['traits', 'cards', 'traitHandlers'];
    for (const exportName of recommendedExports) {
      if (!(exportName in expansion)) {
        result.addWarning(`Missing recommended export: ${exportName}`);
      }
    }

    // 基礎版必須有完整匯出
    if (expansion.manifest?.type === EXPANSION_TYPE.BASE) {
      const baseRequired = ['traits', 'cards', 'traitHandlers', 'createDeck'];
      for (const exportName of baseRequired) {
        if (!(exportName in expansion)) {
          result.addError(`Base expansion missing required export: ${exportName}`);
        }
      }
    }

    return result;
  }

  /**
   * 驗證性狀定義
   */
  validateTraits(traits, expansionId) {
    const result = new ValidationResult();

    if (!traits || typeof traits !== 'object') {
      result.addError('Invalid traits definition');
      return result;
    }

    const traitTypes = new Set();

    for (const [traitType, definition] of Object.entries(traits)) {
      // 檢查重複
      if (traitTypes.has(traitType)) {
        result.addError(`Duplicate trait type: ${traitType}`);
      }
      traitTypes.add(traitType);

      // 驗證性狀定義
      result.merge(this.validateTraitDefinition(traitType, definition));

      // 執行自訂驗證器
      for (const validator of this.traitValidators) {
        result.merge(validator(traitType, definition, expansionId));
      }
    }

    return result;
  }

  /**
   * 驗證單一性狀定義
   */
  validateTraitDefinition(traitType, definition) {
    const result = new ValidationResult();
    const context = { traitType };

    // 必要欄位
    if (!definition.name) {
      result.addError('Trait missing name', context);
    }

    if (!definition.type) {
      result.addError('Trait missing type', context);
    } else if (definition.type !== traitType) {
      result.addWarning(
        `Trait type mismatch: key is "${traitType}" but definition.type is "${definition.type}"`,
        context
      );
    }

    // 食量加成應為數字
    if (definition.foodBonus !== undefined && typeof definition.foodBonus !== 'number') {
      result.addError('Trait foodBonus must be a number', context);
    }

    // 類別驗證
    const validCategories = ['carnivore', 'defense', 'feeding', 'interaction', 'special'];
    if (definition.category && !validCategories.includes(definition.category)) {
      result.addWarning(
        `Unknown trait category: ${definition.category}. Valid categories: ${validCategories.join(', ')}`,
        context
      );
    }

    return result;
  }

  /**
   * 驗證卡牌定義
   */
  validateCards(cards, traits, expansionId) {
    const result = new ValidationResult();

    if (!Array.isArray(cards)) {
      result.addError('Cards must be an array');
      return result;
    }

    const cardIds = new Set();
    let totalCount = 0;

    for (const card of cards) {
      const context = { cardId: card.id };

      // 檢查卡牌 ID
      if (!card.id) {
        result.addError('Card missing id');
        continue;
      }

      if (cardIds.has(card.id)) {
        result.addError(`Duplicate card id: ${card.id}`, context);
      }
      cardIds.add(card.id);

      // 驗證正面性狀
      if (!card.frontTrait) {
        result.addError('Card missing frontTrait', context);
      } else if (traits && !traits[card.frontTrait]) {
        result.addError(`Card frontTrait references unknown trait: ${card.frontTrait}`, context);
      }

      // 驗證背面性狀
      if (!card.backTrait) {
        result.addError('Card missing backTrait', context);
      } else if (traits && !traits[card.backTrait]) {
        result.addError(`Card backTrait references unknown trait: ${card.backTrait}`, context);
      }

      // 驗證數量
      if (!card.count || card.count < 1) {
        result.addError('Card count must be at least 1', context);
      } else {
        totalCount += card.count;
      }

      // 執行自訂驗證器
      for (const validator of this.cardValidators) {
        result.merge(validator(card, traits, expansionId));
      }
    }

    // 基礎版應有 84 張卡
    if (expansionId === 'base' && totalCount !== 84) {
      result.addWarning(`Base expansion should have 84 cards, got ${totalCount}`);
    }

    result.addInfo(`Total cards: ${totalCount}`);

    return result;
  }

  /**
   * 驗證性狀處理器
   */
  validateHandlers(handlers, traits) {
    const result = new ValidationResult();

    if (!handlers || typeof handlers !== 'object') {
      result.addWarning('No trait handlers defined');
      return result;
    }

    // 檢查每個性狀是否有對應處理器
    if (traits) {
      for (const traitType of Object.keys(traits)) {
        if (!handlers[traitType]) {
          result.addWarning(`No handler for trait: ${traitType}`);
        }
      }
    }

    // 驗證處理器介面
    for (const [traitType, handler] of Object.entries(handlers)) {
      const context = { traitType };

      // 檢查必要方法
      const requiredMethods = ['canPlace'];
      for (const method of requiredMethods) {
        if (typeof handler[method] !== 'function') {
          result.addWarning(`Handler missing method: ${method}`, context);
        }
      }

      // 檢查一致性
      if (!traits || !traits[traitType]) {
        result.addWarning(`Handler exists but no trait definition: ${traitType}`, context);
      }
    }

    return result;
  }
}

// 預設驗證器實例
export const expansionValidator = new ExpansionValidator();
```

### 2. 相容性檢查器

```javascript
// shared/expansions/compatibility.js

import { expansionLoader } from './loader.js';
import { ValidationResult } from './validator.js';

/**
 * 相容性檢查結果
 */
export class CompatibilityResult {
  constructor() {
    this.compatible = true;
    this.issues = [];
    this.suggestions = [];
  }

  addIssue(type, message, details = {}) {
    this.compatible = false;
    this.issues.push({ type, message, details });
  }

  addSuggestion(message) {
    this.suggestions.push(message);
  }

  toJSON() {
    return {
      compatible: this.compatible,
      issues: this.issues,
      suggestions: this.suggestions,
    };
  }
}

/**
 * 擴充包相容性檢查器
 */
export class CompatibilityChecker {
  /**
   * 檢查擴充包組合相容性
   * @param {string[]} expansionIds - 擴充包 ID 列表
   */
  async check(expansionIds) {
    const result = new CompatibilityResult();

    // 確保基礎版存在
    if (!expansionIds.includes('base')) {
      result.addIssue('missing_base', 'Base expansion is required');
      return result;
    }

    // 載入所有擴充包
    const expansions = await this._loadAll(expansionIds, result);
    if (!result.compatible) {
      return result;
    }

    // 檢查依賴
    this._checkDependencies(expansions, result);

    // 檢查衝突
    this._checkConflicts(expansions, result);

    // 檢查玩家數
    this._checkPlayerRange(expansions, result);

    // 檢查性狀衝突
    this._checkTraitConflicts(expansions, result);

    // 建議
    this._generateSuggestions(expansions, result);

    return result;
  }

  /**
   * 載入所有擴充包
   */
  async _loadAll(expansionIds, result) {
    const expansions = new Map();

    for (const id of expansionIds) {
      try {
        const loadResult = await expansionLoader.load(id);
        if (!loadResult.success) {
          result.addIssue('load_failed', `Failed to load expansion: ${id}`, {
            expansionId: id,
            error: loadResult.error,
          });
        } else {
          expansions.set(id, loadResult);
        }
      } catch (error) {
        result.addIssue('load_error', `Error loading expansion: ${id}`, {
          expansionId: id,
          error: error.message,
        });
      }
    }

    return expansions;
  }

  /**
   * 檢查依賴關係
   */
  _checkDependencies(expansions, result) {
    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (!manifest.dependencies) continue;

      for (const [depId, versionRange] of Object.entries(manifest.dependencies)) {
        // 檢查依賴是否存在
        if (!expansions.has(depId)) {
          result.addIssue('missing_dependency', `Expansion "${id}" requires "${depId}"`, {
            expansionId: id,
            dependencyId: depId,
            requiredVersion: versionRange,
          });
          continue;
        }

        // 檢查版本
        const depManifest = expansions.get(depId).manifest;
        if (!this._matchVersion(depManifest.version, versionRange)) {
          result.addIssue('version_mismatch',
            `Expansion "${id}" requires "${depId}" version ${versionRange}, but ${depManifest.version} is installed`, {
            expansionId: id,
            dependencyId: depId,
            requiredVersion: versionRange,
            installedVersion: depManifest.version,
          });
        }
      }
    }
  }

  /**
   * 檢查衝突
   */
  _checkConflicts(expansions, result) {
    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (!manifest.conflicts) continue;

      for (const [conflictId, reason] of Object.entries(manifest.conflicts)) {
        if (expansions.has(conflictId)) {
          result.addIssue('conflict',
            `Expansion "${id}" conflicts with "${conflictId}": ${reason}`, {
            expansionId: id,
            conflictingId: conflictId,
            reason,
          });
        }
      }
    }
  }

  /**
   * 檢查玩家數範圍
   */
  _checkPlayerRange(expansions, result) {
    let minPlayers = 0;
    let maxPlayers = Infinity;

    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (manifest.minPlayers !== undefined) {
        minPlayers = Math.max(minPlayers, manifest.minPlayers);
      }
      if (manifest.maxPlayers !== undefined) {
        maxPlayers = Math.min(maxPlayers, manifest.maxPlayers);
      }
    }

    if (minPlayers > maxPlayers) {
      result.addIssue('player_range',
        `Incompatible player ranges: min ${minPlayers} > max ${maxPlayers}`, {
        minPlayers,
        maxPlayers,
      });
    }
  }

  /**
   * 檢查性狀衝突
   */
  _checkTraitConflicts(expansions, result) {
    const traitSources = new Map();

    for (const [id, loadResult] of expansions) {
      const module = loadResult.module;
      if (!module.traits) continue;

      for (const traitType of Object.keys(module.traits)) {
        if (traitSources.has(traitType)) {
          const existingSource = traitSources.get(traitType);
          // 基礎版可被擴充包覆寫
          if (existingSource === 'base') {
            result.addSuggestion(`Trait "${traitType}" will be overridden by "${id}"`);
            traitSources.set(traitType, id);
          } else {
            result.addIssue('trait_conflict',
              `Trait "${traitType}" defined in multiple expansions: "${existingSource}" and "${id}"`, {
              traitType,
              expansions: [existingSource, id],
            });
          }
        } else {
          traitSources.set(traitType, id);
        }
      }
    }
  }

  /**
   * 產生建議
   */
  _generateSuggestions(expansions, result) {
    // 計算總卡牌數
    let totalCards = 0;
    for (const [id, loadResult] of expansions) {
      const manifest = loadResult.manifest;
      if (manifest.contents?.cards) {
        totalCards += manifest.contents.cards;
      }
    }

    if (totalCards > 150) {
      result.addSuggestion(
        `Total cards (${totalCards}) is high. Consider longer game sessions.`
      );
    }
  }

  /**
   * 版本匹配
   */
  _matchVersion(version, range) {
    if (range.startsWith('>=')) {
      const required = range.slice(2);
      return this._compareVersions(version, required) >= 0;
    }
    if (range.startsWith('^')) {
      const required = range.slice(1);
      const [major1] = version.split('.');
      const [major2] = required.split('.');
      return major1 === major2 && this._compareVersions(version, required) >= 0;
    }
    return version === range;
  }

  /**
   * 比較版本
   */
  _compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      if (pa[i] > pb[i]) return 1;
      if (pa[i] < pb[i]) return -1;
    }
    return 0;
  }
}

// 預設實例
export const compatibilityChecker = new CompatibilityChecker();
```

### 3. 驗證 API

```javascript
// shared/expansions/validateExpansion.js

import { expansionValidator } from './validator.js';
import { compatibilityChecker } from './compatibility.js';
import { expansionLoader } from './loader.js';

/**
 * 驗證單一擴充包
 */
export async function validateExpansion(expansionId) {
  const loadResult = await expansionLoader.load(expansionId);

  if (!loadResult.success) {
    return {
      valid: false,
      loaded: false,
      error: loadResult.error,
    };
  }

  const validation = expansionValidator.validate(loadResult.module);

  return {
    valid: validation.valid,
    loaded: true,
    validation: validation.toJSON(),
    manifest: loadResult.manifest,
    loadTime: loadResult.loadTime,
  };
}

/**
 * 驗證擴充包組合
 */
export async function validateExpansionCombination(expansionIds) {
  // 先驗證每個擴充包
  const individualResults = await Promise.all(
    expansionIds.map(id => validateExpansion(id))
  );

  const allValid = individualResults.every(r => r.valid);
  if (!allValid) {
    return {
      valid: false,
      individual: individualResults,
      compatibility: null,
    };
  }

  // 檢查相容性
  const compatibility = await compatibilityChecker.check(expansionIds);

  return {
    valid: compatibility.compatible,
    individual: individualResults,
    compatibility: compatibility.toJSON(),
  };
}

/**
 * 快速檢查擴充包組合是否可用
 */
export async function canUseExpansions(expansionIds) {
  const result = await validateExpansionCombination(expansionIds);
  return result.valid;
}
```

---

## 測試需求

```javascript
// tests/unit/expansions/validator.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { ExpansionValidator, ValidationResult } from '@shared/expansions/validator.js';
import { EXPANSION_TYPE } from '@shared/expansions/manifest.js';

describe('ValidationResult', () => {
  it('should be valid by default', () => {
    const result = new ValidationResult();
    expect(result.valid).toBe(true);
  });

  it('should become invalid on error', () => {
    const result = new ValidationResult();
    result.addError('Test error');
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('should merge results', () => {
    const r1 = new ValidationResult();
    r1.addError('Error 1');

    const r2 = new ValidationResult();
    r2.addWarning('Warning 1');

    r1.merge(r2);

    expect(r1.valid).toBe(false);
    expect(r1.errors).toHaveLength(1);
    expect(r1.warnings).toHaveLength(1);
  });
});

describe('ExpansionValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new ExpansionValidator();
  });

  describe('validateManifest', () => {
    it('should reject missing manifest', () => {
      const result = validator.validateManifest({});
      expect(result.valid).toBe(false);
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
    });
  });

  describe('validateCards', () => {
    it('should validate card definitions', () => {
      const traits = {
        TRAIT_A: { type: 'TRAIT_A', name: 'A' },
        TRAIT_B: { type: 'TRAIT_B', name: 'B' },
      };
      const cards = [
        { id: 'CARD_1', frontTrait: 'TRAIT_A', backTrait: 'TRAIT_B', count: 4 },
      ];
      const result = validator.validateCards(cards, traits, 'test');
      expect(result.valid).toBe(true);
    });

    it('should report unknown traits', () => {
      const traits = {};
      const cards = [
        { id: 'CARD_1', frontTrait: 'UNKNOWN', backTrait: 'ALSO_UNKNOWN', count: 4 },
      ];
      const result = validator.validateCards(cards, traits, 'test');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
    });
  });

  describe('full validation', () => {
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
  });
});
```

---

## 驗收標準

1. [ ] `ValidationResult` 正確追蹤錯誤/警告
2. [ ] `ExpansionValidator` 驗證 Manifest
3. [ ] 性狀定義驗證完整
4. [ ] 卡牌定義驗證完整
5. [ ] 處理器驗證正常
6. [ ] `CompatibilityChecker` 檢測依賴
7. [ ] 衝突檢測正常
8. [ ] 玩家數範圍檢查正常
9. [ ] 驗證 API 可用
10. [ ] 所有單元測試通過

---

## 備註

- 驗證系統確保擴充包品質
- 開發者可擴展自訂驗證器
- 相容性檢查在遊戲開始前執行
