/**
 * 語言切換器組件
 *
 * @description 支援繁體中文、簡體中文、英文、日文的語言切換
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'zh-TW', key: 'language.zh-TW' },
  { code: 'zh-CN', key: 'language.zh-CN' },
  { code: 'en', key: 'language.en' },
  { code: 'ja', key: 'language.ja' },
];

function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <label className="language-switcher__label" htmlFor="language-select">
        {t('language.switcher')}
      </label>
      <select
        id="language-select"
        className="language-switcher__select"
        value={i18n.language}
        onChange={handleChange}
        aria-label={t('language.switcher')}
      >
        {LANGUAGES.map(({ code, key }) => (
          <option key={code} value={code}>
            {t(key)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
