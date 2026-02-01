# 工單 0340：拖放系統核心

## 基本資訊
- **工單編號**：0340
- **所屬計畫**：P2-B 前端 UI
- **前置工單**：0331-0339（基礎組件）
- **預計影響檔案**：
  - `frontend/src/components/games/evolution/dnd/DndContext.jsx`（新增）
  - `frontend/src/components/games/evolution/dnd/dragTypes.js`（新增）
  - `frontend/src/components/games/evolution/dnd/useDragPreview.js`（新增）

---

## 目標

建立統一的拖放系統核心：
1. 定義拖放類型常數
2. 建立 DnD Context 包裝器
3. 實作拖動預覽
4. 支援觸控設備

---

## 詳細規格

### 1. 拖放類型定義

```javascript
// frontend/src/components/games/evolution/dnd/dragTypes.js

/**
 * 拖放項目類型
 */
export const DRAG_TYPES = {
  // 手牌
  HAND_CARD: 'HAND_CARD',

  // 食物
  FOOD_TOKEN: 'FOOD_TOKEN',

  // 生物（用於互動性狀連結）
  CREATURE: 'CREATURE',
};

/**
 * 放置目標類型
 */
export const DROP_TARGETS = {
  // 生物區域（放置性狀）
  CREATURE_SLOT: 'CREATURE_SLOT',

  // 新生物區（創建生物）
  NEW_CREATURE_ZONE: 'NEW_CREATURE_ZONE',

  // 生物（餵食、連結）
  CREATURE: 'CREATURE',

  // 棄牌區
  DISCARD_PILE: 'DISCARD_PILE',
};

/**
 * 拖放動作結果
 */
export const DROP_RESULTS = {
  SUCCESS: 'success',
  INVALID_TARGET: 'invalid_target',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
};
```

### 2. DnD Context 包裝器

```jsx
// frontend/src/components/games/evolution/dnd/DndContext.jsx

import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { DragPreviewLayer } from './DragPreviewLayer';
import { useIsMobile } from '../../../../hooks/useIsMobile';

/**
 * 演化論遊戲 DnD Context
 */
export const EvolutionDndContext = ({
  children,
  onDragStart,
  onDragEnd,
  onDrop,
}) => {
  const isMobile = useIsMobile();

  // 選擇後端
  const backend = isMobile ? TouchBackend : HTML5Backend;

  // 後端選項
  const backendOptions = useMemo(() => {
    if (isMobile) {
      return {
        enableMouseEvents: true,
        enableTouchEvents: true,
        delayTouchStart: 200,
        ignoreContextMenu: true,
      };
    }
    return {};
  }, [isMobile]);

  return (
    <DndProvider backend={backend} options={backendOptions}>
      {children}
      <DragPreviewLayer />
    </DndProvider>
  );
};

EvolutionDndContext.propTypes = {
  children: PropTypes.node.isRequired,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
};

export default EvolutionDndContext;
```

### 3. 拖動預覽層

```jsx
// frontend/src/components/games/evolution/dnd/DragPreviewLayer.jsx

import React from 'react';
import { useDragLayer } from 'react-dnd';
import { motion } from 'framer-motion';
import { DRAG_TYPES } from './dragTypes';
import { HandCard } from '../cards/HandCard';
import './DragPreviewLayer.css';

/**
 * 拖動預覽層
 * 自定義拖動時的視覺效果
 */
export const DragPreviewLayer = () => {
  const {
    item,
    itemType,
    isDragging,
    currentOffset,
    initialOffset,
  } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getClientOffset(),
    initialOffset: monitor.getInitialClientOffset(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  // 計算位置
  const transform = `translate(${currentOffset.x - 50}px, ${currentOffset.y - 70}px)`;

  // 渲染預覽
  const renderPreview = () => {
    switch (itemType) {
      case DRAG_TYPES.HAND_CARD:
        return (
          <div className="drag-preview drag-preview--card">
            <div className="drag-preview__card-content">
              {item.card?.frontTrait || '卡牌'}
            </div>
          </div>
        );

      case DRAG_TYPES.FOOD_TOKEN:
        return (
          <div className="drag-preview drag-preview--food">
            🍖
          </div>
        );

      case DRAG_TYPES.CREATURE:
        return (
          <div className="drag-preview drag-preview--creature">
            🦎
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="drag-preview-layer" style={{ transform }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.1, opacity: 0.9 }}
        className="drag-preview-wrapper"
      >
        {renderPreview()}
      </motion.div>
    </div>
  );
};

export default DragPreviewLayer;
```

### 4. 拖動預覽 Hook

```jsx
// frontend/src/components/games/evolution/dnd/useDragPreview.js

import { useEffect, useRef } from 'react';
import { getEmptyImage } from 'react-dnd-html5-backend';

/**
 * 自定義拖動預覽 Hook
 * 隱藏默認預覽，使用自定義預覽層
 */
export function useDragPreview(preview) {
  const previewRef = useRef(null);

  useEffect(() => {
    if (preview) {
      // 隱藏默認預覽圖
      preview(getEmptyImage(), { captureDraggingState: true });
    }
  }, [preview]);

  return previewRef;
}

/**
 * 拖動狀態 Hook
 */
export function useDragState() {
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedItem: null,
    draggedType: null,
  });

  const startDrag = useCallback((item, type) => {
    setDragState({
      isDragging: true,
      draggedItem: item,
      draggedType: type,
    });
  }, []);

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      draggedType: null,
    });
  }, []);

  return {
    ...dragState,
    startDrag,
    endDrag,
  };
}
```

### 5. 樣式

```css
/* frontend/src/components/games/evolution/dnd/DragPreviewLayer.css */

.drag-preview-layer {
  position: fixed;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 9999;
}

.drag-preview-wrapper {
  transform-origin: center center;
}

.drag-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.drag-preview--card {
  width: 100px;
  height: 140px;
  background: linear-gradient(135deg, #fff 0%, #f1f5f9 100%);
  border: 2px solid var(--color-primary);
}

.drag-preview__card-content {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  padding: 8px;
}

.drag-preview--food {
  width: 48px;
  height: 48px;
  font-size: 32px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 50%;
}

.drag-preview--creature {
  width: 80px;
  height: 80px;
  font-size: 48px;
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}
```

---

## 驗收標準

1. [ ] 拖放類型常數定義完整
2. [ ] DnD Context 正確包裝
3. [ ] 觸控後端正常運作
4. [ ] 自定義預覽層顯示
5. [ ] 預覽跟隨滑鼠/手指
6. [ ] Hook 可正常使用
7. [ ] 效能良好

---

## 備註

- 拖放是核心互動機制
- 需同時支援桌面和觸控設備
- 預覽層提供更好的視覺反饋
