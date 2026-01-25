/**
 * 預測結果組件 - 顯示預測結算結果
 *
 * @module PredictionResult
 */

import React from 'react';
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
 * 預測結果組件
 *
 * @param {Object} props
 * @param {Array} props.predictionResults - 預測結算結果陣列
 * @param {Array} props.players - 玩家陣列
 * @param {Array} props.hiddenCards - 蓋牌陣列
 * @returns {JSX.Element}
 */
function PredictionResult({ predictionResults, players, hiddenCards }) {
  if (!predictionResults || predictionResults.length === 0) {
    return null;
  }

  /**
   * 根據 playerId 取得玩家名稱
   */
  const getPlayerName = (playerId) => {
    const player = players?.find(p => p.id === playerId);
    return player?.name || '未知玩家';
  };

  /**
   * 取得蓋牌顏色字串
   */
  const getHiddenColorsText = () => {
    if (!hiddenCards) return '';
    return hiddenCards.map(card => COLOR_NAMES[card.color] || card.color).join('、');
  };

  return (
    <div className="prediction-results">
      <h4>預測結算</h4>
      <p className="hidden-cards-info">
        蓋牌為：{getHiddenColorsText()}
      </p>
      <ul>
        {predictionResults.map((result, index) => (
          <li key={`${result.playerId}-${index}`}>
            <span className="player-info">
              <span className="player-name">{getPlayerName(result.playerId)}</span>
              {result.color && (
                <span className={`prediction-color color-${result.color}`}>
                  預測 {COLOR_NAMES[result.color]}
                </span>
              )}
            </span>
            <span className={`result-icon ${result.isCorrect ? 'result-correct' : 'result-wrong'}`}>
              {result.isCorrect ? '✓' : '✗'}
            </span>
            <span className={`score-change ${result.scoreChange > 0 ? 'positive' : 'negative'}`}>
              {result.scoreChange > 0 ? `+${result.scoreChange}` : result.scoreChange}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PredictionResult;
