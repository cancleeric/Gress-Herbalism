/**
 * 擴充包介面定義
 *
 * 此模組定義了所有擴充包必須遵循的介面規範。
 * 擴充包是演化論遊戲的模組化單元，可包含新的性狀、卡牌和規則。
 *
 * @module expansions/ExpansionInterface
 */

/**
 * 擴充包介面規範
 * 所有擴充包必須符合此介面
 *
 * @typedef {Object} ExpansionInterface
 *
 * @property {string} id - 唯一識別碼（只允許小寫字母、數字、連字號）
 *   @example 'base', 'flight', 'timeline'
 *
 * @property {string} name - 顯示名稱（中文）
 *   @example '物種起源', '飛翔', '時間軸'
 *
 * @property {string} version - 語意化版本號
 *   @example '1.0.0', '2.1.3'
 *
 * @property {string} description - 擴充包描述
 *
 * @property {string[]} [requires=[]] - 依賴的擴充包 ID 列表
 *   @example ['base'] - 表示此擴充包需要基礎包才能運作
 *
 * @property {string[]} [incompatible=[]] - 不相容的擴充包 ID 列表
 *   @example ['timeline'] - 表示此擴充包與時間軸擴充包不相容
 *
 * @property {Object<string, TraitHandler>} [traits={}] - 性狀處理器映射
 *   鍵為性狀類型，值為對應的 TraitHandler 實例
 *
 * @property {CardDefinition[]} [cards=[]] - 卡牌定義陣列
 *   定義此擴充包新增的卡牌
 *
 * @property {Object} [rules={}] - 規則定義
 *   可覆寫或擴展的遊戲規則
 *
 * @property {Function} [onRegister] - 註冊時調用的鉤子
 *   @param {ExpansionRegistry} registry - 擴充包註冊表
 *
 * @property {Function} [onEnable] - 啟用時調用的鉤子
 *   @param {ExpansionRegistry} registry - 擴充包註冊表
 *
 * @property {Function} [onDisable] - 停用時調用的鉤子
 *   @param {ExpansionRegistry} registry - 擴充包註冊表
 *
 * @property {Function} [onGameInit] - 遊戲初始化時調用的鉤子
 *   @param {Object} gameState - 遊戲狀態
 *
 * @property {Function} [onGameEnd] - 遊戲結束時調用的鉤子
 *   @param {Object} gameState - 遊戲狀態
 */

/**
 * 卡牌定義規範
 *
 * @typedef {Object} CardDefinition
 * @property {string} id - 卡牌唯一識別碼
 * @property {string} frontTrait - 正面性狀類型
 * @property {string} backTrait - 背面性狀類型
 * @property {number} [count=1] - 此卡牌在牌組中的數量
 */

/**
 * 擴充包必要欄位列表
 * @constant {string[]}
 */
const REQUIRED_FIELDS = ['id', 'name', 'version'];

/**
 * 擴充包可選欄位列表（含預設值類型）
 * @constant {Object<string, string>}
 */
const OPTIONAL_FIELDS = {
  description: 'string',
  requires: 'array',
  incompatible: 'array',
  traits: 'object',
  cards: 'array',
  rules: 'object',
  onRegister: 'function',
  onEnable: 'function',
  onDisable: 'function',
  onGameInit: 'function',
  onGameEnd: 'function',
};

/**
 * ID 格式正規表達式（只允許小寫字母、數字、連字號）
 * @constant {RegExp}
 */
const ID_PATTERN = /^[a-z0-9-]+$/;

/**
 * 版本格式正規表達式（語意化版本 x.y.z）
 * @constant {RegExp}
 */
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * 建立空的擴充包模板
 * @param {Object} overrides - 要覆寫的屬性
 * @returns {Object} 擴充包模板
 */
function createExpansionTemplate(overrides = {}) {
  return {
    id: '',
    name: '',
    version: '1.0.0',
    description: '',
    requires: [],
    incompatible: [],
    traits: {},
    cards: [],
    rules: {},
    ...overrides,
  };
}

/**
 * 檢查物件是否符合擴充包介面
 * @param {Object} obj - 要檢查的物件
 * @returns {{ valid: boolean, errors: string[] }} 驗證結果
 */
function validateExpansionInterface(obj) {
  const errors = [];

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['擴充包必須是物件'] };
  }

  // 檢查必要欄位
  for (const field of REQUIRED_FIELDS) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push(`缺少必要欄位: ${field}`);
    } else if (typeof obj[field] !== 'string') {
      errors.push(`欄位 ${field} 必須是字串`);
    } else if (obj[field].trim() === '') {
      errors.push(`欄位 ${field} 不能為空`);
    }
  }

  // 檢查 ID 格式
  if (obj.id && typeof obj.id === 'string' && !ID_PATTERN.test(obj.id)) {
    errors.push('id 只能包含小寫字母、數字和連字號');
  }

  // 檢查版本格式
  if (obj.version && typeof obj.version === 'string' && !VERSION_PATTERN.test(obj.version)) {
    errors.push('version 必須符合語意化版本格式 (x.y.z)');
  }

  // 檢查可選欄位類型
  for (const [field, expectedType] of Object.entries(OPTIONAL_FIELDS)) {
    if (obj[field] !== undefined && obj[field] !== null) {
      const actualType = Array.isArray(obj[field]) ? 'array' : typeof obj[field];
      if (actualType !== expectedType) {
        errors.push(`欄位 ${field} 必須是 ${expectedType}，但得到 ${actualType}`);
      }
    }
  }

  // 檢查自我依賴
  if (Array.isArray(obj.requires) && obj.requires.includes(obj.id)) {
    errors.push('擴充包不能依賴自己');
  }

  // 檢查自我不相容
  if (Array.isArray(obj.incompatible) && obj.incompatible.includes(obj.id)) {
    errors.push('擴充包不能與自己不相容');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = {
  REQUIRED_FIELDS,
  OPTIONAL_FIELDS,
  ID_PATTERN,
  VERSION_PATTERN,
  createExpansionTemplate,
  validateExpansionInterface,
};
