/**
 * 擴充包選擇組件
 *
 * 在遊戲設定時讓玩家選擇要啟用的擴充包
 *
 * @module components/games/evolution/ExpansionSelector
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ExpansionSelector.css';

/**
 * 擴充包資訊定義
 * @type {Object[]}
 */
const EXPANSION_INFO = [
  {
    id: 'base',
    name: '基礎版',
    nameEn: 'Evolution: The Origin of Species',
    required: true,
    description: '演化論基礎遊戲，包含 19 種性狀和 84 張雙面卡',
    cardCount: 84,
    traitCount: 19,
    icon: '🌿',
    traits: ['肉食', '腐食', '偽裝', '穴居', '毒液', '水生', '敏捷', '巨化', '斷尾', '擬態', '脂肪組織', '冬眠', '寄生蟲', '掠奪', '溝通', '合作', '共生', '踐踏', '銳目'],
  },
  {
    id: 'deep-sea',
    name: '深海生態',
    nameEn: 'Deep Sea Ecology',
    required: false,
    description: '探索深海世界！6 種全新深海性狀，24 張雙面卡。需要基礎版。',
    cardCount: 24,
    traitCount: 6,
    icon: '🌊',
    traits: ['深潛', '壓抗', '發光', '群游', '巨口', '電感'],
    requires: ['base'],
  },
];

/**
 * 擴充包選擇組件
 *
 * @param {Object} props
 * @param {string[]} props.selectedExpansions - 已選擇的擴充包 ID 列表
 * @param {Function} props.onChange - 選擇變更回調 (expansionIds: string[]) => void
 * @param {boolean} [props.disabled] - 是否禁用（遊戲進行中）
 */
function ExpansionSelector({ selectedExpansions, onChange, disabled }) {
  const [expandedInfo, setExpandedInfo] = useState(null);

  const handleToggle = useCallback(
    (expansionId, required) => {
      if (disabled || required) return;

      const isSelected = selectedExpansions.includes(expansionId);
      let newSelected;

      if (isSelected) {
        // 停用：移除此擴充包及所有依賴它的擴充包
        newSelected = selectedExpansions.filter(id => {
          const info = EXPANSION_INFO.find(e => e.id === id);
          return id !== expansionId && !info?.requires?.includes(expansionId);
        });
      } else {
        // 啟用：加入此擴充包（依賴會自動確保已啟用）
        newSelected = [...selectedExpansions, expansionId];
      }

      onChange(newSelected);
    },
    [selectedExpansions, onChange, disabled]
  );

  const toggleInfo = useCallback((expansionId) => {
    setExpandedInfo(prev => (prev === expansionId ? null : expansionId));
  }, []);

  return (
    <div className="expansion-selector">
      <h3 className="expansion-selector__title">擴充包選擇</h3>
      <div className="expansion-selector__list">
        {EXPANSION_INFO.map(expansion => {
          const isSelected = selectedExpansions.includes(expansion.id);
          const isExpanded = expandedInfo === expansion.id;
          const isDisabledByDep =
            !expansion.required &&
            expansion.requires?.some(reqId => !selectedExpansions.includes(reqId));

          return (
            <div
              key={expansion.id}
              className={[
                'expansion-card',
                isSelected ? 'expansion-card--selected' : '',
                expansion.required ? 'expansion-card--required' : '',
                disabled || isDisabledByDep ? 'expansion-card--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="expansion-card__header">
                <span className="expansion-card__icon">{expansion.icon}</span>
                <div className="expansion-card__info">
                  <div className="expansion-card__name">
                    {expansion.name}
                    {expansion.required && (
                      <span className="expansion-card__badge">必選</span>
                    )}
                  </div>
                  <div className="expansion-card__meta">
                    {expansion.cardCount} 張卡 · {expansion.traitCount} 種性狀
                  </div>
                </div>
                <div className="expansion-card__actions">
                  <button
                    type="button"
                    className="expansion-card__info-btn"
                    onClick={() => toggleInfo(expansion.id)}
                    aria-label={isExpanded ? '收起詳情' : '展開詳情'}
                  >
                    {isExpanded ? '▲' : '▼'}
                  </button>
                  <label className="expansion-card__toggle">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={disabled || expansion.required || isDisabledByDep}
                      onChange={() => handleToggle(expansion.id, expansion.required)}
                      aria-label={`啟用${expansion.name}`}
                    />
                    <span className="expansion-card__toggle-slider" />
                  </label>
                </div>
              </div>

              {isExpanded && (
                <div className="expansion-card__detail">
                  <p className="expansion-card__description">{expansion.description}</p>
                  <div className="expansion-card__traits">
                    <span className="expansion-card__traits-label">性狀：</span>
                    {expansion.traits.map(trait => (
                      <span key={trait} className="expansion-card__trait-tag">
                        {trait}
                      </span>
                    ))}
                  </div>
                  {expansion.requires && (
                    <p className="expansion-card__requires">
                      需要：{expansion.requires.map(id => {
                        const req = EXPANSION_INFO.find(e => e.id === id);
                        return req?.name || id;
                      }).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="expansion-selector__total">
        共 {EXPANSION_INFO.filter(e => selectedExpansions.includes(e.id))
          .reduce((sum, e) => sum + e.cardCount, 0)} 張卡牌
      </p>
    </div>
  );
}

ExpansionSelector.propTypes = {
  selectedExpansions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

ExpansionSelector.defaultProps = {
  disabled: false,
};

export default ExpansionSelector;
