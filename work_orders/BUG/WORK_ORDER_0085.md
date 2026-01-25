# 工作單 0085

**日期：** 2026-01-25

**工作單標題：** BUG - 問牌後未顯示預測選項（前端組件實作與整合）

**工單主旨：** BUG 修復 - 實作前端預測組件並整合到 GameRoom

**分類：** BUG

**嚴重程度：** 高

**相關工單：** 0076, 0081, 0084

**依賴工單：** 0084（後端修復）

---

## 一、問題概述

工單 0084 處理後端發送事件的問題，本工單處理前端接收事件並顯示預測介面的問題。

---

## 二、前端問題診斷

### 2.1 確認組件是否存在

**執行指令：**

```bash
# 檢查 Prediction 目錄是否存在
ls frontend/src/components/Prediction/

# 如果不存在會顯示錯誤
```

**可能結果：**

| 結果 | 狀態 | 處理方式 |
|------|------|---------|
| 目錄不存在 | 需建立 | 依照本工單建立組件 |
| 目錄存在但檔案不完整 | 需補齊 | 依照本工單補齊檔案 |
| 檔案都存在 | 需檢查整合 | 檢查 GameRoom 整合 |

### 2.2 確認 GameRoom 整合狀態

**檢查項目：**

```javascript
// 檢查 import 是否存在
import PredictionPrompt from '../Prediction/PredictionPrompt';

// 檢查狀態是否存在
const [showPredictionPrompt, setShowPredictionPrompt] = useState(false);

// 檢查 socket 監聽是否存在
socket.on('enterPredictionPhase', (data) => { ... });

// 檢查組件是否渲染
<PredictionPrompt isOpen={showPredictionPrompt} ... />
```

---

## 三、完整前端實作

### 3.1 建立目錄結構

```bash
# Windows PowerShell
New-Item -ItemType Directory -Force -Path "frontend\src\components\Prediction"

# 或 Git Bash
mkdir -p frontend/src/components/Prediction
```

### 3.2 建立 PredictionPrompt.js

**完整檔案：** `frontend/src/components/Prediction/PredictionPrompt.js`

```jsx
/**
 * 預測選項介面組件
 *
 * @file PredictionPrompt.js
 * @description 問牌完成後顯示的預測介面，讓玩家選擇預測蓋牌顏色或跳過
 *
 * @props {boolean} isOpen - 是否顯示介面
 * @props {function} onSubmit - 提交預測的回調，參數為選擇的顏色
 * @props {function} onSkip - 跳過預測的回調
 * @props {boolean} isLoading - 是否正在處理中
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './PredictionPrompt.css';

// ==================== 常數定義 ====================

/**
 * 所有可用顏色
 */
const ALL_COLORS = ['red', 'yellow', 'green', 'blue'];

/**
 * 顏色中文名稱對照
 */
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色',
};

/**
 * 顏色圖示對照
 */
const COLOR_ICONS = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
};

// ==================== 組件實作 ====================

function PredictionPrompt({
  isOpen,
  onSubmit,
  onSkip,
  isLoading = false,
}) {
  // ========== 狀態 ==========
  const [selectedColor, setSelectedColor] = useState(null);

  // ========== 事件處理 ==========

  /**
   * 處理顏色選擇
   * @param {string} color - 選擇的顏色
   */
  const handleColorSelect = useCallback((color) => {
    if (isLoading) return;

    // 如果點擊已選擇的顏色，取消選擇
    if (selectedColor === color) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
  }, [selectedColor, isLoading]);

  /**
   * 處理提交預測
   */
  const handleSubmit = useCallback(() => {
    if (!selectedColor || isLoading) return;

    console.log('[PredictionPrompt] 提交預測:', selectedColor);

    if (onSubmit) {
      onSubmit(selectedColor);
    }

    // 重置選擇狀態
    setSelectedColor(null);
  }, [selectedColor, isLoading, onSubmit]);

  /**
   * 處理跳過預測
   */
  const handleSkip = useCallback(() => {
    if (isLoading) return;

    console.log('[PredictionPrompt] 跳過預測');

    if (onSkip) {
      onSkip();
    }

    // 重置選擇狀態
    setSelectedColor(null);
  }, [isLoading, onSkip]);

  // ========== 渲染 ==========

  // 不顯示時返回 null
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="prediction-prompt-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prediction-prompt-title"
    >
      <div className="prediction-prompt">
        {/* ===== 標題區 ===== */}
        <div className="prediction-prompt-header">
          <span className="prediction-icon" role="img" aria-label="思考">
            💭
          </span>
          <h3 id="prediction-prompt-title">預測蓋牌顏色</h3>
        </div>

        {/* ===== 說明文字 ===== */}
        <p className="prediction-prompt-description">
          你認為蓋牌中有哪個顏色？
        </p>

        {/* ===== 顏色選項 ===== */}
        <div className="prediction-color-options" role="group" aria-label="顏色選項">
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
              aria-label={`選擇${COLOR_NAMES[color]}`}
            >
              <span className="color-icon" role="img" aria-hidden="true">
                {COLOR_ICONS[color]}
              </span>
              <span className="color-name">{COLOR_NAMES[color]}</span>
            </button>
          ))}
        </div>

        {/* ===== 已選擇提示 ===== */}
        {selectedColor && (
          <p className="prediction-selected-hint" aria-live="polite">
            已選擇：
            <span className={`color-badge color-${selectedColor}`}>
              {COLOR_ICONS[selectedColor]} {COLOR_NAMES[selectedColor]}
            </span>
          </p>
        )}

        {/* ===== 按鈕區 ===== */}
        <div className="prediction-prompt-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSkip}
            disabled={isLoading}
          >
            {isLoading ? '處理中...' : '跳過預測'}
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

        {/* ===== 規則提示 ===== */}
        <p className="prediction-rules-hint">
          💡 預測正確 +1 分，預測錯誤 -1 分
        </p>
      </div>
    </div>
  );
}

// ==================== PropTypes ====================

PredictionPrompt.propTypes = {
  /** 是否顯示介面 */
  isOpen: PropTypes.bool.isRequired,

  /** 提交預測的回調函數 */
  onSubmit: PropTypes.func.isRequired,

  /** 跳過預測的回調函數 */
  onSkip: PropTypes.func.isRequired,

  /** 是否正在處理中 */
  isLoading: PropTypes.bool,
};

PredictionPrompt.defaultProps = {
  isLoading: false,
};

export default PredictionPrompt;
```

### 3.3 建立 PredictionPrompt.css

**完整檔案：** `frontend/src/components/Prediction/PredictionPrompt.css`

```css
/**
 * 預測選項介面樣式
 *
 * @file PredictionPrompt.css
 * @description 預測介面的完整樣式定義
 */

/* ==================== 變數定義 ==================== */
:root {
  --prediction-primary: #667eea;
  --prediction-primary-dark: #5a6fd6;
  --prediction-bg: white;
  --prediction-text: #333;
  --prediction-text-secondary: #666;
  --prediction-text-muted: #999;
  --prediction-border: #ddd;
  --prediction-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  --prediction-radius: 16px;

  /* 顏色定義 */
  --color-red: #e74c3c;
  --color-red-bg: #fdecea;
  --color-red-text: #c0392b;
  --color-yellow: #f1c40f;
  --color-yellow-bg: #fef9e7;
  --color-yellow-text: #b7950b;
  --color-green: #27ae60;
  --color-green-bg: #e8f8f5;
  --color-green-text: #1e8449;
  --color-blue: #3498db;
  --color-blue-bg: #ebf5fb;
  --color-blue-text: #2471a3;
}

/* ==================== 遮罩層 ==================== */
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
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* ==================== 主容器 ==================== */
.prediction-prompt {
  background: var(--prediction-bg);
  border-radius: var(--prediction-radius);
  padding: 28px 24px;
  max-width: 420px;
  width: 90%;
  box-shadow: var(--prediction-shadow);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ==================== 標題區 ==================== */
.prediction-prompt-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
}

.prediction-prompt-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: var(--prediction-text);
}

.prediction-icon {
  font-size: 28px;
  line-height: 1;
}

/* ==================== 說明文字 ==================== */
.prediction-prompt-description {
  text-align: center;
  color: var(--prediction-text-secondary);
  margin: 0 0 24px 0;
  font-size: 15px;
  line-height: 1.5;
}

/* ==================== 顏色選項 ==================== */
.prediction-color-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}

.prediction-color-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 18px 12px;
  border: 2px solid var(--prediction-border);
  border-radius: 14px;
  background: var(--prediction-bg);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.prediction-color-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.prediction-color-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
}

.prediction-color-btn.selected {
  border-width: 3px;
  background: #f8f9ff;
}

.prediction-color-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* 顏色圖示 */
.prediction-color-btn .color-icon {
  font-size: 36px;
  margin-bottom: 10px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.prediction-color-btn:hover:not(:disabled) .color-icon {
  transform: scale(1.1);
}

.prediction-color-btn.selected .color-icon {
  animation: pulse 0.5s ease;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* 顏色名稱 */
.prediction-color-btn .color-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--prediction-text);
}

/* 顏色特定樣式 - 選中狀態 */
.prediction-color-btn.color-red.selected {
  border-color: var(--color-red);
  background: var(--color-red-bg);
}

.prediction-color-btn.color-yellow.selected {
  border-color: var(--color-yellow);
  background: var(--color-yellow-bg);
}

.prediction-color-btn.color-green.selected {
  border-color: var(--color-green);
  background: var(--color-green-bg);
}

.prediction-color-btn.color-blue.selected {
  border-color: var(--color-blue);
  background: var(--color-blue-bg);
}

/* ==================== 已選擇提示 ==================== */
.prediction-selected-hint {
  text-align: center;
  margin: 0 0 20px 0;
  font-size: 14px;
  color: var(--prediction-text);
  animation: fadeIn 0.3s ease;
}

.color-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: 600;
  margin-left: 8px;
  font-size: 13px;
}

.color-badge.color-red {
  background: var(--color-red-bg);
  color: var(--color-red-text);
}

.color-badge.color-yellow {
  background: var(--color-yellow-bg);
  color: var(--color-yellow-text);
}

.color-badge.color-green {
  background: var(--color-green-bg);
  color: var(--color-green-text);
}

.color-badge.color-blue {
  background: var(--color-blue-bg);
  color: var(--color-blue-text);
}

/* ==================== 按鈕區 ==================== */
.prediction-prompt-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.prediction-prompt-actions .btn {
  flex: 1;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
}

.prediction-prompt-actions .btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.4);
}

/* 次要按鈕（跳過） */
.prediction-prompt-actions .btn-secondary {
  background: #f5f5f5;
  border: 1px solid var(--prediction-border);
  color: var(--prediction-text-secondary);
}

.prediction-prompt-actions .btn-secondary:hover:not(:disabled) {
  background: #ebebeb;
}

.prediction-prompt-actions .btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 主要按鈕（確認） */
.prediction-prompt-actions .btn-primary {
  background: var(--prediction-primary);
  border: none;
  color: white;
}

.prediction-prompt-actions .btn-primary:hover:not(:disabled) {
  background: var(--prediction-primary-dark);
  transform: translateY(-1px);
}

.prediction-prompt-actions .btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* ==================== 規則提示 ==================== */
.prediction-rules-hint {
  text-align: center;
  font-size: 13px;
  color: var(--prediction-text-muted);
  margin: 0;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

/* ==================== 響應式設計 ==================== */
@media (max-width: 480px) {
  .prediction-prompt {
    padding: 24px 16px;
    width: 95%;
  }

  .prediction-prompt-header h3 {
    font-size: 20px;
  }

  .prediction-color-options {
    gap: 10px;
  }

  .prediction-color-btn {
    padding: 14px 10px;
  }

  .prediction-color-btn .color-icon {
    font-size: 30px;
  }

  .prediction-color-btn .color-name {
    font-size: 13px;
  }

  .prediction-prompt-actions {
    flex-direction: column;
  }

  .prediction-prompt-actions .btn {
    width: 100%;
  }
}

/* ==================== 暗色模式支援（可選） ==================== */
@media (prefers-color-scheme: dark) {
  .prediction-prompt {
    /* 如需支援暗色模式，可在此加入樣式 */
  }
}
```

### 3.4 建立 index.js 匯出

**檔案：** `frontend/src/components/Prediction/index.js`

```javascript
/**
 * Prediction 組件匯出
 */

export { default as PredictionPrompt } from './PredictionPrompt';
// 未來可加入更多組件
// export { default as PredictionResult } from './PredictionResult';
```

---

## 四、整合到 GameRoom

### 4.1 修改 GameRoom.js

**檔案：** `frontend/src/components/GameRoom/GameRoom.js`

#### 4.1.1 新增 import（檔案頂部）

```javascript
// 在現有 import 下方加入
import { PredictionPrompt } from '../Prediction';
// 或
import PredictionPrompt from '../Prediction/PredictionPrompt';
```

#### 4.1.2 新增狀態（在組件內部）

```javascript
function GameRoom() {
  // ... 現有狀態 ...

  // ===== 預測相關狀態 =====
  const [showPredictionPrompt, setShowPredictionPrompt] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // ... 其他程式碼 ...
}
```

#### 4.1.3 新增 Socket 監聽（在 useEffect 中）

```javascript
useEffect(() => {
  if (!socket) return;

  // ... 現有的 socket 監聽 ...

  // ===== 預測相關事件監聽 =====

  /**
   * 監聽進入預測階段
   * 問牌完成後，後端會發送此事件給當前玩家
   */
  socket.on('enterPredictionPhase', (data) => {
    console.log('[GameRoom] 收到 enterPredictionPhase:', data);
    setShowPredictionPrompt(true);
  });

  /**
   * 監聯預測完成（其他玩家的預測）
   * 用於更新遊戲紀錄
   */
  socket.on('predictionMade', (data) => {
    console.log('[GameRoom] 玩家預測:', data);
    // 如果有遊戲紀錄功能，在此更新
    // addGameHistoryItem({ type: 'prediction', ...data });
  });

  /**
   * 監聽跳過預測
   */
  socket.on('predictionSkipped', (data) => {
    console.log('[GameRoom] 玩家跳過預測:', data);
    // 如果有遊戲紀錄功能，在此更新
    // addGameHistoryItem({ type: 'predictionSkipped', ...data });
  });

  // ===== 清理函數 =====
  return () => {
    // ... 現有的清理 ...
    socket.off('enterPredictionPhase');
    socket.off('predictionMade');
    socket.off('predictionSkipped');
  };
}, [socket]);
```

#### 4.1.4 新增處理函數

```javascript
// ===== 預測相關處理函數 =====

/**
 * 處理提交預測
 * @param {string} color - 選擇的顏色
 */
const handleSubmitPrediction = useCallback((color) => {
  if (!socket || predictionLoading) return;

  console.log('[GameRoom] 提交預測:', color);
  setPredictionLoading(true);

  socket.emit('submitPrediction', { color });

  // 延遲關閉介面，讓使用者看到回饋
  setTimeout(() => {
    setShowPredictionPrompt(false);
    setPredictionLoading(false);
  }, 500);
}, [socket, predictionLoading]);

/**
 * 處理跳過預測
 */
const handleSkipPrediction = useCallback(() => {
  if (!socket || predictionLoading) return;

  console.log('[GameRoom] 跳過預測');
  setPredictionLoading(true);

  socket.emit('skipPrediction');

  // 延遲關閉介面
  setTimeout(() => {
    setShowPredictionPrompt(false);
    setPredictionLoading(false);
  }, 500);
}, [socket, predictionLoading]);
```

#### 4.1.5 渲染組件（在 return JSX 中）

```jsx
return (
  <div className="game-room">
    {/* ===== 現有內容 ===== */}
    {/* ... 玩家資訊、手牌、遊戲區域等 ... */}

    {/* ===== 預測選項介面 ===== */}
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

## 五、測試驗證

### 5.1 組件單元測試

**檔案：** `frontend/src/components/Prediction/PredictionPrompt.test.js`

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PredictionPrompt from './PredictionPrompt';

describe('PredictionPrompt 組件', () => {
  const defaultProps = {
    isOpen: true,
    onSubmit: jest.fn(),
    onSkip: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('渲染測試', () => {
    test('isOpen=true 時渲染組件', () => {
      render(<PredictionPrompt {...defaultProps} />);
      expect(screen.getByText('預測蓋牌顏色')).toBeInTheDocument();
    });

    test('isOpen=false 時不渲染組件', () => {
      render(<PredictionPrompt {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('預測蓋牌顏色')).not.toBeInTheDocument();
    });

    test('顯示四個顏色選項', () => {
      render(<PredictionPrompt {...defaultProps} />);
      expect(screen.getByText('紅色')).toBeInTheDocument();
      expect(screen.getByText('黃色')).toBeInTheDocument();
      expect(screen.getByText('綠色')).toBeInTheDocument();
      expect(screen.getByText('藍色')).toBeInTheDocument();
    });

    test('顯示規則提示', () => {
      render(<PredictionPrompt {...defaultProps} />);
      expect(screen.getByText(/預測正確 \+1 分/)).toBeInTheDocument();
    });
  });

  describe('互動測試', () => {
    test('點擊顏色按鈕選擇顏色', () => {
      render(<PredictionPrompt {...defaultProps} />);
      const redButton = screen.getByText('紅色').closest('button');

      fireEvent.click(redButton);

      expect(redButton).toHaveClass('selected');
      expect(screen.getByText(/已選擇/)).toBeInTheDocument();
    });

    test('再次點擊已選擇的顏色取消選擇', () => {
      render(<PredictionPrompt {...defaultProps} />);
      const redButton = screen.getByText('紅色').closest('button');

      fireEvent.click(redButton);
      fireEvent.click(redButton);

      expect(redButton).not.toHaveClass('selected');
    });

    test('未選擇顏色時確認按鈕禁用', () => {
      render(<PredictionPrompt {...defaultProps} />);
      const submitButton = screen.getByText('確認預測');

      expect(submitButton).toBeDisabled();
    });

    test('選擇顏色後確認按鈕啟用', () => {
      render(<PredictionPrompt {...defaultProps} />);
      const redButton = screen.getByText('紅色').closest('button');
      const submitButton = screen.getByText('確認預測');

      fireEvent.click(redButton);

      expect(submitButton).not.toBeDisabled();
    });

    test('點擊確認按鈕呼叫 onSubmit', () => {
      const onSubmit = jest.fn();
      render(<PredictionPrompt {...defaultProps} onSubmit={onSubmit} />);

      fireEvent.click(screen.getByText('紅色').closest('button'));
      fireEvent.click(screen.getByText('確認預測'));

      expect(onSubmit).toHaveBeenCalledWith('red');
    });

    test('點擊跳過按鈕呼叫 onSkip', () => {
      const onSkip = jest.fn();
      render(<PredictionPrompt {...defaultProps} onSkip={onSkip} />);

      fireEvent.click(screen.getByText('跳過預測'));

      expect(onSkip).toHaveBeenCalled();
    });
  });

  describe('載入狀態測試', () => {
    test('isLoading=true 時按鈕禁用', () => {
      render(<PredictionPrompt {...defaultProps} isLoading={true} />);

      expect(screen.getByText('處理中...')).toBeInTheDocument();
      // 確認按鈕顯示「處理中...」且禁用
    });

    test('isLoading=true 時顏色按鈕禁用', () => {
      render(<PredictionPrompt {...defaultProps} isLoading={true} />);
      const redButton = screen.getByText('紅色').closest('button');

      expect(redButton).toBeDisabled();
    });
  });
});
```

### 5.2 整合測試

**檔案：** `frontend/src/components/GameRoom/GameRoom.test.js`（新增測試案例）

```javascript
describe('GameRoom - 預測功能整合', () => {
  test('收到 enterPredictionPhase 後顯示預測介面', async () => {
    render(<GameRoom />);

    // 模擬 socket 事件
    act(() => {
      mockSocket.simulateEvent('enterPredictionPhase', {
        colors: ['red', 'yellow', 'green', 'blue'],
        message: '問牌完成！',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('預測蓋牌顏色')).toBeInTheDocument();
    });
  });

  test('提交預測後發送 submitPrediction 事件', async () => {
    render(<GameRoom />);

    // 顯示預測介面
    act(() => {
      mockSocket.simulateEvent('enterPredictionPhase', {});
    });

    await waitFor(() => {
      expect(screen.getByText('預測蓋牌顏色')).toBeInTheDocument();
    });

    // 選擇顏色並提交
    fireEvent.click(screen.getByText('紅色').closest('button'));
    fireEvent.click(screen.getByText('確認預測'));

    expect(mockSocket.emit).toHaveBeenCalledWith('submitPrediction', { color: 'red' });
  });
});
```

---

## 六、驗收標準

### 組件建立
- [ ] `frontend/src/components/Prediction/` 目錄存在
- [ ] `PredictionPrompt.js` 檔案存在且完整
- [ ] `PredictionPrompt.css` 檔案存在且完整
- [ ] `index.js` 匯出檔案存在

### GameRoom 整合
- [ ] import 語句正確
- [ ] 狀態定義正確
- [ ] Socket 監聽正確
- [ ] 處理函數正確
- [ ] 組件渲染正確

### 功能驗證
- [ ] 收到事件後顯示介面
- [ ] 可選擇顏色
- [ ] 可提交預測
- [ ] 可跳過預測
- [ ] 提交/跳過後介面關閉

### 樣式驗證
- [ ] 介面美觀
- [ ] 動畫流暢
- [ ] 響應式正常（手機版）

### 測試驗證
- [ ] 單元測試全部通過
- [ ] 整合測試全部通過

