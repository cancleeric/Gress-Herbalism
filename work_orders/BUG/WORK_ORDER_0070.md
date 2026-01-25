# 工作單 0070

**日期：** 2026-01-25

**工作單標題：** 登入功能持續失敗 - 網域未授權

**工單主旨：** BUG 修復 - Cloud Run 部署網域未加入 Firebase 授權清單

**分類：** BUG

**相關工單：** 0062（已處理但問題未解決）

**狀態：** 已找到原因

---

## 問題描述

在處理完工單 0062（Firebase Auth 配置錯誤）後，登入功能仍然無法正常運作。

## 錯誤訊息

```
auth/unauthorized-domain
Firebase: Error (auth/unauthorized-domain)

The current domain is not authorized for OAuth operations.
This will prevent signInWithPopup, signInWithRedirect, linkWithPopup
and linkWithRedirect from working.
```

## 問題根因

**部署網域未加入 Firebase 授權清單**

需要授權的網域：
```
gress-frontend-130514813450.asia-east1.run.app
```

## 解決方案

### 步驟 1：進入 Firebase Console

1. 前往 [Firebase Console](https://console.firebase.google.com)
2. 選擇專案 `gress-game`

### 步驟 2：新增授權網域

1. 左側選單 → **Authentication**
2. 上方頁籤 → **Settings**
3. 找到 **Authorized domains** 區塊
4. 點擊 **Add domain**
5. 輸入：`gress-frontend-130514813450.asia-east1.run.app`
6. 點擊 **Add**

### 步驟 3：驗證

1. 重新整理部署網站
2. 嘗試 Google 登入
3. 嘗試訪客模式登入

## 注意事項

- 每次 Cloud Run 重新部署可能產生新的網域（如果沒有設定自訂網域）
- 建議設定自訂網域以避免重複此問題
- 本地開發的 `localhost` 應該已在預設授權清單中

## 驗收標準

- [ ] Firebase 授權網域已新增 Cloud Run 網域
- [ ] Google 登入功能正常
- [ ] 訪客模式登入功能正常
- [ ] 瀏覽器 Console 無 `auth/unauthorized-domain` 錯誤
