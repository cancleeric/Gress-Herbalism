/**
 * CardBase - 演化論卡牌基礎組件
 *
 * 提供統一的卡牌外觀和基本互動
 *
 * @module components/games/evolution/cards/CardBase
 */

import React, { memo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './CardBase.css';

/**
 * 卡牌基礎組件
 * 提供統一的卡牌外觀和基本互動
 */
export const CardBase = memo(function CardBase({
  // 內容
  frontContent,
  backContent,

  // 狀態
  flipped = false,
  selected = false,
  disabled = false,
  highlighted = false,

  // 尺寸
  size = 'medium',

  // 事件
  onClick,
  onDoubleClick,
  onHover,
  onFlip,

  // 拖放
  draggable = false,
  dragData,

  // 樣式
  className = '',
  style = {},

  // 其他
  testId,
  children,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback(
    (e) => {
      if (disabled) return;
      onClick?.(e);
    },
    [disabled, onClick]
  );

  const handleDoubleClick = useCallback(
    (e) => {
      if (disabled) return;
      onDoubleClick?.(e);
    },
    [disabled, onDoubleClick]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    onHover?.(true);
  }, [onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    onHover?.(false);
  }, [onHover]);

  // 組合 CSS 類別
  const cardClasses = [
    'evolution-card',
    `evolution-card--${size}`,
    selected && 'evolution-card--selected',
    disabled && 'evolution-card--disabled',
    highlighted && 'evolution-card--highlighted',
    isHovered && 'evolution-card--hovered',
    flipped && 'evolution-card--flipped',
    draggable && 'evolution-card--draggable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // 翻轉動畫變體
  const flipVariants = {
    front: {
      rotateY: 0,
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
    back: {
      rotateY: 180,
      transition: { duration: 0.4, ease: 'easeInOut' },
    },
  };

  return (
    <motion.div
      className={cardClasses}
      style={style}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid={testId}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-selected={selected}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
    >
      <motion.div
        className="evolution-card__inner"
        animate={flipped ? 'back' : 'front'}
        variants={flipVariants}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* 正面 */}
        <div className="evolution-card__face evolution-card__face--front">
          {frontContent}
        </div>

        {/* 背面 */}
        <div className="evolution-card__face evolution-card__face--back">
          {backContent}
        </div>
      </motion.div>

      {/* 額外內容（如徽章、計數器） */}
      {children}
    </motion.div>
  );
});

CardBase.propTypes = {
  frontContent: PropTypes.node,
  backContent: PropTypes.node,
  flipped: PropTypes.bool,
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  highlighted: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  onHover: PropTypes.func,
  onFlip: PropTypes.func,
  draggable: PropTypes.bool,
  dragData: PropTypes.object,
  className: PropTypes.string,
  style: PropTypes.object,
  testId: PropTypes.string,
  children: PropTypes.node,
};

export default CardBase;
