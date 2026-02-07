/**
 * SwipeCardSelector - 滑動選擇多張卡
 *
 * 支援滑動手勢選擇多張手牌
 *
 * @module components/games/evolution/touch/SwipeCardSelector
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '../../../../hooks/useTouch';
import './SwipeCardSelector.css';

/**
 * 滑動選擇器組件
 */
export const SwipeCardSelector = ({
  children,
  items = [],
  onSelectionChange,
  enabled = true,
  multiSelect = true,
  maxSelect = null,
  className = '',
}) => {
  const haptic = useHapticFeedback();
  const containerRef = useRef(null);
  const itemRefs = useRef(new Map());

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectionRect, setSelectionRect] = useState(null);
  const startPosRef = useRef({ x: 0, y: 0 });

  // 註冊項目 ref
  const registerItemRef = useCallback((id, ref) => {
    if (ref) {
      itemRefs.current.set(id, ref);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // 檢查矩形是否相交
  const rectsIntersect = useCallback((rect1, rect2) => {
    return !(
      rect1.right < rect2.left ||
      rect1.left > rect2.right ||
      rect1.bottom < rect2.top ||
      rect1.top > rect2.bottom
    );
  }, []);

  // 取得項目位置
  const getItemRect = useCallback((id) => {
    const ref = itemRefs.current.get(id);
    if (!ref) return null;
    return ref.getBoundingClientRect();
  }, []);

  // 處理觸控開始
  const handleTouchStart = useCallback(
    (e) => {
      if (!enabled || e.touches.length !== 1) return;

      const touch = e.touches[0];
      startPosRef.current = { x: touch.clientX, y: touch.clientY };

      // 延遲開始選擇（避免誤觸）
      const startTimer = setTimeout(() => {
        setIsSelecting(true);
        setSelectedIds(new Set());
        haptic.light();
      }, 150);

      // 存儲計時器以便取消
      containerRef.current._startTimer = startTimer;
    },
    [enabled, haptic]
  );

  // 處理觸控移動
  const handleTouchMove = useCallback(
    (e) => {
      if (!isSelecting || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const x1 = Math.min(startPosRef.current.x, touch.clientX);
      const y1 = Math.min(startPosRef.current.y, touch.clientY);
      const x2 = Math.max(startPosRef.current.x, touch.clientX);
      const y2 = Math.max(startPosRef.current.y, touch.clientY);

      const rect = {
        left: x1,
        top: y1,
        right: x2,
        bottom: y2,
        width: x2 - x1,
        height: y2 - y1,
      };

      setSelectionRect(rect);

      // 檢查選中的項目
      const newSelected = new Set();
      items.forEach((item) => {
        const id = item.id || item.instanceId;
        const itemRect = getItemRect(id);

        if (itemRect && rectsIntersect(rect, itemRect)) {
          if (!maxSelect || newSelected.size < maxSelect) {
            newSelected.add(id);
          }
        }
      });

      // 如果選擇變更，震動反饋
      if (newSelected.size !== selectedIds.size) {
        haptic.light();
      }

      setSelectedIds(newSelected);
    },
    [isSelecting, items, getItemRect, rectsIntersect, maxSelect, selectedIds.size, haptic]
  );

  // 處理觸控結束
  const handleTouchEnd = useCallback(() => {
    // 取消開始計時器
    if (containerRef.current?._startTimer) {
      clearTimeout(containerRef.current._startTimer);
    }

    if (isSelecting) {
      setIsSelecting(false);
      setSelectionRect(null);

      if (selectedIds.size > 0) {
        haptic.medium();
        onSelectionChange?.(Array.from(selectedIds));
      }
    }
  }, [isSelecting, selectedIds, haptic, onSelectionChange]);

  // 清理計時器
  useEffect(() => {
    return () => {
      if (containerRef.current?._startTimer) {
        clearTimeout(containerRef.current._startTimer);
      }
    };
  }, []);

  // 渲染子元素並傳遞選擇狀態
  const renderChildren = () => {
    return React.Children.map(children, (child) => {
      if (!React.isValidElement(child)) return child;

      const itemId = child.props.card?.instanceId || child.props.id;

      return React.cloneElement(child, {
        ref: (ref) => registerItemRef(itemId, ref),
        isSwipeSelected: selectedIds.has(itemId),
        'data-swipe-id': itemId,
      });
    });
  };

  return (
    <div
      ref={containerRef}
      className={`swipe-card-selector ${className} ${isSelecting ? 'swipe-card-selector--selecting' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      data-testid="swipe-card-selector"
    >
      {renderChildren()}

      {/* 選擇框 */}
      <AnimatePresence>
        {isSelecting && selectionRect && selectionRect.width > 10 && (
          <motion.div
            className="swipe-card-selector__rect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              left: selectionRect.left,
              top: selectionRect.top,
              width: selectionRect.width,
              height: selectionRect.height,
            }}
          />
        )}
      </AnimatePresence>

      {/* 選擇計數 */}
      <AnimatePresence>
        {isSelecting && selectedIds.size > 0 && (
          <motion.div
            className="swipe-card-selector__count"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            已選擇 {selectedIds.size} 張
            {maxSelect && ` / ${maxSelect}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

SwipeCardSelector.propTypes = {
  children: PropTypes.node.isRequired,
  items: PropTypes.array,
  onSelectionChange: PropTypes.func,
  enabled: PropTypes.bool,
  multiSelect: PropTypes.bool,
  maxSelect: PropTypes.number,
  className: PropTypes.string,
};

export default SwipeCardSelector;
