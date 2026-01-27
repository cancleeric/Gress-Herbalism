# 工作單 0182

## 編號
0182

## 日期
2026-01-27

## 工作單標題
Bug 修復 — 猜牌結果面板無法滾動，下一局按鈕不可達

## 工單主旨
修復猜牌結果面板（局結束面板）因 CSS `overflow` 衝突導致內容超長時無法滾動的問題。

## 內容

### 問題描述
GameRoom.js 第 1750-1903 行的猜牌結果面板（`.modal-content.gr-modal`），當內容超過視窗 90vh 時無法滾動。
根因：`.gr-modal` 的 `overflow: hidden`（GameRoom.css:2923）覆蓋了 `.modal-content` 的 `overflow-y: auto`（GameRoom.css:328）。

### 修改檔案

#### `frontend/src/components/GameRoom/GameRoom.css`
- 第 2923 行：`.gr-modal` 的 `overflow: hidden` 改為 `overflow-x: hidden; overflow-y: auto;`
- 保留水平裁切（紋理背景和圓角），允許垂直滾動

### 驗收標準
1. 猜對/猜錯結果面板超出視窗時可正常上下滾動
2. 「下一局」/「繼續觀戰遊戲」/「離開房間」按鈕可正常觸及和點擊
3. 面板圓角和紋理背景效果不受影響
4. 不影響其他 modal 的正常運作
