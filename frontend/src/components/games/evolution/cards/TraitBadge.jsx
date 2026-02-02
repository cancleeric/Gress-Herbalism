/**
 * TraitBadge - 性狀徽章組件
 *
 * 顯示生物的性狀圖示
 *
 * @module components/games/evolution/cards/TraitBadge
 */

import React from 'react';
import PropTypes from 'prop-types';
import { TRAIT_ICONS, TRAIT_NAMES } from '../constants/traitVisuals';
import './TraitBadge.css';

/**
 * 性狀徽章組件
 */
export const TraitBadge = ({
  traitType,
  linked = false,
  size = 'medium',
  onClick,
  showTooltip = true,
}) => {
  const icon = TRAIT_ICONS[traitType] || '❓';
  const name = TRAIT_NAMES[traitType] || traitType;

  const badgeClasses = [
    'trait-badge',
    `trait-badge--${size}`,
    linked && 'trait-badge--linked',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={badgeClasses}
      onClick={onClick}
      title={showTooltip ? name : undefined}
      data-testid="trait-badge"
      data-trait={traitType}
    >
      <span className="trait-badge__icon">{icon}</span>
      {linked && <span className="trait-badge__link-indicator">🔗</span>}
    </div>
  );
};

TraitBadge.propTypes = {
  traitType: PropTypes.string.isRequired,
  linked: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onClick: PropTypes.func,
  showTooltip: PropTypes.bool,
};

export default TraitBadge;
