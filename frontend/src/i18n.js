/**
 * i18n 多語系設定
 *
 * 支援語系：
 * - zh-TW：繁體中文（預設）
 * - zh-CN：簡體中文
 * - en：英文
 * - ja：日文
 *
 * @module i18n
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhTW from './locales/zh-TW/translation.json';
import zhCN from './locales/zh-CN/translation.json';
import en from './locales/en/translation.json';
import ja from './locales/ja/translation.json';

/**
 * 支援的語系列表
 */
export const SUPPORTED_LANGUAGES = ['zh-TW', 'zh-CN', 'en', 'ja'];

/**
 * 預設語系
 */
export const DEFAULT_LANGUAGE = 'zh-TW';

/**
 * 偵測瀏覽器語系
 * @returns {string} 支援的語系代碼
 */
function detectBrowserLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || DEFAULT_LANGUAGE;

  // 完全匹配
  if (SUPPORTED_LANGUAGES.includes(browserLang)) {
    return browserLang;
  }

  // 前綴匹配（例如 zh-HK → zh-TW）
  const prefix = browserLang.split('-')[0];
  if (prefix === 'zh') {
    // 根據地區判斷繁簡
    const region = browserLang.split('-')[1]?.toUpperCase();
    if (region === 'CN' || region === 'SG' || region === 'MY') {
      return 'zh-CN';
    }
    return 'zh-TW';
  }
  if (prefix === 'ja') return 'ja';
  if (prefix === 'en') return 'en';

  return DEFAULT_LANGUAGE;
}

/**
 * 從 localStorage 讀取儲存的語系設定
 * @returns {string|null} 儲存的語系或 null
 */
function getSavedLanguage() {
  try {
    return localStorage.getItem('i18n_language');
  } catch {
    return null;
  }
}

const savedLanguage = getSavedLanguage();
const initialLanguage = savedLanguage || detectBrowserLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'zh-TW': { translation: zhTW },
      'zh-CN': { translation: zhCN },
      en: { translation: en },
      ja: { translation: ja }
    },
    // lng: 初始語系（i18next API 屬性名稱）
    lng: initialLanguage,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false
    }
  });

/**
 * 切換語系並儲存到 localStorage
 * @param {string} language - 目標語系代碼
 */
export function changeLanguage(language) {
  if (SUPPORTED_LANGUAGES.includes(language)) {
    i18n.changeLanguage(language);
    try {
      localStorage.setItem('i18n_language', language);
    } catch {
      // localStorage 不可用時靜默失敗
    }
  }
}

export default i18n;
