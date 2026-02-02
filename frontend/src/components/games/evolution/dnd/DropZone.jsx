/**
 * DropZone - 通用拖放目標區域
 *
 * @module components/games/evolution/dnd/DropZone
 */

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
      data-testid="drop-zone"
      animate={{
        scale: isActive ? 1.02 : 1,
        borderColor: isActive ? '#10b981' : isInvalid ? '#ef4444' : undefined,
      }}
      transition={{ duration: 0.15 }}
    >
      {children}

      {/* 空狀態佔位 */}
      {!children && placeholder && (
        <div className="drop-zone__placeholder" data-testid="drop-zone-placeholder">
          {placeholder}
        </div>
      )}

      {/* 活動狀態標籤 */}
      {isActive && activeLabel && (
        <motion.div
          className="drop-zone__label drop-zone__label--active"
          data-testid="drop-zone-active-label"
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
          data-testid="drop-zone-invalid-label"
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
