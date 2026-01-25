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
 * @param {string|null} props.myDisabledCardId - 自己上回合選過的牌ID（會顯示禁止圖示）
 * @param {Object} props.cardMarkers - 卡牌上的玩家標記 { cardId: { playerId, playerName } }
 * @param {string|null} props.currentPlayerId - 當前玩家ID（用於判斷是否是自己的標記）
 * @param {boolean} props.interactive - 是否可互動（問牌時為true，純展示時為false）
 * @param {Function} props.onCardSelect - 選擇卡牌時的回調函數
 * @param {Function} props.onDisabledCardClick - 點擊禁用牌時的回調函數
 * @returns {JSX.Element} 顏色組合牌容器組件
 */
function ColorCombinationCards({
  selectedCardId = null,
  disabledCardIds = [],
  myDisabledCardId = null,
  cardMarkers = {},
  currentPlayerId = null,
  interactive = false,
  onCardSelect,
  onDisabledCardClick
}) {
  const handleCardClick = (card) => {
    if (interactive && onCardSelect) {
      onCardSelect(card);
    }
  };

  const handleDisabledClick = (card) => {
    if (onDisabledCardClick) {
      onDisabledCardClick(card);
    }
  };

  /**
   * 判斷卡牌是否被禁用
   */
  const isCardDisabled = (cardId) => {
    return !interactive || disabledCardIds.includes(cardId) || cardId === myDisabledCardId;
  };

  /**
   * 判斷卡牌是否因自己上回合選過而禁用
   */
  const isDisabledBySelf = (cardId) => {
    return interactive && cardId === myDisabledCardId;
  };

  /**
   * 取得卡牌的玩家標記
   */
  const getCardMarker = (cardId) => {
    return cardMarkers[cardId] || null;
  };

  return (
    <div className="color-combination-cards">
      <h3 className="cards-title">顏色組合牌</h3>
      <div className="cards-grid">
        {COLOR_COMBINATION_CARDS.map((card) => {
          const marker = getCardMarker(card.id);
          return (
            <ColorCard
              key={card.id}
              card={card}
              selected={selectedCardId === card.id}
              disabled={isCardDisabled(card.id)}
              disabledBySelf={isDisabledBySelf(card.id)}
              markedByPlayer={marker?.playerName || null}
              isMyMark={marker?.playerId === currentPlayerId}
              onClick={handleCardClick}
              onDisabledClick={handleDisabledClick}
            />
          );
        })}
      </div>
    </div>
  );
}

export default ColorCombinationCards;
