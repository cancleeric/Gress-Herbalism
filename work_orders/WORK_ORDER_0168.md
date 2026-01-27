# 工作單 0168

**編號**：0168

**日期**：2026-01-27

**工作單標題**：Firebase Console 授權網域設定指南

**工單主旨**：建立 Firebase Authorized Domains 操作指南文件

---

## 內容

### 背景

應用程式部署到 Google Cloud Run 後，Google 登入功能無法使用。根本原因是 Firebase Authentication 的 Authorized domains 清單中未包含生產環境網域 `herbalism-frontend-130514813450.asia-east1.run.app`。

Firebase 的 `signInWithPopup` 會驗證請求來源網域是否在授權清單中，未授權的網域會收到 `auth/unauthorized-domain` 錯誤。

### 工作內容

1. **建立操作指南文件** `docs/FIREBASE_AUTHORIZED_DOMAINS.md`，內容包含：
   - 問題說明：為什麼需要設定授權網域
   - 需要加入的網域清單：
     - `herbalism-frontend-130514813450.asia-east1.run.app`（生產前端）
     - `localhost`（本地開發）
     - `gress-6270d.firebaseapp.com`（Firebase 預設，通常已存在）
   - Firebase Console 操作步驟（含路徑）：
     1. 前往 https://console.firebase.google.com
     2. 選擇專案 `gress-6270d`
     3. 左側選單 → Authentication → Settings
     4. 找到 Authorized domains 區塊
     5. 點擊 Add domain
     6. 輸入網域並儲存
   - 驗證方式：設定後重新嘗試 Google 登入

2. **更新 `deploy.sh`** 在部署完成後的輸出中加入提醒：提示檢查 Firebase Authorized domains 是否已設定

### 驗收標準

| 標準 | 說明 |
|------|------|
| 操作指南文件完整 | `docs/FIREBASE_AUTHORIZED_DOMAINS.md` 包含完整操作步驟 |
| deploy.sh 包含提醒 | 部署腳本輸出包含 Firebase 授權網域檢查提醒 |

---

**相關計畫書**：`docs/BUG_FIX_PLAN_GOOGLE_LOGIN.md`
