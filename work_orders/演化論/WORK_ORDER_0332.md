# 工單 0332：HandCard 手牌卡牌組件

## 基本資訊
- **工單編號**：0332
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0331（CardBase）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/cards/HandCard.jsx`（新增）
  - `frontend/src/components/games/evolution/cards/HandCard.css`（新增）

---

## 目標

建立手牌卡牌組件，顯示玩家手中的雙面卡：
1. 顯示正反面性狀資訊
2. 支援選擇使用哪一面
3. 可拖動到目標區域
4. 整合到手牌區域

---

## 詳細規格

### 1. 組件實作

```jsx
// frontend/src/components/games/evolution/cards/HandCard.jsx

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useDrag } from 'react-dnd';
import { CardBase } from './CardBase';
import { useEvolutionStore } from '../../../../store/evolution';
import { TRAIT_ICONS, TRAIT_COLORS } from '../constants/traitVisuals';
import './HandCard.css';

/**
 * 手牌卡牌組件
 * 顯示雙面卡，可選擇正反面使用
 */
export const HandCard = ({
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
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 從 store 獲取性狀定義
  const getTraitInfo = useEvolutionStore((state) => state.getTraitInfo);

  // 取得正反面性狀資訊
  const frontTrait = useMemo(() => getTraitInfo(card.frontTrait), [card.frontTrait, getTraitInfo]);
  const backTrait = useMemo(() => getTraitInfo(card.backTrait), [card.backTrait, getTraitInfo]);

  // 拖動設定
  const [{ isDragging }, dragRef] = useDrag({
    type: 'HAND_CARD',
    item: () => ({
      cardId: card.instanceId,
      card,
      selectedSide: selectedSide || 'front',
    }),
    canDrag: !disabled,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

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
  const handleSideSelect = useCallback((side, e) => {
    e.stopPropagation();
    onSideSelect?.(card.instanceId, side);
  }, [card.instanceId, onSideSelect]);

  // 正面內容
  const frontContent = useMemo(() => (
    <div className="hand-card__content">
      <div
        className="hand-card__trait-icon"
        style={{ backgroundColor: TRAIT_COLORS[frontTrait?.category] }}
      >
        {TRAIT_ICONS[card.frontTrait]}
      </div>
      <div className="hand-card__trait-name">
        {frontTrait?.name || card.frontTrait}
      </div>
      {frontTrait?.foodBonus > 0 && (
        <div className="hand-card__food-bonus">+{frontTrait.foodBonus}</div>
      )}
    </div>
  ), [card.frontTrait, frontTrait]);

  // 背面內容
  const backContent = useMemo(() => (
    <div className="hand-card__content hand-card__content--back">
      <div
        className="hand-card__trait-icon"
        style={{ backgroundColor: TRAIT_COLORS[backTrait?.category] }}
      >
        {TRAIT_ICONS[card.backTrait]}
      </div>
      <div className="hand-card__trait-name">
        {backTrait?.name || card.backTrait}
      </div>
      {backTrait?.foodBonus > 0 && (
        <div className="hand-card__food-bonus">+{backTrait.foodBonus}</div>
      )}
    </div>
  ), [card.backTrait, backTrait]);

  return (
    <div
      ref={dragRef}
      className={`hand-card ${className} ${isDragging ? 'hand-card--dragging' : ''}`}
    >
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
      >
        {/* 使用提示 */}
        {selected && (
          <div className="hand-card__hint">
            雙擊翻轉查看
          </div>
        )}
      </CardBase>

      {/* 面選擇器 */}
      {showSideSelector && selected && (
        <div className="hand-card__side-selector">
          <button
            className={`hand-card__side-btn ${selectedSide === 'front' ? 'hand-card__side-btn--active' : ''}`}
            onClick={(e) => handleSideSelect('front', e)}
          >
            <span className="hand-card__side-label">{frontTrait?.name}</span>
          </button>
          <button
            className={`hand-card__side-btn ${selectedSide === 'back' ? 'hand-card__side-btn--active' : ''}`}
            onClick={(e) => handleSideSelect('back', e)}
          >
            <span className="hand-card__side-label">{backTrait?.name}</span>
          </button>
        </div>
      )}

      {/* 操作按鈕 */}
      {selected && !showSideSelector && (
        <div className="hand-card__actions">
          <button
            className="hand-card__action-btn hand-card__action-btn--creature"
            onClick={() => onPlayAsCreature?.(card.instanceId)}
            title="作為生物打出"
          >
            🦎
          </button>
          <button
            className="hand-card__action-btn hand-card__action-btn--trait"
            onClick={() => onPlayAsTrait?.(card.instanceId)}
            title="作為性狀打出"
          >
            🧬
          </button>
        </div>
      )}
    </div>
  );
};

HandCard.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
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
```

### 2. 樣式定義

```css
/* frontend/src/components/games/evolution/cards/HandCard.css */

.hand-card {
  position: relative;
  display: inline-block;
  transition: transform 0.2s ease;
}

.hand-card--dragging {
  opacity: 0.5;
  transform: scale(1.05);
}

/* === 卡牌內容 === */
.hand-card__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 8px;
  text-align: center;
}

.hand-card__content--back {
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  color: #fff;
}

.hand-card__trait-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 8px;
}

.hand-card__trait-name {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hand-card__food-bonus {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #f59e0b;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 4px;
  border-radius: 4px;
}

/* === 提示文字 === */
.hand-card__hint {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #64748b;
  white-space: nowrap;
  pointer-events: none;
}

/* === 面選擇器 === */
.hand-card__side-selector {
  position: absolute;
  bottom: -44px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: #fff;
  padding: 4px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.hand-card__side-btn {
  padding: 4px 8px;
  font-size: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.hand-card__side-btn:hover {
  background: #f1f5f9;
}

.hand-card__side-btn--active {
  background: var(--color-primary, #3b82f6);
  color: #fff;
  border-color: var(--color-primary, #3b82f6);
}

.hand-card__side-label {
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* === 操作按鈕 === */
.hand-card__actions {
  position: absolute;
  top: -8px;
  right: -8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}

.hand-card__action-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.15s ease;
}

.hand-card__action-btn:hover {
  transform: scale(1.1);
}

.hand-card__action-btn--creature {
  background: #10b981;
}

.hand-card__action-btn--trait {
  background: #8b5cf6;
}

/* === 響應式 === */
@media (max-width: 768px) {
  .hand-card__trait-icon {
    width: 32px;
    height: 32px;
    font-size: 20px;
  }

  .hand-card__trait-name {
    font-size: 10px;
  }

  .hand-card__action-btn {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }
}
```

### 3. 性狀視覺常數

```jsx
// frontend/src/components/games/evolution/constants/traitVisuals.js

/**
 * 性狀圖示（使用 Emoji 作為臨時方案，可替換為 SVG）
 */
export const TRAIT_ICONS = {
  // 肉食相關
  CARNIVORE: '🦷',
  SCAVENGER: '🦅',
  SHARP_VISION: '👁️',

  // 防禦相關
  CAMOUFLAGE: '🍃',
  BURROWING: '🕳️',
  POISONOUS: '☠️',
  AQUATIC: '🌊',
  AGILE: '💨',
  MASSIVE: '🦣',
  TAIL_LOSS: '🦎',
  MIMICRY: '🎭',

  // 進食相關
  FAT_TISSUE: '🍖',
  HIBERNATION: '💤',
  PARASITE: '🪱',
  PIRACY: '🏴‍☠️',

  // 互動相關
  COMMUNICATION: '📢',
  COOPERATION: '🤝',
  SYMBIOSIS: '🔗',

  // 特殊
  TRAMPLE: '🦏',
};

/**
 * 性狀類別顏色
 */
export const TRAIT_COLORS = {
  carnivore: '#ef4444',    // 紅色
  defense: '#3b82f6',      // 藍色
  feeding: '#f59e0b',      // 黃色
  interaction: '#10b981',  // 綠色
  special: '#8b5cf6',      // 紫色
};

/**
 * 取得性狀描述
 */
export const getTraitDescription = (traitType) => {
  const descriptions = {
    CARNIVORE: '可以攻擊其他生物獲得食物',
    CAMOUFLAGE: '無法被沒有銳目的肉食生物攻擊',
    FAT_TISSUE: '可以儲存額外的食物',
    // ... 其他性狀
  };
  return descriptions[traitType] || '';
};
```

---

## 測試需求

```jsx
// frontend/src/components/games/evolution/cards/__tests__/HandCard.test.jsx

import { render, screen, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { describe, it, expect, vi } from 'vitest';
import { HandCard } from '../HandCard';

const mockCard = {
  id: 'CARD_001',
  instanceId: 'base_CARD_001_1',
  frontTrait: 'CARNIVORE',
  backTrait: 'FAT_TISSUE',
  expansion: 'base',
};

const renderWithDnd = (component) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {component}
    </DndProvider>
  );
};

describe('HandCard', () => {
  it('should render card with trait info', () => {
    renderWithDnd(<HandCard card={mockCard} />);

    // 應顯示正面性狀
    expect(screen.getByText(/肉食/)).toBeInTheDocument();
  });

  it('should call onSelect when clicked', () => {
    const handleSelect = vi.fn();
    renderWithDnd(<HandCard card={mockCard} onSelect={handleSelect} />);

    fireEvent.click(screen.getByRole('button'));

    expect(handleSelect).toHaveBeenCalledWith(mockCard.instanceId);
  });

  it('should show actions when selected', () => {
    renderWithDnd(<HandCard card={mockCard} selected />);

    expect(screen.getByTitle('作為生物打出')).toBeInTheDocument();
    expect(screen.getByTitle('作為性狀打出')).toBeInTheDocument();
  });

  it('should show side selector when prop is true', () => {
    renderWithDnd(
      <HandCard card={mockCard} selected showSideSelector />
    );

    expect(screen.getByText(/肉食/)).toBeInTheDocument();
    expect(screen.getByText(/脂肪/)).toBeInTheDocument();
  });
});
```

---

## 驗收標準

1. [ ] 正確顯示雙面性狀資訊
2. [ ] 雙擊可翻轉查看背面
3. [ ] 選中時顯示操作按鈕
4. [ ] 拖動功能正常
5. [ ] 面選擇器正確運作
6. [ ] 與 CardBase 整合正常
7. [ ] 響應式設計正確
8. [ ] 單元測試通過

---

## 備註

- 使用 react-dnd 實現拖放
- 性狀圖示暫用 Emoji，未來可替換
- 需配合 Hand 容器組件使用
