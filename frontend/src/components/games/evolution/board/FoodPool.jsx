/**
 * FoodPool - 食物池組件
 *
 * 視覺化顯示可用食物數量，支援拖放取食
 *
 * @module components/games/evolution/board/FoodPool
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from 'react-dnd';
import './FoodPool.css';

/**
 * 拖放類型常數
 */
export const DND_TYPES = {
  FOOD_TOKEN: 'FOOD_TOKEN',
};

/**
 * 單顆食物組件
 */
const FoodToken = ({ index, onTake, canTake }) => {
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: DND_TYPES.FOOD_TOKEN,
      item: { type: DND_TYPES.FOOD_TOKEN },
      canDrag: canTake,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [canTake]
  );

  const tokenClasses = [
    'food-pool__token',
    canTake && 'food-pool__token--available',
    isDragging && 'food-pool__token--dragging',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      ref={dragRef}
      className={tokenClasses}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={canTake ? { scale: 1.2 } : {}}
      onClick={() => canTake && onTake?.()}
      data-testid={`food-token-${index}`}
    >
      🍖
    </motion.div>
  );
};

FoodToken.propTypes = {
  index: PropTypes.number.isRequired,
  onTake: PropTypes.func,
  canTake: PropTypes.bool,
};

/**
 * 食物池組件
 */
export const FoodPool = ({
  amount = 0,
  maxAmount = 20,
  lastRoll = null,
  isRolling = false,
  canTakeFood = false,
  onTakeFood,
  onRoll,
  showRollButton = false,
  className = '',
}) => {
  const [displayAmount, setDisplayAmount] = useState(amount);

  // 動畫更新顯示數量
  useEffect(() => {
    if (amount !== displayAmount) {
      const timer = setTimeout(() => {
        setDisplayAmount(amount);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [amount, displayAmount]);

  // 處理取食物
  const handleTakeFood = useCallback(() => {
    if (canTakeFood && amount > 0) {
      onTakeFood?.();
    }
  }, [canTakeFood, amount, onTakeFood]);

  // 計算食物填充百分比
  const fillPercentage = Math.min((amount / maxAmount) * 100, 100);

  // 狀態類別
  const poolClasses = [
    'food-pool',
    amount === 0 && 'food-pool--empty',
    amount <= 3 && amount > 0 && 'food-pool--low',
    isRolling && 'food-pool--rolling',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={poolClasses} data-testid="food-pool">
      {/* 標題 */}
      <div className="food-pool__header" data-testid="food-pool-header">
        <span className="food-pool__title">食物池</span>
        <span className="food-pool__amount" data-testid="food-amount">
          {amount}
          {lastRoll && (
            <span className="food-pool__roll-result" data-testid="roll-result">
              (骰 {lastRoll.dice} + {lastRoll.players} 人)
            </span>
          )}
        </span>
      </div>

      {/* 食物容器 */}
      <div className="food-pool__container" data-testid="food-container">
        {/* 背景填充 */}
        <div
          className="food-pool__fill"
          style={{ height: `${fillPercentage}%` }}
          data-testid="food-fill"
        />

        {/* 食物代幣 */}
        <div className="food-pool__tokens" data-testid="food-tokens">
          <AnimatePresence>
            {Array.from({ length: Math.min(amount, 30) }).map((_, i) => (
              <FoodToken
                key={i}
                index={i}
                canTake={canTakeFood}
                onTake={handleTakeFood}
              />
            ))}
          </AnimatePresence>

          {/* 超過 30 顯示數字 */}
          {amount > 30 && (
            <div className="food-pool__overflow" data-testid="food-overflow">
              +{amount - 30}
            </div>
          )}
        </div>

        {/* 空狀態 */}
        {amount === 0 && (
          <div className="food-pool__empty-state" data-testid="empty-state">
            <span>食物已耗盡</span>
          </div>
        )}

        {/* 骰子動畫 */}
        <AnimatePresence>
          {isRolling && (
            <motion.div
              className="food-pool__dice"
              initial={{ scale: 0, rotate: 0 }}
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 360, 720],
              }}
              exit={{ scale: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              data-testid="dice-animation"
            >
              🎲
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 擲骰按鈕 */}
      {showRollButton && (
        <motion.button
          className="food-pool__roll-btn"
          onClick={onRoll}
          disabled={isRolling}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          data-testid="roll-button"
        >
          {isRolling ? '擲骰中...' : '決定食物'}
        </motion.button>
      )}

      {/* 提示 */}
      {canTakeFood && amount > 0 && (
        <div className="food-pool__hint" data-testid="food-hint">
          點擊或拖動食物來餵食生物
        </div>
      )}
    </div>
  );
};

FoodPool.propTypes = {
  amount: PropTypes.number,
  maxAmount: PropTypes.number,
  lastRoll: PropTypes.shape({
    dice: PropTypes.number,
    players: PropTypes.number,
  }),
  isRolling: PropTypes.bool,
  canTakeFood: PropTypes.bool,
  onTakeFood: PropTypes.func,
  onRoll: PropTypes.func,
  showRollButton: PropTypes.bool,
  className: PropTypes.string,
};

export default FoodPool;
