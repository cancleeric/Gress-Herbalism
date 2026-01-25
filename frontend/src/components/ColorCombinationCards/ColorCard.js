/**
 * 單張顏色組合牌組件
 *
 * @module ColorCard
 * @description 顯示單張顏色組合牌，包含兩種顏色的圖示
 */

import React from 'react';

/**
 * 顏色對應的 emoji 圖示
 */
const COLOR_ICONS = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵'
};

/**
 * 顏色對應的中文名稱
 */
const COLOR_NAMES = {
  red: '紅',
  yellow: '黃',
  green: '綠',
  blue: '藍'
};

/**
 * 單張顏色組合牌組件
 *
 * @param {Object} props - 組件屬性
 * @param {Object} props.card - 卡牌資料
 * @param {string} props.card.id - 卡牌ID
 * @param {string[]} props.card.colors - 兩種顏色陣列
 * @param {string} props.card.name - 卡牌名稱
 * @param {boolean} props.selected - 是否被選中
 * @param {boolean} props.disabled - 是否禁用
 * @param {Function} props.onClick - 點擊事件處理函數
 * @returns {JSX.Element} 顏色組合牌組件
 */
function ColorCard({ card, selected = false, disabled = false, onClick }) {
  const [color1, color2] = card.colors;

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(card);
    }
  };

  const cardClassName = [
    'color-card',
    selected ? 'selected' : '',
    disabled ? 'disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClassName}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-selected={selected}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* 左上角顏色圖示 */}
      <span className="color-icon top-left">
        {COLOR_ICONS[color1]}
      </span>

      {/* 卡牌中央圖案區域 */}
      <div className="card-illustration">
        <div className={`color-stripe color-${color1}`} />
        <div className={`color-stripe color-${color2}`} />
      </div>

      {/* 卡牌名稱 */}
      <span className="card-name">
        {COLOR_NAMES[color1]}{COLOR_NAMES[color2]}
      </span>

      {/* 右下角顏色圖示 */}
      <span className="color-icon bottom-right">
        {COLOR_ICONS[color2]}
      </span>
    </div>
  );
}

export default ColorCard;
