/**
 * EvolutionDndContext - 演化論遊戲 DnD Context
 *
 * 統一的拖放系統包裝器
 *
 * @module components/games/evolution/dnd/DndContext
 */

import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DragPreviewLayer } from './DragPreviewLayer';

/**
 * 檢測是否為觸控設備
 */
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

/**
 * 演化論遊戲 DnD Context
 */
export const EvolutionDndContext = ({
  children,
  enablePreview = true,
  onDragStart,
  onDragEnd,
  onDrop,
}) => {
  // 後端選項
  const backendOptions = useMemo(() => {
    if (isTouchDevice()) {
      return {
        enableMouseEvents: true,
      };
    }
    return {};
  }, []);

  return (
    <DndProvider backend={HTML5Backend} options={backendOptions}>
      {children}
      {enablePreview && <DragPreviewLayer />}
    </DndProvider>
  );
};

EvolutionDndContext.propTypes = {
  children: PropTypes.node.isRequired,
  enablePreview: PropTypes.bool,
  onDragStart: PropTypes.func,
  onDragEnd: PropTypes.func,
  onDrop: PropTypes.func,
};

export default EvolutionDndContext;
