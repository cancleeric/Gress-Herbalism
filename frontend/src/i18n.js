/**
 * i18n 國際化設定
 *
 * @description 支援語言：繁體中文、簡體中文、英文、日文
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTW from './locales/zh-TW/translation.json';
import zhCN from './locales/zh-CN/translation.json';
import en from './locales/en/translation.json';
import ja from './locales/ja/translation.json';

const LANGUAGE_STORAGE_KEY = 'herbalism-language';

const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'zh-TW';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-TW': { translation: zhTW },
      'zh-CN': { translation: zhCN },
      en: { translation: en },
      ja: { translation: ja },
    },
    lng: savedLanguage,
    fallbackLng: 'zh-TW',
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
});

export default i18n;
