/**
 * Jest 測試設定
 *
 * @description 測試環境的初始化設定
 */

import '@testing-library/jest-dom';

// ==================== react-i18next Mock ====================
// 使用繁體中文翻譯（預設語系）確保現有測試正常運行

const zhTW = require('./locales/zh-TW/translation.json');

/**
 * 從巢狀物件中取得翻譯值
 * @param {Object} obj - 翻譯物件
 * @param {string} key - 以 . 分隔的鍵值路徑
 * @returns {string|Object} 翻譯值
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

/**
 * 翻譯函數 - 對應 i18next 的 t() 行為
 * @param {string} key - 翻譯鍵
 * @param {Object} [options] - 插值選項
 * @returns {string} 翻譯後的文字
 */
function mockT(key, options) {
  const value = getNestedValue(zhTW, key);
  if (value === undefined) {
    return options?.defaultValue !== undefined ? options.defaultValue : key;
  }
  if (typeof value === 'string' && options) {
    // 處理插值（例如 {{count}}）
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) =>
      options[k] !== undefined ? String(options[k]) : `{{${k}}}`
    );
  }
  return typeof value === 'string' ? value : key;
}

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'zh-TW'
    }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn()
  },
  Trans: ({ i18nKey, children }) => children || i18nKey
}));
