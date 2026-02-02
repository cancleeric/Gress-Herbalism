/**
 * 拖動預覽 Hooks
 *
 * @module components/games/evolution/dnd/useDragPreview
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getEmptyImage } from 'react-dnd-html5-backend';

/**
 * 自定義拖動預覽 Hook
 * 隱藏默認預覽，使用自定義預覽層
 *
 * @param {Function} preview - react-dnd 的 preview connector
 * @returns {React.RefObject} previewRef
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
 *
 * @returns {Object} 拖動狀態和控制函數
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
