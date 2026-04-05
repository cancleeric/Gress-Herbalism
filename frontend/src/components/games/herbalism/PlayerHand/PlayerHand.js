/**
 * 玩家手牌組件
 *
 * @module PlayerHand
 * @description 顯示玩家自己的手牌
 */

import React, { useState, memo } from 'react';
import PropTypes from 'prop-types';
import './PlayerHand.css';

/**
 * 單張卡牌組件
 *
 * @param {Object} props - 組件屬性
 * @param {Object} props.card - 卡牌資料
 * @param {boolean} props.isSelected - 是否被選中
 * @param {boolean} props.isSelectable - 是否可選擇
 * @param {Function} props.onClick - 點擊事件處理
 * @param {number} props.index - 卡牌索引
 * @returns {JSX.Element} 卡牌組件
 */
function Card({ card, isSelected = false, isSelectable = false, onClick = null, index = 0 }) {
  const cardClass = [
    'hand-card',
    `card-${card.color}`,
    isSelected ? 'selected' : '',
    isSelectable ? 'selectable' : ''
  ].filter(Boolean).join(' ');

  /**
   * 處理卡牌點擊
   */
  const handleClick = () => {
    if (isSelectable && onClick) {
      onClick(card);
    }
  };

  /**
   * 處理鍵盤事件
   * @param {React.KeyboardEvent} e - 鍵盤事件
   */
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && isSelectable) {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={cardClass}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={isSelectable ? 'button' : 'presentation'}
      tabIndex={isSelectable ? 0 : -1}
      aria-pressed={isSelected}
      aria-label={`${card.color} 牌${isSelected ? ' (已選擇)' : ''}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <span className="card-color-label">{card.color}</span>
    </div>
  );
}

Card.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string,
    color: PropTypes.string.isRequired
  }).isRequired,
  isSelected: PropTypes.bool,
  isSelectable: PropTypes.bool,
  onClick: PropTypes.func,
  index: PropTypes.number
};


/**
 * 玩家手牌組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.cards - 手牌陣列
 * @param {boolean} props.selectable - 是否可選擇卡牌
 * @param {boolean} props.multiSelect - 是否可多選
 * @param {Function} props.onCardSelect - 卡牌選擇回調
 * @param {Array} props.selectedCardIds - 已選擇的卡牌ID列表
 * @param {string} props.title - 區域標題
 * @returns {JSX.Element} 玩家手牌組件
 */
function PlayerHand({
  cards = [],
  selectable = false,
  multiSelect = false,
  onCardSelect,
  selectedCardIds = [],
  title = '我的手牌'
}) {
  // 本地狀態（當沒有外部控制時使用）
  const [localSelectedIds, setLocalSelectedIds] = useState([]);

  // 使用外部或本地的選擇狀態
  const effectiveSelectedIds = selectedCardIds.length > 0 ? selectedCardIds : localSelectedIds;

  /**
   * 處理卡牌選擇
   * @param {Object} card - 被選擇的卡牌
   */
  const handleCardClick = (card) => {
    if (!selectable) return;

    let newSelectedIds;

    if (multiSelect) {
      // 多選模式
      if (effectiveSelectedIds.includes(card.id)) {
        newSelectedIds = effectiveSelectedIds.filter(id => id !== card.id);
      } else {
        newSelectedIds = [...effectiveSelectedIds, card.id];
      }
    } else {
      // 單選模式
      if (effectiveSelectedIds.includes(card.id)) {
        newSelectedIds = [];
      } else {
        newSelectedIds = [card.id];
      }
    }

    // 更新本地狀態
    setLocalSelectedIds(newSelectedIds);

    // 調用外部回調
    if (onCardSelect) {
      onCardSelect(newSelectedIds);
    }
  };

  /**
   * 依顏色分組手牌
   * @returns {Object} 分組後的手牌
   */
  const groupCardsByColor = () => {
    const groups = {};
    cards.forEach(card => {
      if (!groups[card.color]) {
        groups[card.color] = [];
      }
      groups[card.color].push(card);
    });
    return groups;
  };

  /**
   * 計算各顏色的數量
   * @returns {Object} 顏色計數
   */
  const getColorCounts = () => {
    const counts = {};
    cards.forEach(card => {
      counts[card.color] = (counts[card.color] || 0) + 1;
    });
    return counts;
  };

  const colorCounts = getColorCounts();

  return (
    <div className="player-hand">
      <div className="hand-header">
        <h3 className="hand-title">{title}</h3>
        <span className="hand-count">{cards.length} 張牌</span>
      </div>

      {cards.length === 0 ? (
        <div className="no-cards-message">
          <p>目前沒有手牌</p>
        </div>
      ) : (
        <>
          <div className="hand-cards">
            {cards.map((card, index) => (
              <Card
                key={card.id || `card-${index}`}
                card={card}
                isSelected={effectiveSelectedIds.includes(card.id)}
                isSelectable={selectable}
                onClick={handleCardClick}
                index={index}
              />
            ))}
          </div>

          {/* 顏色統計 */}
          <div className="color-summary">
            {Object.entries(colorCounts).map(([color, count]) => (
              <span key={color} className={`color-count color-${color}`}>
                {color}: {count}
              </span>
            ))}
          </div>
        </>
      )}

      {/* 選擇提示 */}
      {selectable && effectiveSelectedIds.length > 0 && (
        <div className="selection-info">
          已選擇 {effectiveSelectedIds.length} 張牌
        </div>
      )}
    </div>
  );
}

PlayerHand.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    color: PropTypes.string.isRequired
  })),
  selectable: PropTypes.bool,
  multiSelect: PropTypes.bool,
  onCardSelect: PropTypes.func,
  selectedCardIds: PropTypes.arrayOf(PropTypes.string),
  title: PropTypes.string
};

// Issue #7：React.memo 避免手牌在無關狀態更新時重渲染
export default memo(PlayerHand);
