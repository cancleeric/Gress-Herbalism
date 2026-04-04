/**
 * ExpansionSelector - 擴充包選擇組件
 *
 * 在遊戲設定時讓玩家（房主）選擇要啟用的擴充包。
 * 支援深海生態擴充包（issue #2）。
 *
 * @module components/games/evolution/ExpansionSelector
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { EXPANSION_LIST } from '../constants/expansionList';
import './ExpansionSelector.css';

/**
 * 擴充包選擇組件
 *
 * @param {Object} props
 * @param {string[]} props.selectedExpansions - 已選擇的擴充包 ID 列表
 * @param {Function} props.onToggle - 切換擴充包回調 (expansionId: string) => void
 * @param {boolean} [props.isHost=false] - 是否為房主（只有房主可以修改）
 * @param {boolean} [props.disabled=false] - 是否禁用選擇
 */
export const ExpansionSelector = memo(function ExpansionSelector({
  selectedExpansions = ['base'],
  onToggle,
  isHost = false,
  disabled = false,
}) {
  const canToggle = isHost && !disabled && typeof onToggle === 'function';

  const handleToggle = (expansionId, required) => {
    if (!canToggle || required) return;
    onToggle(expansionId);
  };

  return (
    <div className="expansion-selector" data-testid="expansion-selector">
      <h3 className="expansion-selector__title">
        🧬 擴充包選擇
      </h3>
      {!isHost && (
        <p className="expansion-selector__note">只有房主可以修改擴充包設定</p>
      )}
      <div className="expansion-selector__list">
        {EXPANSION_LIST.map((expansion) => {
          const isSelected = selectedExpansions.includes(expansion.id);
          const isRequired = expansion.required;

          return (
            <div
              key={expansion.id}
              className={[
                'expansion-card',
                isSelected ? 'expansion-card--selected' : '',
                isRequired ? 'expansion-card--required' : '',
                canToggle && !isRequired ? 'expansion-card--clickable' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleToggle(expansion.id, isRequired)}
              role={canToggle && !isRequired ? 'checkbox' : undefined}
              aria-checked={canToggle && !isRequired ? isSelected : undefined}
              tabIndex={canToggle && !isRequired ? 0 : undefined}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  handleToggle(expansion.id, isRequired);
                }
              }}
              data-testid={`expansion-card-${expansion.id}`}
            >
              <div className="expansion-card__header">
                <span className="expansion-card__icon">{expansion.icon}</span>
                <div className="expansion-card__info">
                  <span className="expansion-card__name">{expansion.name}</span>
                  <span className="expansion-card__name-en">{expansion.nameEn}</span>
                </div>
                <div className="expansion-card__status">
                  {isRequired ? (
                    <span className="expansion-card__badge expansion-card__badge--required">必選</span>
                  ) : (
                    <span
                      className={`expansion-card__badge ${isSelected ? 'expansion-card__badge--on' : 'expansion-card__badge--off'}`}
                    >
                      {isSelected ? '已啟用' : '未啟用'}
                    </span>
                  )}
                </div>
              </div>

              <p className="expansion-card__description">{expansion.description}</p>

              <div className="expansion-card__stats">
                <span className="expansion-card__stat">
                  🃏 {expansion.cardCount} 張卡牌
                </span>
                <span className="expansion-card__stat">
                  🔬 {expansion.traitCount} 種性狀
                </span>
              </div>

              {expansion.newTraits && isSelected && (
                <div className="expansion-card__traits">
                  <p className="expansion-card__traits-title">新性狀：</p>
                  <div className="expansion-card__traits-list">
                    {expansion.newTraits.map((trait) => (
                      <div
                        key={trait.type}
                        className="trait-preview"
                        title={trait.description}
                      >
                        <span className="trait-preview__icon">{trait.icon}</span>
                        <span className="trait-preview__name">{trait.name}</span>
                      </div>
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
  selectedExpansions: PropTypes.arrayOf(PropTypes.string),
  onToggle: PropTypes.func,
  isHost: PropTypes.bool,
  disabled: PropTypes.bool,
};

export default ExpansionSelector;
