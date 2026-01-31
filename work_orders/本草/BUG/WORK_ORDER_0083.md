# 工作單 0083

**日期：** 2026-01-25

**工作單標題：** 預測功能 - 結算結果顯示組件

**工單主旨：** 功能開發 - 實作預測結算結果的視覺化顯示

**計畫書：** [預測功能計畫書](../docs/PREDICTION_FEATURE_PLAN.md)

**相關工單：** 0071, 0076, 0080, 0081

**依賴工單：** 0080（後端實作）, 0081（前端基礎組件）

---

## 一、需求概述

當有玩家猜牌成功（正確猜出蓋牌）時，後端會發送 `predictionsSettled` 事件，前端需要顯示：

1. 蓋牌的實際顏色
2. 每位玩家的預測結果（預測了什麼、是否正確、分數變化）
3. 動態的結算動畫效果

---

## 二、組件設計

### 2.1 組件結構

```
frontend/src/components/
├── Prediction/
│   ├── PredictionResult.js         // 預測結算結果顯示（本工單）
│   └── PredictionResult.css        // 樣式
```

### 2.2 介面設計稿

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    💎 預測結算                          │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │              蓋牌顏色                                ││
│  │                                                     ││
│  │         🔴 紅色    🔵 藍色                          ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  預測結果                                           ││
│  │                                                     ││
│  │  ┌─────────────────────────────────────────────┐   ││
│  │  │ 🎉 小明 預測 🔴 紅色              ✓ +1分  │   ││
│  │  └─────────────────────────────────────────────┘   ││
│  │                                                     ││
│  │  ┌─────────────────────────────────────────────┐   ││
│  │  │ 😢 小華 預測 🟢 綠色              ✗ -1分  │   ││
│  │  └─────────────────────────────────────────────┘   ││
│  │                                                     ││
│  │  ┌─────────────────────────────────────────────┐   ││
│  │  │ 🎉 小李 預測 🔵 藍色              ✓ +1分  │   ││
│  │  └─────────────────────────────────────────────┘   ││
│  │                                                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│                    [確定]                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、組件實作

### 3.1 PredictionResult.js

```jsx
/**
 * 預測結算結果顯示組件
 *
 * 顯示時機：收到 predictionsSettled 事件時
 * 功能：顯示蓋牌顏色和每位玩家的預測結果
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './PredictionResult.css';

/**
 * 顏色名稱對照
 */
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色',
};

/**
 * 顏色圖示
 */
const COLOR_ICONS = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
};

/**
 * 預測結算結果組件
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - 是否顯示
 * @param {string[]} props.hiddenCards - 蓋牌的顏色列表
 * @param {Array} props.results - 預測結果列表
 * @param {Function} props.onClose - 關閉回調
 */
function PredictionResult({
  isOpen,
  hiddenCards = [],
  results = [],
  onClose,
}) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [revealedResults, setRevealedResults] = useState([]);

  // 入場動畫
  useEffect(() => {
    if (isOpen) {
      setShowAnimation(true);

      // 逐一揭曉結果（每個間隔 500ms）
      results.forEach((result, index) => {
        setTimeout(() => {
          setRevealedResults(prev => [...prev, result]);
        }, 500 * (index + 1));
      });
    } else {
      setShowAnimation(false);
      setRevealedResults([]);
    }
  }, [isOpen, results]);

  // 處理關閉
  const handleClose = () => {
    setShowAnimation(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className={`prediction-result-overlay ${showAnimation ? 'show' : ''}`}>
      <div className="prediction-result-modal">
        {/* 標題 */}
        <div className="prediction-result-header">
          <span className="result-icon">💎</span>
          <h2>預測結算</h2>
        </div>

        {/* 蓋牌顏色 */}
        <div className="hidden-cards-section">
          <h3>蓋牌顏色</h3>
          <div className="hidden-cards-display">
            {hiddenCards.map((color, index) => (
              <div
                key={index}
                className={`hidden-card-reveal color-${color}`}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <span className="card-icon">{COLOR_ICONS[color]}</span>
                <span className="card-name">{COLOR_NAMES[color]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 預測結果 */}
        {results.length > 0 ? (
          <div className="predictions-results-section">
            <h3>預測結果</h3>
            <div className="predictions-list">
              {revealedResults.map((result, index) => (
                <div
                  key={index}
                  className={`prediction-result-item ${
                    result.isCorrect ? 'correct' : 'incorrect'
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* 結果圖示 */}
                  <span className="result-emoji">
                    {result.isCorrect ? '🎉' : '😢'}
                  </span>

                  {/* 玩家資訊 */}
                  <div className="prediction-info">
                    <span className="player-name">{result.playerName}</span>
                    <span className="prediction-text">
                      預測{' '}
                      <span className={`color-badge color-${result.color}`}>
                        {COLOR_ICONS[result.color]} {COLOR_NAMES[result.color]}
                      </span>
                    </span>
                  </div>

                  {/* 結果標示 */}
                  <div className="prediction-outcome">
                    <span className={`outcome-icon ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {result.isCorrect ? '✓' : '✗'}
                    </span>
                    <span className={`score-change ${result.scoreChange > 0 ? 'positive' : 'negative'}`}>
                      {result.scoreChange > 0 ? '+' : ''}{result.scoreChange} 分
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-predictions">
            <p>本局無人預測</p>
          </div>
        )}

        {/* 關閉按鈕 */}
        <div className="prediction-result-footer">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleClose}
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
}

PredictionResult.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  hiddenCards: PropTypes.arrayOf(PropTypes.string),
  results: PropTypes.arrayOf(
    PropTypes.shape({
      playerId: PropTypes.string.isRequired,
      playerName: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
      isCorrect: PropTypes.bool.isRequired,
      scoreChange: PropTypes.number.isRequired,
    })
  ),
  onClose: PropTypes.func.isRequired,
};

export default PredictionResult;
```

### 3.2 PredictionResult.css

```css
/* ==================== 遮罩層 ==================== */
.prediction-result-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.prediction-result-overlay.show {
  opacity: 1;
}

/* ==================== 主容器 ==================== */
.prediction-result-modal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  color: white;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  transform: scale(0.8);
  animation: modalBounceIn 0.5s ease forwards;
}

@keyframes modalBounceIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* ==================== 標題 ==================== */
.prediction-result-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.prediction-result-header h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
}

.result-icon {
  font-size: 36px;
  animation: sparkle 1s ease infinite;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* ==================== 蓋牌顏色區塊 ==================== */
.hidden-cards-section {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.hidden-cards-section h3 {
  text-align: center;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  opacity: 0.9;
}

.hidden-cards-display {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.hidden-card-reveal {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-radius: 12px;
  animation: cardReveal 0.6s ease forwards;
  opacity: 0;
  transform: rotateY(90deg);
}

@keyframes cardReveal {
  0% {
    opacity: 0;
    transform: rotateY(90deg);
  }
  100% {
    opacity: 1;
    transform: rotateY(0);
  }
}

.hidden-card-reveal .card-icon {
  font-size: 40px;
  margin-bottom: 8px;
}

.hidden-card-reveal .card-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 顏色特定樣式 */
.hidden-card-reveal.color-red { border: 3px solid #e74c3c; }
.hidden-card-reveal.color-yellow { border: 3px solid #f1c40f; }
.hidden-card-reveal.color-green { border: 3px solid #27ae60; }
.hidden-card-reveal.color-blue { border: 3px solid #3498db; }

/* ==================== 預測結果區塊 ==================== */
.predictions-results-section h3 {
  text-align: center;
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  opacity: 0.9;
}

.predictions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prediction-result-item {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 12px 16px;
  color: #333;
  animation: slideInResult 0.4s ease forwards;
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes slideInResult {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.prediction-result-item.correct {
  border-left: 4px solid #27ae60;
}

.prediction-result-item.incorrect {
  border-left: 4px solid #e74c3c;
}

.result-emoji {
  font-size: 24px;
  margin-right: 12px;
  animation: emojiPop 0.5s ease forwards;
}

@keyframes emojiPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.prediction-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prediction-info .player-name {
  font-weight: 600;
  font-size: 15px;
}

.prediction-info .prediction-text {
  font-size: 13px;
  color: #666;
}

.prediction-info .color-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.color-badge.color-red { background: #fdecea; color: #c0392b; }
.color-badge.color-yellow { background: #fef9e7; color: #b7950b; }
.color-badge.color-green { background: #e8f8f5; color: #1e8449; }
.color-badge.color-blue { background: #ebf5fb; color: #2471a3; }

.prediction-outcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.outcome-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
}

.outcome-icon.correct {
  background: #27ae60;
  color: white;
}

.outcome-icon.incorrect {
  background: #e74c3c;
  color: white;
}

.score-change {
  font-size: 14px;
  font-weight: 700;
}

.score-change.positive {
  color: #27ae60;
}

.score-change.negative {
  color: #e74c3c;
}

/* ==================== 無人預測 ==================== */
.no-predictions {
  text-align: center;
  padding: 20px;
  opacity: 0.8;
}

.no-predictions p {
  margin: 0;
  font-size: 16px;
}

/* ==================== 底部按鈕 ==================== */
.prediction-result-footer {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}

.prediction-result-footer .btn {
  padding: 14px 48px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.prediction-result-footer .btn-primary {
  background: white;
  color: #667eea;
}

.prediction-result-footer .btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.4);
}

/* ==================== 響應式設計 ==================== */
@media (max-width: 480px) {
  .prediction-result-modal {
    padding: 24px 16px;
  }

  .prediction-result-header h2 {
    font-size: 22px;
  }

  .hidden-cards-display {
    flex-direction: column;
    align-items: center;
  }

  .hidden-card-reveal {
    width: 100%;
    flex-direction: row;
    justify-content: center;
    gap: 12px;
    padding: 12px;
  }

  .hidden-card-reveal .card-icon {
    font-size: 28px;
    margin-bottom: 0;
  }

  .prediction-result-item {
    flex-wrap: wrap;
  }

  .prediction-outcome {
    width: 100%;
    flex-direction: row;
    justify-content: flex-end;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #eee;
  }
}
```

---

## 四、整合到 GameRoom

### 4.1 修改檔案：`frontend/src/components/GameRoom/GameRoom.js`

#### 4.1.1 新增狀態

```javascript
// 新增狀態
const [showPredictionResult, setShowPredictionResult] = useState(false);
const [predictionResultData, setPredictionResultData] = useState({
  hiddenCards: [],
  results: [],
});
```

#### 4.1.2 修改 Socket 事件監聽

```javascript
// 監聽預測結算
socket.on('predictionsSettled', (data) => {
  console.log('預測結算:', data);
  setPredictionResultData({
    hiddenCards: data.hiddenCards,
    results: data.results,
  });
  setShowPredictionResult(true);
});
```

#### 4.1.3 處理關閉

```javascript
// 處理關閉預測結果
const handleClosePredictionResult = () => {
  setShowPredictionResult(false);
  setPredictionResultData({ hiddenCards: [], results: [] });
};
```

#### 4.1.4 渲染組件

```jsx
return (
  <div className="game-room">
    {/* ... 現有內容 ... */}

    {/* 預測結算結果 */}
    <PredictionResult
      isOpen={showPredictionResult}
      hiddenCards={predictionResultData.hiddenCards}
      results={predictionResultData.results}
      onClose={handleClosePredictionResult}
    />
  </div>
);
```

---

## 五、測試案例

### 5.1 組件測試

```javascript
describe('PredictionResult 組件', () => {
  const mockHiddenCards = ['red', 'blue'];
  const mockResults = [
    { playerId: '1', playerName: '小明', color: 'red', isCorrect: true, scoreChange: 1 },
    { playerId: '2', playerName: '小華', color: 'green', isCorrect: false, scoreChange: -1 },
  ];

  test('顯示蓋牌顏色', () => {
    render(
      <PredictionResult
        isOpen={true}
        hiddenCards={mockHiddenCards}
        results={mockResults}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('紅色')).toBeInTheDocument();
    expect(screen.getByText('藍色')).toBeInTheDocument();
  });

  test('顯示預測結果', async () => {
    render(
      <PredictionResult
        isOpen={true}
        hiddenCards={mockHiddenCards}
        results={mockResults}
        onClose={jest.fn()}
      />
    );

    // 等待動畫完成
    await waitFor(() => {
      expect(screen.getByText('小明')).toBeInTheDocument();
      expect(screen.getByText('小華')).toBeInTheDocument();
    });
  });

  test('正確顯示得分變化', async () => {
    render(
      <PredictionResult
        isOpen={true}
        hiddenCards={mockHiddenCards}
        results={mockResults}
        onClose={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('+1 分')).toBeInTheDocument();
      expect(screen.getByText('-1 分')).toBeInTheDocument();
    });
  });

  test('無人預測時顯示提示', () => {
    render(
      <PredictionResult
        isOpen={true}
        hiddenCards={mockHiddenCards}
        results={[]}
        onClose={jest.fn()}
      />
    );
    expect(screen.getByText('本局無人預測')).toBeInTheDocument();
  });

  test('點擊確定按鈕關閉', () => {
    const onClose = jest.fn();
    render(
      <PredictionResult
        isOpen={true}
        hiddenCards={mockHiddenCards}
        results={mockResults}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByText('確定'));
    // 等待動畫結束
    setTimeout(() => {
      expect(onClose).toHaveBeenCalled();
    }, 300);
  });

  test('isOpen=false 時不顯示', () => {
    const { container } = render(
      <PredictionResult
        isOpen={false}
        hiddenCards={mockHiddenCards}
        results={mockResults}
        onClose={jest.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
```

### 5.2 動畫測試

```javascript
describe('PredictionResult 動畫', () => {
  test('蓋牌依序翻牌動畫', async () => {
    const { container } = render(
      <PredictionResult
        isOpen={true}
        hiddenCards={['red', 'blue']}
        results={[]}
        onClose={jest.fn()}
      />
    );

    const cards = container.querySelectorAll('.hidden-card-reveal');
    expect(cards[0].style.animationDelay).toBe('0s');
    expect(cards[1].style.animationDelay).toBe('0.2s');
  });

  test('結果逐一揭曉動畫', async () => {
    jest.useFakeTimers();

    render(
      <PredictionResult
        isOpen={true}
        hiddenCards={['red']}
        results={[
          { playerId: '1', playerName: '玩家1', color: 'red', isCorrect: true, scoreChange: 1 },
          { playerId: '2', playerName: '玩家2', color: 'blue', isCorrect: false, scoreChange: -1 },
        ]}
        onClose={jest.fn()}
      />
    );

    // 初始不顯示
    expect(screen.queryByText('玩家1')).not.toBeInTheDocument();

    // 500ms 後顯示第一個
    jest.advanceTimersByTime(500);
    expect(screen.getByText('玩家1')).toBeInTheDocument();
    expect(screen.queryByText('玩家2')).not.toBeInTheDocument();

    // 1000ms 後顯示第二個
    jest.advanceTimersByTime(500);
    expect(screen.getByText('玩家2')).toBeInTheDocument();

    jest.useRealTimers();
  });
});
```

---

## 六、驗收標準

### 介面顯示
- [ ] 收到 `predictionsSettled` 後顯示結算介面
- [ ] 顯示蓋牌的實際顏色
- [ ] 顯示每位玩家的預測內容
- [ ] 顯示預測正確/錯誤標示
- [ ] 顯示分數變化（+1/-1）
- [ ] 無人預測時顯示提示文字

### 動畫效果
- [ ] 入場動畫流暢
- [ ] 蓋牌翻牌動畫
- [ ] 結果逐一揭曉動畫
- [ ] 表情符號跳動動畫

### 互動行為
- [ ] 點擊「確定」關閉介面
- [ ] 關閉後清除狀態

### 響應式設計
- [ ] 桌面版正常顯示
- [ ] 手機版正常顯示
- [ ] 動畫在各裝置流暢

