/**
 * i18n 多語系設定
 *
 * @module i18n
 * @description 整合 i18next、react-i18next 與瀏覽器語系自動偵測
 * 支援：繁體中文 (zh-TW)、簡體中文 (zh-CN)、英文 (en)、日文 (ja)
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhTW from './locales/zh-TW/translation.json';
import zhCN from './locales/zh-CN/translation.json';
import en from './locales/en/translation.json';
import ja from './locales/ja/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-TW': { translation: zhTW },
      'zh-CN': { translation: zhCN },
      en: { translation: en },
      ja: { translation: ja }
    },
    fallbackLng: 'zh-TW',
    supportedLngs: ['zh-TW', 'zh-CN', 'en', 'ja'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
