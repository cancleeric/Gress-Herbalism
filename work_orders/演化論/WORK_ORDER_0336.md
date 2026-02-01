# 工單 0336：FoodPool 食物池組件

## 基本資訊
- **工單編號**：0336
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0331（CardBase）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/board/FoodPool.jsx`（新增）
  - `frontend/src/components/games/evolution/board/FoodPool.css`（新增）

---

## 目標

建立食物池組件：
1. 視覺化顯示可用食物數量
2. 支援從食物池拖取食物
3. 食物供給階段的骰子動畫
4. 食物耗盡狀態顯示

---

## 詳細規格

### 1. 組件實作

```jsx
// frontend/src/components/games/evolution/board/FoodPool.jsx

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from 'react-dnd';
import './FoodPool.css';

/**
 * 單顆食物組件
 */
const FoodToken = ({ index, onTake, canTake }) => {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'FOOD_TOKEN',
    item: { type: 'FOOD_TOKEN' },
    canDrag: canTake,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <motion.div
      ref={dragRef}
      className={`food-pool__token ${canTake ? 'food-pool__token--available' : ''} ${isDragging ? 'food-pool__token--dragging' : ''}`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={canTake ? { scale: 1.2 } : {}}
      onClick={() => canTake && onTake?.()}
    >
      🍖
    </motion.div>
  );
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
  ].filter(Boolean).join(' ');

  return (
    <div className={poolClasses}>
      {/* 標題 */}
      <div className="food-pool__header">
        <span className="food-pool__title">食物池</span>
        <span className="food-pool__amount">
          {amount}
          {lastRoll && (
            <span className="food-pool__roll-result">
              (骰 {lastRoll.dice} + {lastRoll.players} 人)
            </span>
          )}
        </span>
      </div>

      {/* 食物容器 */}
      <div className="food-pool__container">
        {/* 背景填充 */}
        <div
          className="food-pool__fill"
          style={{ height: `${fillPercentage}%` }}
        />

        {/* 食物代幣 */}
        <div className="food-pool__tokens">
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
            <div className="food-pool__overflow">
              +{amount - 30}
            </div>
          )}
        </div>

        {/* 空狀態 */}
        {amount === 0 && (
          <div className="food-pool__empty-state">
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
        >
          {isRolling ? '擲骰中...' : '決定食物'}
        </motion.button>
      )}

      {/* 提示 */}
      {canTakeFood && amount > 0 && (
        <div className="food-pool__hint">
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
```

### 2. 樣式

```css
/* frontend/src/components/games/evolution/board/FoodPool.css */

.food-pool {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  border: 2px solid #e2e8f0;
  overflow: hidden;
  min-width: 200px;
}

/* === 標題 === */
.food-pool__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-bottom: 1px solid #fcd34d;
}

.food-pool__title {
  font-weight: 600;
  color: #92400e;
}

.food-pool__amount {
  font-size: 24px;
  font-weight: 700;
  color: #78350f;
}

.food-pool__roll-result {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.7;
  margin-left: 4px;
}

/* === 容器 === */
.food-pool__container {
  position: relative;
  min-height: 150px;
  padding: 16px;
  background: #fefce8;
}

.food-pool__fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, #fcd34d 0%, #fde68a 100%);
  opacity: 0.3;
  transition: height 0.5s ease;
}

/* === 食物代幣 === */
.food-pool__tokens {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

.food-pool__token {
  font-size: 24px;
  cursor: default;
  user-select: none;
}

.food-pool__token--available {
  cursor: grab;
  transition: transform 0.15s;
}

.food-pool__token--available:hover {
  transform: scale(1.2);
}

.food-pool__token--dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.food-pool__overflow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f59e0b;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
}

/* === 空狀態 === */
.food-pool--empty .food-pool__container {
  background: #f1f5f9;
}

.food-pool__empty-state {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 14px;
}

/* === 低食物警告 === */
.food-pool--low .food-pool__header {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-color: #fca5a5;
}

.food-pool--low .food-pool__amount {
  color: #dc2626;
}

/* === 骰子動畫 === */
.food-pool__dice {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 64px;
  z-index: 10;
}

.food-pool--rolling .food-pool__tokens {
  opacity: 0.3;
}

/* === 擲骰按鈕 === */
.food-pool__roll-btn {
  margin: 12px 16px 16px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.food-pool__roll-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* === 提示 === */
.food-pool__hint {
  padding: 8px 16px 16px;
  text-align: center;
  font-size: 12px;
  color: #64748b;
}

/* === 響應式 === */
@media (max-width: 768px) {
  .food-pool {
    min-width: 150px;
  }

  .food-pool__container {
    min-height: 120px;
    padding: 12px;
  }

  .food-pool__token {
    font-size: 20px;
  }
}
```

---

## 驗收標準

1. [ ] 正確顯示食物數量
2. [ ] 食物代幣可拖動
3. [ ] 骰子動畫流暢
4. [ ] 空/低食物狀態顯示
5. [ ] 擲骰按鈕正常運作
6. [ ] 響應式設計正確
7. [ ] 效能良好（大量食物）

---

## 備註

- 食物池是遊戲中央區域
- 視覺效果需直觀
- 拖放與點擊兩種取食方式
