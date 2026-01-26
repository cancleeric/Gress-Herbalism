/**
 * AI 玩家選擇器組件
 *
 * @module AIPlayerSelector
 * @description 用於設定單人模式時的 AI 玩家數量與難度
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  AI_DIFFICULTY,
  ALL_AI_DIFFICULTIES,
  getAIDifficultyDescription,
  AI_PLAYER_NAMES
} from '../../shared/constants';
import './AIPlayerSelector.css';

/**
 * AI 玩家選擇器組件
 *
 * @param {Object} props - 組件屬性
 * @param {Function} props.onConfigChange - AI 設定變更時的回調函數
 * @returns {JSX.Element} AI 玩家選擇器
 */
function AIPlayerSelector({ onConfigChange }) {
  // AI 數量狀態（2-3 個）
  const [aiCount, setAiCount] = useState(2);

  // 各 AI 的難度設定
  const [difficulties, setDifficulties] = useState([
    AI_DIFFICULTY.MEDIUM,
    AI_DIFFICULTY.MEDIUM
  ]);

  /**
   * 當 aiCount 或 difficulties 變更時，調用 onConfigChange
   */
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        aiCount,
        difficulties
      });
    }
  }, [aiCount, difficulties, onConfigChange]);

  /**
   * 處理 AI 數量變更
   * @param {Event} e - 變更事件
   */
  const handleAiCountChange = (e) => {
    const newCount = parseInt(e.target.value, 10);
    setAiCount(newCount);

    // 調整 difficulties 陣列長度
    setDifficulties(prevDifficulties => {
      const newDifficulties = [...prevDifficulties];

      // 如果新數量大於舊數量，填充預設難度
      while (newDifficulties.length < newCount) {
        newDifficulties.push(AI_DIFFICULTY.MEDIUM);
      }

      // 如果新數量小於舊數量，截斷陣列
      if (newDifficulties.length > newCount) {
        newDifficulties.length = newCount;
      }

      return newDifficulties;
    });
  };

  /**
   * 處理特定 AI 的難度變更
   * @param {number} index - AI 索引
   * @param {Event} e - 變更事件
   */
  const handleDifficultyChange = (index, e) => {
    const newDifficulty = e.target.value;

    setDifficulties(prevDifficulties => {
      const newDifficulties = [...prevDifficulties];
      newDifficulties[index] = newDifficulty;
      return newDifficulties;
    });
  };

  /**
   * 取得難度顯示名稱
   * @param {string} difficulty - 難度值
   * @returns {string} 顯示名稱
   */
  const getDifficultyDisplayName = (difficulty) => {
    switch (difficulty) {
      case AI_DIFFICULTY.EASY:
        return '簡單';
      case AI_DIFFICULTY.MEDIUM:
        return '中等';
      case AI_DIFFICULTY.HARD:
        return '困難';
      default:
        return '未知';
    }
  };

  return (
    <div className="ai-player-selector">
      <h3 className="ai-selector-title">AI 玩家設定</h3>

      {/* AI 數量選擇 */}
      <div className="ai-count-section">
        <label htmlFor="ai-count" className="ai-count-label">
          AI 玩家數量
        </label>
        <select
          id="ai-count"
          className="ai-count-select"
          value={aiCount}
          onChange={handleAiCountChange}
        >
          <option value={2}>2 個 AI (3 人遊戲)</option>
          <option value={3}>3 個 AI (4 人遊戲)</option>
        </select>
        <p className="ai-count-hint">
          選擇與你一起遊戲的 AI 玩家數量
        </p>
      </div>

      {/* 各 AI 難度設定 */}
      <div className="ai-difficulty-section">
        <h4 className="difficulty-section-title">各 AI 難度設定</h4>

        {difficulties.map((difficulty, index) => (
          <div key={index} className="ai-difficulty-row">
            <span className="ai-name">
              {AI_PLAYER_NAMES[index] || `AI ${index + 1}`}
            </span>
            <select
              className="difficulty-select"
              value={difficulty}
              onChange={(e) => handleDifficultyChange(index, e)}
              aria-label={`${AI_PLAYER_NAMES[index]} 難度`}
            >
              {ALL_AI_DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {getDifficultyDisplayName(diff)}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* 難度說明 */}
      <div className="difficulty-info">
        <h4 className="info-title">難度說明</h4>
        <dl className="difficulty-descriptions">
          {ALL_AI_DIFFICULTIES.map((diff) => (
            <div key={diff} className="difficulty-item">
              <dt className={`difficulty-name difficulty-${diff}`}>
                {getDifficultyDisplayName(diff)}
              </dt>
              <dd className="difficulty-description">
                {getAIDifficultyDescription(diff)}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 當前設定摘要 */}
      <div className="config-summary">
        <p className="summary-text">
          將與 <strong>{aiCount}</strong> 個 AI 玩家進行{' '}
          <strong>{aiCount + 1}</strong> 人遊戲
        </p>
      </div>
    </div>
  );
}

AIPlayerSelector.propTypes = {
  /** AI 設定變更時的回調函數 */
  onConfigChange: PropTypes.func.isRequired
};

export default AIPlayerSelector;
