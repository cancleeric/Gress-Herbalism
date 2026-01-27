# 工作單 0170

**編號**：0170

**日期**：2026-01-27

**工作單標題**：Google 登入 Redirect 降級備案

**工單主旨**：為 `signInWithPopup` 加入 `signInWithRedirect` 降級機制

---

## 內容

### 背景

`signInWithPopup` 依賴跨域 Cookie（來自 `gress-6270d.firebaseapp.com`），在以下情況可能失敗：

- Safari 預設阻擋第三方 Cookie
- Chrome 啟用嚴格隱私模式
- 瀏覽器阻擋彈出視窗

Firebase 官方建議：當 `signInWithPopup` 失敗時，自動降級為 `signInWithRedirect`。`signInWithRedirect` 使用頁面跳轉而非彈出視窗，不受第三方 Cookie 限制。

### 工作內容

#### 1. 修改 `frontend/src/firebase/authService.js`

a. 新增引入：

```javascript
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  // ... 其他既有引入
} from 'firebase/auth';
```

b. 修改 `signInWithGoogle` 函數邏輯：

```
嘗試 signInWithPopup
  → 成功：返回使用者資料
  → 失敗：
    → 如果錯誤是 popup 相關（popup-blocked, popup-closed-by-user）或
       第三方 Cookie 相關（internal-error 且瀏覽器可能阻擋 Cookie）：
      → 嘗試 signInWithRedirect（頁面會跳轉，不會返回結果）
    → 其他錯誤：返回錯誤訊息
```

c. 新增 `handleRedirectResult` 函數：

```javascript
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return { success: true, user: { ... } };
    }
    return null; // 沒有 redirect 結果
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
```

#### 2. 修改 `frontend/src/firebase/index.js`（或 AuthContext）

在應用初始化時呼叫 `handleRedirectResult()`，處理從 Google 登入頁面返回的結果。

#### 3. 更新 `ERROR_MESSAGES`

新增提示訊息：

```javascript
'auth/popup-blocked': '登入視窗被瀏覽器阻擋，正在嘗試其他登入方式...',
```

（修改原有訊息，表明正在嘗試降級）

#### 4. 測試

- 確保既有測試通過
- 補充 redirect 降級邏輯的單元測試
- 手動測試：在 Safari 或阻擋 popup 的瀏覽器中驗證降級行為

### 驗收標準

| 標準 | 說明 |
|------|------|
| Popup 成功 | 正常瀏覽器中 signInWithPopup 仍正常運作 |
| 降級機制 | popup 失敗時自動嘗試 redirect |
| Redirect 結果處理 | 頁面載入時正確處理 redirect 返回結果 |
| 既有測試通過 | 所有登入相關測試通過 |
| 新增測試 | redirect 降級邏輯有對應測試 |

### 注意事項

- `signInWithRedirect` 會導致頁面跳轉，返回後需要透過 `getRedirectResult` 取得結果
- 需要確保 AuthContext 在初始化時處理 redirect result
- 降級不應影響正常的 popup 登入流程

---

**相關計畫書**：`docs/BUG_FIX_PLAN_GOOGLE_LOGIN.md`

**相關檔案**：
- `frontend/src/firebase/authService.js`
- `frontend/src/firebase/index.js`（或 AuthContext 相關檔案）
- `frontend/src/components/Login/Login.js`
