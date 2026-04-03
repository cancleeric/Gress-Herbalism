/**
 * Jest 測試設定
 *
 * @description 測試環境的初始化設定
 */

import '@testing-library/jest-dom';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      // Return the last part of the key as a simple fallback
      const parts = key.split('.');
      return parts[parts.length - 1];
    },
    i18n: {
      language: 'zh-TW',
      changeLanguage: jest.fn(),
    },
  }),
  Trans: ({ children }) => children,
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));
