# 工作單 0062

**日期：** 2026-01-24

**工作單標題：** 修復 Firebase Auth 配置錯誤

**工單主旨：** BUG 修復 - 解決 Firebase Authentication 登入時出現 `auth/configuration-not-found` 錯誤

**內容：**

## 問題描述

使用者在登入頁面嘗試任何登入方式（Google 登入、訪客模式）時，都會出現以下錯誤：

```
Firebase: Error (auth/configuration-not-found).
```

## 錯誤截圖

登入頁面顯示紅色錯誤訊息：「Firebase: Error (auth/configuration-not-found).」

## 可能原因

1. **Firebase 環境變數未設定或設定錯誤**
   - `frontend/.env.local` 檔案不存在或內容不正確
   - 環境變數名稱不正確（應以 `REACT_APP_` 開頭）

2. **Firebase Console 設定問題**
   - Firebase 專案尚未建立
   - Authentication 服務未啟用
   - Google 登入 / 匿名登入提供者未啟用

3. **Firebase 專案 ID 不匹配**
   - 環境變數中的 `projectId` 與實際 Firebase 專案不符

4. **授權網域未設定**
   - `localhost` 或部署網域未加入 Firebase 授權網域清單

## 修復步驟

### 1. 檢查環境變數檔案

確認 `frontend/.env.local` 存在且包含正確的 Firebase 配置：

```bash
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 2. 檢查 Firebase Console 設定

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 確認專案存在
3. 進入 Authentication > Sign-in method
4. 確認以下提供者已啟用：
   - Google
   - 匿名（Anonymous）
5. 檢查 Settings > Authorized domains，確認包含：
   - `localhost`
   - 部署網域（如有）

### 3. 檢查 Firebase 配置程式碼

確認 `frontend/src/firebase/config.js` 正確讀取環境變數。

### 4. 重新啟動開發伺服器

環境變數變更後需重新啟動：

```bash
cd frontend
npm start
```

## 受影響檔案

- `frontend/.env.local`
- `frontend/src/firebase/config.js`
- `frontend/src/services/authService.js`（可能需要改進錯誤處理）

## 驗收標準

- [ ] Google 登入功能正常運作
- [ ] 訪客模式登入功能正常運作
- [ ] Email/密碼登入功能正常運作
- [ ] 錯誤訊息顯示友善的中文提示
- [ ] 開發環境和生產環境都能正常登入
