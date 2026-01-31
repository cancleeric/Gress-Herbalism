# 完成報告 0051

**日期：** 2026-01-24

**工作單標題：** 修復「給一張要全部」要牌方式的顏色選擇權 Bug

**工單主旨：** Bug 修復 - 要牌方應有權選擇給哪種顏色的一張

## 完成內容

### 1. 問題描述

當使用問牌類型 3（給其中一種顏色一張，要另一種顏色全部）時，如果要牌方（問牌的人）兩種顏色都有，應該可以自己選擇要給對方哪種顏色的一張。

之前的實作是自動使用第一個選擇的顏色作為給牌顏色，沒有提供選擇介面。

### 2. 解決方案

#### 新增 GiveColorSelector 組件

在 `QuestionCard.js` 中新增給牌顏色選擇器組件：

```jsx
function GiveColorSelector({ colors, selectedGiveColor, onSelect }) {
  return (
    <div className="give-color-selector">
      <h4>選擇要給哪種顏色的一張</h4>
      <p>你兩種顏色都有，請選擇要給對方哪種顏色的一張牌</p>
      <div className="give-color-options">
        {colors.map((color) => (
          <button onClick={() => onSelect(color)}>
            給 {color} 一張
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### 新增輔助函數

```javascript
// 檢查要牌方擁有哪些選定顏色的牌
const getOwnedColorsFromSelection = () => { ... }

// 檢查是否需要讓要牌方選擇給哪種顏色
const needsGiveColorChoice = () => {
  if (selectedType !== QUESTION_TYPE_GIVE_ONE_GET_ALL) return false;
  const ownedColors = getOwnedColorsFromSelection();
  return ownedColors.length === 2; // 兩種顏色都有，需要選擇
}

// 取得實際的給牌顏色
const getEffectiveGiveColor = () => {
  if (selectedType !== QUESTION_TYPE_GIVE_ONE_GET_ALL) return null;
  const ownedColors = getOwnedColorsFromSelection();
  if (ownedColors.length === 1) {
    return ownedColors[0]; // 只有一種，自動選擇
  }
  return selectedGiveColor; // 兩種都有，使用選擇的
}
```

#### 更新 GameRoom.js

```javascript
const action = {
  // ...
  giveColor: questionData.giveColor || questionData.colors[0],
  getColor: questionData.getColor || questionData.colors[1]
};
```

### 3. 流程說明

1. 玩家選兩種顏色 A 和 B
2. 選擇目標玩家
3. 選擇問牌類型 3（給一張要全部）
4. **如果玩家兩種顏色都有**：顯示選擇介面讓玩家選擇給哪種顏色的一張
5. **如果玩家只有一種顏色**：自動使用有的那種顏色
6. 提交問牌動作

### 4. CSS 樣式

新增 `.give-color-selector` 相關樣式：
- 高亮顯示的選擇區域
- 清楚的選項按鈕
- 選擇結果預覽

## 驗收結果

- [x] 要牌方兩種顏色都有時，顯示選擇介面
- [x] 要牌方可以選擇要給哪種顏色的一張
- [x] 被要牌方自動給「另一種顏色」的全部（無需選擇）
- [x] 只有一種顏色時，系統自動處理
- [x] 顏色/類型改變時正確重置選擇

## 修改的檔案

1. `frontend/src/components/QuestionCard/QuestionCard.js` - 新增 GiveColorSelector 組件和相關邏輯
2. `frontend/src/components/QuestionCard/QuestionCard.css` - 新增樣式
3. `frontend/src/components/GameRoom/GameRoom.js` - 更新 action 使用 questionData 的 giveColor

## 備註

此修改遵循遊戲規則：
- **類型 2**（其中一種顏色全部）：**被要牌方**選擇給哪種顏色的全部
- **類型 3**（給一張要全部）：**要牌方**選擇給哪種顏色的一張，被要牌方自動給另一種的全部
