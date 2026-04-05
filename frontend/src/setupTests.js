/**
 * Jest 測試設定
 *
 * @description 測試環境的初始化設定
 */

import '@testing-library/jest-dom';

// react-i18next mock - 使用 zh-TW 翻譯值
jest.mock('react-i18next', () => {
  const zhTW = require('./locales/zh-TW/translation.json');

  // 簡易巢狀 key 解析（支援 'a.b.c' 格式）
  function getNestedValue(obj, key) {
    return key.split('.').reduce((acc, part) => {
      return acc && typeof acc === 'object' ? acc[part] : undefined;
    }, obj);
  }

  const t = (key, opts) => {
    const val = getNestedValue(zhTW, key);
    if (typeof val === 'string') {
      if (opts) {
        return val.replace(/\{\{(\w+)\}\}/g, (_, k) => (opts[k] !== undefined ? opts[k] : `{{${k}}}`));
      }
      return val;
    }
    return key;
  };

  return {
    useTranslation: () => ({
      t,
      i18n: {
        language: 'zh-TW',
        resolvedLanguage: 'zh-TW',
        changeLanguage: jest.fn()
      }
    }),
    Trans: ({ children }) => children,
    I18nextProvider: ({ children }) => children,
    initReactI18next: { type: '3rdParty', init: jest.fn() }
  };
});
