# 工單 0341：拖放目標區域組件

## 基本資訊
- **工單編號**：0341
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0340（拖放系統核心）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/dnd/DropZone.jsx`（新增）
  - `frontend/src/components/games/evolution/dnd/NewCreatureZone.jsx`（新增）
  - `frontend/src/components/games/evolution/dnd/DropZone.css`（新增）

---

## 目標

建立拖放目標區域組件：
1. 通用 DropZone 組件
2. 新建生物區域
3. 放置有效性視覺反饋
4. 動畫效果

---

## 詳細規格

### 1. 通用 DropZone

```jsx
// frontend/src/components/games/evolution/dnd/DropZone.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import './DropZone.css';

/**
 * 通用拖放目標區域
 */
export const DropZone = ({
  accept,
  onDrop,
  canDrop: canDropProp,
  children,
  placeholder,
  activeLabel,
  invalidLabel,
  disabled = false,
  className = '',
}) => {
  const [{ isOver, canDrop, draggedItem }, dropRef] = useDrop({
    accept,
    canDrop: (item, monitor) => {
      if (disabled) return false;
      if (canDropProp) return canDropProp(item, monitor);
      return true;
    },
    drop: (item, monitor) => {
      if (!monitor.didDrop()) {
        onDrop?.(item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  });

  // 狀態判斷
  const isActive = isOver && canDrop;
  const isInvalid = isOver && !canDrop;

  // CSS 類別
  const zoneClasses = [
    'drop-zone',
    isActive && 'drop-zone--active',
    isInvalid && 'drop-zone--invalid',
    disabled && 'drop-zone--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      ref={dropRef}
      className={zoneClasses}
      animate={{
        scale: isActive ? 1.02 : 1,
        borderColor: isActive ? '#10b981' : isInvalid ? '#ef4444' : undefined,
      }}
      transition={{ duration: 0.15 }}
    >
      {children}

      {/* 空狀態佔位 */}
      {!children && placeholder && (
        <div className="drop-zone__placeholder">
          {placeholder}
        </div>
      )}

      {/* 活動狀態標籤 */}
      {isActive && activeLabel && (
        <motion.div
          className="drop-zone__label drop-zone__label--active"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {activeLabel}
        </motion.div>
      )}

      {/* 無效狀態標籤 */}
      {isInvalid && invalidLabel && (
        <motion.div
          className="drop-zone__label drop-zone__label--invalid"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {invalidLabel}
        </motion.div>
      )}
    </motion.div>
  );
};

DropZone.propTypes = {
  accept: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]).isRequired,
  onDrop: PropTypes.func,
  canDrop: PropTypes.func,
  children: PropTypes.node,
  placeholder: PropTypes.node,
  activeLabel: PropTypes.string,
  invalidLabel: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default DropZone;
```

### 2. 新建生物區域

```jsx
// frontend/src/components/games/evolution/dnd/NewCreatureZone.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { DropZone } from './DropZone';
import { DRAG_TYPES } from './dragTypes';
import './NewCreatureZone.css';

/**
 * 新建生物區域
 * 用於將手牌拖放創建新生物
 */
export const NewCreatureZone = ({
  onCreateCreature,
  disabled = false,
  visible = true,
  className = '',
}) => {
  const handleDrop = (item) => {
    if (item.cardId) {
      onCreateCreature?.(item.cardId);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`new-creature-zone ${className}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <DropZone
            accept={DRAG_TYPES.HAND_CARD}
            onDrop={handleDrop}
            disabled={disabled}
            placeholder={
              <div className="new-creature-zone__content">
                <span className="new-creature-zone__icon">🦎</span>
                <span className="new-creature-zone__text">
                  拖放卡牌創建新生物
                </span>
              </div>
            }
            activeLabel="放開創建生物"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

NewCreatureZone.propTypes = {
  onCreateCreature: PropTypes.func,
  disabled: PropTypes.bool,
  visible: PropTypes.bool,
  className: PropTypes.string,
};

export default NewCreatureZone;
```

### 3. 樣式

```css
/* frontend/src/components/games/evolution/dnd/DropZone.css */

.drop-zone {
  position: relative;
  min-height: 80px;
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.5);
  transition: all 0.2s ease;
}

.drop-zone--active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.drop-zone--invalid {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.drop-zone--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.drop-zone__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 80px;
  padding: 16px;
  color: #94a3b8;
  text-align: center;
}

.drop-zone__label {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.drop-zone__label--active {
  background: #10b981;
  color: #fff;
}

.drop-zone__label--invalid {
  background: #ef4444;
  color: #fff;
}

/* === NewCreatureZone.css === */

.new-creature-zone {
  width: 100%;
  max-width: 200px;
  margin: 0 auto;
}

.new-creature-zone__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.new-creature-zone__icon {
  font-size: 32px;
  opacity: 0.6;
}

.new-creature-zone__text {
  font-size: 12px;
  color: #64748b;
}
```

---

## 驗收標準

1. [ ] DropZone 正確接受拖放
2. [ ] 有效/無效狀態視覺反饋
3. [ ] 新建生物區域功能正常
4. [ ] 動畫效果流暢
5. [ ] disabled 狀態正確
6. [ ] 標籤正確顯示
7. [ ] 與卡牌組件整合正常

---

## 備註

- DropZone 是可複用的基礎組件
- 需與遊戲邏輯正確整合
