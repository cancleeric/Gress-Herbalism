# BUG 修復計畫書 — 顏色組合牌圖片未生效

## 一、問題描述

**BUG 編號**：BUG-0217
**建立日期**：2026-01-31
**嚴重程度**：中等（UI 修改未生效）

### 1.1 問題現象

用戶要求將「問牌選擇」的六張顏色組合按鈕替換為雙色卡片圖片，但修改後畫面仍顯示舊的顏色條紋 + Material Icons 設計。

### 1.2 預期行為

六張顏色組合牌應顯示用戶提供的中藥材主題圖片。

### 1.3 實際行為

畫面仍顯示兩色條紋加上 Material Icons（eco、spa、water_drop 等）。

## 二、問題分析

### 2.1 根本原因

**修改了錯誤的元件！**

| 項目 | 錯誤的修改位置 | 正確的修改位置 |
|------|---------------|---------------|
| 元件 | `ColorCombinationCards/ColorCard.js` | `GameRoom/GameRoom.js` |
| CSS | `ColorCombinationCards/ColorCombinationCards.css` | `GameRoom/GameRoom.css` |
| 類別 | `.color-card` | `.playing-inquiry-card` |

### 2.2 詳細分析

1. **ColorCombinationCards 元件**
   - 這是一個獨立的元件，可能用於其他地方
   - 工單 0214-0216 的修改對此元件有效
   - 但遊戲進行中的「問牌選擇」並未使用此元件

2. **GameRoom.js 中的實作**
   - 遊戲進行中的 UI 在 `GameRoom.js` 第 1446-1477 行
   - 使用 `playing-inquiry-card` 類別
   - 有自己的 `colorCombinations` 陣列定義（第 1320-1327 行）
   - 使用 Material Icons 而非圖片

### 2.3 GameRoom.js 中的現有實作

```javascript
// 第 1320-1327 行
const colorCombinations = [
  { id: 'red-yellow', colors: ['red', 'yellow'], icons: ['eco', 'energy_savings_leaf'] },
  { id: 'red-green', colors: ['red', 'green'], icons: ['eco', 'spa'] },
  { id: 'red-blue', colors: ['red', 'blue'], icons: ['eco', 'water_drop'] },
  { id: 'yellow-green', colors: ['yellow', 'green'], icons: ['energy_savings_leaf', 'spa'] },
  { id: 'yellow-blue', colors: ['yellow', 'blue'], icons: ['energy_savings_leaf', 'water_drop'] },
  { id: 'green-blue', colors: ['green', 'blue'], icons: ['spa', 'water_drop'] },
];

// 第 1452-1476 行：渲染邏輯
<div className={`playing-inquiry-card ...`}>
  <div className={`playing-inquiry-card-half color-${combo.colors[0]}`}>
    <span className="material-symbols-outlined">{combo.icons[0]}</span>
  </div>
  <div className={`playing-inquiry-card-half color-${combo.colors[1]}`}>
    <span className="material-symbols-outlined">{combo.icons[1]}</span>
  </div>
</div>
```

### 2.4 圖片與卡牌 ID 對應關係

注意：GameRoom.js 的 ID 命名與 constants.js 不同！

| GameRoom.js ID | constants.js ID | 圖片檔名 |
|----------------|-----------------|---------|
| red-yellow | yellow-red | yellow-red.jpg |
| red-green | red-green | red-green.jpg |
| red-blue | red-blue | red-blue.jpg |
| yellow-green | green-yellow | green-yellow.jpg |
| yellow-blue | yellow-blue | yellow-blue.jpg |
| green-blue | green-blue | green-blue.jpg |

## 三、修復計畫

### 3.1 步驟一：統一卡牌 ID

修改 `GameRoom.js` 中的 `colorCombinations` 陣列，使 ID 與圖片檔名一致。

### 3.2 步驟二：修改渲染邏輯

將 `playing-inquiry-card` 的渲染改為使用圖片：

```jsx
// 修改後
<div className={`playing-inquiry-card ...`}>
  <img
    src={`/images/cards/${combo.id}.jpg`}
    alt={combo.name}
    className="playing-inquiry-card-image"
  />
  {/* 保留禁用遮罩 */}
</div>
```

### 3.3 步驟三：修改 CSS 樣式

更新 `GameRoom.css`：
- 移除或保留 `.playing-inquiry-card-half` 樣式
- 新增 `.playing-inquiry-card-image` 樣式
- 調整卡片尺寸以適應圖片

### 3.4 步驟四：測試驗證

確認六張卡片圖片正確顯示。

## 四、工單規劃

| 工單編號 | 標題 |
|---------|------|
| 0217 | 修復 GameRoom 問牌選擇使用圖片 |

## 五、影響範圍

- `frontend/src/components/GameRoom/GameRoom.js`
- `frontend/src/components/GameRoom/GameRoom.css`
- 可能需要更新測試檔案

## 六、風險評估

| 風險 | 等級 | 緩解措施 |
|------|------|---------|
| 圖片比例問題 | 低 | 使用 object-fit: cover |
| 響應式問題 | 低 | 調整媒體查詢 |
