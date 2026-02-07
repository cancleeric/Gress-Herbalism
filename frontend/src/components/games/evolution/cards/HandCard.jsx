/**
 * HandCard - 手牌卡牌組件
 *
 * 顯示玩家手中的雙面卡，可選擇正反面使用
 *
 * @module components/games/evolution/cards/HandCard
 */

import React, { memo, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDrag } from 'react-dnd';
import { CardBase } from './CardBase';
import {
  TRAIT_ICONS,
  TRAIT_COLORS,
  TRAIT_NAMES,
  TRAIT_CATEGORY_MAP,
  TRAIT_FOOD_BONUS,
} from '../constants/traitVisuals';
import './HandCard.css';

/**
 * 拖放類型常數
 */
export const DND_TYPES = {
  HAND_CARD: 'HAND_CARD',
};

/**
 * 手牌卡牌組件
 * 顯示雙面卡，可選擇正反面使用
 */
export const HandCard = memo(function HandCard({
  card,
  selected = false,
  disabled = false,
  onSelect,
  onPlayAsCreature,
  onPlayAsTrait,
  showSideSelector = false,
  selectedSide = null,
  onSideSelect,
  className = '',
}) {
  const [isFlipped, setIsFlipped] = useState(false);

  // 取得性狀資訊
  const getFrontTraitInfo = useMemo(() => {
    const traitType = card.frontTrait;
    return {
      name: TRAIT_NAMES[traitType] || traitType,
      icon: TRAIT_ICONS[traitType] || '❓',
      category: TRAIT_CATEGORY_MAP[traitType] || 'special',
      foodBonus: TRAIT_FOOD_BONUS[traitType] || 0,
    };
  }, [card.frontTrait]);

  const getBackTraitInfo = useMemo(() => {
    const traitType = card.backTrait;
    return {
      name: TRAIT_NAMES[traitType] || traitType,
      icon: TRAIT_ICONS[traitType] || '❓',
      category: TRAIT_CATEGORY_MAP[traitType] || 'special',
      foodBonus: TRAIT_FOOD_BONUS[traitType] || 0,
    };
  }, [card.backTrait]);

  // 拖動設定
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: DND_TYPES.HAND_CARD,
      item: () => ({
        cardId: card.instanceId,
        card,
        selectedSide: selectedSide || 'front',
      }),
      canDrag: !disabled,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [card, disabled, selectedSide]
  );

  // 處理卡牌點擊
  const handleClick = useCallback(() => {
    if (disabled) return;
    onSelect?.(card.instanceId);
  }, [disabled, card.instanceId, onSelect]);

  // 處理雙擊翻轉
  const handleDoubleClick = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // 處理面選擇
  const handleSideSelect = useCallback(
    (side, e) => {
      e.stopPropagation();
      onSideSelect?.(card.instanceId, side);
    },
    [card.instanceId, onSideSelect]
  );

  // 處理作為生物打出
  const handlePlayAsCreature = useCallback(
    (e) => {
      e.stopPropagation();
      onPlayAsCreature?.(card.instanceId);
    },
    [card.instanceId, onPlayAsCreature]
  );

  // 處理作為性狀打出
  const handlePlayAsTrait = useCallback(
    (e) => {
      e.stopPropagation();
      onPlayAsTrait?.(card.instanceId);
    },
    [card.instanceId, onPlayAsTrait]
  );

  // 正面內容
  const frontContent = useMemo(
    () => (
      <div className="hand-card__content">
        <div
          className="hand-card__trait-icon"
          style={{ backgroundColor: TRAIT_COLORS[getFrontTraitInfo.category] }}
        >
          {getFrontTraitInfo.icon}
        </div>
        <div className="hand-card__trait-name">{getFrontTraitInfo.name}</div>
        {getFrontTraitInfo.foodBonus > 0 && (
          <div className="hand-card__food-bonus">
            +{getFrontTraitInfo.foodBonus}
          </div>
        )}
      </div>
    ),
    [getFrontTraitInfo]
  );

  // 背面內容
  const backContent = useMemo(
    () => (
      <div className="hand-card__content hand-card__content--back">
        <div
          className="hand-card__trait-icon"
          style={{ backgroundColor: TRAIT_COLORS[getBackTraitInfo.category] }}
        >
          {getBackTraitInfo.icon}
        </div>
        <div className="hand-card__trait-name">{getBackTraitInfo.name}</div>
        {getBackTraitInfo.foodBonus > 0 && (
          <div className="hand-card__food-bonus">
            +{getBackTraitInfo.foodBonus}
          </div>
        )}
      </div>
    ),
    [getBackTraitInfo]
  );

  const cardClasses = [
    'hand-card',
    className,
    isDragging ? 'hand-card--dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={dragRef} className={cardClasses} data-testid="hand-card">
      <CardBase
        frontContent={frontContent}
        backContent={backContent}
        flipped={isFlipped}
        selected={selected}
        disabled={disabled}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        draggable={!disabled}
        size="medium"
        testId="hand-card-base"
      >
        {/* 使用提示 */}
        {selected && !showSideSelector && (
          <div className="hand-card__hint">雙擊翻轉查看</div>
        )}
      </CardBase>

      {/* 面選擇器 */}
      {showSideSelector && selected && (
        <div className="hand-card__side-selector" data-testid="side-selector">
          <button
            className={`hand-card__side-btn ${selectedSide === 'front' ? 'hand-card__side-btn--active' : ''}`}
            onClick={(e) => handleSideSelect('front', e)}
            data-testid="side-btn-front"
          >
            <span className="hand-card__side-label">
              {getFrontTraitInfo.name}
            </span>
          </button>
          <button
            className={`hand-card__side-btn ${selectedSide === 'back' ? 'hand-card__side-btn--active' : ''}`}
            onClick={(e) => handleSideSelect('back', e)}
            data-testid="side-btn-back"
          >
            <span className="hand-card__side-label">
              {getBackTraitInfo.name}
            </span>
          </button>
        </div>
      )}

      {/* 操作按鈕 */}
      {selected && !showSideSelector && (
        <div className="hand-card__actions" data-testid="card-actions">
          <button
            className="hand-card__action-btn hand-card__action-btn--creature"
            onClick={handlePlayAsCreature}
            title="作為生物打出"
            data-testid="action-creature"
          >
            🦎
          </button>
          <button
            className="hand-card__action-btn hand-card__action-btn--trait"
            onClick={handlePlayAsTrait}
            title="作為性狀打出"
            data-testid="action-trait"
          >
            🧬
          </button>
        </div>
      )}
    </div>
  );
});

HandCard.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string,
    instanceId: PropTypes.string.isRequired,
    frontTrait: PropTypes.string.isRequired,
    backTrait: PropTypes.string.isRequired,
    expansion: PropTypes.string,
  }).isRequired,
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  onSelect: PropTypes.func,
  onPlayAsCreature: PropTypes.func,
  onPlayAsTrait: PropTypes.func,
  showSideSelector: PropTypes.bool,
  selectedSide: PropTypes.oneOf(['front', 'back', null]),
  onSideSelect: PropTypes.func,
  className: PropTypes.string,
};

export default HandCard;
