/**
 * 段位徽章組件
 *
 * 顯示玩家的賽季段位圖示、名稱和進度條
 * 工單 0064 - 賽季聯賽系統
 *
 * @module components/common/TierBadge
 */

import React from 'react';
import PropTypes from 'prop-types';
import './TierBadge.css';

/**
 * 段位徽章組件
 *
 * @param {object} props
 * @param {object} props.tier - 段位資訊 { id, name, icon, color }
 * @param {object} [props.progress] - 進度資訊 { progressPercent, eloNeeded, nextTier }
 * @param {number} [props.elo] - 當前 ELO 分數
 * @param {boolean} [props.showProgress] - 是否顯示進度條
 * @param {'sm'|'md'|'lg'} [props.size] - 顯示尺寸
 * @param {string} [props.className] - 額外 CSS 類名
 */
function TierBadge({ tier, progress, elo, showProgress, size, className }) {
  if (!tier) return null;

  const sizeClass = `tier-badge--${size || 'md'}`;

  return (
    <div
      className={`tier-badge ${sizeClass} ${className || ''}`}
      style={{ '--tier-color': tier.color }}
      aria-label={`段位：${tier.name}`}
    >
      <span className="tier-badge__icon" role="img" aria-label={tier.name}>
        {tier.icon}
      </span>
      <span className="tier-badge__name">{tier.name}</span>

      {elo !== undefined && (
        <span className="tier-badge__elo">{elo} ELO</span>
      )}

      {showProgress && progress && !progress.nextTier && (
        <span className="tier-badge__max">最高段位</span>
      )}

      {showProgress && progress && progress.nextTier && (
        <div className="tier-badge__progress" aria-label={`進度 ${progress.progressPercent}%`}>
          <div className="tier-badge__progress-bar">
            <div
              className="tier-badge__progress-fill"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
          <span className="tier-badge__progress-label">
            還差 {progress.eloNeeded} ELO 升至{progress.nextTier.name}
          </span>
        </div>
      )}
    </div>
  );
}

TierBadge.propTypes = {
  tier: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
  }).isRequired,
  progress: PropTypes.shape({
    progressPercent: PropTypes.number,
    eloNeeded: PropTypes.number,
    nextTier: PropTypes.object,
  }),
  elo: PropTypes.number,
  showProgress: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string,
};

export default TierBadge;
