# 工作單 0215

## 編號
0215

## 日期
2026-01-31

## 工作單標題
修改 ColorCard 元件使用圖片

## 工單主旨
UI 元件修改 - 顏色組合牌視覺升級

## 內容

### 任務描述
修改 `ColorCard.js` 元件，將現有的 emoji 圖示和顏色條紋替換為雙色卡片圖片。

### 具體工作項目

1. **修改 ColorCard.js**
   - 移除左上角和右下角的 emoji 圖示
   - 將卡牌中央區域的顏色條紋替換為圖片
   - 使用 `<img>` 標籤顯示對應的卡片圖片
   - 圖片路徑格式：`/images/cards/${card.id}.jpg`
   - 新增圖片載入錯誤處理（onError）

2. **修改 ColorCombinationCards.css**
   - 修改 `.card-illustration` 為圖片容器
   - 新增 `.card-image` 樣式（object-fit: cover）
   - 保留或調整選中、禁用狀態樣式
   - 調整響應式設計以適應圖片
   - 可移除不再使用的 `.color-icon` 和 `.color-stripe` 樣式

### 修改前程式碼參考

```jsx
// ColorCard.js 現有結構
<span className="color-icon top-left">{COLOR_ICONS[color1]}</span>
<div className="card-illustration">
  <div className={`color-stripe color-${color1}`} />
  <div className={`color-stripe color-${color2}`} />
</div>
<span className="color-icon bottom-right">{COLOR_ICONS[color2]}</span>
```

### 修改後程式碼參考

```jsx
// ColorCard.js 新結構
<div className="card-illustration">
  <img
    src={`/images/cards/${card.id}.jpg`}
    alt={card.name}
    className="card-image"
    onError={(e) => { e.target.style.display = 'none'; }}
  />
</div>
```

### 保留功能
- 卡牌名稱顯示（`.card-name`）
- 玩家標記功能（`.player-marker`）
- 禁用遮罩功能（`.disabled-overlay`）
- 選中狀態邊框

### 驗收標準

- [ ] ColorCard 元件使用圖片而非 emoji/條紋
- [ ] 六張卡片圖片正確對應顯示
- [ ] 選中狀態樣式正常
- [ ] 禁用狀態遮罩正常
- [ ] 玩家標記正常顯示
- [ ] 響應式設計正常

### 相關文件
- 計畫書：`docs/PLAN_COLOR_CARD_IMAGES.md`
- 依賴工單：0214（圖片資源）

### 相關檔案
- `frontend/src/components/ColorCombinationCards/ColorCard.js`
- `frontend/src/components/ColorCombinationCards/ColorCombinationCards.css`
