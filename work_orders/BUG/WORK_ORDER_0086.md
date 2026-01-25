# 工作單 0086

**日期：** 2026-01-25

**工作單標題：** BUG - 「其中一種全部」要牌方式 - 前端選擇介面實作

**工單主旨：** BUG 修復 - 實作被要牌玩家的顏色選擇介面，避免資訊洩漏

**分類：** BUG

**嚴重程度：** 高

**相關工單：** 0069, 0078, 0082

**依賴工單：** 0082（後端修復）

---

## 一、問題概述

### 1.1 關聯問題

工單 0082 修復了後端邏輯，確保無論被要牌玩家有幾種顏色都會進入選擇流程。本工單實作前端的選擇介面。

### 1.2 前端需求

當後端發送 `chooseColorToGive` 事件時，前端需要：

1. 顯示顏色選擇介面給被要牌玩家
2. 根據 `availableColors` 決定哪些按鈕可選
3. 當 `hasNoCards` 為 true 時顯示「無牌可給」
4. 提交選擇後發送 `submitColorChoice` 事件

---

## 二、介面設計

### 2.1 情境一：兩種顏色都有

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│            🎴 選擇要給的顏色                            │
│                                                         │
│        小明 向你要「紅色」或「藍色」的牌                 │
│               （其中一種全部）                          │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────┐             │
│  │                 │    │                 │             │
│  │      🔴         │    │      🔵         │             │
│  │     紅色        │    │     藍色        │             │
│  │    (3 張)       │    │    (2 張)       │             │
│  │                 │    │                 │             │
│  └─────────────────┘    └─────────────────┘             │
│                                                         │
│                    [確認選擇]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.2 情境二：只有一種顏色

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│            🎴 選擇要給的顏色                            │
│                                                         │
│        小明 向你要「紅色」或「藍色」的牌                 │
│               （其中一種全部）                          │
│                                                         │
│  ┌─────────────────┐    ┌─────────────────┐             │
│  │                 │    │   (不可選)      │             │
│  │      🔴         │    │      🔵         │             │
│  │     紅色        │    │     藍色        │             │
│  │    (3 張)       │    │    (沒有)       │             │
│  │   [可選]        │    │   [禁用]        │             │
│  │                 │    │                 │             │
│  └─────────────────┘    └─────────────────┘             │
│                                                         │
│                    [確認選擇]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2.3 情境三：兩種都沒有

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│            🎴 無牌可給                                  │
│                                                         │
│        小明 向你要「紅色」或「藍色」的牌                 │
│               （其中一種全部）                          │
│                                                         │
│           😔 你沒有這兩種顏色的牌                       │
│                                                         │
│                 [確認（無牌可給）]                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 三、組件實作

### 3.1 建立組件

**檔案：** `frontend/src/components/ColorChoice/ColorChoicePrompt.js`

```jsx
/**
 * 顏色選擇介面組件
 *
 * @file ColorChoicePrompt.js
 * @description 「其中一種全部」要牌方式時，被要牌玩家選擇要給哪種顏色
 *
 * @props {boolean} isOpen - 是否顯示介面
 * @props {string} askingPlayerName - 問牌玩家名稱
 * @props {string[]} colors - 問的兩種顏色
 * @props {string[]} availableColors - 可選的顏色（有牌的）
 * @props {boolean} hasNoCards - 是否兩種都沒有
 * @props {Object} cardCounts - 每種顏色的牌數（可選）
 * @props {function} onSubmit - 提交選擇的回調
 * @props {boolean} isLoading - 是否正在處理中
 */

import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import './ColorChoicePrompt.css';

// ==================== 常數定義 ====================

const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色',
};

const COLOR_ICONS = {
  red: '🔴',
  yellow: '🟡',
  green: '🟢',
  blue: '🔵',
};

// ==================== 組件實作 ====================

function ColorChoicePrompt({
  isOpen,
  askingPlayerName,
  colors = [],
  availableColors = [],
  hasNoCards = false,
  cardCounts = {},
  onSubmit,
  isLoading = false,
}) {
  // ========== 狀態 ==========
  const [selectedColor, setSelectedColor] = useState(null);

  // ========== 計算值 ==========

  /**
   * 檢查顏色是否可選
   */
  const isColorAvailable = useCallback((color) => {
    return availableColors.includes(color);
  }, [availableColors]);

  /**
   * 取得顏色的牌數
   */
  const getCardCount = useCallback((color) => {
    return cardCounts[color] || 0;
  }, [cardCounts]);

  /**
   * 格式化顏色列表文字
   */
  const colorsText = useMemo(() => {
    if (colors.length === 0) return '';
    return colors.map(c => `「${COLOR_NAMES[c]}」`).join('或');
  }, [colors]);

  // ========== 事件處理 ==========

  /**
   * 處理顏色選擇
   */
  const handleColorSelect = useCallback((color) => {
    if (isLoading || !isColorAvailable(color)) return;

    // 如果點擊已選擇的顏色，取消選擇
    if (selectedColor === color) {
      setSelectedColor(null);
    } else {
      setSelectedColor(color);
    }
  }, [selectedColor, isLoading, isColorAvailable]);

  /**
   * 處理提交選擇
   */
  const handleSubmit = useCallback(() => {
    if (isLoading) return;

    console.log('[ColorChoicePrompt] 提交選擇:', selectedColor);

    if (onSubmit) {
      // 如果沒有牌可給，傳 null
      onSubmit(hasNoCards ? null : selectedColor);
    }

    // 重置狀態
    setSelectedColor(null);
  }, [selectedColor, hasNoCards, isLoading, onSubmit]);

  // ========== 渲染 ==========

  if (!isOpen) return null;

  // 無牌可給的情況
  if (hasNoCards) {
    return (
      <div className="color-choice-overlay" role="dialog" aria-modal="true">
        <div className="color-choice-prompt no-cards">
          <div className="color-choice-header">
            <span className="choice-icon">🎴</span>
            <h3>無牌可給</h3>
          </div>

          <p className="asking-player-info">
            <strong>{askingPlayerName}</strong> 向你要{colorsText}的牌
            <br />
            <span className="question-type-hint">（其中一種全部）</span>
          </p>

          <div className="no-cards-message">
            <span className="sad-icon">😔</span>
            <p>你沒有這兩種顏色的牌</p>
          </div>

          <div className="color-choice-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? '處理中...' : '確認（無牌可給）'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 有牌可選的情況
  return (
    <div className="color-choice-overlay" role="dialog" aria-modal="true">
      <div className="color-choice-prompt">
        {/* 標題 */}
        <div className="color-choice-header">
          <span className="choice-icon">🎴</span>
          <h3>選擇要給的顏色</h3>
        </div>

        {/* 問牌玩家資訊 */}
        <p className="asking-player-info">
          <strong>{askingPlayerName}</strong> 向你要{colorsText}的牌
          <br />
          <span className="question-type-hint">（其中一種全部）</span>
        </p>

        {/* 顏色選項 */}
        <div className="color-options">
          {colors.map((color) => {
            const isAvailable = isColorAvailable(color);
            const count = getCardCount(color);
            const isSelected = selectedColor === color;

            return (
              <button
                key={color}
                type="button"
                className={`color-option-btn color-${color} ${
                  isSelected ? 'selected' : ''
                } ${!isAvailable ? 'unavailable' : ''}`}
                onClick={() => handleColorSelect(color)}
                disabled={isLoading || !isAvailable}
                aria-pressed={isSelected}
                aria-disabled={!isAvailable}
              >
                {/* 不可選標示 */}
                {!isAvailable && (
                  <div className="unavailable-overlay">
                    <span>沒有</span>
                  </div>
                )}

                {/* 顏色圖示 */}
                <span className="color-icon">{COLOR_ICONS[color]}</span>

                {/* 顏色名稱 */}
                <span className="color-name">{COLOR_NAMES[color]}</span>

                {/* 牌數 */}
                <span className="card-count">
                  {isAvailable ? `${count} 張` : '(沒有)'}
                </span>
              </button>
            );
          })}
        </div>

        {/* 已選擇提示 */}
        {selectedColor && (
          <p className="selected-hint">
            將給出所有
            <span className={`color-badge color-${selectedColor}`}>
              {COLOR_ICONS[selectedColor]} {COLOR_NAMES[selectedColor]}
            </span>
            （{getCardCount(selectedColor)} 張）
          </p>
        )}

        {/* 只有一種可選的提示 */}
        {availableColors.length === 1 && (
          <p className="one-option-hint">
            💡 你只有{COLOR_NAMES[availableColors[0]]}的牌，只能選擇這個顏色
          </p>
        )}

        {/* 確認按鈕 */}
        <div className="color-choice-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!selectedColor || isLoading}
          >
            {isLoading ? '處理中...' : '確認選擇'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== PropTypes ====================

ColorChoicePrompt.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  askingPlayerName: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
  availableColors: PropTypes.arrayOf(PropTypes.string),
  hasNoCards: PropTypes.bool,
  cardCounts: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

ColorChoicePrompt.defaultProps = {
  askingPlayerName: '',
  colors: [],
  availableColors: [],
  hasNoCards: false,
  cardCounts: {},
  isLoading: false,
};

export default ColorChoicePrompt;
```

### 3.2 建立樣式

**檔案：** `frontend/src/components/ColorChoice/ColorChoicePrompt.css`

```css
/**
 * 顏色選擇介面樣式
 */

/* ==================== 遮罩層 ==================== */
.color-choice-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ==================== 主容器 ==================== */
.color-choice-prompt {
  background: white;
  border-radius: 20px;
  padding: 28px;
  max-width: 450px;
  width: 90%;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ==================== 標題 ==================== */
.color-choice-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.color-choice-header h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #333;
}

.choice-icon {
  font-size: 28px;
}

/* ==================== 問牌玩家資訊 ==================== */
.asking-player-info {
  text-align: center;
  font-size: 15px;
  color: #555;
  margin: 0 0 24px 0;
  line-height: 1.6;
}

.asking-player-info strong {
  color: #333;
  font-weight: 600;
}

.question-type-hint {
  font-size: 13px;
  color: #888;
}

/* ==================== 顏色選項 ==================== */
.color-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.color-option-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 16px;
  border: 3px solid #ddd;
  border-radius: 16px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
}

.color-option-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.color-option-btn.selected {
  border-width: 4px;
}

.color-option-btn:disabled {
  cursor: not-allowed;
}

.color-option-btn.unavailable {
  opacity: 0.6;
  background: #f8f8f8;
}

/* 不可選覆蓋層 */
.unavailable-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #e74c3c;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

/* 顏色圖示 */
.color-option-btn .color-icon {
  font-size: 42px;
  margin-bottom: 10px;
  transition: transform 0.2s;
}

.color-option-btn:hover:not(:disabled) .color-icon {
  transform: scale(1.1);
}

.color-option-btn.selected .color-icon {
  animation: bounce 0.4s ease;
}

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* 顏色名稱 */
.color-option-btn .color-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

/* 牌數 */
.color-option-btn .card-count {
  font-size: 13px;
  color: #888;
}

.color-option-btn.unavailable .card-count {
  color: #bbb;
}

/* 顏色特定樣式 */
.color-option-btn.color-red.selected { border-color: #e74c3c; background: #fdecea; }
.color-option-btn.color-yellow.selected { border-color: #f1c40f; background: #fef9e7; }
.color-option-btn.color-green.selected { border-color: #27ae60; background: #e8f8f5; }
.color-option-btn.color-blue.selected { border-color: #3498db; background: #ebf5fb; }

/* ==================== 已選擇提示 ==================== */
.selected-hint {
  text-align: center;
  font-size: 14px;
  color: #333;
  margin: 0 0 16px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 10px;
  animation: fadeIn 0.3s ease;
}

.selected-hint .color-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  margin: 0 4px;
  font-weight: 600;
}

.color-badge.color-red { background: #fdecea; color: #c0392b; }
.color-badge.color-yellow { background: #fef9e7; color: #b7950b; }
.color-badge.color-green { background: #e8f8f5; color: #1e8449; }
.color-badge.color-blue { background: #ebf5fb; color: #2471a3; }

/* ==================== 只有一種可選提示 ==================== */
.one-option-hint {
  text-align: center;
  font-size: 13px;
  color: #e67e22;
  margin: 0 0 16px 0;
  padding: 10px;
  background: #fef5e7;
  border-radius: 8px;
}

/* ==================== 無牌可給 ==================== */
.color-choice-prompt.no-cards {
  text-align: center;
}

.no-cards-message {
  padding: 24px;
  margin: 16px 0;
  background: #f8f9fa;
  border-radius: 12px;
}

.no-cards-message .sad-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.no-cards-message p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

/* ==================== 確認按鈕 ==================== */
.color-choice-actions {
  display: flex;
  justify-content: center;
}

.color-choice-actions .btn {
  padding: 14px 40px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-choice-actions .btn-primary {
  background: #667eea;
  color: white;
}

.color-choice-actions .btn-primary:hover:not(:disabled) {
  background: #5a6fd6;
  transform: translateY(-2px);
}

.color-choice-actions .btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

/* ==================== 響應式 ==================== */
@media (max-width: 480px) {
  .color-choice-prompt {
    padding: 20px 16px;
    width: 95%;
  }

  .color-options {
    gap: 12px;
  }

  .color-option-btn {
    padding: 16px 12px;
  }

  .color-option-btn .color-icon {
    font-size: 36px;
  }
}
```

---

## 四、整合到 GameRoom

### 4.1 修改 GameRoom.js

**新增 import：**
```javascript
import ColorChoicePrompt from '../ColorChoice/ColorChoicePrompt';
```

**新增狀態：**
```javascript
// 顏色選擇相關狀態
const [showColorChoice, setShowColorChoice] = useState(false);
const [colorChoiceData, setColorChoiceData] = useState({
  askingPlayerName: '',
  colors: [],
  availableColors: [],
  hasNoCards: false,
  cardCounts: {},
});
const [colorChoiceLoading, setColorChoiceLoading] = useState(false);
```

**新增 Socket 監聽：**
```javascript
// 監聽顏色選擇（被要牌玩家收到）
socket.on('chooseColorToGive', (data) => {
  console.log('[GameRoom] 收到 chooseColorToGive:', data);

  // 計算每種顏色的牌數
  const cardCounts = {};
  data.colors.forEach(color => {
    cardCounts[color] = myHand.filter(c => c.color === color).length;
  });

  setColorChoiceData({
    askingPlayerName: data.askingPlayerName,
    colors: data.colors,
    availableColors: data.availableColors,
    hasNoCards: data.hasNoCards,
    cardCounts,
  });
  setShowColorChoice(true);
});

// 監聯選擇完成
socket.on('colorChoiceComplete', (data) => {
  console.log('[GameRoom] 顏色選擇完成:', data);
  setShowColorChoice(false);
});
```

**新增處理函數：**
```javascript
const handleColorChoiceSubmit = useCallback((chosenColor) => {
  if (!socket || colorChoiceLoading) return;

  console.log('[GameRoom] 提交顏色選擇:', chosenColor);
  setColorChoiceLoading(true);

  socket.emit('submitColorChoice', { chosenColor });

  setTimeout(() => {
    setShowColorChoice(false);
    setColorChoiceLoading(false);
  }, 500);
}, [socket, colorChoiceLoading]);
```

**渲染組件：**
```jsx
<ColorChoicePrompt
  isOpen={showColorChoice}
  askingPlayerName={colorChoiceData.askingPlayerName}
  colors={colorChoiceData.colors}
  availableColors={colorChoiceData.availableColors}
  hasNoCards={colorChoiceData.hasNoCards}
  cardCounts={colorChoiceData.cardCounts}
  onSubmit={handleColorChoiceSubmit}
  isLoading={colorChoiceLoading}
/>
```

---

## 五、測試案例

### 5.1 單元測試

```javascript
describe('ColorChoicePrompt 組件', () => {
  describe('兩種顏色都有', () => {
    test('顯示兩個可選按鈕', () => {
      render(
        <ColorChoicePrompt
          isOpen={true}
          colors={['red', 'blue']}
          availableColors={['red', 'blue']}
          cardCounts={{ red: 3, blue: 2 }}
          onSubmit={jest.fn()}
        />
      );
      expect(screen.getByText('紅色')).toBeInTheDocument();
      expect(screen.getByText('藍色')).toBeInTheDocument();
      expect(screen.getByText('3 張')).toBeInTheDocument();
      expect(screen.getByText('2 張')).toBeInTheDocument();
    });

    test('兩個按鈕都可點擊', () => {
      render(
        <ColorChoicePrompt
          isOpen={true}
          colors={['red', 'blue']}
          availableColors={['red', 'blue']}
          onSubmit={jest.fn()}
        />
      );
      const redBtn = screen.getByText('紅色').closest('button');
      const blueBtn = screen.getByText('藍色').closest('button');

      expect(redBtn).not.toBeDisabled();
      expect(blueBtn).not.toBeDisabled();
    });
  });

  describe('只有一種顏色', () => {
    test('只有一個按鈕可選', () => {
      render(
        <ColorChoicePrompt
          isOpen={true}
          colors={['red', 'blue']}
          availableColors={['red']}
          cardCounts={{ red: 3 }}
          onSubmit={jest.fn()}
        />
      );
      const redBtn = screen.getByText('紅色').closest('button');
      const blueBtn = screen.getByText('藍色').closest('button');

      expect(redBtn).not.toBeDisabled();
      expect(blueBtn).toBeDisabled();
    });

    test('顯示提示訊息', () => {
      render(
        <ColorChoicePrompt
          isOpen={true}
          colors={['red', 'blue']}
          availableColors={['red']}
          onSubmit={jest.fn()}
        />
      );
      expect(screen.getByText(/只能選擇這個顏色/)).toBeInTheDocument();
    });
  });

  describe('兩種都沒有', () => {
    test('顯示無牌可給介面', () => {
      render(
        <ColorChoicePrompt
          isOpen={true}
          colors={['red', 'blue']}
          availableColors={[]}
          hasNoCards={true}
          onSubmit={jest.fn()}
        />
      );
      expect(screen.getByText('無牌可給')).toBeInTheDocument();
      expect(screen.getByText(/你沒有這兩種顏色的牌/)).toBeInTheDocument();
    });

    test('點擊確認傳 null', () => {
      const onSubmit = jest.fn();
      render(
        <ColorChoicePrompt
          isOpen={true}
          colors={['red', 'blue']}
          availableColors={[]}
          hasNoCards={true}
          onSubmit={onSubmit}
        />
      );
      fireEvent.click(screen.getByText('確認（無牌可給）'));
      expect(onSubmit).toHaveBeenCalledWith(null);
    });
  });
});
```

---

## 六、驗收標準

### 組件建立
- [ ] `ColorChoicePrompt.js` 存在且完整
- [ ] `ColorChoicePrompt.css` 存在且完整
- [ ] 組件正確匯出

### 情境測試
- [ ] 兩種顏色都有：兩個按鈕都可選
- [ ] 只有一種顏色：只有一個按鈕可選，另一個禁用
- [ ] 兩種都沒有：顯示「無牌可給」介面

### 資訊隱藏驗證
- [ ] 其他玩家只看到「正在選擇中」
- [ ] 不會洩漏被要牌玩家有哪些顏色

### 介面驗證
- [ ] 顯示問牌玩家名稱
- [ ] 顯示問的兩種顏色
- [ ] 顯示每種顏色的牌數
- [ ] 選擇後顯示確認訊息

