/**
 * 問牌介面組件
 *
 * @module QuestionCard
 * @description 問牌操作介面，包含顏色選擇、目標玩家選擇和要牌方式選擇
 */

import React, { useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import {
  ALL_COLORS,
  QUESTION_TYPE_ONE_EACH,
  QUESTION_TYPE_ALL_ONE_COLOR,
  QUESTION_TYPE_GIVE_ONE_GET_ALL,
  QUESTION_TYPE_DESCRIPTIONS
} from '../../shared/constants';
import { validateQuestionType } from '../../utils/gameRules';
import { processQuestionAction } from '../../services/gameService';
import { updateGameState } from '../../store/gameStore';
import './QuestionCard.css';

/**
 * 顏色選擇器組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.selectedColors - 已選擇的顏色
 * @param {Function} props.onColorSelect - 顏色選擇回調
 * @param {number} props.maxColors - 最多可選顏色數
 * @returns {JSX.Element} 顏色選擇器
 */
function ColorSelector({ selectedColors, onColorSelect, maxColors = 2 }) {
  const handleColorClick = (color) => {
    if (selectedColors.includes(color)) {
      // 取消選擇
      onColorSelect(selectedColors.filter(c => c !== color));
    } else if (selectedColors.length < maxColors) {
      // 新增選擇
      onColorSelect([...selectedColors, color]);
    }
  };

  return (
    <div className="color-selector">
      <h4 className="selector-title">選擇顏色 (選擇 {maxColors} 個不同顏色)</h4>
      <div className="color-options">
        {ALL_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`color-option color-${color} ${selectedColors.includes(color) ? 'selected' : ''}`}
            onClick={() => handleColorClick(color)}
            aria-pressed={selectedColors.includes(color)}
            aria-label={`${color} ${selectedColors.includes(color) ? '(已選擇)' : ''}`}
          >
            {color}
          </button>
        ))}
      </div>
      <p className="selection-hint">
        已選擇: {selectedColors.length > 0 ? selectedColors.join(', ') : '尚未選擇'}
      </p>
    </div>
  );
}

ColorSelector.propTypes = {
  selectedColors: PropTypes.arrayOf(PropTypes.string).isRequired,
  onColorSelect: PropTypes.func.isRequired,
  maxColors: PropTypes.number
};

/**
 * 目標玩家選擇器組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.players - 玩家列表
 * @param {string} props.selectedPlayerId - 已選擇的玩家ID
 * @param {Function} props.onPlayerSelect - 玩家選擇回調
 * @param {string} props.currentPlayerId - 當前玩家ID（排除自己）
 * @returns {JSX.Element} 目標玩家選擇器
 */
function PlayerSelector({ players, selectedPlayerId, onPlayerSelect, currentPlayerId }) {
  // 排除自己
  const otherPlayers = players.filter(p => p.id !== currentPlayerId);

  return (
    <div className="player-selector">
      <h4 className="selector-title">選擇目標玩家</h4>
      <div className="player-options">
        {otherPlayers.length === 0 ? (
          <p className="no-players">沒有其他玩家</p>
        ) : (
          otherPlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              className={`player-option ${selectedPlayerId === player.id ? 'selected' : ''}`}
              onClick={() => onPlayerSelect(player.id)}
              aria-pressed={selectedPlayerId === player.id}
            >
              {player.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

PlayerSelector.propTypes = {
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  selectedPlayerId: PropTypes.string,
  onPlayerSelect: PropTypes.func.isRequired,
  currentPlayerId: PropTypes.string
};

/**
 * 要牌方式選擇器組件
 *
 * @param {Object} props - 組件屬性
 * @param {number} props.selectedType - 已選擇的類型
 * @param {Function} props.onTypeSelect - 類型選擇回調
 * @returns {JSX.Element} 要牌方式選擇器
 */
function QuestionTypeSelector({ selectedType, onTypeSelect }) {
  const questionTypes = [
    { type: QUESTION_TYPE_ONE_EACH, description: QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_ONE_EACH] },
    { type: QUESTION_TYPE_ALL_ONE_COLOR, description: QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_ALL_ONE_COLOR] },
    { type: QUESTION_TYPE_GIVE_ONE_GET_ALL, description: QUESTION_TYPE_DESCRIPTIONS[QUESTION_TYPE_GIVE_ONE_GET_ALL] }
  ];

  return (
    <div className="question-type-selector">
      <h4 className="selector-title">選擇要牌方式</h4>
      <div className="type-options">
        {questionTypes.map(({ type, description }) => (
          <button
            key={type}
            type="button"
            className={`type-option ${selectedType === type ? 'selected' : ''}`}
            onClick={() => onTypeSelect(type)}
            aria-pressed={selectedType === type}
          >
            <span className="type-number">方式 {type}</span>
            <span className="type-description">{description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

QuestionTypeSelector.propTypes = {
  selectedType: PropTypes.number,
  onTypeSelect: PropTypes.func.isRequired
};

/**
 * 問牌結果顯示組件
 *
 * @param {Object} props - 組件屬性
 * @param {Object} props.result - 問牌結果
 * @param {Function} props.onClose - 關閉回調
 * @returns {JSX.Element} 結果顯示組件
 */
function QuestionResult({ result, onClose }) {
  if (!result) return null;

  return (
    <div className="question-result">
      <h4 className="result-title">
        {result.success ? '問牌成功' : '問牌失敗'}
      </h4>
      <p className="result-message">{result.message}</p>
      {result.success && result.result && result.result.cardsReceived.length > 0 && (
        <div className="result-cards">
          <p>收到的牌：</p>
          <ul>
            {result.result.cardsReceived.map(card => (
              <li key={card.id} className={`result-card card-${card.color}`}>
                {card.color}
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.success && result.result && result.result.cardsReceived.length === 0 && (
        <p className="result-no-cards">目標玩家沒有該顏色的牌</p>
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

QuestionResult.propTypes = {
  result: PropTypes.shape({
    success: PropTypes.bool,
    message: PropTypes.string,
    result: PropTypes.shape({
      cardsReceived: PropTypes.array
    })
  }),
  onClose: PropTypes.func.isRequired
};

/**
 * 問牌介面組件
 *
 * @param {Object} props - 組件屬性
 * @param {Array} props.players - 玩家列表
 * @param {string} props.currentPlayerId - 當前玩家ID
 * @param {Array} props.currentPlayerHand - 當前玩家手牌（用於類型3驗證）
 * @param {Function} props.onSubmit - 提交回調
 * @param {Function} props.onCancel - 取消回調
 * @param {boolean} props.isOpen - 是否開啟
 * @param {boolean} props.isLoading - 是否載入中
 * @param {Object} props.questionResult - 問牌結果
 * @param {Function} props.onResultClose - 關閉結果回調
 * @returns {JSX.Element} 問牌介面組件
 */
function QuestionCard({
  players = [],
  currentPlayerId,
  currentPlayerHand = [],
  onSubmit,
  onCancel,
  isOpen = true,
  isLoading = false,
  questionResult = null,
  onResultClose
}) {
  // 狀態
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState('');

  /**
   * 驗證表單
   * 使用 gameRules 進行完整驗證
   * @returns {boolean} 是否有效
   */
  const validateForm = () => {
    // 基本驗證
    if (selectedColors.length !== 2) {
      setError('請選擇兩個不同顏色');
      return false;
    }

    if (selectedColors[0] === selectedColors[1]) {
      setError('請選擇兩個不同的顏色');
      return false;
    }

    if (!selectedPlayerId) {
      setError('請選擇目標玩家');
      return false;
    }

    if (!selectedType) {
      setError('請選擇要牌方式');
      return false;
    }

    // 使用 gameRules 進行問牌類型驗證
    const targetPlayer = players.find(p => p.id === selectedPlayerId);
    const targetHand = targetPlayer ? targetPlayer.hand || [] : [];

    const validation = validateQuestionType(
      selectedType,
      selectedColors,
      currentPlayerHand,
      targetHand
    );

    if (!validation.isValid) {
      setError(validation.message);
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

    const questionData = {
      colors: selectedColors,
      targetPlayerId: selectedPlayerId,
      questionType: selectedType
    };

    if (onSubmit) {
      onSubmit(questionData);
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
    setSelectedPlayerId(null);
    setSelectedType(null);
    setError('');
  };

  /**
   * 處理顏色選擇變更
   */
  const handleColorChange = (colors) => {
    setSelectedColors(colors);
    setError('');
  };

  /**
   * 處理玩家選擇變更
   */
  const handlePlayerChange = (playerId) => {
    setSelectedPlayerId(playerId);
    setError('');
  };

  /**
   * 處理類型選擇變更
   */
  const handleTypeChange = (type) => {
    setSelectedType(type);
    setError('');
  };

  /**
   * 檢查是否可提交
   */
  const canSubmit = () => {
    return selectedColors.length === 2 &&
           selectedColors[0] !== selectedColors[1] &&
           selectedPlayerId &&
           selectedType;
  };

  if (!isOpen) return null;

  // 顯示問牌結果
  if (questionResult) {
    return (
      <div className="question-card">
        <div className="question-card-header">
          <h3>問牌結果</h3>
        </div>
        <div className="question-card-body">
          <QuestionResult
            result={questionResult}
            onClose={onResultClose || handleCancel}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="question-card">
      <div className="question-card-header">
        <h3>問牌</h3>
      </div>

      <div className="question-card-body">
        {/* 載入指示器 */}
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner" aria-label="載入中"></div>
            <p>處理中...</p>
          </div>
        )}

        {/* 顏色選擇 */}
        <ColorSelector
          selectedColors={selectedColors}
          onColorSelect={handleColorChange}
          maxColors={2}
        />

        {/* 目標玩家選擇 */}
        <PlayerSelector
          players={players}
          selectedPlayerId={selectedPlayerId}
          onPlayerSelect={handlePlayerChange}
          currentPlayerId={currentPlayerId}
        />

        {/* 要牌方式選擇 */}
        <QuestionTypeSelector
          selectedType={selectedType}
          onTypeSelect={handleTypeChange}
        />

        {/* 錯誤訊息 */}
        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}
      </div>

      <div className="question-card-footer">
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
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit() || isLoading}
        >
          {isLoading ? '處理中...' : '確認問牌'}
        </button>
      </div>
    </div>
  );
}

QuestionCard.propTypes = {
  players: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    hand: PropTypes.array
  })),
  currentPlayerId: PropTypes.string,
  currentPlayerHand: PropTypes.array,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isOpen: PropTypes.bool,
  isLoading: PropTypes.bool,
  questionResult: PropTypes.object,
  onResultClose: PropTypes.func
};

/**
 * 問牌介面容器組件
 * 處理 Redux 整合和 gameService 調用
 *
 * @param {Object} props - 組件屬性
 * @param {boolean} props.isOpen - 是否開啟
 * @param {Function} props.onClose - 關閉回調
 * @returns {JSX.Element} 問牌介面容器組件
 */
function QuestionCardContainer({ isOpen = true, onClose }) {
  const dispatch = useDispatch();

  // 從 Redux store 取得遊戲狀態（分開選取以避免不必要的重新渲染）
  const gameId = useSelector(state => state.gameId);
  const players = useSelector(state => state.players);
  const currentPlayerId = useSelector(state => state.currentPlayerId);
  const currentPlayerIndex = useSelector(state => state.currentPlayerIndex);

  // 本地狀態
  const [isLoading, setIsLoading] = useState(false);
  const [questionResult, setQuestionResult] = useState(null);

  // 取得當前玩家資訊
  const currentPlayer = players[currentPlayerIndex] || {};
  const effectivePlayerId = currentPlayerId || currentPlayer.id;
  const currentPlayerHand = currentPlayer.hand || [];

  /**
   * 處理問牌提交
   * @param {Object} questionData - 問牌資料
   */
  const handleSubmit = useCallback(async (questionData) => {
    if (!gameId) {
      setQuestionResult({
        success: false,
        message: '遊戲不存在'
      });
      return;
    }

    setIsLoading(true);

    try {
      // 建立問牌動作
      const action = {
        playerId: effectivePlayerId,
        targetPlayerId: questionData.targetPlayerId,
        colors: questionData.colors,
        questionType: questionData.questionType
      };

      // 調用 gameService 處理問牌動作
      const result = processQuestionAction(gameId, action);

      setQuestionResult(result);

      // 如果成功，更新 Redux store
      if (result.success && result.gameState) {
        dispatch(updateGameState({
          players: result.gameState.players,
          currentPlayerIndex: result.gameState.currentPlayerIndex,
          gameHistory: result.gameState.gameHistory
        }));
      }
    } catch (err) {
      setQuestionResult({
        success: false,
        message: '處理問牌時發生錯誤：' + (err.message || '未知錯誤')
      });
    } finally {
      setIsLoading(false);
    }
  }, [gameId, effectivePlayerId, dispatch]);

  /**
   * 處理取消
   */
  const handleCancel = useCallback(() => {
    setQuestionResult(null);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  /**
   * 處理結果關閉
   */
  const handleResultClose = useCallback(() => {
    setQuestionResult(null);
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  return (
    <QuestionCard
      players={players}
      currentPlayerId={effectivePlayerId}
      currentPlayerHand={currentPlayerHand}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isOpen={isOpen}
      isLoading={isLoading}
      questionResult={questionResult}
      onResultClose={handleResultClose}
    />
  );
}

QuestionCardContainer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func
};

export default QuestionCard;
export { QuestionCardContainer };
