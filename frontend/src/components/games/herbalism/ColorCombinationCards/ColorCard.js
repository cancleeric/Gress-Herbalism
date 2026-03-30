/**
 * 單張顏色組合牌組件
 *
 * @module ColorCard
 * @description 顯示單張顏色組合牌，使用雙色卡片圖片
 * @updated 2026-01-31 工單 0215：將 emoji + 條紋替換為卡片圖片
 */

import React, { memo } from 'react';

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
 * @param {boolean} props.disabledBySelf - 是否因自己上回合選過而禁用
 * @param {string|null} props.markedByPlayer - 標記的玩家名稱
 * @param {boolean} props.isMyMark - 是否是自己的標記
 * @param {Function} props.onClick - 點擊事件處理函數
 * @param {Function} props.onDisabledClick - 點擊禁用牌時的回調
 * @returns {JSX.Element} 顏色組合牌組件
 */
const ColorCard = memo(function ColorCard({
  card,
  selected = false,
  disabled = false,
  disabledBySelf = false,
  markedByPlayer = null,
  isMyMark = false,
  onClick,
  onDisabledClick
}) {
  const handleClick = () => {
    if (disabledBySelf && onDisabledClick) {
      onDisabledClick(card);
      return;
    }
    if (!disabled && onClick) {
      onClick(card);
    }
  };

  const cardClassName = [
    'color-card',
    selected ? 'selected' : '',
    disabled ? 'disabled' : '',
    disabledBySelf ? 'disabled-by-self' : '',
    markedByPlayer ? 'has-marker' : ''
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
      {/* 卡牌圖片區域（工單 0215：使用雙色卡片圖片） */}
      <div className="card-illustration">
        <img
          src={`/images/cards/${card.id}.jpg`}
          alt={card.name}
          className="card-image"
          onError={(e) => {
            // 圖片載入失敗時隱藏圖片
            e.target.style.display = 'none';
          }}
        />
      </div>

      {/* 卡牌名稱 */}
      <span className="card-name">
        {card.name}
      </span>

      {/* 玩家標記（工單 0075，工單 0077：移除「你」字樣） */}
      {markedByPlayer && !isMyMark && (
        <div className="player-marker">
          <span className="marker-name">
            {markedByPlayer}
          </span>
        </div>
      )}

      {/* 禁用遮罩（自己上回合選過） */}
      {disabledBySelf && (
        <div className="disabled-overlay">
          <span className="disabled-icon">🚫</span>
        </div>
      )}
    </div>
  );
});

export default ColorCard;
