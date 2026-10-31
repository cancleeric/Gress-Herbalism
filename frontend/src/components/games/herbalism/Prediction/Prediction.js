/**
 * 預測組件 - 問牌後選擇預測蓋牌顏色
 *
 * @module Prediction
 * @description 讓玩家在問牌後選擇性預測蓋牌中包含的顏色
 */

import React, { useState } from 'react';
import { ALL_COLORS } from '../../../../shared/constants';
import HerbArt from '../GameRoom/HerbArt';
import { HERB_GROUPS } from '../GameRoom/herbSpecies';
import './Prediction.css';

/**
 * 顏色名稱對應
 */
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色'
};

/**
 * 預測組件
 *
 * @param {Object} props
 * @param {Function} props.onEndTurn - 結束回合的回調函數，參數為選擇的顏色（或 null）
 * @param {boolean} props.isLoading - 是否正在載入中
 * @returns {JSX.Element}
 */
function Prediction({ onEndTurn, isLoading }) {
  const [selectedColor, setSelectedColor] = useState(null);

  /**
   * 處理顏色選擇
   */
  const handleColorSelect = (color) => {
    if (selectedColor === color) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
  };

  /**
   * 處理結束回合
   */
  const handleEndTurn = () => {
    if (onEndTurn) {
      onEndTurn(selectedColor);
    }
  };

  return (
    <div className="prediction-card">
      <header className="prediction-heading">
        <span className="prediction-eyebrow">問牌已完成 · 可選步驟</span>
        <h3>預測中央蓋牌</h3>
        <p className="prediction-prompt">不是交牌選擇。選一色預測，或直接略過。</p>
      </header>

      <div className="prediction-colors">
        {ALL_COLORS.map(color => (
          <button
            key={color}
            style={{"--herb-glow":HERB_GROUPS[color].glow,"--herb-ink":HERB_GROUPS[color].ink}}
            aria-label={COLOR_NAMES[color]}
            aria-pressed={selectedColor === color}
            className={`prediction-choice color-${color} ${selectedColor === color ? 'selected' : ''}`}
            onClick={() => handleColorSelect(color)}
            disabled={isLoading}
          >
            <span className="prediction-art"><HerbArt color={color} /></span>
            <span className="prediction-color-name"><i aria-hidden="true">{HERB_GROUPS[color].symbol}</i>{COLOR_NAMES[color]}<b aria-hidden="true">{selectedColor === color ? '✓' : ''}</b></span>
          </button>
        ))}
      </div>

      <p className="prediction-hint" role="status">
        {selectedColor
          ? `已選擇：${COLOR_NAMES[selectedColor]} ✓`
          : '不選顏色也能結束回合'}
      </p>

      <p className="prediction-rules">
        預測規則：預測對 +1 分，預測錯 -1 分（最低 0 分）
      </p>

      <button
        className="btn btn-primary end-turn-btn"
        onClick={handleEndTurn}
        disabled={isLoading}
      >
        {isLoading ? '處理中...' : selectedColor ? '確認預測並結束回合' : '略過預測，結束回合'}
      </button>
    </div>
  );
}

export default Prediction;
