# 報告書 0183

## 工作單編號
0183

## 完成日期
2026-01-28

## 完成內容摘要

修復 Cloud Run 部署設定，解決 WebSocket 連線在遊戲中途斷線的問題。

### 修改檔案

#### `.git/hooks/pre-push`
- 後端部署指令新增 `--timeout=3600`：將請求超時從預設 5 分鐘延長至 1 小時，避免 WebSocket 長連線被 Cloud Run 自動切斷
- 新增 `--session-affinity`：啟用 Session 黏著性，確保同一客戶端的重連請求路由到同一實例
- 新增 `--min-instances=1`：保持至少 1 個實例運行，避免冷啟動導致斷線

## 遇到的問題與解決方案

### 問題：Cloud Run 預設 5 分鐘 WebSocket 超時
- **原因**：Cloud Run 預設請求超時為 300 秒（5 分鐘），WebSocket 連線會在 5 分鐘後被強制切斷
- **解決**：設定 `--timeout=3600` 延長至 1 小時

### 問題：重連路由到不同實例
- **原因**：Cloud Run 預設負載均衡會將請求分散到不同實例，重連時可能路由到沒有遊戲狀態的實例
- **解決**：啟用 `--session-affinity` 確保同一客戶端連到同一實例

## 測試結果
- pre-push hook 語法正確
- 需在下次推送時驗證 Cloud Run 部署參數生效

## 下一步計劃
- 推送至 GitHub 觸發部署，驗證 WebSocket 連線穩定性
