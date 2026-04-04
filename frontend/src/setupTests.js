/**
 * Jest 測試設定
 *
 * @description 測試環境的初始化設定
 */

import '@testing-library/jest-dom';

// Mock react-i18next for tests
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => {
      if (options) {
        return key.replace(/\{\{(\w+)\}\}/g, (_, k) => options[k] ?? `{{${k}}}`);
      }
      return key;
    },
    i18n: {
      language: 'zh-TW',
      changeLanguage: jest.fn(),
    },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  Trans: ({ children }) => children,
}));
