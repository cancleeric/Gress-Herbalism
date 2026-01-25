/**
 * 預測組件 - 問牌後選擇預測蓋牌顏色
 *
 * @module Prediction
 * @description 讓玩家在問牌後選擇性預測蓋牌中包含的顏色
 */

import React, { useState } from 'react';
import { ALL_COLORS } from '../../shared/constants';
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
      <h3>問牌完成！</h3>
      <p className="prediction-prompt">是否要預測蓋牌中有哪個顏色？</p>

      <div className="prediction-colors">
        {ALL_COLORS.map(color => (
          <button
            key={color}
            className={`btn btn-color color-${color} ${selectedColor === color ? 'selected' : ''}`}
            onClick={() => handleColorSelect(color)}
            disabled={isLoading}
          >
            {COLOR_NAMES[color]}
          </button>
        ))}
      </div>

      <p className="prediction-hint">
        {selectedColor
          ? `已選擇：${COLOR_NAMES[selectedColor]} ✓`
          : '（點擊選擇，可不選）'}
      </p>

      <p className="prediction-rules">
        預測規則：預測對 +1 分，預測錯 -1 分（最低 0 分）
      </p>

      <button
        className="btn btn-primary end-turn-btn"
        onClick={handleEndTurn}
        disabled={isLoading}
      >
        {isLoading ? '處理中...' : '結束回合'}
      </button>
    </div>
  );
}

export default Prediction;
