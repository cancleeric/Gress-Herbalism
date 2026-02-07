/**
 * GestureOverlay - 手勢識別覆蓋層
 *
 * 處理全域手勢（如左滑跳過）
 *
 * @module components/games/evolution/touch/GestureOverlay
 */

import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipe, useHapticFeedback, SWIPE_DIRECTION } from '../../../../hooks/useTouch';
import './GestureOverlay.css';

/**
 * 手勢動作定義
 */
const GESTURE_ACTIONS = {
  PASS: 'pass',
  UNDO: 'undo',
  OPEN_MENU: 'openMenu',
  OPEN_LOG: 'openLog',
};

/**
 * 手勢提示組件
 */
const GestureHint = ({ direction, action, visible }) => {
  const getHintContent = () => {
    switch (action) {
      case GESTURE_ACTIONS.PASS:
        return { icon: '⏭️', text: '跳過' };
      case GESTURE_ACTIONS.UNDO:
        return { icon: '↩️', text: '復原' };
      case GESTURE_ACTIONS.OPEN_MENU:
        return { icon: '☰', text: '選單' };
      case GESTURE_ACTIONS.OPEN_LOG:
        return { icon: '📜', text: '紀錄' };
      default:
        return { icon: '', text: '' };
    }
  };

  const content = getHintContent();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={`gesture-hint gesture-hint--${direction}`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <span className="gesture-hint__icon">{content.icon}</span>
          <span className="gesture-hint__text">{content.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

GestureHint.propTypes = {
  direction: PropTypes.string,
  action: PropTypes.string,
  visible: PropTypes.bool,
};

/**
 * 手勢覆蓋層組件
 */
export const GestureOverlay = ({
  children,
  enabled = true,
  onPass,
  onUndo,
  onOpenMenu,
  onOpenLog,
  swipeThreshold = 100,
  edgeWidth = 50,
}) => {
  const haptic = useHapticFeedback();
  const [activeGesture, setActiveGesture] = useState(null);
  const [showHint, setShowHint] = useState(false);

  // 判斷手勢對應的動作
  const getGestureAction = useCallback(
    (direction, startX) => {
      const isFromLeftEdge = startX < edgeWidth;
      const isFromRightEdge = startX > window.innerWidth - edgeWidth;

      switch (direction) {
        case SWIPE_DIRECTION.LEFT:
          // 從右邊緣左滑 = 跳過
          if (isFromRightEdge) return GESTURE_ACTIONS.PASS;
          break;
        case SWIPE_DIRECTION.RIGHT:
          // 從左邊緣右滑 = 復原或開選單
          if (isFromLeftEdge) return GESTURE_ACTIONS.OPEN_MENU;
          break;
        case SWIPE_DIRECTION.UP:
          // 從右邊緣上滑 = 打開紀錄
          if (isFromRightEdge) return GESTURE_ACTIONS.OPEN_LOG;
          break;
        default:
          break;
      }
      return null;
    },
    [edgeWidth]
  );

  // 執行手勢動作
  const executeGestureAction = useCallback(
    (action) => {
      haptic.medium();

      switch (action) {
        case GESTURE_ACTIONS.PASS:
          onPass?.();
          break;
        case GESTURE_ACTIONS.UNDO:
          onUndo?.();
          break;
        case GESTURE_ACTIONS.OPEN_MENU:
          onOpenMenu?.();
          break;
        case GESTURE_ACTIONS.OPEN_LOG:
          onOpenLog?.();
          break;
        default:
          break;
      }
    },
    [haptic, onPass, onUndo, onOpenMenu, onOpenLog]
  );

  // 滑動處理
  const { handlers, swiping, swipeOffset } = useSwipe(
    {
      onSwipe: (data) => {
        if (!enabled) return;

        // 這裡需要記錄起始位置，但 useSwipe 沒有提供
        // 暫時使用簡化邏輯
        const action = getGestureAction(data.direction, window.innerWidth / 2);

        if (action && Math.abs(data.deltaX) > swipeThreshold) {
          executeGestureAction(action);
        }

        setActiveGesture(null);
        setShowHint(false);
      },
    },
    {
      threshold: swipeThreshold / 2, // 較低的閾值用於顯示提示
      preventDefault: false,
    }
  );

  // 更新提示顯示
  const handleTouchMove = useCallback(
    (e) => {
      handlers.onTouchMove(e);

      if (!enabled || !swiping) return;

      const absX = Math.abs(swipeOffset.x);
      const absY = Math.abs(swipeOffset.y);

      if (absX > 30 || absY > 30) {
        let direction = null;
        if (absX > absY) {
          direction = swipeOffset.x > 0 ? SWIPE_DIRECTION.RIGHT : SWIPE_DIRECTION.LEFT;
        } else {
          direction = swipeOffset.y > 0 ? SWIPE_DIRECTION.DOWN : SWIPE_DIRECTION.UP;
        }

        // 簡化：使用螢幕中心作為判斷
        const action = getGestureAction(direction, window.innerWidth / 2);

        if (action) {
          setActiveGesture({ direction, action });
          setShowHint(absX > swipeThreshold / 2 || absY > swipeThreshold / 2);

          if (absX > swipeThreshold || absY > swipeThreshold) {
            haptic.light();
          }
        }
      }
    },
    [
      handlers,
      enabled,
      swiping,
      swipeOffset,
      swipeThreshold,
      getGestureAction,
      haptic,
    ]
  );

  const handleTouchEnd = useCallback(
    (e) => {
      handlers.onTouchEnd(e);
      setActiveGesture(null);
      setShowHint(false);
    },
    [handlers]
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="gesture-overlay"
      onTouchStart={handlers.onTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      data-testid="gesture-overlay"
    >
      {children}

      {/* 手勢提示 */}
      <GestureHint
        direction={activeGesture?.direction}
        action={activeGesture?.action}
        visible={showHint}
      />

      {/* 邊緣指示器 */}
      <div className="gesture-overlay__edge gesture-overlay__edge--left" />
      <div className="gesture-overlay__edge gesture-overlay__edge--right" />
    </div>
  );
};

GestureOverlay.propTypes = {
  children: PropTypes.node.isRequired,
  enabled: PropTypes.bool,
  onPass: PropTypes.func,
  onUndo: PropTypes.func,
  onOpenMenu: PropTypes.func,
  onOpenLog: PropTypes.func,
  swipeThreshold: PropTypes.number,
  edgeWidth: PropTypes.number,
};

export default GestureOverlay;
