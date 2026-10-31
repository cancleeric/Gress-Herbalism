/**
 * AI 玩家選擇器組件
 *
 * @module AIPlayerSelector
 * @description 用於設定單人模式時的 AI 玩家數量與難度
 */

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  AI_DIFFICULTY,
  ALL_AI_DIFFICULTIES,
  getAIDifficultyDescription,
  getAIPlayerName,
} from "../../../../shared/constants";
import "./AIPlayerSelector.css";

/**
 * AI 玩家選擇器組件
 *
 * @param {Object} props - 組件屬性
 * @param {Function} props.onConfigChange - AI 設定變更時的回調函數
 * @returns {JSX.Element} AI 玩家選擇器
 */
function AIPlayerSelector({ onConfigChange }) {
  const [showDifficultyHelp, setShowDifficultyHelp] = useState(false);

  // AI 數量狀態（2-3 個）
  const [aiCount, setAiCount] = useState(2);

  // 各 AI 的難度設定
  const [difficulties, setDifficulties] = useState([
    AI_DIFFICULTY.MEDIUM,
    AI_DIFFICULTY.MEDIUM,
  ]);

  /**
   * 當 aiCount 或 difficulties 變更時，調用 onConfigChange
   */
  useEffect(() => {
    if (onConfigChange) {
      onConfigChange({
        aiCount,
        difficulties,
      });
    }
  }, [aiCount, difficulties, onConfigChange]);

  /**
   * 處理 AI 數量變更
   * @param {Event} e - 變更事件
   */
  const handleAiCountChange = (newCount) => {
    setAiCount(newCount);

    // 調整 difficulties 陣列長度
    setDifficulties((prevDifficulties) => {
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
  const handleDifficultyChange = (index, newDifficulty) => {

    setDifficulties((prevDifficulties) => {
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
        return "簡單";
      case AI_DIFFICULTY.MEDIUM:
        return "中等";
      case AI_DIFFICULTY.HARD:
        return "困難";
      default:
        return "未知";
    }
  };

  return (
    <div className="ai-player-selector">
      <h3 className="ai-selector-title">AI 玩家設定</h3>

      {/* AI 數量選擇 */}
      <div className="ai-count-section">
        <p className="ai-count-label" id="ai-count-label">選擇席位</p>
        <div className="ai-seat-options" role="group" aria-labelledby="ai-count-label">
          {[2, 3].map(count => <button type="button" key={count}
            data-ai-count={count} aria-pressed={aiCount === count}
            onClick={() => handleAiCountChange(count)}>
            <span className="ai-seat-glyph" aria-hidden="true">{count === 2 ? '◇ ◇ ◇' : '◇ ◇ ◇ ◇'}</span>
            <strong>{count + 1} 人局</strong><small>你與 {count} 位 AI</small>
            <span className="ai-seat-check" aria-hidden="true">{aiCount === count ? '✓' : ''}</span>
          </button>)}
        </div>
      </div>

      {/* 各 AI 難度設定 */}
      <div className="ai-difficulty-section">
        <h4 className="difficulty-section-title">入席對手 <span>各自選擇難度</span></h4>

        {difficulties.map((difficulty, index) => (
          <div key={index} className="ai-difficulty-row">
            <div className="ai-opponent-art" aria-hidden="true">
              <img alt="" draggable="false" src={`${process.env.PUBLIC_URL}/images/herbs/groups/${['blue', 'green', 'red'][index]}-1.webp`} />
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="ai-opponent-detail">
              <div className="ai-opponent-heading"><strong className="ai-name">{getAIPlayerName(index, difficulty)}</strong><small>{['冷靜觀察', '細讀線索', '沉著推演'][index]}</small></div>
              <div className="ai-level-options" role="group" aria-label={`${getAIPlayerName(index, difficulty)} 難度`}>
                {ALL_AI_DIFFICULTIES.map(diff => <button type="button" key={diff}
                  aria-label={`${getAIPlayerName(index, difficulty)}：${getDifficultyDisplayName(diff)}`}
                  aria-pressed={difficulty === diff} onClick={() => handleDifficultyChange(index, diff)}>
                  {getDifficultyDisplayName(diff)}
                </button>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 難度說明 */}
      <div className="difficulty-info">
        <button
          type="button"
          className="difficulty-info-toggle"
          aria-expanded={showDifficultyHelp}
          aria-controls="ai-difficulty-descriptions"
          onClick={() => setShowDifficultyHelp((value) => !value)}
        >
          難度說明{" "}
          <span aria-hidden="true">{showDifficultyHelp ? "−" : "＋"}</span>
        </button>
        <dl
          id="ai-difficulty-descriptions"
          className="difficulty-descriptions"
          hidden={!showDifficultyHelp}
        >
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
      <div className="config-summary" role="status">
        <p className="summary-text">
          將與 <strong>{aiCount}</strong> 個 AI 玩家進行{" "}
          <strong>{aiCount + 1}</strong> 人遊戲
        </p>
      </div>
    </div>
  );
}

AIPlayerSelector.propTypes = {
  /** AI 設定變更時的回調函數 */
  onConfigChange: PropTypes.func.isRequired,
};

export default AIPlayerSelector;
