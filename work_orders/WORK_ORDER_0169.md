# 工作單 0169

**編號**：0169

**日期**：2026-01-27

**工作單標題**：完善 Google 登入錯誤處理

**工單主旨**：改善 Firebase Authentication 錯誤訊息和管理員提示

---

## 內容

### 背景

目前 `authService.js` 的 `ERROR_MESSAGES` 未包含 `auth/unauthorized-domain` 錯誤碼，當 Firebase Authorized domains 未正確設定時，使用者只會看到無意義的「登入失敗，請稍後再試」，無法判斷問題原因。

同時 `Login.js` 的管理員設定提示也不完整，未涵蓋此錯誤類型，且只提到 localhost 而未提及生產環境網域。

### 工作內容

#### 1. 修改 `frontend/src/firebase/authService.js`

在 `ERROR_MESSAGES` 物件中新增：

```javascript
'auth/unauthorized-domain': '此網域未被授權使用 Google 登入，請聯繫管理員在 Firebase Console 中新增授權網域',
```

#### 2. 修改 `frontend/src/components/Login/Login.js`

a. 更新 `isConfigurationError` 函數，加入 `auth/unauthorized-domain`：

```javascript
function isConfigurationError(errorCode) {
  return errorCode === 'auth/configuration-not-found' ||
         errorCode === 'auth/operation-not-allowed' ||
         errorCode === 'auth/unauthorized-domain';
}
```

b. 更新管理員設定步驟第 4 項，改為：

```
確認 Authorized domains 包含 localhost 和生產環境網域
```

#### 3. 測試

- 確保現有的 Login.test.js 和 authService 相關測試仍通過
- 如有需要，補充 `auth/unauthorized-domain` 錯誤處理的測試案例

### 驗收標準

| 標準 | 說明 |
|------|------|
| 錯誤碼覆蓋 | `ERROR_MESSAGES` 包含 `auth/unauthorized-domain` |
| 配置錯誤判定 | `isConfigurationError` 涵蓋 `auth/unauthorized-domain` |
| 管理員提示完整 | 提示步驟包含生產環境網域 |
| 既有測試通過 | 所有 Login 相關測試通過 |

---

**相關計畫書**：`docs/BUG_FIX_PLAN_GOOGLE_LOGIN.md`

**相關檔案**：
- `frontend/src/firebase/authService.js`
- `frontend/src/components/Login/Login.js`
