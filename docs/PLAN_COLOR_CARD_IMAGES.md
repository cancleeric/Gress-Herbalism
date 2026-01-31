# 顏色組合牌圖片替換計畫書

## 一、計畫概述

**計畫名稱**：顏色組合牌樣式替換為雙色卡片圖片
**建立日期**：2026-01-31
**計畫編號**：PLAN-UI-001

### 1.1 背景說明

目前遊戲中的六張顏色組合牌（用於問牌時選擇兩種顏色）使用的是 emoji 圖示（🔴、🟡、🟢、🔵）和純色條紋作為視覺呈現。用戶希望將這些按鈕替換為精美的雙色卡片圖片，以提升遊戲的視覺體驗。

### 1.2 目標

將桌上六個顏色組合按鈕的樣式從 emoji + 條紋替換為用戶提供的雙色卡片圖片。

## 二、現況分析

### 2.1 現有元件結構

| 檔案路徑 | 說明 |
|---------|------|
| `frontend/src/components/ColorCombinationCards/ColorCard.js` | 單張顏色組合牌元件 |
| `frontend/src/components/ColorCombinationCards/ColorCombinationCards.css` | 樣式檔案 |
| `shared/constants.js` | 六張牌的定義 |

### 2.2 現有六張牌定義

```javascript
COLOR_COMBINATION_CARDS = [
  { id: 'red-green', colors: ['red', 'green'], name: '紅綠' },
  { id: 'green-blue', colors: ['green', 'blue'], name: '綠藍' },
  { id: 'green-yellow', colors: ['green', 'yellow'], name: '綠黃' },
  { id: 'red-blue', colors: ['red', 'blue'], name: '紅藍' },
  { id: 'yellow-red', colors: ['yellow', 'red'], name: '黃紅' },
  { id: 'yellow-blue', colors: ['yellow', 'blue'], name: '黃藍' },
]
```

### 2.3 用戶提供的圖片

| 圖片檔名 | 對應卡牌 ID | 說明 |
|---------|------------|------|
| 紅綠.jpg | red-green | 紅棗 + 綠色葉子 |
| 綠藍.jpg | green-blue | 綠茶碗 + 綠葉（藍色圖騰） |
| 黃綠.jpg | green-yellow | 綠色草藥 + 黃色花/粉末 |
| 紅藍.jpg | red-blue | 紅色枸杞 + 棕色湯碗（藍色圖騰） |
| 紅黃.jpg | yellow-red | 紅色辣椒 + 黃色洋蔥/南瓜 |
| 黃藍.jpg | yellow-blue | 黃色藥材片 + 黃色液體（藍色圖騰） |

## 三、實施計畫

### 3.1 步驟一：建立圖片資源目錄

1. 在 `frontend/public/` 下建立 `images/cards/` 目錄
2. 將用戶提供的六張圖片複製到該目錄
3. 重新命名圖片以符合程式命名規範：
   - `紅綠.jpg` → `red-green.jpg`
   - `綠藍.jpg` → `green-blue.jpg`
   - `黃綠.jpg` → `green-yellow.jpg`
   - `紅藍.jpg` → `red-blue.jpg`
   - `紅黃.jpg` → `yellow-red.jpg`
   - `黃藍.jpg` → `yellow-blue.jpg`

### 3.2 步驟二：修改 ColorCard.js 元件

1. 移除 emoji 圖示元素
2. 移除顏色條紋元素
3. 將卡牌中央區域改為顯示對應的卡片圖片
4. 保留卡牌名稱顯示
5. 保留玩家標記功能
6. 保留禁用遮罩功能

### 3.3 步驟三：修改 CSS 樣式

1. 移除 `.color-icon` 相關樣式（或保留備用）
2. 移除 `.color-stripe` 相關樣式
3. 修改 `.card-illustration` 為圖片容器樣式
4. 新增圖片樣式（object-fit、圓角等）
5. 調整響應式設計以適應圖片

### 3.4 步驟四：測試驗證

1. 確認六張卡片圖片正確顯示
2. 確認選中狀態樣式正確
3. 確認禁用狀態遮罩正確
4. 確認玩家標記正確顯示
5. 確認響應式設計在不同螢幕尺寸下正常

## 四、技術細節

### 4.1 圖片路徑規劃

```
frontend/
├── public/
│   ├── images/
│   │   └── cards/
│   │       ├── red-green.jpg
│   │       ├── green-blue.jpg
│   │       ├── green-yellow.jpg
│   │       ├── red-blue.jpg
│   │       ├── yellow-red.jpg
│   │       └── yellow-blue.jpg
│   └── index.html
```

### 4.2 圖片引用方式

由於圖片放在 `public/` 目錄下，在 React 中可直接使用絕對路徑引用：

```javascript
const imagePath = `/images/cards/${card.id}.jpg`;
```

### 4.3 元件修改重點

```jsx
// 修改前
<div className="card-illustration">
  <div className={`color-stripe color-${color1}`} />
  <div className={`color-stripe color-${color2}`} />
</div>

// 修改後
<div className="card-illustration">
  <img
    src={`/images/cards/${card.id}.jpg`}
    alt={card.name}
    className="card-image"
  />
</div>
```

## 五、風險評估

| 風險項目 | 風險等級 | 緩解措施 |
|---------|---------|---------|
| 圖片載入失敗 | 低 | 新增 onError 處理，顯示替代內容 |
| 圖片尺寸不一致 | 低 | 使用 object-fit: cover 統一處理 |
| 響應式問題 | 低 | 測試各種螢幕尺寸 |

## 六、工單規劃

根據本計畫，將建立以下工單：

| 工單編號 | 標題 | 說明 |
|---------|------|------|
| 0214 | 建立圖片資源目錄並放置卡片圖片 | 步驟一 |
| 0215 | 修改 ColorCard 元件使用圖片 | 步驟二、三 |
| 0216 | 測試驗證顏色組合牌圖片功能 | 步驟四 |

## 七、預期成果

完成後，遊戲中的顏色組合牌將從簡單的 emoji + 條紋樣式，升級為精美的中藥材主題雙色卡片圖片，提升整體遊戲的視覺品質和使用者體驗。
