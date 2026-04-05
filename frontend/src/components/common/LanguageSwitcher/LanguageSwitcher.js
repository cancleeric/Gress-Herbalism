/**
 * 語系切換組件
 *
 * @module LanguageSwitcher
 * @description 提供 UI 切換應用語系（繁中／簡中／英文／日文）
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LANGUAGES = [
  { code: 'zh-TW', label: '繁中' },
  { code: 'zh-CN', label: '简中' },
  { code: 'en', label: 'EN' },
  { code: 'ja', label: '日本語' }
];

/**
 * 語系切換下拉選單
 *
 * @returns {JSX.Element}
 */
function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const handleChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <label className="language-switcher-label" htmlFor="language-select">
        {t('languageSwitcher.label')}
      </label>
      <select
        id="language-select"
        className="language-switcher-select"
        value={i18n.resolvedLanguage || i18n.language}
        onChange={handleChange}
        aria-label={t('languageSwitcher.label')}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LanguageSwitcher;
