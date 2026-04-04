/**
 * ExpansionSelector - 擴充包選擇組件
 *
 * 在遊戲設定階段讓玩家選擇要啟用的擴充包
 *
 * @module components/games/evolution/ExpansionSelector
 */

import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ExpansionSelector.css';

/**
 * 可用擴充包清單定義
 */
const AVAILABLE_EXPANSIONS = [
  {
    id: 'base',
    name: '物種起源',
    nameEn: 'Evolution: The Origin of Species',
    description: '基礎版，包含 19 種性狀和 84 張雙面卡',
    cardCount: 84,
    traitCount: 19,
    required: true,
    icon: '🌿',
  },
  {
    id: 'deep-sea',
    name: '深海生態',
    nameEn: 'Deep Sea Ecology',
    description: '新增 6 種深海性狀：深潛、發光、群游、巨口、電感、墨汁',
    cardCount: 24,
    traitCount: 6,
    required: false,
    requires: ['base'],
    icon: '🌊',
    newTraits: ['深潛', '發光', '群游', '巨口', '電感', '墨汁'],
  },
];

/**
 * 單一擴充包卡片
 */
function ExpansionCard({ expansion, enabled, onChange }) {
  const isDisabled = expansion.required;

  return (
    <div
      className={`expansion-card ${enabled ? 'expansion-card--enabled' : ''} ${isDisabled ? 'expansion-card--required' : ''}`}
      data-testid={`expansion-card-${expansion.id}`}
    >
      <div className="expansion-card__header">
        <span className="expansion-card__icon">{expansion.icon}</span>
        <div className="expansion-card__title">
          <h3 className="expansion-card__name">{expansion.name}</h3>
          <span className="expansion-card__name-en">{expansion.nameEn}</span>
        </div>
        <label className="expansion-card__toggle">
          <input
            type="checkbox"
            checked={enabled}
            disabled={isDisabled}
            onChange={(e) => onChange(expansion.id, e.target.checked)}
            aria-label={`啟用 ${expansion.name}`}
          />
          <span className="expansion-card__toggle-slider" />
        </label>
      </div>

      <p className="expansion-card__description">{expansion.description}</p>

      <div className="expansion-card__stats">
        <span className="expansion-card__stat">
          🃏 {expansion.cardCount} 張卡
        </span>
        <span className="expansion-card__stat">
          🏷️ {expansion.traitCount} 種性狀
        </span>
        {expansion.required && (
          <span className="expansion-card__required-badge">必要</span>
        )}
      </div>

      {expansion.newTraits && (
        <div className="expansion-card__traits">
          {expansion.newTraits.map(trait => (
            <span key={trait} className="expansion-card__trait-tag">
              {trait}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

ExpansionCard.propTypes = {
  expansion: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    nameEn: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    cardCount: PropTypes.number.isRequired,
    traitCount: PropTypes.number.isRequired,
    required: PropTypes.bool,
    icon: PropTypes.string.isRequired,
    newTraits: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  enabled: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
};

/**
 * 擴充包選擇器主組件
 *
 * @param {Object} props
 * @param {string[]} props.selectedExpansions - 目前選擇的擴充包 ID 陣列
 * @param {Function} props.onChange - 選擇變更回調 (expansionIds: string[]) => void
 * @param {boolean} props.disabled - 是否禁用（遊戲已開始時）
 */
function ExpansionSelector({ selectedExpansions, onChange, disabled }) {
  const buildEnabled = useCallback((ids) => {
    const state = { base: true };
    if (ids) ids.forEach(id => { state[id] = true; });
    return state;
  }, []);

  const [enabled, setEnabled] = useState(() => buildEnabled(selectedExpansions));

  useEffect(() => {
    setEnabled(buildEnabled(selectedExpansions));
  }, [selectedExpansions, buildEnabled]);

  const handleToggle = useCallback((expansionId, isEnabled) => {
    if (disabled) return;

    const newEnabled = { ...enabled, [expansionId]: isEnabled };

    // 如果停用擴充包，也停用依賴它的擴充包
    if (!isEnabled) {
      AVAILABLE_EXPANSIONS.forEach(exp => {
        if (exp.requires?.includes(expansionId)) {
          newEnabled[exp.id] = false;
        }
      });
    }

    // base 永遠啟用
    newEnabled.base = true;

    setEnabled(newEnabled);

    const selectedIds = Object.entries(newEnabled)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onChange(selectedIds);
  }, [enabled, disabled, onChange]);

  const totalCards = AVAILABLE_EXPANSIONS
    .filter(exp => enabled[exp.id])
    .reduce((sum, exp) => sum + exp.cardCount, 0);

  const totalTraits = AVAILABLE_EXPANSIONS
    .filter(exp => enabled[exp.id])
    .reduce((sum, exp) => sum + exp.traitCount, 0);

  return (
    <div className={`expansion-selector ${disabled ? 'expansion-selector--disabled' : ''}`} data-testid="expansion-selector">
      <div className="expansion-selector__header">
        <h2 className="expansion-selector__title">擴充包選擇</h2>
        <div className="expansion-selector__summary">
          <span>共 {totalCards} 張卡 · {totalTraits} 種性狀</span>
        </div>
      </div>

      <div className="expansion-selector__list">
        {AVAILABLE_EXPANSIONS.map(expansion => (
          <ExpansionCard
            key={expansion.id}
            expansion={expansion}
            enabled={enabled[expansion.id] ?? false}
            onChange={handleToggle}
          />
        ))}
      </div>
    </div>
  );
}

ExpansionSelector.propTypes = {
  selectedExpansions: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ExpansionSelector.defaultProps = {
  selectedExpansions: ['base'],
  disabled: false,
};

export default ExpansionSelector;
export { AVAILABLE_EXPANSIONS };
