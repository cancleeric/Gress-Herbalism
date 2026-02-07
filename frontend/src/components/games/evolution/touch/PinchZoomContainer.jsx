/**
 * PinchZoomContainer - 雙指縮放容器
 *
 * 包裝遊戲板，支援雙指縮放和平移
 *
 * @module components/games/evolution/touch/PinchZoomContainer
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { usePinchZoom, useDoubleTap } from '../../../../hooks/useTouch';
import './PinchZoomContainer.css';

/**
 * 雙指縮放容器組件
 */
export const PinchZoomContainer = ({
  children,
  minScale = 0.5,
  maxScale = 3,
  initialScale = 1,
  enableDoubleTapReset = true,
  className = '',
  onScaleChange,
}) => {
  const containerRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const lastTouchRef = useRef({ x: 0, y: 0 });
  const lastOffsetRef = useRef({ x: 0, y: 0 });

  // 使用雙指縮放 hook
  const {
    handlers: pinchHandlers,
    scale,
    isPinching,
    origin,
    resetScale,
    setScale,
  } = usePinchZoom({
    minScale,
    maxScale,
    onPinchStart: () => {
      lastOffsetRef.current = offset;
    },
    onPinchMove: ({ scale: newScale }) => {
      onScaleChange?.(newScale);
    },
  });

  // 初始化縮放
  useEffect(() => {
    if (initialScale !== 1) {
      setScale(initialScale);
    }
  }, [initialScale, setScale]);

  // 雙擊重置
  const doubleTapHandlers = useDoubleTap(
    enableDoubleTapReset
      ? () => {
          resetScale();
          setOffset({ x: 0, y: 0 });
          onScaleChange?.(1);
        }
      : null
  );

  // 單指平移（縮放後）
  const handleTouchStart = useCallback(
    (e) => {
      pinchHandlers.onTouchStart(e);

      if (e.touches.length === 1 && scale > 1) {
        setIsDragging(true);
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        lastOffsetRef.current = offset;
      }
    },
    [pinchHandlers, scale, offset]
  );

  const handleTouchMove = useCallback(
    (e) => {
      pinchHandlers.onTouchMove(e);

      if (isDragging && e.touches.length === 1 && scale > 1) {
        const deltaX = e.touches[0].clientX - lastTouchRef.current.x;
        const deltaY = e.touches[0].clientY - lastTouchRef.current.y;

        // 限制平移範圍
        const container = containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const maxOffsetX = (rect.width * (scale - 1)) / 2;
          const maxOffsetY = (rect.height * (scale - 1)) / 2;

          setOffset({
            x: Math.max(
              -maxOffsetX,
              Math.min(maxOffsetX, lastOffsetRef.current.x + deltaX)
            ),
            y: Math.max(
              -maxOffsetY,
              Math.min(maxOffsetY, lastOffsetRef.current.y + deltaY)
            ),
          });
        }
      }
    },
    [pinchHandlers, isDragging, scale]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      pinchHandlers.onTouchEnd(e);
      doubleTapHandlers.onTouchEnd(e);
      setIsDragging(false);
    },
    [pinchHandlers, doubleTapHandlers]
  );

  // 重置函數
  const reset = useCallback(() => {
    resetScale();
    setOffset({ x: 0, y: 0 });
    onScaleChange?.(1);
  }, [resetScale, onScaleChange]);

  return (
    <div
      ref={containerRef}
      className={`pinch-zoom-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      data-testid="pinch-zoom-container"
    >
      <motion.div
        className="pinch-zoom-container__content"
        style={{
          transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
          transformOrigin: isPinching
            ? `${origin.x}px ${origin.y}px`
            : 'center center',
        }}
        animate={{
          scale,
          x: offset.x,
          y: offset.y,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
          mass: 0.5,
        }}
      >
        {children}
      </motion.div>

      {/* 縮放指示器 */}
      {scale !== 1 && (
        <div className="pinch-zoom-container__indicator">
          <span>{Math.round(scale * 100)}%</span>
          <button
            className="pinch-zoom-container__reset"
            onClick={reset}
            aria-label="重置縮放"
          >
            重置
          </button>
        </div>
      )}

      {/* 縮放提示（首次使用） */}
      {scale === 1 && (
        <div className="pinch-zoom-container__hint touch-only">
          雙指縮放查看詳情
        </div>
      )}
    </div>
  );
};

PinchZoomContainer.propTypes = {
  children: PropTypes.node.isRequired,
  minScale: PropTypes.number,
  maxScale: PropTypes.number,
  initialScale: PropTypes.number,
  enableDoubleTapReset: PropTypes.bool,
  className: PropTypes.string,
  onScaleChange: PropTypes.func,
};

export default PinchZoomContainer;
