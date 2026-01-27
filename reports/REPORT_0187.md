# 報告書 0187

## 工作單編號
0187

## 完成日期
2026-01-28

## 完成內容摘要

修復跟猜提示框（`.fg-modal`）無法垂直滾動的問題，參照工單 0182 的修復方式。

### 修改檔案

#### `frontend/src/components/GameRoom/GameRoom.css`
- 第 618 行：`.fg-modal` 的 `overflow: hidden` 改為 `overflow-x: hidden; overflow-y: auto;`
- 加入滾動軸樣式：`scrollbar-width: thin; scrollbar-color: #d4c9a8 #f5f1e6;`
- 新增 `.fg-modal::-webkit-scrollbar` 等 WebKit 偽元素樣式（Chrome/Edge 滾動軸為米色亮色系）

## 遇到的問題與解決方案

### 問題：跟猜提示框無法滾動
- **原因**：與工單 0182 完全相同 — `.fg-modal` 的 `overflow: hidden` 覆蓋了 `.modal-content` 的 `overflow-y: auto`
- **解決**：拆分為 `overflow-x: hidden`（保留水平裁切）和 `overflow-y: auto`（允許垂直滾動）

## 測試結果
- 前端編譯成功（webpack compiled with 1 warning，為既有的 Profile.js useEffect 依賴項問題）

## 下一步計劃
- 無額外工作需求
