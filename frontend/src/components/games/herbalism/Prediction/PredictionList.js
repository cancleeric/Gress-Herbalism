/**
 * 預測列表組件 - 顯示當局所有玩家的預測
 *
 * @module PredictionList
 */

import React from 'react';
import './Prediction.css';

/**
 * 顏色名稱對應
 */
const COLOR_NAMES = {
  red: '紅',
  yellow: '黃',
  green: '綠',
  blue: '藍'
};

/**
 * 預測列表組件
 *
 * @param {Object} props
 * @param {Array} props.predictions - 預測記錄陣列
 * @param {Array} props.players - 玩家陣列
 * @returns {JSX.Element}
 */
function PredictionList({ predictions, players }) {
  if (!predictions || predictions.length === 0) {
    return null;
  }

  /**
   * 根據 playerId 取得玩家名稱
   */
  const getPlayerName = (playerId) => {
    const player = players?.find(p => p.id === playerId);
    return player?.name || '未知玩家';
  };

  return (
    <div className="prediction-list">
      <h4>本局預測</h4>
      <ul>
        {predictions.map((pred, index) => (
          <li key={`${pred.playerId}-${index}`}>
            <span className="player-name">{getPlayerName(pred.playerId)}</span>
            {pred.color ? (
              <span className={`prediction-color color-${pred.color}`}>
                {COLOR_NAMES[pred.color] || pred.color}
              </span>
            ) : (
              <span className="no-prediction">未預測</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PredictionList;
