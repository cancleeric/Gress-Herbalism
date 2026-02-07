/**
 * 觸控優化組件
 *
 * 提供移動端觸控體驗優化的組件集合
 *
 * @module components/games/evolution/touch
 */

export { TouchCardDetail } from './TouchCardDetail';
export { PinchZoomContainer } from './PinchZoomContainer';
export { GestureOverlay } from './GestureOverlay';
export { SwipeCardSelector } from './SwipeCardSelector';

// 重新匯出 hooks
export {
  useLongPress,
  useSwipe,
  usePinchZoom,
  useDoubleTap,
  useHapticFeedback,
  useMultiSelect,
  useGestures,
  SWIPE_DIRECTION,
} from '../../../../hooks/useTouch';
