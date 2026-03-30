/**
 * 語系切換組件
 *
 * @module LanguageSwitcher
 * @description 提供語系切換功能的下拉選單組件
 */

import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { changeLanguage, SUPPORTED_LANGUAGES } from '../../../i18n';
import './LanguageSwitcher.css';

/**
 * 語系旗幟表情符號對照
 */
const LANGUAGE_FLAGS = {
  'zh-TW': '🇹🇼',
  'zh-CN': '🇨🇳',
  'en': '🇺🇸',
  'ja': '🇯🇵'
};

/**
 * 語系切換組件
 *
 * @param {Object} props - 組件屬性
 * @param {string} [props.className] - 額外的 CSS 類別名稱
 * @param {boolean} [props.showFlag] - 是否顯示旗幟
 * @param {boolean} [props.showLabel] - 是否顯示語言標籤
 * @returns {JSX.Element} 語系切換下拉選單
 */
function LanguageSwitcher({ className = '', showFlag = true, showLabel = true }) {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className={`language-switcher ${className}`}>
      {showLabel && (
        <label className="language-switcher-label" htmlFor="language-select">
          {t('settings.language')}
        </label>
      )}
      <div className="language-switcher-select-wrapper">
        {showFlag && (
          <span className="language-flag" aria-hidden="true">
            {LANGUAGE_FLAGS[currentLanguage] || '🌐'}
          </span>
        )}
        <select
          id="language-select"
          className="language-switcher-select"
          value={currentLanguage}
          onChange={handleChange}
          aria-label={t('settings.language')}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {t(`settings.languages.${lang}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

LanguageSwitcher.propTypes = {
  className: PropTypes.string,
  showFlag: PropTypes.bool,
  showLabel: PropTypes.bool
};

export default LanguageSwitcher;
