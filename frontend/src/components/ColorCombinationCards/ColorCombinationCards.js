/**
 * 六張顏色組合牌容器組件
 *
 * @module ColorCombinationCards
 * @description 顯示六張顏色組合牌，用於問牌時選擇顏色組合
 */

import React from 'react';
import ColorCard from './ColorCard';
import { COLOR_COMBINATION_CARDS } from '../../shared/constants';
import './ColorCombinationCards.css';

/**
 * 六張顏色組合牌容器組件
 *
 * @param {Object} props - 組件屬性
 * @param {string|null} props.selectedCardId - 已選擇的卡牌ID
 * @param {string[]} props.disabledCardIds - 禁用的卡牌ID列表
 * @param {boolean} props.interactive - 是否可互動（問牌時為true，純展示時為false）
 * @param {Function} props.onCardSelect - 選擇卡牌時的回調函數
 * @returns {JSX.Element} 顏色組合牌容器組件
 */
function ColorCombinationCards({
  selectedCardId = null,
  disabledCardIds = [],
  interactive = false,
  onCardSelect
}) {
  const handleCardClick = (card) => {
    if (interactive && onCardSelect) {
      onCardSelect(card);
    }
  };

  return (
    <div className="color-combination-cards">
      <h3 className="cards-title">顏色組合牌</h3>
      <div className="cards-grid">
        {COLOR_COMBINATION_CARDS.map((card) => (
          <ColorCard
            key={card.id}
            card={card}
            selected={selectedCardId === card.id}
            disabled={!interactive || disabledCardIds.includes(card.id)}
            onClick={handleCardClick}
          />
        ))}
      </div>
    </div>
  );
}

export default ColorCombinationCards;
