/**
 * 猜牌介面組件
 *
 * @module GuessCard
 * @description 猜牌操作介面，包含顏色選擇和警告提示
 */

import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { ALL_COLORS } from '../../../../shared/constants';
import { processGuessAction } from '../../../../services/gameService';
import { updateGameState } from '../../../../store/gameStore';
import './GuessCard.css';

/**
 * 顏色名稱對照
 */
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色'
};

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

  const isMaxSelected = selectedColors.length >= 2;

  return (
    <div className="guess-color-selector">
      <h4 className="guess-selector-title">選擇兩個顏色（可重複）</h4>
      <div className="guess-color-grid">
        {ALL_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`guess-color-btn ${isMaxSelected ? 'disabled' : ''}`}
            onClick={() => handleColorClick(color)}
            disabled={disabled || isMaxSelected}
            aria-label={`選擇 ${COLOR_NAMES[color]}`}
          >
            <div className={`guess-color-square color-${color}`}></div>
            <span className="guess-color-label">{COLOR_NAMES[color]}</span>
          </button>
        ))}
      </div>

      {/* 已選擇顏色顯示區 */}
      <div className="guess-selected-area">
        <span className="guess-selected-label">已選擇：</span>
        <div className="guess-selected-chips">
          {selectedColors.length === 0 ? (
            <span className="guess-no-selection">尚未選擇</span>
          ) : (
            selectedColors.map((color, index) => (
              <div
                key={index}
                className={`guess-color-chip color-${color}`}
              >
                <span className="chip-text">{COLOR_NAMES[color]}</span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => handleRemoveColor(index)}
                  disabled={disabled}
                  aria-label={`移除 ${COLOR_NAMES[color]}`}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
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
                {COLOR_NAMES[card.color] || card.color}
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
        className="guess-btn guess-btn-confirm"
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
 * @returns {JSX.Element} 猜牌介面組件
 */
function GuessCard({
  onSubmit,
  onCancel,
  isOpen = true,
  isLoading = false,
  guessResult = null,
  onResultClose
}) {
  // 狀態
  const [selectedColors, setSelectedColors] = useState([]);
  const [error, setError] = useState('');

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
          <h3 className="guess-card-title">猜牌結果</h3>
          <div className="guess-header-line"></div>
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
      {/* 裝飾角落 */}
      <div className="guess-motif-tl"></div>
      <div className="guess-motif-br"></div>

      {/* 標題區 */}
      <div className="guess-card-header">
        <h3 className="guess-card-title">猜牌</h3>
        <div className="guess-header-line"></div>
      </div>

      <div className="guess-card-body">
        {/* 載入指示器 */}
        {isLoading && (
          <div className="guess-loading-overlay">
            <div className="guess-loading-spinner" aria-label="載入中"></div>
            <p>處理中...</p>
          </div>
        )}

        {/* 警告訊息 */}
        <div className="guess-warning" role="alert">
          <span className="material-symbols-outlined warning-icon">warning</span>
          <p className="warning-text">猜錯會退出遊戲！請謹慎選擇。</p>
        </div>

        {/* 顏色選擇 */}
        <GuessColorSelector
          selectedColors={selectedColors}
          onColorSelect={handleColorChange}
          disabled={isLoading}
        />

        {/* 錯誤訊息 */}
        {error && (
          <div className="guess-error" role="alert">
            {error}
          </div>
        )}
      </div>

      {/* 底部按鈕區 */}
      <div className="guess-card-footer">
        <button
          type="button"
          className="guess-btn guess-btn-cancel"
          onClick={handleCancel}
          disabled={isLoading}
        >
          取消
        </button>
        <button
          type="button"
          className="guess-btn guess-btn-submit"
          onClick={handleSubmit}
          disabled={!canSubmit() || isLoading}
        >
          <span className="material-symbols-outlined btn-icon">check_circle</span>
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
  onResultClose: PropTypes.func
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

  // 從 Redux store 取得遊戲狀態（分開選取以避免不必要的重新渲染）
  const gameId = useSelector(state => state.gameId);
  const reduxCurrentPlayerId = useSelector(state => state.currentPlayerId);
  const currentPlayerIndex = useSelector(state => state.currentPlayerIndex);
  const players = useSelector(state => state.players);

  // 本地狀態
  const [isLoading, setIsLoading] = useState(false);
  const [guessResult, setGuessResult] = useState(null);

  // 取得當前玩家資訊
  const currentPlayer = players[currentPlayerIndex] || {};
  const currentPlayerId = reduxCurrentPlayerId || currentPlayer.id;

  /**
   * 處理猜牌提交
   * @param {Object} guessData - 猜牌資料
   */
  const handleSubmit = useCallback(async (guessData) => {
    if (!gameId) {
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
      const result = processGuessAction(gameId, action);

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
  }, [gameId, currentPlayerId, dispatch]);

  /**
   * 處理取消
   */
  const handleCancel = useCallback(() => {
    setGuessResult(null);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  /**
   * 處理結果關閉
   */
  const handleResultClose = useCallback(() => {
    setGuessResult(null);
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
    />
  );
}

GuessCardContainer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func
};

export default GuessCard;
export { GuessCardContainer };
