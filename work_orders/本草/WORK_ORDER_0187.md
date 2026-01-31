# 工作單 0187

## 編號
0187

## 日期
2026-01-28

## 工作單標題
Bug 修復 — 跟猜提示框無法滾動

## 工單主旨
修復跟猜提示框（`.fg-modal`）的 `overflow: hidden` 導致無法垂直滾動的問題，參照工單 0182 的修復方式。

## 內容

### 問題描述
跟猜提示框在小螢幕或內容過多時無法滾動，底部的跟猜/不跟猜按鈕不可達。原因與工單 0182 相同：`.fg-modal` 的 `overflow: hidden` 覆蓋了 `.modal-content` 的 `overflow-y: auto`。

### 修改檔案

#### `frontend/src/components/GameRoom/GameRoom.css`
1. 第 618 行：`.fg-modal` 的 `overflow: hidden` 改為 `overflow-x: hidden; overflow-y: auto;`
2. 加入滾動軸樣式：`scrollbar-width: thin; scrollbar-color: #d4c9a8 #f5f1e6;`
3. 加入 `.fg-modal::-webkit-scrollbar` 等 WebKit 偽元素樣式（與 `.gr-modal` 一致）

### 驗收標準
1. 跟猜提示框在內容超出時可垂直滾動
2. 滾動軸為米色亮色系風格
3. 水平方向仍然裁切（保留裝飾效果）
4. 不影響跟猜功能正常運作
