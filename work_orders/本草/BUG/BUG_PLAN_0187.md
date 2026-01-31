# BUG 修復計畫書 — 跟猜提示框無法滾動

## 問題描述
跟猜提示框（follow guess modal）在手機或小螢幕上，內容超過視窗高度時無法滾動，導致底部按鈕不可達。與工單 0182 猜牌結果面板（`.gr-modal`）完全相同的問題。

## 根本原因
`GameRoom.css` 第 618 行，`.fg-modal` 設定了 `overflow: hidden`，覆蓋了 `.modal-content` 的 `overflow-y: auto`，導致垂直方向無法滾動。

## 實施計畫

### 工單 0187：修復跟猜提示框滾動問題
- **修改檔案**：`frontend/src/components/GameRoom/GameRoom.css`
- **修改內容**：
  1. `.fg-modal`（第 618 行）：`overflow: hidden` → `overflow-x: hidden; overflow-y: auto;`
  2. 加入米色亮色系滾動軸樣式（與 `.gr-modal` 一致）
  3. 加入 WebKit 滾動軸偽元素樣式
- **參考**：工單 0182 對 `.gr-modal` 的相同修復
