# 工作單 0183

## 編號
0183

## 日期
2026-01-28

## 工作單標題
Bug 修復 — Cloud Run 部署缺少 WebSocket 關鍵設定

## 工單主旨
修改部署腳本，為 Cloud Run 後端加入 timeout、session-affinity、min-instances 設定。

## 內容

### 問題描述
Cloud Run 預設 WebSocket 超時 5 分鐘，遊戲超過 5 分鐘必定斷線。且無 session affinity，重連可能被路由到不同實例（無此遊戲狀態）。

### 修改檔案

#### `.git/hooks/pre-push`
後端部署命令加入：
- `--timeout=3600`（WebSocket 超時 1 小時）
- `--session-affinity`（同一用戶連同一實例）
- `--min-instances=1`（保持至少一個實例避免冷啟動）

### 驗收標準
1. 部署腳本包含三個新參數
2. 推送後 Cloud Run 後端正確套用設定
