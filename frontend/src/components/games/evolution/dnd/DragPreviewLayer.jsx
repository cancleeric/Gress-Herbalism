/**
 * DragPreviewLayer - 拖動預覽層
 *
 * 自定義拖動時的視覺效果
 *
 * @module components/games/evolution/dnd/DragPreviewLayer
 */

import React from 'react';
import { useDragLayer } from 'react-dnd';
import { motion } from 'framer-motion';
import { DRAG_TYPES } from './dragTypes';
import './DragPreviewLayer.css';

/**
 * 拖動預覽層組件
 */
export const DragPreviewLayer = () => {
  const { item, itemType, isDragging, currentOffset } = useDragLayer(
    (monitor) => ({
      item: monitor.getItem(),
      itemType: monitor.getItemType(),
      isDragging: monitor.isDragging(),
      currentOffset: monitor.getClientOffset(),
    })
  );

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
          <div
            className="drag-preview drag-preview--card"
            data-testid="drag-preview-card"
          >
            <div className="drag-preview__card-content">
              {item?.card?.frontTrait || '🃏'}
            </div>
          </div>
        );

      case DRAG_TYPES.FOOD_TOKEN:
        return (
          <div
            className="drag-preview drag-preview--food"
            data-testid="drag-preview-food"
          >
            🍖
          </div>
        );

      case DRAG_TYPES.CREATURE:
        return (
          <div
            className="drag-preview drag-preview--creature"
            data-testid="drag-preview-creature"
          >
            🦎
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="drag-preview-layer"
      style={{ transform }}
      data-testid="drag-preview-layer"
    >
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
