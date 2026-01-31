# 工作單 0217

## 編號
0217

## 日期
2026-01-31

## 工作單標題
修復 GameRoom 問牌選擇使用圖片

## 工單主旨
BUG 修復 — 顏色組合牌圖片未生效

## 內容

### 問題描述

工單 0214-0216 修改了錯誤的元件（ColorCombinationCards），但實際遊戲中「問牌選擇」使用的是 GameRoom.js 中的 `playing-inquiry-card`。

### 具體工作項目

#### 1. 修改 GameRoom.js

**修改 colorCombinations 陣列（第 1320-1327 行）**

```javascript
// 修改前
const colorCombinations = [
  { id: 'red-yellow', colors: ['red', 'yellow'], icons: ['eco', 'energy_savings_leaf'] },
  { id: 'red-green', colors: ['red', 'green'], icons: ['eco', 'spa'] },
  { id: 'red-blue', colors: ['red', 'blue'], icons: ['eco', 'water_drop'] },
  { id: 'yellow-green', colors: ['yellow', 'green'], icons: ['energy_savings_leaf', 'spa'] },
  { id: 'yellow-blue', colors: ['yellow', 'blue'], icons: ['energy_savings_leaf', 'water_drop'] },
  { id: 'green-blue', colors: ['green', 'blue'], icons: ['spa', 'water_drop'] },
];

// 修改後（ID 對應圖片檔名）
const colorCombinations = [
  { id: 'yellow-red', colors: ['red', 'yellow'], name: '紅黃' },
  { id: 'red-green', colors: ['red', 'green'], name: '紅綠' },
  { id: 'red-blue', colors: ['red', 'blue'], name: '紅藍' },
  { id: 'green-yellow', colors: ['green', 'yellow'], name: '綠黃' },
  { id: 'yellow-blue', colors: ['yellow', 'blue'], name: '黃藍' },
  { id: 'green-blue', colors: ['green', 'blue'], name: '綠藍' },
];
```

**修改渲染邏輯（第 1452-1476 行）**

```jsx
// 修改前
<div className={`playing-inquiry-card-half color-${combo.colors[0]}`}>
  <span className="material-symbols-outlined">{combo.icons[0]}</span>
</div>
<div className={`playing-inquiry-card-half color-${combo.colors[1]}`}>
  <span className="material-symbols-outlined">{combo.icons[1]}</span>
</div>

// 修改後
<img
  src={`/images/cards/${combo.id}.jpg`}
  alt={combo.name}
  className="playing-inquiry-card-image"
  onError={(e) => { e.target.style.display = 'none'; }}
/>
```

#### 2. 修改 GameRoom.css

**新增圖片樣式**

```css
.playing-inquiry-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
```

**調整卡片尺寸**

根據需要調整 `.playing-inquiry-card` 的寬高比以適應圖片。

### 驗收標準

- [ ] 六張卡片顯示圖片而非顏色條紋
- [ ] 圖片正確對應顏色組合
- [ ] 禁用狀態遮罩正常顯示
- [ ] hover 效果正常
- [ ] 響應式設計正常

### 相關文件

- BUG 計畫書：`docs/PLAN_BUG_0217_WRONG_COMPONENT.md`
- 圖片目錄：`frontend/public/images/cards/`

### 相關檔案

- `frontend/src/components/GameRoom/GameRoom.js`
- `frontend/src/components/GameRoom/GameRoom.css`
