# 工單 0334：Hand 手牌區域組件

## 基本資訊
- **工單編號**：0334
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0332（HandCard）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/board/Hand.jsx`（新增）
  - `frontend/src/components/games/evolution/board/Hand.css`（新增）

---

## 目標

建立手牌區域容器組件：
1. 扇形排列手牌
2. 支援手牌選擇和操作
3. 響應式調整布局
4. 顯示手牌數量

---

## 詳細規格

### 1. 組件實作

```jsx
// frontend/src/components/games/evolution/board/Hand.jsx

import React, { useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { HandCard } from '../cards/HandCard';
import { useCardInteraction } from '../cards/useCardInteraction';
import './Hand.css';

/**
 * 手牌區域組件
 */
export const Hand = ({
  cards = [],
  disabled = false,
  maxDisplay = 10,
  onPlayAsCreature,
  onPlayAsTrait,
  showCount = true,
  layout = 'fan',
  className = '',
}) => {
  const [expandedView, setExpandedView] = useState(false);
  const [selectedSide, setSelectedSide] = useState({});

  // 卡牌選擇邏輯
  const {
    selectedCards,
    selectedCount,
    toggleSelect,
    isSelected,
    clearSelection,
  } = useCardInteraction({
    multiSelect: false,
    onSelect: (cardId) => {
      // 預設選擇正面
      setSelectedSide((prev) => ({ ...prev, [cardId]: 'front' }));
    },
    onDeselect: (cardId) => {
      setSelectedSide((prev) => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
    },
  });

  // 計算卡牌位置（扇形排列）
  const cardPositions = useMemo(() => {
    const total = Math.min(cards.length, maxDisplay);
    if (total === 0) return [];

    const positions = [];
    const spreadAngle = Math.min(5, 30 / total); // 每張卡的角度
    const startAngle = -(total - 1) * spreadAngle / 2;

    for (let i = 0; i < total; i++) {
      const angle = startAngle + i * spreadAngle;
      const radian = (angle * Math.PI) / 180;
      const yOffset = Math.abs(angle) * 0.5; // 弧形效果

      positions.push({
        rotation: angle,
        translateY: yOffset,
        zIndex: i + 1,
      });
    }

    return positions;
  }, [cards.length, maxDisplay]);

  // 處理面選擇
  const handleSideSelect = useCallback((cardId, side) => {
    setSelectedSide((prev) => ({ ...prev, [cardId]: side }));
  }, []);

  // 處理作為生物打出
  const handlePlayAsCreature = useCallback((cardId) => {
    onPlayAsCreature?.(cardId);
    clearSelection();
  }, [onPlayAsCreature, clearSelection]);

  // 處理作為性狀打出
  const handlePlayAsTrait = useCallback((cardId) => {
    const side = selectedSide[cardId] || 'front';
    onPlayAsTrait?.(cardId, side);
    clearSelection();
  }, [onPlayAsTrait, selectedSide, clearSelection]);

  // 顯示的卡牌
  const displayCards = cards.slice(0, maxDisplay);
  const hiddenCount = cards.length - displayCards.length;

  return (
    <div className={`hand ${layout === 'fan' ? 'hand--fan' : 'hand--grid'} ${className}`}>
      {/* 手牌數量 */}
      {showCount && (
        <div className="hand__count">
          <span className="hand__count-number">{cards.length}</span>
          <span className="hand__count-label">張手牌</span>
        </div>
      )}

      {/* 展開按鈕 */}
      {hiddenCount > 0 && (
        <button
          className="hand__expand-btn"
          onClick={() => setExpandedView(!expandedView)}
        >
          {expandedView ? '收起' : `+${hiddenCount} 更多`}
        </button>
      )}

      {/* 卡牌容器 */}
      <div className="hand__cards">
        <AnimatePresence mode="popLayout">
          {displayCards.map((card, index) => {
            const position = cardPositions[index] || {};
            const isCardSelected = isSelected(card.instanceId);

            return (
              <motion.div
                key={card.instanceId}
                className="hand__card-wrapper"
                initial={{ opacity: 0, scale: 0.8, y: 50 }}
                animate={{
                  opacity: 1,
                  scale: isCardSelected ? 1.1 : 1,
                  y: isCardSelected ? -20 : 0,
                  rotate: layout === 'fan' ? position.rotation : 0,
                  zIndex: isCardSelected ? 100 : position.zIndex,
                }}
                exit={{ opacity: 0, scale: 0.8, y: 50 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                style={{
                  transformOrigin: 'center bottom',
                }}
              >
                <HandCard
                  card={card}
                  selected={isCardSelected}
                  disabled={disabled}
                  onSelect={toggleSelect}
                  onPlayAsCreature={handlePlayAsCreature}
                  onPlayAsTrait={handlePlayAsTrait}
                  showSideSelector={isCardSelected}
                  selectedSide={selectedSide[card.instanceId]}
                  onSideSelect={handleSideSelect}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 展開視圖（Grid 模式） */}
      <AnimatePresence>
        {expandedView && (
          <motion.div
            className="hand__expanded-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedView(false)}
          >
            <motion.div
              className="hand__expanded-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>全部手牌 ({cards.length})</h3>
              <div className="hand__expanded-grid">
                {cards.map((card) => (
                  <HandCard
                    key={card.instanceId}
                    card={card}
                    selected={isSelected(card.instanceId)}
                    disabled={disabled}
                    onSelect={toggleSelect}
                    onPlayAsCreature={handlePlayAsCreature}
                    onPlayAsTrait={handlePlayAsTrait}
                  />
                ))}
              </div>
              <button
                className="hand__close-btn"
                onClick={() => setExpandedView(false)}
              >
                關閉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Hand.propTypes = {
  cards: PropTypes.arrayOf(PropTypes.object),
  disabled: PropTypes.bool,
  maxDisplay: PropTypes.number,
  onPlayAsCreature: PropTypes.func,
  onPlayAsTrait: PropTypes.func,
  showCount: PropTypes.bool,
  layout: PropTypes.oneOf(['fan', 'grid']),
  className: PropTypes.string,
};

export default Hand;
```

### 2. 樣式

```css
/* frontend/src/components/games/evolution/board/Hand.css */

.hand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

/* === 卡牌數量 === */
.hand__count {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  align-items: baseline;
  gap: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.hand__count-number {
  font-weight: 700;
  font-size: 18px;
}

.hand__count-label {
  font-size: 12px;
  opacity: 0.8;
}

/* === 展開按鈕 === */
.hand__expand-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  border: none;
  border-radius: 16px;
  background: var(--color-primary);
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.hand__expand-btn:hover {
  background: var(--color-primary-dark);
}

/* === 卡牌容器 === */
.hand__cards {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  min-height: 180px;
  padding-top: 40px;
}

.hand--fan .hand__cards {
  gap: -30px; /* 負間距讓卡牌重疊 */
}

.hand--grid .hand__cards {
  flex-wrap: wrap;
  gap: 12px;
}

.hand__card-wrapper {
  position: relative;
  flex-shrink: 0;
  margin: 0 -15px; /* 讓卡牌重疊 */
}

/* === 展開視圖 === */
.hand__expanded-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.hand__expanded-content {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.hand__expanded-content h3 {
  margin: 0 0 16px;
  font-size: 18px;
}

.hand__expanded-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.hand__close-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  font-size: 14px;
  cursor: pointer;
}

.hand__close-btn:hover {
  background: #e2e8f0;
}

/* === 響應式 === */
@media (max-width: 768px) {
  .hand__cards {
    min-height: 140px;
  }

  .hand__card-wrapper {
    margin: 0 -20px;
  }

  .hand__expanded-content {
    padding: 16px;
    max-width: 95vw;
  }
}
```

---

## 驗收標準

1. [ ] 扇形排列正確顯示
2. [ ] 選中卡牌突出顯示
3. [ ] 超出數量顯示展開按鈕
4. [ ] 展開視圖功能正常
5. [ ] 卡牌操作正常傳遞
6. [ ] 響應式布局正確
7. [ ] 動畫流暢

---

## 備註

- 扇形排列提供良好的視覺效果
- 考慮觸控設備的操作體驗
