# BUG 修復計畫書：Google 登入在雲端部署環境無法使用

**建立日期**：2026-01-27

**問題描述**：應用程式部署到 Google Cloud Run 後，使用者無法使用 Google 登入功能。

---

## 一、問題分析

### 調查範圍

| 檔案 | 說明 | 狀態 |
|------|------|------|
| `frontend/src/firebase/config.js` | Firebase 初始化設定 | 已檢查 |
| `frontend/src/firebase/authService.js` | Google 登入實作 | 已檢查 |
| `frontend/src/components/Login/Login.js` | 登入頁面組件 | 已檢查 |
| `frontend/.env.production` | 生產環境變數 | 已檢查 |
| `frontend/.env` | 開發環境變數 | 已檢查 |
| `frontend/Dockerfile` | Docker 建置設定 | 已檢查 |
| `frontend/.dockerignore` | Docker 排除清單 | 已檢查 |
| `frontend/.gcloudignore` | Cloud Build 排除清單 | 已檢查 |
| `deploy.sh` | 部署腳本 | 已檢查 |
| `frontend/nginx.conf` | Nginx 設定 | 已檢查 |

### 排除的原因

1. **環境變數未注入**：已排除。`.env.production` 未被 `.dockerignore` 或 `.gcloudignore` 排除，CRA 在 `npm run build` 時會自動讀取 `.env.production`，Firebase config 會正確嵌入到 JavaScript bundle 中。

2. **Dockerfile 問題**：已排除。`COPY . .` 會將 `.env.production` 複製進 builder stage，`npm run build` 可以正確讀取。

3. **Nginx 設定問題**：已排除。SPA routing 設定正確，靜態資源正常服務。

### 確認的問題

#### 問題 1：Firebase Authorized Domains 未設定（主要原因）

**嚴重程度：高**

Firebase Authentication 的 `signInWithPopup` 會開啟彈出視窗到 `gress-6270d.firebaseapp.com/__/auth/handler`，該 handler 會驗證請求來源網域是否在 Firebase Console 的 **Authorized domains** 清單中。

生產環境網域為 `herbalism-frontend-130514813450.asia-east1.run.app`，如果此網域未加入 Authorized domains，Google 登入會失敗並返回 `auth/unauthorized-domain` 錯誤。

**驗證方式**：前往 Firebase Console → Authentication → Settings → Authorized domains，檢查是否包含 `herbalism-frontend-130514813450.asia-east1.run.app`。

#### 問題 2：缺少 `auth/unauthorized-domain` 錯誤處理

**嚴重程度：中**

`authService.js` 的 `ERROR_MESSAGES` 未包含 `auth/unauthorized-domain` 錯誤碼，導致使用者看到無意義的「登入失敗，請稍後再試」，而非告知管理員需要設定授權網域。

#### 問題 3：Login.js 管理員提示不完整

**嚴重程度：低**

`Login.js` 的管理員設定步驟第 4 項只提到「確認 Authorized domains 包含 localhost」，未提及需要加入生產環境網域。且 `isConfigurationError` 函數未涵蓋 `auth/unauthorized-domain` 錯誤碼。

#### 問題 4：`signInWithPopup` 第三方 Cookie 相容性問題

**嚴重程度：中**

部分瀏覽器（特別是 Safari、以及啟用嚴格隱私模式的 Chrome）會阻擋第三方 Cookie。`signInWithPopup` 依賴 `gress-6270d.firebaseapp.com` 的跨域 Cookie，在這些瀏覽器上可能失敗。

Firebase 官方建議：當 `signInWithPopup` 失敗時，自動降級為 `signInWithRedirect` 作為備用方案。

---

## 二、實施計畫

### 工單 0168：Firebase Console 授權網域設定指南

**類型**：文件 + 驗證

建立操作指南文件，說明如何在 Firebase Console 中新增授權網域。這是手動操作，需要專案擁有者在 Firebase Console 執行。

**具體內容**：
- 建立 `docs/FIREBASE_AUTHORIZED_DOMAINS.md` 操作指南
- 列出需要加入的網域清單
- 提供 Firebase Console 操作步驟

### 工單 0169：完善 Google 登入錯誤處理

**類型**：程式修改

修改 `authService.js` 和 `Login.js`，改善錯誤處理和使用者提示。

**具體內容**：
1. 在 `authService.js` 的 `ERROR_MESSAGES` 新增 `auth/unauthorized-domain` 錯誤碼對應的中文訊息
2. 在 `Login.js` 的 `isConfigurationError` 函數加入 `auth/unauthorized-domain`
3. 更新管理員設定步驟，加入「確認 Authorized domains 包含生產環境網域」

### 工單 0170：Google 登入 Redirect 降級備案

**類型**：程式修改

為 `signInWithPopup` 加入 `signInWithRedirect` 降級機制，提升瀏覽器相容性。

**具體內容**：
1. 在 `authService.js` 中引入 `signInWithRedirect` 和 `getRedirectResult`
2. 修改 `signInWithGoogle`：先嘗試 `signInWithPopup`，若因 popup 被阻擋或第三方 Cookie 問題失敗，自動降級為 `signInWithRedirect`
3. 在 Firebase 初始化時處理 `getRedirectResult`，確保 redirect 回來後能正確取得登入結果

---

## 三、工單依賴關係

```
0168 (Firebase 授權網域指南) → 手動操作，無程式依賴
0169 (錯誤處理完善) → 獨立修改
0170 (Redirect 降級備案) → 獨立修改，但建議在 0169 之後
```

### 執行順序

1. **優先**：工單 0168 — 這是解決問題的根本原因，需要手動操作
2. **其次**：工單 0169 — 改善錯誤提示，即使問題再次發生也能給出有用資訊
3. **最後**：工單 0170 — 增加瀏覽器相容性，防止未來類似問題

---

## 四、預期成效

| 指標 | 修復前 | 修復後 |
|------|--------|--------|
| Cloud Run Google 登入 | 無法使用 | 正常運作 |
| 錯誤提示品質 | 「登入失敗，請稍後再試」 | 明確告知需設定授權網域 |
| 瀏覽器相容性 | 僅支援允許第三方 Cookie 的瀏覽器 | 支援 popup 和 redirect 兩種模式 |

---

*計畫書建立時間: 2026-01-27*
