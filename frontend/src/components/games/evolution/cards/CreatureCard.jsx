/**
 * CreatureCard - 生物卡牌組件
 *
 * 顯示場上生物狀態，包括性狀、食物和脂肪
 *
 * @module components/games/evolution/cards/CreatureCard
 */

import React, { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrop } from 'react-dnd';
import { CardBase } from './CardBase';
import { TraitBadge } from './TraitBadge';
import { FoodIndicator } from './FoodIndicator';
import { DND_TYPES } from './HandCard';
import './CreatureCard.css';

/**
 * 生物卡牌組件
 */
export const CreatureCard = memo(function CreatureCard({
  creature,
  isOwn = false,
  selected = false,
  canBeAttacked = false,
  canReceiveTrait = false,
  isAttacking = false,
  isFed = false,
  currentPhase = 'evolution',
  onSelect,
  onFeed,
  onAttack,
  onPlaceTrait,
  className = '',
}) {
  // 計算狀態
  const maxFood = creature.maxFood || 1;
  const currentFood = creature.food || 0;
  const fat = creature.fat || 0;
  const traits = creature.traits || [];

  const isHungry = currentFood < maxFood;
  const isSatisfied = currentFood >= maxFood;
  const hasFat = fat > 0;

  // 計算脂肪容量（脂肪組織性狀數量）
  const fatCapacity = traits.filter((t) => t.type === 'fatTissue').length;

  // 放置性狀目標
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: [DND_TYPES.HAND_CARD],
      canDrop: () => canReceiveTrait && isOwn,
      drop: (item) => {
        onPlaceTrait?.(creature.id, item.cardId, item.selectedSide);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [canReceiveTrait, isOwn, creature.id, onPlaceTrait]
  );

  // 點擊處理
  const handleClick = useCallback(() => {
    if (canBeAttacked) {
      onAttack?.(creature.id);
    } else {
      onSelect?.(creature.id);
    }
  }, [canBeAttacked, creature.id, onAttack, onSelect]);

  // 進食處理
  const handleFeed = useCallback(
    (e) => {
      e.stopPropagation();
      if (isSatisfied) return;
      onFeed?.(creature.id);
    },
    [creature.id, isSatisfied, onFeed]
  );

  // 生物圖示（根據性狀組合）
  const creatureIcon = useMemo(() => {
    if (traits.some((t) => t.type === 'aquatic')) return '🐟';
    if (traits.some((t) => t.type === 'carnivore')) return '🦖';
    if (traits.some((t) => t.type === 'massive')) return '🦕';
    return '🦎';
  }, [traits]);

  // 卡牌內容
  const cardContent = (
    <div className="creature-card__content">
      {/* 生物圖示 */}
      <div className="creature-card__icon" data-testid="creature-icon">
        {creatureIcon}
      </div>

      {/* 食物指示器 */}
      <FoodIndicator
        current={currentFood}
        max={maxFood}
        fat={fat}
        fatCapacity={fatCapacity}
      />

      {/* 狀態標籤 */}
      <div className="creature-card__status" data-testid="creature-status">
        {isHungry && !isFed && (
          <span
            className="creature-card__status-tag creature-card__status-tag--hungry"
            data-testid="status-hungry"
          >
            餓
          </span>
        )}
        {isSatisfied && (
          <span
            className="creature-card__status-tag creature-card__status-tag--fed"
            data-testid="status-fed"
          >
            飽
          </span>
        )}
        {hasFat && (
          <span
            className="creature-card__status-tag creature-card__status-tag--fat"
            data-testid="status-fat"
          >
            脂肪 {fat}
          </span>
        )}
      </div>
    </div>
  );

  // CSS 類別
  const cardClasses = [
    'creature-card',
    isOwn && 'creature-card--own',
    isHungry && 'creature-card--hungry',
    isSatisfied && 'creature-card--satisfied',
    canBeAttacked && 'creature-card--attackable',
    isAttacking && 'creature-card--attacking',
    isOver && canDrop && 'creature-card--drop-target',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={dropRef} className={cardClasses} data-testid="creature-card">
      <CardBase
        frontContent={cardContent}
        backContent={<div className="creature-card__back" />}
        selected={selected}
        highlighted={canBeAttacked || (isOver && canDrop)}
        onClick={handleClick}
        size="medium"
        testId="creature-card-base"
      >
        {/* 性狀徽章列表 */}
        {traits.length > 0 && (
          <div className="creature-card__traits" data-testid="creature-traits">
            <AnimatePresence>
              {traits.map((trait, index) => (
                <motion.div
                  key={`${trait.type}-${index}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TraitBadge
                    traitType={trait.type}
                    linked={!!trait.link}
                    size="small"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* 進食按鈕 */}
        {isOwn && currentPhase === 'feeding' && isHungry && (
          <motion.button
            className="creature-card__feed-btn"
            onClick={handleFeed}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            data-testid="feed-button"
          >
            🍖
          </motion.button>
        )}

        {/* 攻擊標記 */}
        {canBeAttacked && (
          <div className="creature-card__attack-overlay" data-testid="attack-overlay">
            <span>⚔️ 可攻擊</span>
          </div>
        )}

        {/* 放置性狀提示 */}
        {isOver && canDrop && (
          <div className="creature-card__drop-overlay" data-testid="drop-overlay">
            <span>放置性狀</span>
          </div>
        )}
      </CardBase>
    </div>
  );
});

CreatureCard.propTypes = {
  creature: PropTypes.shape({
    id: PropTypes.string.isRequired,
    ownerId: PropTypes.string,
    traits: PropTypes.arrayOf(
      PropTypes.shape({
        type: PropTypes.string.isRequired,
        link: PropTypes.object,
      })
    ),
    food: PropTypes.number,
    maxFood: PropTypes.number,
    fat: PropTypes.number,
  }).isRequired,
  isOwn: PropTypes.bool,
  selected: PropTypes.bool,
  canBeAttacked: PropTypes.bool,
  canReceiveTrait: PropTypes.bool,
  isAttacking: PropTypes.bool,
  isFed: PropTypes.bool,
  currentPhase: PropTypes.string,
  onSelect: PropTypes.func,
  onFeed: PropTypes.func,
  onAttack: PropTypes.func,
  onPlaceTrait: PropTypes.func,
  className: PropTypes.string,
};

export default CreatureCard;
