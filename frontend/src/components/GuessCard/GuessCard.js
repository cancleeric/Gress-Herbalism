/**
 * 猜牌介面組件
 *
 * @module GuessCard
 * @description 猜牌操作介面，包含顏色選擇和警告提示
 */

import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { ALL_COLORS } from '../../shared/constants';
import { processGuessAction, revealHiddenCards } from '../../services/gameService';
import { updateGameState } from '../../store/gameStore';
import './GuessCard.css';

/**
 * 顏色選擇器組件（猜牌用，可重複選擇）
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.selectedColors - 已選擇的顏色
 * @param {Function} props.onColorSelect - 顏色選擇回調
 * @param {boolean} props.disabled - 是否禁用
 * @returns {JSX.Element} 顏色選擇器
 */
function GuessColorSelector({ selectedColors, onColorSelect, disabled = false }) {
  /**
   * 處理顏色點擊
   * @param {string} color - 點擊的顏色
   */
  const handleColorClick = (color) => {
    if (disabled) return;

    if (selectedColors.length < 2) {
      // 新增選擇（允許重複）
      onColorSelect([...selectedColors, color]);
    }
  };

  /**
   * 移除已選顏色
   * @param {number} index - 要移除的索引
   */
  const handleRemoveColor = (index) => {
    if (disabled) return;
    const newColors = selectedColors.filter((_, i) => i !== index);
    onColorSelect(newColors);
  };

  return (
    <div className="guess-color-selector">
      <h4 className="selector-title">選擇兩個顏色（可重複）</h4>
      <div className="color-options">
        {ALL_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-option color-${color}`}
            onClick={() => handleColorClick(color)}
            disabled={disabled || selectedColors.length >= 2}
            aria-label={`選擇 ${color}`}
          >
            {color}
          </button>
        ))}
      </div>
      <div className="selected-colors">
        <p>已選擇：</p>
        <div className="selected-color-tags">
          {selectedColors.length === 0 ? (
            <span className="no-selection">尚未選擇</span>
          ) : (
            selectedColors.map((color, index) => (
              <button
                key={index}
                type="button"
                className={`selected-color-tag color-${color}`}
                onClick={() => handleRemoveColor(index)}
                disabled={disabled}
                aria-label={`移除 ${color}`}
              >
                {color} ✕
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

GuessColorSelector.propTypes = {
  selectedColors: PropTypes.arrayOf(PropTypes.string).isRequired,
  onColorSelect: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

/**
 * 蓋牌顯示組件（查看答案用）
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.hiddenCards - 蓋牌資訊
 * @param {boolean} props.revealed - 是否已揭示
 * @returns {JSX.Element} 蓋牌顯示
 */
function HiddenCardsReveal({ hiddenCards, revealed }) {
  if (!hiddenCards || hiddenCards.length === 0) {
    return null;
  }

  return (
    <div className={`hidden-cards-reveal ${revealed ? 'revealed' : ''}`}>
      <h4 className="reveal-title">
        {revealed ? '蓋牌答案' : '蓋牌（點擊查看）'}
      </h4>
      <div className="hidden-cards-display">
        {hiddenCards.map((card, index) => (
          <div
            key={card.id || index}
            className={`hidden-card-reveal ${revealed ? `color-${card.color}` : 'face-down'}`}
          >
            {revealed ? card.color : '?'}
          </div>
        ))}
      </div>
    </div>
  );
}

HiddenCardsReveal.propTypes = {
  hiddenCards: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    color: PropTypes.string
  })),
  revealed: PropTypes.bool
};

/**
 * 猜牌結果顯示組件
 *
 * @param {Object} props - 組件屬性
 * @param {Object} props.result - 猜牌結果
 * @param {Function} props.onClose - 關閉回調
 * @returns {JSX.Element} 結果顯示組件
 */
function GuessResult({ result, onClose }) {
  if (!result) return null;

  const isCorrect = result.isCorrect;
  const isGameOver = result.gameState?.gamePhase === 'finished';
  const hasWinner = result.gameState?.winner !== null;

  return (
    <div className={`guess-result ${isCorrect ? 'correct' : 'incorrect'}`}>
      <h4 className="result-title">
        {isCorrect ? '🎉 恭喜猜對了！' : '😢 猜錯了'}
      </h4>
      <p className="result-message">{result.message}</p>

      {/* 猜對時顯示揭示的蓋牌 */}
      {isCorrect && result.revealedCards && (
        <div className="revealed-answer">
          <p>正確答案：</p>
          <div className="answer-cards">
            {result.revealedCards.map((card, index) => (
              <span key={index} className={`answer-card color-${card.color}`}>
                {card.color}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 猜錯且遊戲結束無獲勝者 */}
      {isGameOver && !hasWinner && (
        <p className="game-over-message">遊戲結束，沒有獲勝者</p>
      )}

      {/* 猜錯但遊戲繼續 */}
      {!isCorrect && !isGameOver && (
        <p className="elimination-message">你已退出遊戲</p>
      )}

      <button
        type="button"
        className="btn btn-primary"
        onClick={onClose}
      >
        確定
      </button>
    </div>
  );
}

GuessResult.propTypes = {
  result: PropTypes.shape({
    isCorrect: PropTypes.bool,
    message: PropTypes.string,
    revealedCards: PropTypes.array,
    gameState: PropTypes.shape({
      gamePhase: PropTypes.string,
      winner: PropTypes.string
    })
  }),
  onClose: PropTypes.func.isRequired
};

/**
 * 猜牌介面組件
 *
 * @param {Object} props - 組件屬性
 * @param {Function} props.onSubmit - 提交回調
 * @param {Function} props.onCancel - 取消回調
 * @param {boolean} props.isOpen - 是否開啟
 * @param {boolean} props.isLoading - 是否載入中
 * @param {Object} props.guessResult - 猜牌結果
 * @param {Function} props.onResultClose - 關閉結果回調
 * @param {Array} props.hiddenCards - 蓋牌資訊（供查看）
 * @param {boolean} props.canViewAnswer - 是否可查看答案
 * @returns {JSX.Element} 猜牌介面組件
 */
function GuessCard({
  onSubmit,
  onCancel,
  isOpen = true,
  isLoading = false,
  guessResult = null,
  onResultClose,
  hiddenCards = [],
  canViewAnswer = false
}) {
  // 狀態
  const [selectedColors, setSelectedColors] = useState([]);
  const [error, setError] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  /**
   * 驗證表單
   * @returns {boolean} 是否有效
   */
  const validateForm = () => {
    if (selectedColors.length !== 2) {
      setError('請選擇兩個顏色');
      return false;
    }

    setError('');
    return true;
  };

  /**
   * 處理提交
   */
  const handleSubmit = () => {
    if (!validateForm()) return;

    const guessData = {
      guessedColors: selectedColors
    };

    if (onSubmit) {
      onSubmit(guessData);
    }

    // 重置表單
    resetForm();
  };

  /**
   * 處理取消
   */
  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  /**
   * 重置表單
   */
  const resetForm = () => {
    setSelectedColors([]);
    setError('');
    setShowAnswer(false);
  };

  /**
   * 處理顏色選擇變更
   * @param {Array} colors - 新的顏色陣列
   */
  const handleColorChange = (colors) => {
    setSelectedColors(colors);
    setError('');
  };

  /**
   * 切換查看答案
   */
  const handleToggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  /**
   * 檢查是否可提交
   * @returns {boolean} 是否可提交
   */
  const canSubmit = () => {
    return selectedColors.length === 2;
  };

  if (!isOpen) return null;

  // 顯示猜牌結果
  if (guessResult) {
    return (
      <div className="guess-card">
        <div className="guess-card-header">
          <h3>猜牌結果</h3>
        </div>
        <div className="guess-card-body">
          <GuessResult
            result={guessResult}
            onClose={onResultClose || handleCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="guess-card">
      <div className="guess-card-header">
        <h3>猜牌</h3>
      </div>

      <div className="guess-card-body">
        {/* 載入指示器 */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner" aria-label="載入中"></div>
            <p>處理中...</p>
          </div>
        )}

        {/* 警告訊息 */}
        <div className="warning-message" role="alert">
          ⚠️ 猜錯會退出遊戲！請謹慎選擇。
        </div>

        {/* 查看蓋牌答案 */}
        {canViewAnswer && hiddenCards.length > 0 && (
          <div className="answer-section">
            <button
              type="button"
              className="btn btn-view-answer"
              onClick={handleToggleAnswer}
              disabled={isLoading}
            >
              {showAnswer ? '隱藏答案' : '查看答案'}
            </button>
            <HiddenCardsReveal
              hiddenCards={hiddenCards}
              revealed={showAnswer}
            />
          </div>
        )}

        {/* 顏色選擇 */}
        <GuessColorSelector
          selectedColors={selectedColors}
          onColorSelect={handleColorChange}
          disabled={isLoading}
        />

        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="guess-card-footer">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleCancel}
          disabled={isLoading}
        >
          取消
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleSubmit}
          disabled={!canSubmit() || isLoading}
        >
          {isLoading ? '處理中...' : '確認猜牌'}
        </button>
      </div>
    </div>
  );
}

GuessCard.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isOpen: PropTypes.bool,
  isLoading: PropTypes.bool,
  guessResult: PropTypes.object,
  onResultClose: PropTypes.func,
  hiddenCards: PropTypes.array,
  canViewAnswer: PropTypes.bool
};

/**
 * 猜牌介面容器組件
 * 處理 Redux 整合和 gameService 調用
 *
 * @param {Object} props - 組件屬性
 * @param {boolean} props.isOpen - 是否開啟
 * @param {Function} props.onClose - 關閉回調
 * @returns {JSX.Element} 猜牌介面容器組件
 */
function GuessCardContainer({ isOpen = true, onClose }) {
  const dispatch = useDispatch();

  // 從 Redux store 取得遊戲狀態
  const gameState = useSelector((state) => ({
    gameId: state.gameId,
    currentPlayerId: state.currentPlayerId,
    currentPlayerIndex: state.currentPlayerIndex,
    players: state.players
  }));

  // 本地狀態
  const [isLoading, setIsLoading] = useState(false);
  const [guessResult, setGuessResult] = useState(null);
  const [hiddenCards, setHiddenCards] = useState([]);

  // 取得當前玩家資訊
  const currentPlayer = gameState.players[gameState.currentPlayerIndex] || {};
  const currentPlayerId = gameState.currentPlayerId || currentPlayer.id;

  /**
   * 取得蓋牌答案（供猜牌者查看）
   */
  const fetchHiddenCards = useCallback(() => {
    if (!gameState.gameId || !currentPlayerId) return;

    const result = revealHiddenCards(gameState.gameId, currentPlayerId);
    if (result.success) {
      setHiddenCards(result.cards);
    }
  }, [gameState.gameId, currentPlayerId]);

  // 組件載入時取得蓋牌答案
  React.useEffect(() => {
    if (isOpen) {
      fetchHiddenCards();
    }
  }, [isOpen, fetchHiddenCards]);

  /**
   * 處理猜牌提交
   * @param {Object} guessData - 猜牌資料
   */
  const handleSubmit = useCallback(async (guessData) => {
    if (!gameState.gameId) {
      setGuessResult({
        success: false,
        isCorrect: false,
        message: '遊戲不存在'
      });
      return;
    }

    setIsLoading(true);

    try {
      // 建立猜牌動作
      const action = {
        playerId: currentPlayerId,
        guessedColors: guessData.guessedColors
      };

      // 調用 gameService 處理猜牌動作
      const result = processGuessAction(gameState.gameId, action);

      setGuessResult(result);

      // 如果成功，更新 Redux store
      if (result.success && result.gameState) {
        dispatch(updateGameState({
          players: result.gameState.players,
          currentPlayerIndex: result.gameState.currentPlayerIndex,
          gamePhase: result.gameState.gamePhase,
          winner: result.gameState.winner,
          hiddenCards: result.gameState.hiddenCards,
          gameHistory: result.gameState.gameHistory
        }));
      }
    } catch (err) {
      setGuessResult({
        success: false,
        isCorrect: false,
        message: '處理猜牌時發生錯誤：' + (err.message || '未知錯誤')
      });
    } finally {
      setIsLoading(false);
    }
  }, [gameState.gameId, currentPlayerId, dispatch]);

  /**
   * 處理取消
   */
  const handleCancel = useCallback(() => {
    setGuessResult(null);
    setHiddenCards([]);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  /**
   * 處理結果關閉
   */
  const handleResultClose = useCallback(() => {
    setGuessResult(null);
    setHiddenCards([]);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <GuessCard
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isOpen={isOpen}
      isLoading={isLoading}
      guessResult={guessResult}
      onResultClose={handleResultClose}
      hiddenCards={hiddenCards}
      canViewAnswer={true}
    />
  );
}

GuessCardContainer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func
};

export default GuessCard;
export { GuessCardContainer };
