# 工單 0333：CreatureCard 生物卡牌組件

## 基本資訊
- **工單編號**：0333
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0331（CardBase）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/cards/CreatureCard.jsx`（新增）
  - `frontend/src/components/games/evolution/cards/CreatureCard.css`（新增）

---

## 目標

建立生物卡牌組件，顯示場上生物狀態：
1. 顯示生物的性狀列表
2. 顯示食物/脂肪狀態
3. 支援作為攻擊/放置性狀目標
4. 視覺化表示餓飽狀態

---

## 詳細規格

### 1. 組件實作

```jsx
// frontend/src/components/games/evolution/cards/CreatureCard.jsx

import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrop } from 'react-dnd';
import { CardBase } from './CardBase';
import { TraitBadge } from './TraitBadge';
import { FoodIndicator } from './FoodIndicator';
import { useEvolutionStore } from '../../../../store/evolution';
import './CreatureCard.css';

/**
 * 生物卡牌組件
 */
export const CreatureCard = ({
  creature,
  isOwn = false,
  selected = false,
  canBeAttacked = false,
  canReceiveTrait = false,
  isAttacking = false,
  isFed = false,
  onSelect,
  onFeed,
  onAttack,
  onPlaceTrait,
  className = '',
}) => {
  const currentPhase = useEvolutionStore((state) => state.currentPhase);

  // 計算狀態
  const isHungry = creature.food < creature.maxFood;
  const isSatisfied = creature.food >= creature.maxFood;
  const hasFat = creature.fat > 0;
  const traitCount = creature.traits.length;

  // 放置性狀目標
  const [{ isOver, canDrop }, dropRef] = useDrop({
    accept: ['HAND_CARD'],
    canDrop: (item) => canReceiveTrait && isOwn,
    drop: (item) => {
      onPlaceTrait?.(creature.id, item.cardId, item.selectedSide);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // 點擊處理
  const handleClick = useCallback(() => {
    if (canBeAttacked) {
      onAttack?.(creature.id);
    } else {
      onSelect?.(creature.id);
    }
  }, [canBeAttacked, creature.id, onAttack, onSelect]);

  // 進食處理
  const handleFeed = useCallback((e) => {
    e.stopPropagation();
    if (isSatisfied) return;
    onFeed?.(creature.id);
  }, [creature.id, isSatisfied, onFeed]);

  // 生物圖示（根據性狀組合）
  const creatureIcon = useMemo(() => {
    if (creature.traits.some(t => t.type === 'AQUATIC')) return '🐟';
    if (creature.traits.some(t => t.type === 'CARNIVORE')) return '🦖';
    if (creature.traits.some(t => t.type === 'MASSIVE')) return '🦕';
    return '🦎';
  }, [creature.traits]);

  // 卡牌內容
  const cardContent = (
    <div className="creature-card__content">
      {/* 生物圖示 */}
      <div className="creature-card__icon">{creatureIcon}</div>

      {/* 食物指示器 */}
      <FoodIndicator
        current={creature.food}
        max={creature.maxFood}
        fat={creature.fat}
        fatCapacity={creature.traits.filter(t => t.type === 'FAT_TISSUE').length}
      />

      {/* 狀態標籤 */}
      <div className="creature-card__status">
        {isHungry && !isFed && (
          <span className="creature-card__status-tag creature-card__status-tag--hungry">
            餓
          </span>
        )}
        {isSatisfied && (
          <span className="creature-card__status-tag creature-card__status-tag--fed">
            飽
          </span>
        )}
        {hasFat && (
          <span className="creature-card__status-tag creature-card__status-tag--fat">
            脂肪 {creature.fat}
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
  ].filter(Boolean).join(' ');

  return (
    <div ref={dropRef} className={cardClasses}>
      <CardBase
        frontContent={cardContent}
        backContent={<div className="creature-card__back" />}
        selected={selected}
        highlighted={canBeAttacked || (isOver && canDrop)}
        onClick={handleClick}
        size="medium"
      >
        {/* 性狀徽章列表 */}
        <div className="creature-card__traits">
          <AnimatePresence>
            {creature.traits.map((trait, index) => (
              <motion.div
                key={trait.type + index}
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

        {/* 進食按鈕 */}
        {isOwn && currentPhase === 'feeding' && isHungry && (
          <motion.button
            className="creature-card__feed-btn"
            onClick={handleFeed}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            🍖
          </motion.button>
        )}

        {/* 攻擊標記 */}
        {canBeAttacked && (
          <div className="creature-card__attack-overlay">
            <span>⚔️ 可攻擊</span>
          </div>
        )}

        {/* 放置性狀提示 */}
        {isOver && canDrop && (
          <div className="creature-card__drop-overlay">
            <span>放置性狀</span>
          </div>
        )}
      </CardBase>
    </div>
  );
};

CreatureCard.propTypes = {
  creature: PropTypes.shape({
    id: PropTypes.string.isRequired,
    ownerId: PropTypes.string.isRequired,
    traits: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string.isRequired,
      link: PropTypes.object,
    })).isRequired,
    food: PropTypes.number.isRequired,
    maxFood: PropTypes.number.isRequired,
    fat: PropTypes.number,
  }).isRequired,
  isOwn: PropTypes.bool,
  selected: PropTypes.bool,
  canBeAttacked: PropTypes.bool,
  canReceiveTrait: PropTypes.bool,
  isAttacking: PropTypes.bool,
  isFed: PropTypes.bool,
  onSelect: PropTypes.func,
  onFeed: PropTypes.func,
  onAttack: PropTypes.func,
  onPlaceTrait: PropTypes.func,
  className: PropTypes.string,
};

export default CreatureCard;
```

### 2. 食物指示器

```jsx
// frontend/src/components/games/evolution/cards/FoodIndicator.jsx

import React from 'react';
import PropTypes from 'prop-types';
import './FoodIndicator.css';

/**
 * 食物指示器組件
 */
export const FoodIndicator = ({
  current,
  max,
  fat = 0,
  fatCapacity = 0,
}) => {
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
    <div className="food-indicator">
      {/* 食物槽 */}
      <div className="food-indicator__food">
        {foodSlots.map((slot, i) => (
          <div
            key={`food-${i}`}
            className={`food-indicator__slot ${slot.filled ? 'food-indicator__slot--filled' : ''}`}
            title={slot.filled ? '已進食' : '空'}
          >
            {slot.filled ? '🍖' : '○'}
          </div>
        ))}
      </div>

      {/* 脂肪槽 */}
      {fatCapacity > 0 && (
        <div className="food-indicator__fat">
          {fatSlots.map((slot, i) => (
            <div
              key={`fat-${i}`}
              className={`food-indicator__slot food-indicator__slot--fat ${slot.filled ? 'food-indicator__slot--filled' : ''}`}
              title={slot.filled ? '已儲存脂肪' : '空脂肪槽'}
            >
              {slot.filled ? '🥓' : '◇'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

FoodIndicator.propTypes = {
  current: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  fat: PropTypes.number,
  fatCapacity: PropTypes.number,
};

export default FoodIndicator;
```

### 3. 性狀徽章

```jsx
// frontend/src/components/games/evolution/cards/TraitBadge.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { TRAIT_ICONS, TRAIT_COLORS } from '../constants/traitVisuals';
import './TraitBadge.css';

/**
 * 性狀徽章組件
 */
export const TraitBadge = ({
  traitType,
  linked = false,
  size = 'medium',
  onClick,
  showTooltip = true,
}) => {
  const icon = TRAIT_ICONS[traitType] || '❓';

  return (
    <div
      className={`trait-badge trait-badge--${size} ${linked ? 'trait-badge--linked' : ''}`}
      onClick={onClick}
      title={showTooltip ? traitType : undefined}
    >
      <span className="trait-badge__icon">{icon}</span>
      {linked && <span className="trait-badge__link-indicator">🔗</span>}
    </div>
  );
};

TraitBadge.propTypes = {
  traitType: PropTypes.string.isRequired,
  linked: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onClick: PropTypes.func,
  showTooltip: PropTypes.bool,
};

export default TraitBadge;
```

### 4. 樣式

```css
/* frontend/src/components/games/evolution/cards/CreatureCard.css */

.creature-card {
  position: relative;
}

.creature-card__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px;
}

.creature-card__icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.creature-card__status {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 4px;
}

.creature-card__status-tag {
  font-size: 9px;
  padding: 2px 4px;
  border-radius: 4px;
  font-weight: 600;
}

.creature-card__status-tag--hungry {
  background: #fecaca;
  color: #dc2626;
}

.creature-card__status-tag--fed {
  background: #bbf7d0;
  color: #16a34a;
}

.creature-card__status-tag--fat {
  background: #fde68a;
  color: #d97706;
}

/* 性狀列表 */
.creature-card__traits {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  z-index: 10;
}

/* 進食按鈕 */
.creature-card__feed-btn {
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #10b981;
  font-size: 16px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* 可攻擊狀態 */
.creature-card--attackable {
  animation: attackable-pulse 1s ease-in-out infinite;
}

@keyframes attackable-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

.creature-card__attack-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.2);
  border-radius: var(--card-border-radius);
  pointer-events: none;
}

.creature-card__attack-overlay span {
  background: #dc2626;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

/* 放置目標 */
.creature-card--drop-target {
  outline: 2px dashed var(--color-primary);
  outline-offset: 2px;
}

.creature-card__drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.2);
  border-radius: var(--card-border-radius);
  pointer-events: none;
}

.creature-card__drop-overlay span {
  background: var(--color-primary);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
}

/* === FoodIndicator.css === */

.food-indicator {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
}

.food-indicator__food,
.food-indicator__fat {
  display: flex;
  gap: 2px;
}

.food-indicator__slot {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  border-radius: 2px;
  background: #f1f5f9;
  color: #94a3b8;
}

.food-indicator__slot--filled {
  background: #fef3c7;
}

.food-indicator__slot--fat {
  background: #fef9c3;
}

/* === TraitBadge.css === */

.trait-badge {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
}

.trait-badge--small {
  width: 20px;
  height: 20px;
  font-size: 12px;
}

.trait-badge--medium {
  width: 28px;
  height: 28px;
  font-size: 16px;
}

.trait-badge--large {
  width: 36px;
  height: 36px;
  font-size: 20px;
}

.trait-badge--linked {
  border: 2px solid #10b981;
}

.trait-badge__link-indicator {
  position: absolute;
  bottom: -4px;
  right: -4px;
  font-size: 8px;
}
```

---

## 測試需求

```jsx
// 測試生物卡牌各狀態渲染
describe('CreatureCard', () => {
  it('should display food indicator', () => {});
  it('should show hungry status when not fed', () => {});
  it('should show trait badges', () => {});
  it('should highlight when attackable', () => {});
  it('should accept trait drop', () => {});
});
```

---

## 驗收標準

1. [ ] 正確顯示生物狀態
2. [ ] 食物指示器準確
3. [ ] 性狀徽章正確顯示
4. [ ] 可攻擊狀態視覺清晰
5. [ ] 拖放性狀功能正常
6. [ ] 進食按鈕正常運作
7. [ ] 動畫流暢

---

## 備註

- 生物卡牌是遊戲核心 UI
- 需支援多種互動狀態
- 效能考量：大量生物時的渲染
