/**
 * TouchCardDetail - 長按顯示卡牌詳情
 *
 * 移動端長按卡牌時顯示的詳細資訊彈窗
 *
 * @module components/games/evolution/touch/TouchCardDetail
 */

import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TRAIT_ICONS,
  TRAIT_COLORS,
  TRAIT_NAMES,
  TRAIT_CATEGORY_MAP,
  TRAIT_FOOD_BONUS,
  TRAIT_DESCRIPTIONS,
} from '../constants/traitVisuals';
import { useHapticFeedback } from '../../../../hooks/useTouch';
import './TouchCardDetail.css';

/**
 * 卡牌詳情組件
 */
export const TouchCardDetail = ({
  visible,
  card,
  position,
  onClose,
  onPlayAsCreature,
  onPlayAsTrait,
}) => {
  const haptic = useHapticFeedback();

  // 顯示時震動
  useEffect(() => {
    if (visible) {
      haptic.medium();
    }
  }, [visible, haptic]);

  // 點擊背景關閉
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        haptic.light();
        onClose?.();
      }
    },
    [onClose, haptic]
  );

  // ESC 關閉
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && visible) {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  // 取得性狀資訊
  const getTraitInfo = useCallback((traitType) => {
    return {
      name: TRAIT_NAMES[traitType] || traitType,
      icon: TRAIT_ICONS[traitType] || '?',
      category: TRAIT_CATEGORY_MAP[traitType] || 'special',
      color: TRAIT_COLORS[TRAIT_CATEGORY_MAP[traitType]] || TRAIT_COLORS.special,
      foodBonus: TRAIT_FOOD_BONUS[traitType] || 0,
      description: TRAIT_DESCRIPTIONS[traitType] || '',
    };
  }, []);

  if (!card) return null;

  const frontInfo = getTraitInfo(card.frontTrait);
  const backInfo = getTraitInfo(card.backTrait);

  // 計算彈窗位置（避免超出螢幕）
  const getPopupStyle = () => {
    if (!position) return {};

    const padding = 16;
    const popupWidth = 280;
    const popupHeight = 400;

    let left = position.x - popupWidth / 2;
    let top = position.y - popupHeight - 20;

    // 確保不超出左右邊界
    if (left < padding) left = padding;
    if (left + popupWidth > window.innerWidth - padding) {
      left = window.innerWidth - popupWidth - padding;
    }

    // 如果上方空間不足，顯示在下方
    if (top < padding) {
      top = position.y + 20;
    }

    return { left, top };
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="touch-card-detail__backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          data-testid="touch-card-detail"
        >
          <motion.div
            className="touch-card-detail__popup"
            style={getPopupStyle()}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* 關閉按鈕 */}
            <button
              className="touch-card-detail__close"
              onClick={onClose}
              aria-label="關閉"
            >
              ✕
            </button>

            {/* 卡牌雙面資訊 */}
            <div className="touch-card-detail__sides">
              {/* 正面 */}
              <div className="touch-card-detail__side">
                <div className="touch-card-detail__side-label">正面</div>
                <div
                  className="touch-card-detail__trait-card"
                  style={{ borderColor: frontInfo.color }}
                >
                  <div
                    className="touch-card-detail__trait-icon"
                    style={{ backgroundColor: frontInfo.color }}
                  >
                    {frontInfo.icon}
                  </div>
                  <div className="touch-card-detail__trait-name">
                    {frontInfo.name}
                    {frontInfo.foodBonus > 0 && (
                      <span className="touch-card-detail__food-bonus">
                        +{frontInfo.foodBonus}
                      </span>
                    )}
                  </div>
                  <div className="touch-card-detail__trait-desc">
                    {frontInfo.description}
                  </div>
                </div>
              </div>

              {/* 分隔線 */}
              <div className="touch-card-detail__divider">
                <span>或</span>
              </div>

              {/* 背面 */}
              <div className="touch-card-detail__side">
                <div className="touch-card-detail__side-label">背面</div>
                <div
                  className="touch-card-detail__trait-card"
                  style={{ borderColor: backInfo.color }}
                >
                  <div
                    className="touch-card-detail__trait-icon"
                    style={{ backgroundColor: backInfo.color }}
                  >
                    {backInfo.icon}
                  </div>
                  <div className="touch-card-detail__trait-name">
                    {backInfo.name}
                    {backInfo.foodBonus > 0 && (
                      <span className="touch-card-detail__food-bonus">
                        +{backInfo.foodBonus}
                      </span>
                    )}
                  </div>
                  <div className="touch-card-detail__trait-desc">
                    {backInfo.description}
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="touch-card-detail__actions">
              <button
                className="touch-card-detail__action touch-card-detail__action--creature"
                onClick={() => {
                  haptic.success();
                  onPlayAsCreature?.(card.instanceId);
                  onClose?.();
                }}
              >
                <span className="touch-card-detail__action-icon">🦎</span>
                <span>作為生物</span>
              </button>
              <button
                className="touch-card-detail__action touch-card-detail__action--trait"
                onClick={() => {
                  haptic.success();
                  onPlayAsTrait?.(card.instanceId);
                  onClose?.();
                }}
              >
                <span className="touch-card-detail__action-icon">🧬</span>
                <span>作為性狀</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

TouchCardDetail.propTypes = {
  visible: PropTypes.bool,
  card: PropTypes.shape({
    instanceId: PropTypes.string.isRequired,
    frontTrait: PropTypes.string.isRequired,
    backTrait: PropTypes.string.isRequired,
  }),
  position: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  onClose: PropTypes.func,
  onPlayAsCreature: PropTypes.func,
  onPlayAsTrait: PropTypes.func,
};

export default TouchCardDetail;
