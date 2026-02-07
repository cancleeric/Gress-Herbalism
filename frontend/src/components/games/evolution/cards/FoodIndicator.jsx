/**
 * FoodIndicator - 食物指示器組件
 *
 * 顯示生物的食物和脂肪狀態
 *
 * @module components/games/evolution/cards/FoodIndicator
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './FoodIndicator.css';

/**
 * 食物指示器組件
 */
export const FoodIndicator = memo(function FoodIndicator({ current, max, fat = 0, fatCapacity = 0 }) {
  const foodSlots = [];
  const fatSlots = [];

  // 建立食物槽
  for (let i = 0; i < max; i++) {
    foodSlots.push({
      filled: i < current,
    });
  }

  // 建立脂肪槽
  for (let i = 0; i < fatCapacity; i++) {
    fatSlots.push({
      filled: i < fat,
    });
  }

  return (
    <div className="food-indicator" data-testid="food-indicator">
      {/* 食物槽 */}
      <div className="food-indicator__food" data-testid="food-slots">
        {foodSlots.map((slot, i) => (
          <div
            key={`food-${i}`}
            className={`food-indicator__slot ${slot.filled ? 'food-indicator__slot--filled' : ''}`}
            title={slot.filled ? '已進食' : '空'}
            data-testid={`food-slot-${i}`}
          >
            {slot.filled ? '🍖' : '○'}
          </div>
        ))}
      </div>

      {/* 脂肪槽 */}
      {fatCapacity > 0 && (
        <div className="food-indicator__fat" data-testid="fat-slots">
          {fatSlots.map((slot, i) => (
            <div
              key={`fat-${i}`}
              className={`food-indicator__slot food-indicator__slot--fat ${slot.filled ? 'food-indicator__slot--filled' : ''}`}
              title={slot.filled ? '已儲存脂肪' : '空脂肪槽'}
              data-testid={`fat-slot-${i}`}
            >
              {slot.filled ? '🥓' : '◇'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

FoodIndicator.propTypes = {
  current: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  fat: PropTypes.number,
  fatCapacity: PropTypes.number,
};

export default FoodIndicator;
