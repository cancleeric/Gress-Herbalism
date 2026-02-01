# 工單 0331：CardBase 基礎卡牌組件

## 基本資訊
- **工單編號**：0331
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：無
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/cards/CardBase.jsx`（新增）
  - `frontend/src/components/games/evolution/cards/CardBase.css`（新增）
  - `frontend/src/components/games/evolution/cards/index.js`（新增）

---

## 目標

建立通用的卡牌基礎組件，作為所有卡牌類型的底層：
1. 統一的卡牌尺寸和樣式
2. 翻轉動畫支援
3. 選中/懸停狀態
4. 響應式設計

---

## 詳細規格

### 1. 組件介面

```jsx
// frontend/src/components/games/evolution/cards/CardBase.jsx

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './CardBase.css';

/**
 * 卡牌基礎組件
 * 提供統一的卡牌外觀和基本互動
 */
export const CardBase = ({
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
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = useCallback((e) => {
    if (disabled) return;
    onClick?.(e);
  }, [disabled, onClick]);

  const handleDoubleClick = useCallback((e) => {
    if (disabled) return;
    onDoubleClick?.(e);
  }, [disabled, onDoubleClick]);

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
  ].filter(Boolean).join(' ');

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
};

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
```

### 2. 樣式定義

```css
/* frontend/src/components/games/evolution/cards/CardBase.css */

/* === 卡牌尺寸變數 === */
:root {
  /* 小尺寸（用於縮略、列表） */
  --card-width-small: 60px;
  --card-height-small: 84px;

  /* 中等尺寸（預設） */
  --card-width-medium: 100px;
  --card-height-medium: 140px;

  /* 大尺寸（詳情、選擇） */
  --card-width-large: 140px;
  --card-height-large: 196px;

  /* 卡牌樣式 */
  --card-border-radius: 8px;
  --card-border-width: 2px;
  --card-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  --card-shadow-hover: 0 4px 16px rgba(0, 0, 0, 0.25);
  --card-shadow-selected: 0 0 0 3px var(--color-primary);

  /* 動畫 */
  --card-transition: all 0.2s ease;
}

/* === 基礎卡牌 === */
.evolution-card {
  position: relative;
  display: inline-flex;
  perspective: 1000px;
  cursor: pointer;
  user-select: none;
  transition: var(--card-transition);
}

.evolution-card:focus {
  outline: none;
}

.evolution-card:focus-visible {
  box-shadow: var(--card-shadow-selected);
}

/* === 尺寸變體 === */
.evolution-card--small {
  width: var(--card-width-small);
  height: var(--card-height-small);
}

.evolution-card--medium {
  width: var(--card-width-medium);
  height: var(--card-height-medium);
}

.evolution-card--large {
  width: var(--card-width-large);
  height: var(--card-height-large);
}

/* === 卡牌內層（用於翻轉） === */
.evolution-card__inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

/* === 卡牌面 === */
.evolution-card__face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--card-border-radius);
  border: var(--card-border-width) solid var(--color-border, #ddd);
  background: var(--color-card-bg, #fff);
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.evolution-card__face--front {
  z-index: 2;
}

.evolution-card__face--back {
  transform: rotateY(180deg);
  background: var(--color-card-back, #4a5568);
}

/* === 狀態樣式 === */
.evolution-card--hovered .evolution-card__face {
  box-shadow: var(--card-shadow-hover);
}

.evolution-card--selected {
  transform: translateY(-4px);
}

.evolution-card--selected .evolution-card__face {
  border-color: var(--color-primary, #3b82f6);
  box-shadow: var(--card-shadow-selected);
}

.evolution-card--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.evolution-card--highlighted .evolution-card__face {
  animation: card-pulse 1.5s ease-in-out infinite;
}

@keyframes card-pulse {
  0%, 100% {
    box-shadow: var(--card-shadow);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
  }
}

/* === 可拖動狀態 === */
.evolution-card--draggable {
  cursor: grab;
}

.evolution-card--draggable:active {
  cursor: grabbing;
}

/* === 響應式調整 === */
@media (max-width: 768px) {
  :root {
    --card-width-small: 50px;
    --card-height-small: 70px;
    --card-width-medium: 80px;
    --card-height-medium: 112px;
    --card-width-large: 120px;
    --card-height-large: 168px;
  }
}

@media (max-width: 480px) {
  :root {
    --card-width-small: 45px;
    --card-height-small: 63px;
    --card-width-medium: 70px;
    --card-height-medium: 98px;
    --card-width-large: 100px;
    --card-height-large: 140px;
  }
}
```

### 3. 輔助 Hook

```jsx
// frontend/src/components/games/evolution/cards/useCardInteraction.js

import { useState, useCallback } from 'react';

/**
 * 卡牌互動 Hook
 */
export function useCardInteraction(options = {}) {
  const {
    onSelect,
    onDeselect,
    multiSelect = false,
    maxSelect = Infinity,
  } = options;

  const [selectedCards, setSelectedCards] = useState(new Set());

  const toggleSelect = useCallback((cardId) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);

      if (next.has(cardId)) {
        next.delete(cardId);
        onDeselect?.(cardId);
      } else {
        if (!multiSelect) {
          // 單選模式，清除之前的選擇
          const prevSelected = Array.from(prev);
          prevSelected.forEach(id => onDeselect?.(id));
          next.clear();
        } else if (next.size >= maxSelect) {
          // 達到最大選擇數
          return prev;
        }
        next.add(cardId);
        onSelect?.(cardId);
      }

      return next;
    });
  }, [multiSelect, maxSelect, onSelect, onDeselect]);

  const isSelected = useCallback((cardId) => {
    return selectedCards.has(cardId);
  }, [selectedCards]);

  const clearSelection = useCallback(() => {
    const prevSelected = Array.from(selectedCards);
    prevSelected.forEach(id => onDeselect?.(id));
    setSelectedCards(new Set());
  }, [selectedCards, onDeselect]);

  const selectAll = useCallback((cardIds) => {
    const toSelect = multiSelect
      ? cardIds.slice(0, maxSelect)
      : cardIds.slice(0, 1);

    setSelectedCards(new Set(toSelect));
    toSelect.forEach(id => onSelect?.(id));
  }, [multiSelect, maxSelect, onSelect]);

  return {
    selectedCards: Array.from(selectedCards),
    selectedCount: selectedCards.size,
    toggleSelect,
    isSelected,
    clearSelection,
    selectAll,
  };
}
```

### 4. 索引檔案

```jsx
// frontend/src/components/games/evolution/cards/index.js

export { CardBase } from './CardBase';
export { useCardInteraction } from './useCardInteraction';
```

---

## 測試需求

```jsx
// frontend/src/components/games/evolution/cards/__tests__/CardBase.test.jsx

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CardBase } from '../CardBase';

describe('CardBase', () => {
  it('should render front content', () => {
    render(
      <CardBase
        frontContent={<div>Front</div>}
        backContent={<div>Back</div>}
      />
    );

    expect(screen.getByText('Front')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<CardBase onClick={handleClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should not call onClick when disabled', () => {
    const handleClick = vi.fn();
    render(<CardBase onClick={handleClick} disabled />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply selected class', () => {
    render(<CardBase selected testId="card" />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('evolution-card--selected');
  });

  it('should apply size class', () => {
    render(<CardBase size="large" testId="card" />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('evolution-card--large');
  });
});
```

---

## 驗收標準

1. [ ] 組件正確渲染正反面內容
2. [ ] 翻轉動畫流暢
3. [ ] 選中/懸停狀態視覺反饋正確
4. [ ] 三種尺寸正常顯示
5. [ ] disabled 狀態禁止互動
6. [ ] 響應式設計在各裝置正常
7. [ ] 單元測試通過
8. [ ] 無障礙支援（keyboard、ARIA）

---

## 備註

- 使用 Framer Motion 處理動畫
- 遵循設計系統的色彩變數
- 為後續拖放功能預留介面
