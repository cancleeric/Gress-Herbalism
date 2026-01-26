/**
 * 問牌流程組件
 *
 * @module QuestionFlow
 * @description 新版問牌流程介面，三欄式設計
 * 工單 0074, 0127（重新設計）
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  QUESTION_TYPE_DESCRIPTIONS
} from '../../shared/constants';
import './QuestionFlow.css';

/**
 * 顏色對應的中文名稱
 */
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色'
};

/**
 * 問牌流程組件
 *
 * @param {Object} props - 組件屬性
 * @param {Object} props.selectedCard - 選擇的顏色組合牌
 * @param {Array} props.players - 其他玩家列表
 * @param {string} props.currentPlayerId - 當前玩家ID
 * @param {Array} props.currentPlayerHand - 當前玩家手牌
 * @param {Function} props.onSubmit - 確認問牌回調
 * @param {Function} props.onCancel - 取消回調
 * @param {boolean} props.isLoading - 是否載入中
 * @returns {JSX.Element|null} 問牌流程組件
 */
function QuestionFlow({
  selectedCard,
  players = [],
  currentPlayerId,
  currentPlayerHand = [],
  onSubmit,
  onCancel,
  isLoading = false
}) {
  // 流程狀態
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedGiveColor, setSelectedGiveColor] = useState(null);
  const [error, setError] = useState('');

  // 排除自己的其他玩家（且只顯示活躍玩家）
  const otherPlayers = players.filter(
    p => p.id !== currentPlayerId && p.isActive !== false
  );

  // 選擇的顏色
  const colors = selectedCard?.colors || [];

  /**
   * 檢查要牌方是否擁有選定顏色的牌
   */
  const getOwnedColorsFromSelection = useCallback(() => {
    const owned = [];
    for (const color of colors) {
      if (currentPlayerHand.some(c => c.color === color)) {
        owned.push(color);
      }
    }
    return owned;
  }, [colors, currentPlayerHand]);

  /**
   * 檢查是否需要選擇給哪種顏色（類型3）
   */
  const needsGiveColorChoice = useCallback(() => {
    if (selectedType !== QUESTION_TYPE_GIVE_ONE_GET_ALL) return false;
    const ownedColors = getOwnedColorsFromSelection();
    return ownedColors.length === 2;
  }, [selectedType, getOwnedColorsFromSelection]);

  /**
   * 取得有效的給牌顏色
   */
  const getEffectiveGiveColor = useCallback(() => {
    if (selectedType !== QUESTION_TYPE_GIVE_ONE_GET_ALL) return null;
    const ownedColors = getOwnedColorsFromSelection();
    if (ownedColors.length === 1) {
      return ownedColors[0];
    }
    return selectedGiveColor;
  }, [selectedType, getOwnedColorsFromSelection, selectedGiveColor]);

  /**
   * 處理選擇目標玩家
   */
  const handleSelectPlayer = (playerId) => {
    setSelectedPlayerId(playerId);
    setError('');
  };

  /**
   * 處理選擇問牌類型
   */
  const handleSelectType = (type) => {
    // 如果是類型3，檢查是否有牌
    if (type === QUESTION_TYPE_GIVE_ONE_GET_ALL) {
      const ownedColors = getOwnedColorsFromSelection();
      if (ownedColors.length === 0) {
        setError('你沒有這兩種顏色的牌，無法使用此問牌方式');
        return;
      }
    }
    setSelectedType(type);
    setSelectedGiveColor(null);
    setError('');
  };

  /**
   * 處理選擇給牌顏色（類型3）
   */
  const handleSelectGiveColor = (color) => {
    setSelectedGiveColor(color);
    setError('');
  };

  /**
   * 處理確認提交
   */
  const handleSubmit = () => {
    const effectiveGiveColor = getEffectiveGiveColor();
    const questionData = {
      colors: colors,
      colorCardId: selectedCard.id,
      targetPlayerId: selectedPlayerId,
      questionType: selectedType
    };

    // 類型3：添加給牌顏色
    if (selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL && effectiveGiveColor) {
      questionData.giveColor = effectiveGiveColor;
      questionData.getColor = colors.find(c => c !== effectiveGiveColor);
    }

    onSubmit?.(questionData);
  };

  /**
   * 取得選擇的玩家名稱
   */
  const getSelectedPlayerName = () => {
    const player = players.find(p => p.id === selectedPlayerId);
    return player?.name || '';
  };

  /**
   * 檢查是否可以提交
   */
  const canSubmit = () => {
    if (!selectedPlayerId || !selectedType) return false;
    if (selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL) {
      const ownedColors = getOwnedColorsFromSelection();
      if (ownedColors.length === 2 && !selectedGiveColor) return false;
      if (ownedColors.length === 0) return false;
    }
    return true;
  };

  /**
   * 取得問牌方式的描述文字
   */
  const getActionDescription = () => {
    if (!selectedType) return '';

    const effectiveGiveColor = getEffectiveGiveColor();

    switch (selectedType) {
      case QUESTION_TYPE_ONE_EACH:
        return `向目標索取 ${COLOR_NAMES[colors[0]]} 和 ${COLOR_NAMES[colors[1]]} 各一張`;
      case QUESTION_TYPE_ALL_ONE_COLOR:
        return `向目標索取指定顏色的所有手牌`;
      case QUESTION_TYPE_GIVE_ONE_GET_ALL:
        if (effectiveGiveColor) {
          const getColor = colors.find(c => c !== effectiveGiveColor);
          return `給予目標 1 張${COLOR_NAMES[effectiveGiveColor]}，獲取其手中所有${COLOR_NAMES[getColor]}`;
        }
        return `給予一張，換取另一色全部手牌`;
      default:
        return '';
    }
  };

  /**
   * 取得問牌方式的簡短文字
   */
  const getActionText = () => {
    if (!selectedType) return '';

    const effectiveGiveColor = getEffectiveGiveColor();

    switch (selectedType) {
      case QUESTION_TYPE_ONE_EACH:
        return '各一張';
      case QUESTION_TYPE_ALL_ONE_COLOR:
        return '其中一種全部';
      case QUESTION_TYPE_GIVE_ONE_GET_ALL:
        if (effectiveGiveColor) {
          const getColor = colors.find(c => c !== effectiveGiveColor);
          return `給一張 ${COLOR_NAMES[effectiveGiveColor]} 要全部 ${COLOR_NAMES[getColor]}`;
        }
        return '給一張要全部';
      default:
        return '';
    }
  };

  if (!selectedCard) return null;

  return (
    <div className="question-flow-overlay">
      <div className="question-flow-modal">
        {/* 裝飾圖示 */}
        <span className="material-symbols-outlined qf-decor-top">eco</span>
        <span className="material-symbols-outlined qf-decor-bottom">psychiatry</span>

        {/* Header */}
        <header className="question-flow-header">
          <h2 className="qf-title">
            問牌
            <span className="qf-title-sub">(Inquiry)</span>
          </h2>
          <div className="qf-color-chips">
            <span className="qf-color-chips-label">當前組合：</span>
            {colors.map((color) => (
              <div key={color} className={`qf-color-chip ${color}`}>
                <span className={`qf-color-dot ${color}`}></span>
                <span className="qf-color-name">{COLOR_NAMES[color]}</span>
              </div>
            ))}
          </div>
        </header>

        {/* 載入指示器 */}
        {isLoading && (
          <div className="qf-loading">
            <div className="qf-loading-spinner"></div>
            <p>處理中...</p>
          </div>
        )}

        {/* Main Content - 三欄式 */}
        <main className="question-flow-body">
          <div className="qf-steps-grid">
            {/* 步驟 1: 選擇目標玩家 */}
            <section className="qf-step">
              <div className="qf-step-header">
                <span className={`qf-step-number ${selectedPlayerId ? 'completed' : ''}`}>1</span>
                <h3 className="qf-step-title">選擇目標玩家</h3>
              </div>
              <div className="qf-player-options">
                {otherPlayers.length === 0 ? (
                  <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px' }}>沒有其他玩家</p>
                ) : (
                  otherPlayers.map((player) => (
                    <label
                      key={player.id}
                      className={`qf-player-option ${selectedPlayerId === player.id ? 'selected' : ''}`}
                      onClick={() => handleSelectPlayer(player.id)}
                    >
                      <input
                        type="radio"
                        name="target_player"
                        checked={selectedPlayerId === player.id}
                        onChange={() => handleSelectPlayer(player.id)}
                      />
                      <div className="qf-player-info">
                        <span className="qf-player-name">{player.name}</span>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </section>

            {/* 步驟 2: 選擇問牌方式 */}
            <section className="qf-step">
              <div className="qf-step-header">
                <span className={`qf-step-number ${selectedType ? 'completed' : ''}`}>2</span>
                <h3 className="qf-step-title">選擇要牌方式</h3>
              </div>
              <div className="qf-type-options">
                <button
                  type="button"
                  className={`qf-type-option ${selectedType === QUESTION_TYPE_ONE_EACH ? 'selected' : ''}`}
                  onClick={() => handleSelectType(QUESTION_TYPE_ONE_EACH)}
                >
                  <div className="qf-type-header">
                    <span className="qf-type-name">各一張 (Each Color)</span>
                    {selectedType === QUESTION_TYPE_ONE_EACH && (
                      <span className="material-symbols-outlined qf-type-check">check_circle</span>
                    )}
                  </div>
                  <span className="qf-type-desc">{QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_ONE_EACH]}</span>
                </button>

                <button
                  type="button"
                  className={`qf-type-option ${selectedType === QUESTION_TYPE_ALL_ONE_COLOR ? 'selected' : ''}`}
                  onClick={() => handleSelectType(QUESTION_TYPE_ALL_ONE_COLOR)}
                >
                  <div className="qf-type-header">
                    <span className="qf-type-name">其中一種全部 (All of One)</span>
                    {selectedType === QUESTION_TYPE_ALL_ONE_COLOR && (
                      <span className="material-symbols-outlined qf-type-check">check_circle</span>
                    )}
                  </div>
                  <span className="qf-type-desc">{QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_ALL_ONE_COLOR]}</span>
                </button>

                <button
                  type="button"
                  className={`qf-type-option ${selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL ? 'selected' : ''}`}
                  onClick={() => handleSelectType(QUESTION_TYPE_GIVE_ONE_GET_ALL)}
                >
                  <div className="qf-type-header">
                    <span className="qf-type-name">給一張要全部 (Give & Take)</span>
                    {selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL && (
                      <span className="material-symbols-outlined qf-type-check">check_circle</span>
                    )}
                  </div>
                  <span className="qf-type-desc">{QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_GIVE_ONE_GET_ALL]}</span>
                </button>
              </div>

              {/* 步驟 2.5: 給牌顏色選擇 */}
              {needsGiveColorChoice() && (
                <div className="qf-give-color-section">
                  <p className="qf-give-color-label">選擇要給出的顏色：</p>
                  <div className="qf-give-color-options">
                    {colors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`qf-give-color-btn ${color} ${selectedGiveColor === color ? 'selected' : ''}`}
                        onClick={() => handleSelectGiveColor(color)}
                      >
                        <span className={`qf-color-dot ${color}`}></span>
                        給 {COLOR_NAMES[color]} 一張
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 步驟 3: 確認問牌內容 */}
            <section className="qf-step">
              <div className="qf-step-header">
                <span className={`qf-step-number ${canSubmit() ? 'completed' : ''}`}>3</span>
                <h3 className="qf-step-title">確認問牌內容</h3>
              </div>
              <div className="qf-confirm-card">
                <div className="qf-confirm-content">
                  <div className="qf-confirm-row">
                    <div>
                      <p className="qf-confirm-label">對象 Player</p>
                      <p className="qf-confirm-value">
                        {selectedPlayerId ? getSelectedPlayerName() : '—'}
                      </p>
                    </div>
                    <span className="material-symbols-outlined qf-confirm-icon">person_search</span>
                  </div>
                  <div>
                    <p className="qf-confirm-label">行動 Action</p>
                    <p className="qf-confirm-action">
                      {selectedType ? getActionText() : '—'}
                    </p>
                    {selectedType && (
                      <p className="qf-confirm-action-desc">{getActionDescription()}</p>
                    )}
                  </div>
                  <div className="qf-confirm-footer">
                    <span className="material-symbols-outlined">info</span>
                    <p>確認後將立即執行問牌，目標玩家需如實配合。</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="qf-error" role="alert">
              {error}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="question-flow-footer">
          <button
            type="button"
            className="qf-btn qf-btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </button>
          <button
            type="button"
            className="qf-btn qf-btn-primary"
            onClick={handleSubmit}
            disabled={isLoading || !canSubmit()}
          >
            確認問牌
            <span className="material-symbols-outlined">send</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

QuestionFlow.propTypes = {
  selectedCard: PropTypes.shape({
    id: PropTypes.string.isRequired,
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    name: PropTypes.string
  }),
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isActive: PropTypes.bool
  })),
  currentPlayerId: PropTypes.string,
  currentPlayerHand: PropTypes.array,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isLoading: PropTypes.bool
};

export default QuestionFlow;
