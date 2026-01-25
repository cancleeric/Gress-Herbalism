# 工作單 0081

**日期：** 2026-01-25

**工作單標題：** 預測功能 - 前端組件與介面實作

**工單主旨：** 功能開發 - 實作預測選項介面與 Socket 事件監聽

**計畫書：** [預測功能計畫書](../docs/PREDICTION_FEATURE_PLAN.md)

**相關工單：** 0071, 0076, 0080

**依賴工單：** 0080（後端實作）

---

## 一、需求概述

當後端發送 `enterPredictionPhase` 事件時，前端需要顯示預測選項介面，讓玩家選擇預測顏色或跳過。

---

## 二、新增組件

### 2.1 組件結構

```
frontend/src/components/
├── Prediction/
│   ├── index.js                    // 匯出
│   ├── PredictionPrompt.js         // 預測選項介面（主組件）
│   ├── PredictionPrompt.css        // 樣式
│   ├── PredictionResult.js         // 預測結算結果顯示
│   └── PredictionHistory.js        // 遊戲紀錄中的預測顯示
```

### 2.2 PredictionPrompt.js - 預測選項介面

```jsx
/**
 * 預測選項介面組件
 *
 * 顯示時機：問牌完成後，收到 enterPredictionPhase 事件
 * 功能：讓玩家選擇預測蓋牌顏色或跳過
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ALL_COLORS } from '../../shared/constants';
import './PredictionPrompt.css';

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

function PredictionPrompt({
  isOpen,
  onSubmit,
  onSkip,
  isLoading = false
}) {
  const [selectedColor, setSelectedColor] = useState(null);

  // 處理顏色選擇
  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  // 處理提交預測
  const handleSubmit = () => {
    if (selectedColor && onSubmit) {
      onSubmit(selectedColor);
      setSelectedColor(null);
    }
  };

  // 處理跳過
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
      setSelectedColor(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="prediction-prompt-overlay">
      <div className="prediction-prompt">
        {/* 標題 */}
        <div className="prediction-prompt-header">
          <span className="prediction-icon">💭</span>
          <h3>預測蓋牌顏色</h3>
        </div>

        {/* 說明 */}
        <p className="prediction-prompt-description">
          你認為蓋牌中有哪個顏色？
        </p>

        {/* 顏色選項 */}
        <div className="prediction-color-options">
          {ALL_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`prediction-color-btn color-${color} ${
                selectedColor === color ? 'selected' : ''
              }`}
              onClick={() => handleColorSelect(color)}
              disabled={isLoading}
              aria-pressed={selectedColor === color}
            >
              <span className="color-icon">{COLOR_ICONS[color]}</span>
              <span className="color-name">{COLOR_NAMES[color]}</span>
            </button>
          ))}
        </div>

        {/* 已選擇提示 */}
        {selectedColor && (
          <p className="prediction-selected-hint">
            已選擇：
            <span className={`color-badge color-${selectedColor}`}>
              {COLOR_ICONS[selectedColor]} {COLOR_NAMES[selectedColor]}
            </span>
          </p>
        )}

        {/* 按鈕區 */}
        <div className="prediction-prompt-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSkip}
            disabled={isLoading}
          >
            跳過預測
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedColor || isLoading}
          >
            {isLoading ? '處理中...' : '確認預測'}
          </button>
        </div>

        {/* 規則提示 */}
        <p className="prediction-rules-hint">
          預測正確 +1 分，預測錯誤 -1 分
        </p>
      </div>
    </div>
  );
}

PredictionPrompt.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSkip: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default PredictionPrompt;
```

### 2.3 PredictionPrompt.css - 樣式

```css
/* 遮罩層 */
.prediction-prompt-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* 主容器 */
.prediction-prompt {
  background: white;
  border-radius: 16px;
  padding: 24px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 標題 */
.prediction-prompt-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.prediction-prompt-header h3 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.prediction-icon {
  font-size: 24px;
}

/* 說明 */
.prediction-prompt-description {
  text-align: center;
  color: #666;
  margin-bottom: 20px;
}

/* 顏色選項 */
.prediction-color-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.prediction-color-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border: 2px solid #ddd;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.prediction-color-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.prediction-color-btn.selected {
  border-color: #667eea;
  background: #f0f4ff;
}

.prediction-color-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.color-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

/* 顏色特定樣式 */
.prediction-color-btn.color-red.selected { border-color: #e74c3c; }
.prediction-color-btn.color-yellow.selected { border-color: #f1c40f; }
.prediction-color-btn.color-green.selected { border-color: #27ae60; }
.prediction-color-btn.color-blue.selected { border-color: #3498db; }

/* 已選擇提示 */
.prediction-selected-hint {
  text-align: center;
  margin-bottom: 16px;
  color: #333;
}

.color-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 16px;
  font-weight: 500;
  margin-left: 8px;
}

.color-badge.color-red { background: #fdecea; color: #c0392b; }
.color-badge.color-yellow { background: #fef9e7; color: #b7950b; }
.color-badge.color-green { background: #e8f8f5; color: #1e8449; }
.color-badge.color-blue { background: #ebf5fb; color: #2471a3; }

/* 按鈕區 */
.prediction-prompt-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.prediction-prompt-actions .btn {
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.prediction-prompt-actions .btn-secondary {
  background: #f5f5f5;
  border: 1px solid #ddd;
  color: #666;
}

.prediction-prompt-actions .btn-secondary:hover {
  background: #eee;
}

.prediction-prompt-actions .btn-primary {
  background: #667eea;
  border: none;
  color: white;
}

.prediction-prompt-actions .btn-primary:hover {
  background: #5a6fd6;
}

.prediction-prompt-actions .btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 規則提示 */
.prediction-rules-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 0;
}
```

---

## 三、整合到 GameRoom

### 3.1 修改檔案：`frontend/src/components/GameRoom/GameRoom.js`

#### 3.1.1 新增狀態

```javascript
// 新增狀態
const [showPredictionPrompt, setShowPredictionPrompt] = useState(false);
const [predictionLoading, setPredictionLoading] = useState(false);
```

#### 3.1.2 新增 Socket 事件監聽

```javascript
useEffect(() => {
  // ... 現有的 socket 監聽 ...

  // 監聽進入預測階段
  socket.on('enterPredictionPhase', (data) => {
    console.log('進入預測階段:', data);
    setShowPredictionPrompt(true);
  });

  // 監聽預測完成（其他玩家的預測）
  socket.on('predictionMade', (data) => {
    console.log('玩家預測:', data);
    // 更新遊戲紀錄
    addToGameHistory({
      type: 'prediction',
      ...data,
    });
  });

  // 監聽跳過預測
  socket.on('predictionSkipped', (data) => {
    console.log('玩家跳過預測:', data);
    // 更新遊戲紀錄
    addToGameHistory({
      type: 'predictionSkipped',
      ...data,
    });
  });

  // 監聽預測結算
  socket.on('predictionsSettled', (data) => {
    console.log('預測結算:', data);
    // 顯示結算結果
    showPredictionResults(data);
  });

  return () => {
    socket.off('enterPredictionPhase');
    socket.off('predictionMade');
    socket.off('predictionSkipped');
    socket.off('predictionsSettled');
  };
}, [socket]);
```

#### 3.1.3 新增處理函數

```javascript
// 處理提交預測
const handleSubmitPrediction = (color) => {
  setPredictionLoading(true);
  socket.emit('submitPrediction', { color });

  // 關閉介面（後端會廣播結果）
  setTimeout(() => {
    setShowPredictionPrompt(false);
    setPredictionLoading(false);
  }, 500);
};

// 處理跳過預測
const handleSkipPrediction = () => {
  setPredictionLoading(true);
  socket.emit('skipPrediction');

  // 關閉介面
  setTimeout(() => {
    setShowPredictionPrompt(false);
    setPredictionLoading(false);
  }, 500);
};
```

#### 3.1.4 渲染組件

```jsx
return (
  <div className="game-room">
    {/* ... 現有內容 ... */}

    {/* 預測選項介面 */}
    <PredictionPrompt
      isOpen={showPredictionPrompt}
      onSubmit={handleSubmitPrediction}
      onSkip={handleSkipPrediction}
      isLoading={predictionLoading}
    />
  </div>
);
```

---

## 四、遊戲紀錄顯示

### 4.1 修改遊戲紀錄組件

在遊戲紀錄中顯示預測相關訊息：

```javascript
// 遊戲紀錄項目渲染
function renderHistoryItem(item) {
  switch (item.type) {
    case 'prediction':
      return (
        <div className="history-item prediction">
          <span className="player-name">{item.playerName}</span>
          <span> 預測：</span>
          <span className={`color-badge color-${item.color}`}>
            {COLOR_NAMES[item.color]}
          </span>
        </div>
      );

    case 'predictionSkipped':
      return (
        <div className="history-item prediction-skipped">
          <span className="player-name">{item.playerName}</span>
          <span> 選擇不預測</span>
        </div>
      );

    // ... 其他類型 ...
  }
}
```

---

## 五、測試案例

### 5.1 組件測試

```javascript
describe('PredictionPrompt 組件', () => {
  test('顯示四個顏色選項', () => {
    render(<PredictionPrompt isOpen={true} onSubmit={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('紅色')).toBeInTheDocument();
    expect(screen.getByText('黃色')).toBeInTheDocument();
    expect(screen.getByText('綠色')).toBeInTheDocument();
    expect(screen.getByText('藍色')).toBeInTheDocument();
  });

  test('點擊顏色後顯示已選擇', () => {
    render(<PredictionPrompt isOpen={true} onSubmit={jest.fn()} onSkip={jest.fn()} />);
    fireEvent.click(screen.getByText('紅色'));
    expect(screen.getByText(/已選擇/)).toBeInTheDocument();
  });

  test('未選擇時確認按鈕禁用', () => {
    render(<PredictionPrompt isOpen={true} onSubmit={jest.fn()} onSkip={jest.fn()} />);
    expect(screen.getByText('確認預測')).toBeDisabled();
  });

  test('選擇後可以提交', () => {
    const onSubmit = jest.fn();
    render(<PredictionPrompt isOpen={true} onSubmit={onSubmit} onSkip={jest.fn()} />);
    fireEvent.click(screen.getByText('紅色'));
    fireEvent.click(screen.getByText('確認預測'));
    expect(onSubmit).toHaveBeenCalledWith('red');
  });

  test('可以跳過預測', () => {
    const onSkip = jest.fn();
    render(<PredictionPrompt isOpen={true} onSubmit={jest.fn()} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('跳過預測'));
    expect(onSkip).toHaveBeenCalled();
  });

  test('isOpen=false 時不顯示', () => {
    const { container } = render(
      <PredictionPrompt isOpen={false} onSubmit={jest.fn()} onSkip={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });
});
```

---

## 六、驗收標準

### 介面顯示
- [ ] 收到 `enterPredictionPhase` 後顯示預測介面
- [ ] 顯示四個顏色選項（紅、黃、綠、藍）
- [ ] 顯示顏色圖示和名稱
- [ ] 顯示「跳過預測」按鈕
- [ ] 顯示「確認預測」按鈕

### 互動行為
- [ ] 點擊顏色可選擇
- [ ] 再次點擊可切換選擇
- [ ] 顯示已選擇的顏色提示
- [ ] 未選擇時「確認預測」按鈕禁用
- [ ] 選擇後可點擊「確認預測」
- [ ] 可點擊「跳過預測」

### Socket 整合
- [ ] 點擊「確認預測」發送 `submitPrediction` 事件
- [ ] 點擊「跳過預測」發送 `skipPrediction` 事件
- [ ] 提交/跳過後關閉介面

### 遊戲紀錄
- [ ] 遊戲紀錄顯示預測訊息
- [ ] 遊戲紀錄顯示跳過預測訊息

### 樣式
- [ ] 介面美觀
- [ ] 動畫流暢
- [ ] 手機版正常顯示
