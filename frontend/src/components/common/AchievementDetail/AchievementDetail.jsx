/**
 * 成就詳情彈窗
 *
 * @module components/common/AchievementDetail/AchievementDetail
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { getRarity } from '../AchievementToast/AchievementToast';
import './AchievementDetail.css';

/** 類別標籤 */
const CATEGORY_LABELS = {
  milestone: '里程碑',
  gameplay: '遊戲玩法',
  collection: '收集類',
  special: '特殊成就',
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { scale: 0.85, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: { scale: 0.85, opacity: 0 },
};

/**
 * 成就詳情彈窗
 *
 * @param {Object}   props
 * @param {Object}   props.achievement  - 成就物件（含 progress 0-100 欄位）
 * @param {boolean}  props.isOpen       - 控制顯示
 * @param {Function} props.onClose      - 關閉回調
 * @param {Function} props.onShare      - 分享回調（選填）
 */
export function AchievementDetailModal({ achievement, isOpen, onClose, onShare }) {
  const handleOverlayClick = useCallback(() => onClose && onClose(), [onClose]);
  const handleModalClick = useCallback((e) => e.stopPropagation(), []);

  if (!achievement) return null;

  const rarity = getRarity(achievement.points || 0);
  const categoryLabel = CATEGORY_LABELS[achievement.category] || achievement.category || '';
  const progress = achievement.progress ?? (achievement.unlocked ? 100 : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="achievement-detail__overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleOverlayClick}
          data-testid="achievement-detail-overlay"
        >
          <motion.div
            className={`achievement-detail ${rarity.className}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleModalClick}
            data-testid="achievement-detail-modal"
          >
            {/* 關閉按鈕 */}
            <button
              className="achievement-detail__close"
              onClick={onClose}
              aria-label="關閉"
              data-testid="achievement-detail-close"
            >
              ×
            </button>

            {/* 圖示與標題 */}
            <div className="achievement-detail__header">
              <span className="achievement-detail__icon">{achievement.icon}</span>
              <div className="achievement-detail__meta">
                <div className="achievement-detail__badges">
                  {categoryLabel && (
                    <span className="achievement-detail__category">{categoryLabel}</span>
                  )}
                  <span className={`achievement-detail__rarity ${rarity.className}`}>
                    {rarity.label}
                  </span>
                </div>
                <h2 className="achievement-detail__name">{achievement.name}</h2>
                {achievement.unlocked && (
                  <span className="achievement-detail__unlocked-tag">✓ 已解鎖</span>
                )}
              </div>
            </div>

            {/* 描述 */}
            {achievement.description && (
              <p className="achievement-detail__description">{achievement.description}</p>
            )}

            {/* 進度條 */}
            {!achievement.unlocked && (
              <div className="achievement-detail__progress-section">
                <div className="achievement-detail__progress-label">
                  <span>解鎖進度</span>
                  <span className="achievement-detail__progress-value">
                    {Math.round(progress)}%
                  </span>
                </div>
                <div
                  className="achievement-detail__progress-bar"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  data-testid="achievement-progress-bar"
                >
                  <div
                    className="achievement-detail__progress-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                {achievement.currentValue != null && achievement.targetValue != null && (
                  <p className="achievement-detail__progress-text">
                    {achievement.currentValue} / {achievement.targetValue}
                  </p>
                )}
              </div>
            )}

            {/* 點數 */}
            <div className="achievement-detail__footer">
              <span className="achievement-detail__points">+{achievement.points || 0} 點</span>
              {onShare && (
                <button
                  className="achievement-detail__share-btn"
                  onClick={() => onShare(achievement)}
                  data-testid="achievement-share-btn"
                >
                  📤 分享
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

AchievementDetailModal.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    icon: PropTypes.string,
    points: PropTypes.number,
    unlocked: PropTypes.bool,
    progress: PropTypes.number,
    currentValue: PropTypes.number,
    targetValue: PropTypes.number,
    category: PropTypes.string,
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onShare: PropTypes.func,
};

export default AchievementDetailModal;
