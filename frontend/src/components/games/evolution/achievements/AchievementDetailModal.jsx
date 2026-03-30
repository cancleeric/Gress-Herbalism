/**
 * 成就詳情彈窗
 */

import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import './AchievementDetailModal.css';

const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  legendary: '傳說',
};

const CATEGORY_LABELS = {
  milestone: '里程碑',
  gameplay: '遊戲玩法',
  collection: '收集類',
  special: '特殊成就',
};

/**
 * 成就詳情彈窗
 * @param {Object} props
 * @param {Object} props.achievement - 成就資料
 * @param {Function} props.onClose - 關閉回調
 * @param {Function} [props.onShare] - 分享回調
 */
function AchievementDetailModal({ achievement, onClose, onShare }) {
  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  if (!achievement) return null;

  const {
    icon,
    name,
    description,
    points,
    unlocked,
    rarity = 'common',
    category,
    progress = 0,
    currentValue,
    targetValue,
  } = achievement;

  const rarityLabel = RARITY_LABELS[rarity] || '普通';
  const categoryLabel = CATEGORY_LABELS[category] || '';
  const progressPercent = Math.min(Math.max(progress, 0), 100);

  return (
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
    <div
      className="achievement-detail-modal__backdrop"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`成就詳情：${name}`}
    >
      <div className="achievement-detail-modal">
        <button
          className="achievement-detail-modal__close"
          onClick={onClose}
          aria-label="關閉"
        >
          ✕
        </button>

        {/* 成就圖示 */}
        <div
          className={`achievement-detail-modal__icon-wrap achievement-detail-modal__icon-wrap--${rarity} ${unlocked ? '' : 'achievement-detail-modal__icon-wrap--locked'}`}
        >
          <span className="achievement-detail-modal__icon">{icon}</span>
        </div>

        {/* 稀有度標籤 */}
        <span className={`achievement-detail-modal__rarity achievement-detail-modal__rarity--${rarity}`}>
          {rarityLabel}
        </span>

        {/* 名稱 */}
        <h2 className="achievement-detail-modal__name">{name}</h2>

        {/* 類別 */}
        {categoryLabel && (
          <span className="achievement-detail-modal__category">{categoryLabel}</span>
        )}

        {/* 描述 */}
        <p className="achievement-detail-modal__description">{description}</p>

        {/* 進度條（未解鎖時顯示） */}
        {!unlocked && (
          <div className="achievement-detail-modal__progress-section">
            <div className="achievement-detail-modal__progress-label">
              <span>進度</span>
              {currentValue !== undefined && targetValue !== undefined && (
                <span className="achievement-detail-modal__progress-value">
                  {currentValue} / {targetValue}
                </span>
              )}
            </div>
            <div
              className="achievement-detail-modal__progress-bar"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="achievement-detail-modal__progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="achievement-detail-modal__progress-percent">{progressPercent}%</span>
          </div>
        )}

        {/* 解鎖狀態 */}
        <div className="achievement-detail-modal__footer">
          <span className={`achievement-detail-modal__status ${unlocked ? 'achievement-detail-modal__status--unlocked' : 'achievement-detail-modal__status--locked'}`}>
            {unlocked ? '✅ 已解鎖' : '🔒 未解鎖'}
          </span>
          <span className="achievement-detail-modal__points">
            {points} 點
          </span>
        </div>

        {/* 分享按鈕（已解鎖時顯示） */}
        {unlocked && onShare && (
          <button
            className="achievement-detail-modal__share-btn"
            onClick={() => onShare(achievement)}
          >
            📤 分享成就
          </button>
        )}
      </div>
    </div>
  );
}

AchievementDetailModal.propTypes = {
  achievement: PropTypes.shape({
    id: PropTypes.string,
    icon: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    points: PropTypes.number,
    unlocked: PropTypes.bool,
    rarity: PropTypes.oneOf(['common', 'rare', 'legendary']),
    category: PropTypes.string,
    progress: PropTypes.number,
    currentValue: PropTypes.number,
    targetValue: PropTypes.number,
  }),
  onClose: PropTypes.func.isRequired,
  onShare: PropTypes.func,
};

export default AchievementDetailModal;
