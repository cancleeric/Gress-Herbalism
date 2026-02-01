# 工單 0367：E2E 測試框架設置

## 基本資訊
- **工單編號**：0367
- **所屬計畫**：P2-D 品質保證
- **前置工單**：0348
- **預計影響檔案**：
  - `cypress.config.js`
  - `tests/e2e/support/*.js`
  - `tests/e2e/fixtures/*.json`

## 目標
設置 Cypress E2E 測試框架

## 詳細規格
- Cypress 配置
- 自訂命令（登入、建立遊戲等）
- 測試資料夾結構
- Mock Socket.io
- CI 整合

## 驗收標準
1. [ ] Cypress 可正常執行
2. [ ] 自訂命令可用
3. [ ] CI 可執行測試
