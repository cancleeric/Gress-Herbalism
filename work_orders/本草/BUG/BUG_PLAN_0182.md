# BUG 修復計畫書 — 猜牌結果面板無法滾動

## 日期
2026-01-27

## 問題描述
猜對後的「局結束/猜牌結果面板」內容過長（包含：猜對標題、蓋牌揭示、分數變化、預測結算、目前分數、下一局按鈕），超出視窗高度時無法滾動，導致玩家無法按到「下一局」按鈕。

## 問題根因分析

### 涉及組件
此面板**不是** `GuessCard` 組件，而是 `GameRoom.js` 第 1750-1903 行直接渲染的猜牌結果面板（工單 0133/0172）。

### DOM 結構
```html
<div className="modal-overlay">
  <div className="modal-content gr-modal">   ← 同一元素同時有兩個 class
    <!-- 大量內容：標題、蓋牌、分數變化、預測結算、目前分數、按鈕 -->
  </div>
</div>
```

### CSS 衝突（根因）
同一元素上的兩個 CSS class 互相衝突：

| Class | 屬性 | 來源 |
|-------|------|------|
| `.modal-content` | `max-height: 90vh; overflow-y: auto;` | GameRoom.css:321-329 |
| `.gr-modal` | `overflow: hidden;` | GameRoom.css:2923 |

`.gr-modal` 的 `overflow: hidden` **覆蓋**了 `.modal-content` 的 `overflow-y: auto`，導致：
- 面板高度被 `max-height: 90vh` 限制
- 但超出的內容被 `overflow: hidden` 裁切掉
- 無法產生滾動條，「下一局」按鈕不可達

### `.gr-modal` 使用 `overflow: hidden` 的原因
- 配合 `border-radius: 12px` 裁切子元素的圓角溢出
- 紋理背景 `.gr-texture` 使用 `position: absolute`，需要限制溢出

## 修復方案

### 工單 0182：修復猜牌結果面板無法滾動

將 `.gr-modal` 的 `overflow: hidden` 改為 `overflow-x: hidden; overflow-y: auto;`：
- **保留水平裁切**：紋理背景和圓角效果不受影響
- **允許垂直滾動**：當內容超過 `max-height: 90vh` 時可上下滾動
- `max-height: 90vh` 已由 `.modal-content` 提供，不需額外設定

## 涉及檔案
| 檔案 | 修改類型 |
|------|---------|
| `frontend/src/components/GameRoom/GameRoom.css` | 修改 `.gr-modal` 的 overflow 屬性（第 2923 行） |

## 驗收標準
1. 猜對/猜錯結果面板內容超過視窗高度時可正常上下滾動
2. 「下一局」/「繼續觀戰遊戲」/「離開房間」按鈕可正常觸及和點擊
3. 面板圓角和紋理背景效果不受影響
4. 不影響其他 modal 的正常運作
