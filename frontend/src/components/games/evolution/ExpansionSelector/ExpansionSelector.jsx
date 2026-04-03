/**
 * ExpansionSelector - 擴充包選擇組件
 *
 * 在遊戲設定時可勾選要啟用的擴充包
 *
 * @module components/games/evolution/ExpansionSelector
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './ExpansionSelector.css';

/**
 * 可用擴充包清單
 */
const AVAILABLE_EXPANSIONS = [
  {
    id: 'base',
    name: '物種起源',
    nameEn: 'Evolution: The Origin of Species',
    description: '基礎版，包含 19 種性狀和 84 張雙面卡',
    traitCount: 19,
    cardCount: 84,
    required: true,
    icon: '🦕',
  },
  {
    id: 'deepSea',
    name: '深海生態',
    nameEn: 'Deep Sea Ecology',
    description: '深海生態擴充包，新增 6 種深海性狀和 28 張雙面卡',
    traitCount: 6,
    cardCount: 28,
    required: false,
    icon: '🌊',
    newTraits: [
      { type: 'deepDive', name: '深潛', icon: '🤿' },
      { type: 'schooling', name: '群游', icon: '🐟' },
      { type: 'inkSquirt', name: '噴墨', icon: '🦑' },
      { type: 'bioluminescence', name: '發光', icon: '✨' },
      { type: 'electroreception', name: '電感', icon: '⚡' },
      { type: 'gulper', name: '巨口', icon: '💥' },
    ],
  },
];

/**
 * 擴充包選擇組件
 * @param {Object} props
 * @param {string[]} props.enabledExpansions - 已啟用的擴充包 ID 列表
 * @param {Function} props.onChange - 變更回調 (enabledExpansions: string[]) => void
 * @param {boolean} props.disabled - 是否禁用（遊戲已開始）
 */
export const ExpansionSelector = memo(function ExpansionSelector({
  enabledExpansions = ['base'],
  onChange,
  disabled = false,
}) {
  const handleToggle = (expansionId) => {
    if (disabled) return;

    const expansion = AVAILABLE_EXPANSIONS.find(e => e.id === expansionId);
    if (!expansion || expansion.required) return;

    const isEnabled = enabledExpansions.includes(expansionId);
    let next;
    if (isEnabled) {
      next = enabledExpansions.filter(id => id !== expansionId);
    } else {
      next = [...enabledExpansions, expansionId];
    }
    onChange?.(next);
  };

  return (
    <div className="expansion-selector" data-testid="expansion-selector">
      <h3 className="expansion-selector__title">擴充包選擇</h3>
      <p className="expansion-selector__hint">選擇遊戲中要使用的擴充包</p>

      <div className="expansion-selector__list">
        {AVAILABLE_EXPANSIONS.map(expansion => {
          const isEnabled = expansion.required || enabledExpansions.includes(expansion.id);

          return (
            <div
              key={expansion.id}
              className={[
                'expansion-card',
                isEnabled && 'expansion-card--enabled',
                expansion.required && 'expansion-card--required',
                disabled && 'expansion-card--disabled',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleToggle(expansion.id)}
              data-testid={`expansion-card-${expansion.id}`}
            >
              <div className="expansion-card__header">
                <span className="expansion-card__icon">{expansion.icon}</span>
                <div className="expansion-card__info">
                  <span className="expansion-card__name">{expansion.name}</span>
                  <span className="expansion-card__name-en">{expansion.nameEn}</span>
                </div>
                <div className="expansion-card__toggle">
                  {expansion.required ? (
                    <span className="expansion-card__required-badge">必選</span>
                  ) : (
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={() => handleToggle(expansion.id)}
                      disabled={disabled}
                      aria-label={`啟用 ${expansion.name}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </div>

              <p className="expansion-card__description">{expansion.description}</p>

              <div className="expansion-card__stats">
                <span>性狀數：{expansion.traitCount}</span>
                <span>卡牌數：{expansion.cardCount}</span>
              </div>

              {expansion.newTraits && (
                <div className="expansion-card__traits">
                  <span className="expansion-card__traits-label">新增性狀：</span>
                  <div className="expansion-card__trait-list">
                    {expansion.newTraits.map(trait => (
                      <span
                        key={trait.type}
                        className="expansion-card__trait-badge"
                        title={trait.name}
                      >
                        {trait.icon} {trait.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ExpansionSelector.propTypes = {
  enabledExpansions: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

export default ExpansionSelector;
