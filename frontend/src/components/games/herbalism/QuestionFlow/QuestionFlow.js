/**
 * 問牌流程組件
 *
 * @module QuestionFlow
 * @description 新版問牌流程介面，三欄式設計
 * 工單 0074, 0127（重新設計）
 */

import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
} from "../../../../shared/constants";
import "./QuestionFlow.css";
import HerbArt from "../GameRoom/HerbArt";
import { HERB_GROUPS, inquiryImage } from "../GameRoom/herbSpecies";
import "./QuestionFlowCraft.css";

/**
 * 顏色對應的中文名稱
 */
const COLOR_NAMES = {
  red: "紅色",
  yellow: "黃色",
  green: "綠色",
  blue: "藍色",
};
const EMPTY_COLORS = Object.freeze([]);

// Decorative card diagrams always accompany explicit text; they never reveal opponents' hands.
function ActionDiagram({ colors, type }) {
  return (
    <span className={`qf-action-diagram diagram-${type}`} aria-hidden="true">
      <span className={`qf-diagram-card ${type === 2 ? "stack" : ""}`}>
        <HerbArt color={colors[0]} />
        <b>{type === 1 ? "1" : type === 2 ? "全部" : "1"}</b>
      </span>
      <span className="qf-diagram-link">
        {type === 1 ? "+" : type === 2 ? "或" : "⇄"}
      </span>
      <span className={`qf-diagram-card ${type !== 1 ? "stack" : ""}`}>
        <HerbArt color={colors[1]} />
        <b>{type === 1 ? "1" : "全部"}</b>
      </span>
    </span>
  );
}

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
function QuestionFlow(props) {
  const { selectedCard, currentPlayerId } = props;
  if (!selectedCard) return null;
  // Reset before rendering a different action context, not in a later effect.
  const contextKey = JSON.stringify([
    currentPlayerId,
    selectedCard.id,
    selectedCard.colors,
  ]);
  return <QuestionFlowForm key={contextKey} {...props} />;
}

function QuestionFlowForm({
  selectedCard,
  players = [],
  currentPlayerId,
  currentPlayerHand = [],
  onSubmit,
  onCancel,
  isLoading = false,
}) {
  // 流程狀態
  const [stage, setStage] = useState(1);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedGiveColor, setSelectedGiveColor] = useState(null);
  const [error, setError] = useState("");

  // 排除自己的其他玩家（已退出的玩家仍可被問牌）
  const otherPlayers = players.filter((p) => p.id !== currentPlayerId);
  const targetAvailable = otherPlayers.some(
    (player) => player.id === selectedPlayerId,
  );

  // 選擇的顏色
  const colors = selectedCard?.colors || EMPTY_COLORS;

  /**
   * 檢查要牌方是否擁有選定顏色的牌
   */
  const getOwnedColorsFromSelection = useCallback(() => {
    const owned = [];
    for (const color of colors) {
      if (currentPlayerHand.some((c) => c.color === color)) {
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
    if (isLoading) return;
    setSelectedPlayerId(playerId);
    setStage(2);
    setError("");
  };

  /**
   * 處理選擇問牌類型
   */
  const handleSelectType = (type) => {
    if (isLoading) return;
    // 如果是類型3，檢查是否有牌
    if (type === QUESTION_TYPE_GIVE_ONE_GET_ALL) {
      const ownedColors = getOwnedColorsFromSelection();
      if (ownedColors.length === 0) {
        setError("你沒有這兩種顏色的牌，無法使用此問牌方式");
        return;
      }
    }
    setSelectedType(type);
    setStage(3);
    setSelectedGiveColor(null);
    setError("");
  };

  /**
   * 處理選擇給牌顏色（類型3）
   */
  const handleSelectGiveColor = (color) => {
    if (isLoading) return;
    setSelectedGiveColor(color);
    setError("");
  };

  /**
   * 處理確認提交
   */
  const handleSubmit = () => {
    if (!canSubmit()) return;
    const effectiveGiveColor = getEffectiveGiveColor();
    const questionData = {
      colors: colors,
      colorCardId: selectedCard.id,
      targetPlayerId: selectedPlayerId,
      questionType: selectedType,
    };

    // 類型3：添加給牌顏色
    if (selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL && effectiveGiveColor) {
      questionData.giveColor = effectiveGiveColor;
      questionData.getColor = colors.find((c) => c !== effectiveGiveColor);
    }

    onSubmit?.(questionData);
  };

  /**
   * 取得選擇的玩家名稱
   */
  const getSelectedPlayerName = () => {
    const player = players.find((p) => p.id === selectedPlayerId);
    return player?.name || "";
  };

  /**
   * 檢查是否可以提交
   */
  const canSubmit = () => {
    if (
      isLoading ||
      !targetAvailable ||
      ![
        QUESTION_TYPE_ONE_EACH,
        QUESTION_TYPE_ALL_ONE_COLOR,
        QUESTION_TYPE_GIVE_ONE_GET_ALL,
      ].includes(selectedType)
    )
      return false;
    if (selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL) {
      return getOwnedColorsFromSelection().includes(getEffectiveGiveColor());
    }
    return true;
  };

  /**
   * 取得問牌方式的描述文字
   */
  const getActionDescription = () => {
    if (!selectedType) return "";

    const effectiveGiveColor = getEffectiveGiveColor();

    switch (selectedType) {
      case QUESTION_TYPE_ONE_EACH:
        return `向目標索取 ${COLOR_NAMES[colors[0]]} 和 ${COLOR_NAMES[colors[1]]} 各一張`;
      case QUESTION_TYPE_ALL_ONE_COLOR:
        return `請對方交出其中一種顏色的全部手牌`;
      case QUESTION_TYPE_GIVE_ONE_GET_ALL:
        if (effectiveGiveColor) {
          const getColor = colors.find((c) => c !== effectiveGiveColor);
          return `給予目標 1 張${COLOR_NAMES[effectiveGiveColor]}，獲取其手中所有${COLOR_NAMES[getColor]}`;
        }
        return `給予一張，換取另一色全部手牌`;
      default:
        return "";
    }
  };

  /**
   * 取得問牌方式的簡短文字
   */
  const getActionText = () => {
    if (!selectedType) return "";

    const effectiveGiveColor = getEffectiveGiveColor();

    switch (selectedType) {
      case QUESTION_TYPE_ONE_EACH:
        return "各一張";
      case QUESTION_TYPE_ALL_ONE_COLOR:
        return "其中一種全部";
      case QUESTION_TYPE_GIVE_ONE_GET_ALL:
        if (effectiveGiveColor) {
          const getColor = colors.find((c) => c !== effectiveGiveColor);
          return `給一張 ${COLOR_NAMES[effectiveGiveColor]} 要全部 ${COLOR_NAMES[getColor]}`;
        }
        return "給一張要全部";
      default:
        return "";
    }
  };

  const validationError =
    error ||
    (selectedPlayerId && !targetAvailable ? "目標玩家已離開，請重新選擇" : "");

  return (
    <div className="question-flow-overlay">
      <div
        className="question-flow-modal qf-inquiry"
        data-stage={stage}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qf-inquiry-title"
      >
        {/* 裝飾圖示 */}
        <span className="material-symbols-outlined qf-decor-top">eco</span>
        <span className="material-symbols-outlined qf-decor-bottom">
          psychiatry
        </span>

        {/* Header */}
        <header className="question-flow-header">
          <div className="qf-inquiry-heading">
            <span className="qf-eyebrow">探 問 草 藥</span>
            <h2 className="qf-title" id="qf-inquiry-title">
              問牌
            </h2>
            <div className="qf-color-chips">
              {colors.map((color) => (
                <span
                  key={color}
                  className="qf-group-seal"
                  style={{ "--seal-color": HERB_GROUPS[color]?.glow }}
                >
                  <i aria-hidden="true">{HERB_GROUPS[color]?.symbol}</i>
                  <span>{COLOR_NAMES[color]}</span>
                </span>
              ))}
            </div>
          </div>
          <img
            className="qf-inquiry-art"
            src={inquiryImage(colors)}
            alt=""
            aria-hidden="true"
          />
        </header>

        {/* 載入指示器 */}
        {isLoading && (
          <div className="qf-loading">
            <div className="qf-loading-spinner"></div>
            <p>處理中...</p>
          </div>
        )}

        <nav className="qf-stage-nav" aria-label="問牌步驟">
          {['對手', '方式', '確認'].map((label, i) => (
            <button key={label} type="button" aria-current={stage === i + 1 ? 'step' : undefined}
              disabled={isLoading || (i > 0 && !targetAvailable) || (i > 1 && !selectedType)}
              onClick={() => setStage(i + 1)}>{i + 1} · {label}</button>
          ))}
        </nav>
        {/* Each phone screen contains one decision, never a scrolling form. */}
        <main className="question-flow-body">
          <div className="qf-steps-grid">
            {/* 步驟 1: 選擇目標玩家 */}
            <section className="qf-step" data-step="1">
              <div className="qf-step-header">
                <span
                  className={`qf-step-number ${selectedPlayerId ? "completed" : ""}`}
                >
                  1
                </span>
                <h3 className="qf-step-title">選擇目標玩家</h3>
              </div>
              <div className="qf-player-options">
                {otherPlayers.length === 0 ? (
                  <p
                    style={{
                      color: "#6b7280",
                      textAlign: "center",
                      padding: "16px",
                    }}
                  >
                    沒有其他玩家
                  </p>
                ) : (
                  otherPlayers.map((player) => (
                    <label
                      key={player.id}
                      className={`qf-player-option ${selectedPlayerId === player.id ? "selected" : ""}`}
                      onClick={() => handleSelectPlayer(player.id)}
                    >
                      <input
                        type="radio"
                        disabled={isLoading}
                        name="target_player"
                        checked={selectedPlayerId === player.id}
                        onChange={() => handleSelectPlayer(player.id)}
                      />
                      <span className="qf-seat-avatar" aria-hidden="true">
                        {player.name.slice(0, 1)}
                      </span>
                      <div className="qf-player-info">
                        <span className="qf-player-name">{player.name}</span>
                      </div>
                      <span className="qf-seat-check" aria-hidden="true">
                        {selectedPlayerId === player.id ? "✓" : ""}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </section>

            {/* 步驟 2: 選擇問牌方式 */}
            <section className="qf-step" data-step="2">
              <div className="qf-step-header">
                <span
                  className={`qf-step-number ${selectedType ? "completed" : ""}`}
                >
                  2
                </span>
                <h3 className="qf-step-title">選擇要牌方式</h3>
              </div>
              <div className="qf-type-options">
                {[
                  {
                    type: QUESTION_TYPE_ONE_EACH,
                    name: "各一張",
                    hint: "兩色各取 1 張",
                  },
                  {
                    type: QUESTION_TYPE_ALL_ONE_COLOR,
                    name: "其中一種全部",
                    hint: "取回其中一色",
                  },
                  {
                    type: QUESTION_TYPE_GIVE_ONE_GET_ALL,
                    name: "給一張要全部",
                    hint: "給一色・取另一色",
                  },
                ].map(({ type, name, hint }) => (
                  <button
                    key={type}
                    type="button"
                    className={`qf-type-option ${selectedType === type ? "selected" : ""}`}
                    aria-pressed={selectedType === type}
                    disabled={isLoading}
                    onClick={() => handleSelectType(type)}
                  >
                    <ActionDiagram
                      colors={
                        type === QUESTION_TYPE_GIVE_ONE_GET_ALL &&
                        getEffectiveGiveColor()
                          ? [
                              getEffectiveGiveColor(),
                              colors.find(
                                (color) => color !== getEffectiveGiveColor(),
                              ),
                            ]
                          : colors
                      }
                      type={type}
                    />
                    <span className="qf-type-name">{name}</span>
                    <span className="qf-type-desc">{hint}</span>
                    <span className="qf-action-check" aria-hidden="true">
                      {selectedType === type ? "✓" : ""}
                    </span>
                  </button>
                ))}
              </div>


            </section>

            {/* 步驟 3: 確認問牌內容 */}
            <section className="qf-step" data-step="3">
              <div className="qf-step-header">
                <span
                  className={`qf-step-number ${canSubmit() ? "completed" : ""}`}
                >
                  3
                </span>
                <h3 className="qf-step-title">確認問牌內容</h3>
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
                        disabled={isLoading}
                        className={`qf-give-color-btn ${color} ${selectedGiveColor === color ? "selected" : ""}`}
                        onClick={() => handleSelectGiveColor(color)}
                      >
                        <span className="qf-herb-medallion">
                          <HerbArt color={color} />
                        </span>
                        給 {COLOR_NAMES[color]} 一張
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div
                className={`qf-order-preview ${canSubmit() ? "ready" : ""}`}
                aria-live="polite"
              >
                <div className="qf-order-route" aria-hidden="true">
                  <span className="qf-order-person">
                    {selectedPlayerId ? getSelectedPlayerName() : "對手"}
                  </span>
                  <span className="qf-order-arrow">
                    {selectedType === QUESTION_TYPE_GIVE_ONE_GET_ALL
                      ? "⇄"
                      : "→"}
                  </span>
                  <span className="qf-order-person">你</span>
                </div>
                <p className="qf-order-description">
                  {!targetAvailable
                    ? "先選擇一位對手"
                    : !selectedType
                      ? "再選擇上方的要牌方式"
                      : needsGiveColorChoice() && !selectedGiveColor
                        ? "選擇要給出的色組後即可確認"
                        : getActionDescription()}
                </p>
                <span className="qf-order-caption">
                  {canSubmit() ? getActionText() : "選好後再確認，不會立即出牌"}
                </span>
              </div>
            </section>
          </div>

          {/* 錯誤訊息 */}
          {validationError && (
            <div className="qf-error" role="alert">
              {validationError}
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
    name: PropTypes.string,
  }),
  players: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      isActive: PropTypes.bool,
    }),
  ),
  currentPlayerId: PropTypes.string,
  currentPlayerHand: PropTypes.array,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default QuestionFlow;
