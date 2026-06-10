# Gress Herbalism — Secrets 管理

## Hurricane Vault 路徑清單

本專案所有機密設定統一儲存於 Hurricane Vault（開發環境）。

| Vault 路徑 | 對應 env var | 說明 |
|-----------|-------------|------|
| `hurricanedigital/dev/GRESS_FIREBASE_API_KEY` | `REACT_APP_FIREBASE_API_KEY` | Firebase Web API Key |
| `hurricanedigital/dev/GRESS_FIREBASE_AUTH_DOMAIN` | `REACT_APP_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `hurricanedigital/dev/GRESS_FIREBASE_PROJECT_ID` | `REACT_APP_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `hurricanedigital/dev/GRESS_FIREBASE_STORAGE_BUCKET` | `REACT_APP_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `hurricanedigital/dev/GRESS_FIREBASE_MESSAGING_SENDER_ID` | `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `hurricanedigital/dev/GRESS_FIREBASE_APP_ID` | `REACT_APP_FIREBASE_APP_ID` | Firebase App ID |

## 本機開發取用方式

前置條件：Hurricane Vault server 跑在 `http://localhost:8930`（由老闆 Mac 上的 Vault service 提供）。

```bash
# 安裝 hvault CLI（若未安裝）
ln -sf /Users/yinghaowang/HurricaneTech/hurricane-vault/cli/.venv/bin/hvault ~/.local/bin/hvault
export HVAULT_URL=http://localhost:8930

# 查詢單一 key
hvault get hurricanedigital/dev/GRESS_FIREBASE_API_KEY --reveal

# 用 hvault run 包住啟動指令（自動注入 env var）
hvault run --prefix "hurricanedigital/dev/GRESS_FIREBASE_" -- npm start
# 注意：prefix strip 後對應 REACT_APP_FIREBASE_* 需在 .env 保留非機密設定

# 或手動產生 .env.local（不 commit）
hvault get hurricanedigital/dev/GRESS_FIREBASE_API_KEY --reveal > /dev/null  # 先測可否讀取
```

實際上目前 `frontend/.env.production` 仍保有明文值（見下方遷移說明），本機開發可直接沿用。

## 生產環境注入方式

正式（Cloud Run）由 **HurricaneSoft Estella** 負責在部署鏈中注入：
- 來源：GCP Secret Manager（非 Hurricane Vault；Vault 只供開發用）
- 方式：Cloud Run 環境變數 or Secret Manager volume mount
- 不在 repo 內保存任何生產機密值

## Key Rotation 政策

- **Rotation 需老闆（Eric Wang）親自授權**，任何副手或員工不可自行 rotate
- Firebase API key rotation 影響所有已部署前端，rotation 前必須先協調 HurricaneSoft 部署鏈切換

## 目前遷移狀態（2026-06-10）

- [x] 全部 6 個 Firebase key 已落庫至 Hurricane Vault（`hurricanedigital/dev/`）
- [ ] `frontend/.env.production` 明文值尚未移除（等待部署鏈切換後執行）
- [ ] CI/CD 改由 GCP Secret Manager 注入（由 HurricaneSoft Estella 負責）

**第二步執行條件**：待 HurricaneSoft Estella 確認 Cloud Run 部署流程已改用 GCP Secret Manager 注入後，才移除 repo 內 `frontend/.env.production` 的明文值。
