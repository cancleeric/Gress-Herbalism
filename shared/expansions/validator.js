/**
 * 擴充包驗證器
 *
 * 提供擴充包結構、性狀、卡牌的完整驗證功能
 *
 * @module expansions/validator
 */

const { validateManifest, EXPANSION_TYPE } = require('./manifest');

/**
 * 驗證結果類別
 */
class ValidationResult {
  constructor() {
    this.valid = true;
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * 新增錯誤
   * @param {string} message - 錯誤訊息
   * @param {Object|null} context - 上下文資訊
   */
  addError(message, context = null) {
    this.valid = false;
    this.errors.push({ message, context });
  }

  /**
   * 新增警告
   * @param {string} message - 警告訊息
   * @param {Object|null} context - 上下文資訊
   */
  addWarning(message, context = null) {
    this.warnings.push({ message, context });
  }

  /**
   * 新增資訊
   * @param {string} message - 資訊訊息
   * @param {Object|null} context - 上下文資訊
   */
  addInfo(message, context = null) {
    this.info.push({ message, context });
  }

  /**
   * 合併另一個驗證結果
   * @param {ValidationResult} other - 其他驗證結果
   */
  merge(other) {
    if (!other.valid) this.valid = false;
    this.errors.push(...other.errors);
    this.warnings.push(...other.warnings);
    this.info.push(...other.info);
  }

  /**
   * 轉換為 JSON
   * @returns {Object}
   */
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
class ExpansionValidator {
  constructor() {
    /** @type {Function[]} 自訂性狀驗證器 */
    this.traitValidators = [];

    /** @type {Function[]} 自訂卡牌驗證器 */
    this.cardValidators = [];

    /** @type {Function[]} 自訂結構驗證器 */
    this.structureValidators = [];
  }

  /**
   * 註冊自訂性狀驗證器
   * @param {Function} validator - 驗證函數 (traitType, definition, expansionId) => ValidationResult
   */
  registerTraitValidator(validator) {
    this.traitValidators.push(validator);
  }

  /**
   * 註冊自訂卡牌驗證器
   * @param {Function} validator - 驗證函數 (card, traits, expansionId) => ValidationResult
   */
  registerCardValidator(validator) {
    this.cardValidators.push(validator);
  }

  /**
   * 註冊自訂結構驗證器
   * @param {Function} validator - 驗證函數 (expansion) => ValidationResult
   */
  registerStructureValidator(validator) {
    this.structureValidators.push(validator);
  }

  /**
   * 完整驗證擴充包
   * @param {Object} expansion - 擴充包模組
   * @returns {ValidationResult}
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
      const validatorResult = validator(expansion);
      if (validatorResult instanceof ValidationResult) {
        result.merge(validatorResult);
      }
    }

    return result;
  }

  /**
   * 驗證 Manifest
   * @param {Object} expansion - 擴充包模組
   * @returns {ValidationResult}
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
   * @param {Object} expansion - 擴充包模組
   * @returns {ValidationResult}
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
      const baseRequired = ['traits', 'cards', 'createDeck'];
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
   * @param {Object} traits - 性狀定義物件
   * @param {string} expansionId - 擴充包 ID
   * @returns {ValidationResult}
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
        const validatorResult = validator(traitType, definition, expansionId);
        if (validatorResult instanceof ValidationResult) {
          result.merge(validatorResult);
        }
      }
    }

    return result;
  }

  /**
   * 驗證單一性狀定義
   * @param {string} traitType - 性狀類型
   * @param {Object} definition - 性狀定義
   * @returns {ValidationResult}
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
   * @param {Array} cards - 卡牌定義陣列
   * @param {Object} traits - 性狀定義
   * @param {string} expansionId - 擴充包 ID
   * @returns {ValidationResult}
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
        const validatorResult = validator(card, traits, expansionId);
        if (validatorResult instanceof ValidationResult) {
          result.merge(validatorResult);
        }
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
   * @param {Object} handlers - 處理器物件
   * @param {Object} traits - 性狀定義
   * @returns {ValidationResult}
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

  /**
   * 重置所有自訂驗證器
   */
  reset() {
    this.traitValidators = [];
    this.cardValidators = [];
    this.structureValidators = [];
  }
}

// 預設驗證器實例
const expansionValidator = new ExpansionValidator();

module.exports = {
  ValidationResult,
  ExpansionValidator,
  expansionValidator,
};
