/**
 * 問牌流程組件
 *
 * @module QuestionFlow
 * @description 新版問牌流程介面，用於選擇顏色牌後的後續步驟
 * 工單 0074
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
 * 顏色對應的 emoji
 */
const COLOR_ICONS = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵'
};

/**
 * 問牌流程步驟
 */
const STEPS = {
  SELECT_PLAYER: 'selectPlayer',
  SELECT_TYPE: 'selectType',
  SELECT_GIVE_COLOR: 'selectGiveColor',
  CONFIRM: 'confirm'
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
  const [step, setStep] = useState(STEPS.SELECT_PLAYER);
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
    setStep(STEPS.SELECT_TYPE);
    setError('');
  };

  /**
   * 處理選擇問牌類型
   */
  const handleSelectType = (type) => {
    setSelectedType(type);
    setError('');

    // 如果是類型3且兩種顏色都有，需要選擇給哪種
    if (type === QUESTION_TYPE_GIVE_ONE_GET_ALL) {
      const ownedColors = getOwnedColorsFromSelection();
      if (ownedColors.length === 2) {
        setStep(STEPS.SELECT_GIVE_COLOR);
        return;
      } else if (ownedColors.length === 0) {
        setError('你沒有這兩種顏色的牌，無法使用此問牌方式');
        return;
      }
    }

    setStep(STEPS.CONFIRM);
  };

  /**
   * 處理選擇給牌顏色（類型3）
   */
  const handleSelectGiveColor = (color) => {
    setSelectedGiveColor(color);
    setStep(STEPS.CONFIRM);
    setError('');
  };

  /**
   * 處理返回上一步
   */
  const handleBack = () => {
    switch (step) {
      case STEPS.SELECT_TYPE:
        setStep(STEPS.SELECT_PLAYER);
        setSelectedType(null);
        break;
      case STEPS.SELECT_GIVE_COLOR:
        setStep(STEPS.SELECT_TYPE);
        setSelectedGiveColor(null);
        break;
      case STEPS.CONFIRM:
        if (needsGiveColorChoice()) {
          setStep(STEPS.SELECT_GIVE_COLOR);
        } else {
          setStep(STEPS.SELECT_TYPE);
        }
        break;
      default:
        onCancel?.();
    }
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

  if (!selectedCard) return null;

  return (
    <div className="question-flow-overlay">
      <div className="question-flow-modal">
        {/* 標題 */}
        <div className="question-flow-header">
          <h3>問牌</h3>
          <div className="selected-card-info">
            <span className="color-badge">
              {COLOR_ICONS[colors[0]]} {COLOR_NAMES[colors[0]]}
            </span>
            <span className="separator">+</span>
            <span className="color-badge">
              {COLOR_ICONS[colors[1]]} {COLOR_NAMES[colors[1]]}
            </span>
          </div>
        </div>

        {/* 載入指示器 */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>處理中...</p>
          </div>
        )}

        {/* 內容區域 */}
        <div className="question-flow-body">
          {/* 步驟 1: 選擇目標玩家 */}
          {step === STEPS.SELECT_PLAYER && (
            <div className="step-content">
              <h4>選擇要問牌的對象</h4>
              <div className="player-options">
                {otherPlayers.length === 0 ? (
                  <p className="no-players">沒有其他玩家</p>
                ) : (
                  otherPlayers.map((player) => (
                    <button
                      key={player.id}
                      type="button"
                      className="player-option"
                      onClick={() => handleSelectPlayer(player.id)}
                    >
                      {player.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 步驟 2: 選擇問牌方式 */}
          {step === STEPS.SELECT_TYPE && (
            <div className="step-content">
              <p className="step-info">
                問牌對象：<strong>{getSelectedPlayerName()}</strong>
              </p>
              <h4>選擇要牌方式</h4>
              <div className="type-options">
                <button
                  type="button"
                  className="type-option"
                  onClick={() => handleSelectType(QUESTION_TYPE_ONE_EACH)}
                >
                  <span className="type-name">各一張</span>
                  <span className="type-desc">{QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_ONE_EACH]}</span>
                </button>
                <button
                  type="button"
                  className="type-option"
                  onClick={() => handleSelectType(QUESTION_TYPE_ALL_ONE_COLOR)}
                >
                  <span className="type-name">其中一種全部</span>
                  <span className="type-desc">{QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_ALL_ONE_COLOR]}</span>
                </button>
                <button
                  type="button"
                  className="type-option"
                  onClick={() => handleSelectType(QUESTION_TYPE_GIVE_ONE_GET_ALL)}
                >
                  <span className="type-name">給一張要全部</span>
                  <span className="type-desc">{QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_GIVE_ONE_GET_ALL]}</span>
                </button>
              </div>
            </div>
          )}

          {/* 步驟 2.5: 選擇給牌顏色（類型3） */}
          {step === STEPS.SELECT_GIVE_COLOR && (
            <div className="step-content">
              <p className="step-info">
                問牌對象：<strong>{getSelectedPlayerName()}</strong>
              </p>
              <h4>選擇要給哪種顏色的一張</h4>
              <p className="hint">你兩種顏色都有，請選擇要給對方哪種顏色</p>
              <div className="color-options">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option color-${color}`}
                    onClick={() => handleSelectGiveColor(color)}
                  >
                    {COLOR_ICONS[color]} 給 {COLOR_NAMES[color]} 一張
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 步驟 3: 確認 */}
          {step === STEPS.CONFIRM && (
            <div className="step-content">
              <h4>確認問牌</h4>
              <div className="confirm-summary">
                <div className="summary-row">
                  <span className="label">顏色：</span>
                  <span className="value">
                    {COLOR_ICONS[colors[0]]} {COLOR_NAMES[colors[0]]} + {COLOR_ICONS[colors[1]]} {COLOR_NAMES[colors[1]]}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="label">對象：</span>
                  <span className="value">{getSelectedPlayerName()}</span>
                </div>
                <div className="summary-row">
                  <span className="label">方式：</span>
                  <span className="value">
                    {selectedType === QUESTION_TYPE_ONE_EACH && '各一張'}
                    {selectedType === QUESTION_TYPE_ALL_ONE_COLOR && '其中一種全部'}
                    {selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL && '給一張要全部'}
                  </span>
                </div>
                {selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL && getEffectiveGiveColor() && (
                  <div className="summary-row">
                    <span className="label">給牌：</span>
                    <span className="value">
                      給 {COLOR_NAMES[getEffectiveGiveColor()]} 一張，
                      要 {COLOR_NAMES[colors.find(c => c !== getEffectiveGiveColor())]} 全部
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 錯誤訊息 */}
          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="question-flow-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={step === STEPS.SELECT_PLAYER ? onCancel : handleBack}
            disabled={isLoading}
          >
            {step === STEPS.SELECT_PLAYER ? '取消' : '上一步'}
          </button>
          {step === STEPS.CONFIRM && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? '處理中...' : '確認問牌'}
            </button>
          )}
        </div>
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
