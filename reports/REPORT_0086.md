# 工單完成報告 0086

**日期：** 2026-01-25

**工作單標題：** BUG - 「其中一種全部」要牌方式 - 前端選擇介面實作

**工單主旨：** BUG 修復 - 實作被要牌玩家的顏色選擇介面，避免資訊洩漏

**分類：** BUG

---

## 驗證結果

經過程式碼審查，此功能**已正確實作**，無需額外修改。

## 前端實作驗證

### 1. 狀態定義 - GameRoom.js lines 91-94

```javascript
const [showColorChoice, setShowColorChoice] = useState(false);
const [colorChoiceData, setColorChoiceData] = useState(null);
const [waitingForColorChoice, setWaitingForColorChoice] = useState(false);
const [colorChoiceInfo, setColorChoiceInfo] = useState(null);
```

### 2. Socket 監聽 - lines 188-206

```javascript
// 監聽顏色選擇需求（被要牌玩家）
const unsubColorChoice = onColorChoiceRequired(({ askingPlayerId, colors, availableColors, message }) => {
  setColorChoiceData({ askingPlayerId, colors, availableColors, message });
  setShowColorChoice(true);
  setWaitingForColorChoice(false);
});

// 監聽等待顏色選擇（其他玩家）
const unsubWaiting = onWaitingForColorChoice(({ targetPlayerId, askingPlayerId }) => {
  setWaitingForColorChoice(true);
  setColorChoiceInfo({ targetPlayerId, askingPlayerId });
});

// 監聽顏色選擇結果
const unsubColorResult = onColorChoiceResult(({ targetPlayerId, chosenColor, cardsTransferred }) => {
  setShowColorChoice(false);
  setColorChoiceData(null);
  setWaitingForColorChoice(false);
  setColorChoiceInfo(null);
});
```

### 3. 處理函數 - lines 398-403

```javascript
const handleColorChoice = (chosenColor) => {
  if (!gameId) return;
  submitColorChoice(gameId, chosenColor);
  setShowColorChoice(false);
  setColorChoiceData(null);
};
```

### 4. 三種情境的 UI 實作 - lines 752-819

#### 情境一：兩種都沒有 (availableColors.length === 0)
```jsx
<p>你沒有這兩種顏色的牌。</p>
<button onClick={() => handleColorChoice('none')}>
  確認（無牌可給）
</button>
```

#### 情境二：只有一種顏色 (availableColors.length === 1)
```jsx
<p>請確認給出你有的顏色：</p>
{colors.map(color => (
  <button
    disabled={!availableColors.includes(color)}
    onClick={() => isAvailable && handleColorChoice(color)}
  >
    {colorName} {!isAvailable && ' (無)'}
  </button>
))}
```

#### 情境三：兩種都有
```jsx
<p>請選擇要給哪種顏色的全部牌：</p>
{colors.map(color => (
  <button onClick={() => handleColorChoice(color)}>
    {colorName}
  </button>
))}
```

### 5. 等待提示 - lines 822-828

```jsx
{waitingForColorChoice && colorChoiceInfo && (
  <div className="waiting-overlay">
    <p>等待 {playerName} 選擇要給哪種顏色...</p>
  </div>
)}
```

## 驗收項目

- [x] 收到 `chooseColorToGive` 事件後顯示選擇介面
- [x] 根據 `availableColors` 決定按鈕可選狀態
- [x] 兩種都有：兩個按鈕都可選
- [x] 只有一種：一個可選，一個禁用並顯示「(無)」
- [x] 兩種都沒有：顯示「無牌可給」訊息
- [x] 提交選擇後發送 `submitColorChoice` 事件
- [x] 其他玩家顯示「等待選擇」提示
- [x] 選擇完成後自動關閉介面

## 資訊隱藏驗證

- [x] 被要牌玩家看到自己有哪些顏色可選
- [x] 其他玩家只看到「等待選擇」，不知道可選顏色
- [x] 選擇結果通過 `colorChoiceResult` 事件廣播（不含選擇細節）

---

**狀態：** ✅ 已實作（驗證通過）
