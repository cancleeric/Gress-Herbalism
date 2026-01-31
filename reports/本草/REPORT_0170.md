# 報告書 0170

**工作單編號**：0170

**完成日期**：2026-01-27

**工作單標題**：Google 登入 Redirect 降級備案

---

## 一、完成內容摘要

為 `signInWithPopup` 加入 `signInWithRedirect` 降級機制，提升瀏覽器相容性。當 popup 因被阻擋或被關閉而失敗時，自動降級為頁面跳轉方式登入。

### 修改內容

#### 1. `authService.js`

- 新增引入 `signInWithRedirect` 和 `getRedirectResult`
- 新增 `isPopupError()` 輔助函數，判斷是否為 popup 相關錯誤（`popup-blocked`、`popup-closed-by-user`、`cancelled-popup-request`）
- 修改 `signInWithGoogle()`：popup 失敗且為 popup 相關錯誤時，自動嘗試 `signInWithRedirect`
- 新增 `handleRedirectResult()` 函數：處理從 Google 登入頁面返回後的結果

#### 2. `AuthContext.js`

- 引入 `handleRedirectResult`
- 在 `useEffect` 中呼叫 `handleRedirectResult()`，處理頁面載入時的 redirect 結果

#### 3. `index.js`

- 導出 `handleRedirectResult`

#### 4. 測試更新

- `authService.test.js`：新增 7 個測試（3 個 redirect 降級 + 1 個降級失敗 + 3 個 handleRedirectResult）
- `AuthContext.test.js`：新增 `handleRedirectResult` mock 設定
- 移除原有的 `popup-closed-by-user` 直接返回錯誤測試（已改為降級行為）

---

## 二、遇到的問題與解決方案

| 問題 | 解決方案 |
|------|----------|
| 原有 `popup-closed-by-user` 測試與新降級邏輯衝突 | 移除舊測試，改為新的降級測試覆蓋相同場景 |

---

## 三、測試結果

```
Test Suites: 3 passed, 3 total
Tests:       51 passed, 51 total (全部通過)
  - authService.test.js: 30 tests (+7 新增, -1 移除)
  - AuthContext.test.js: 8 tests
  - Login.test.js: 13 tests
Time:        2.125s
```

---

## 四、修改的檔案

| 檔案 | 類型 | 說明 |
|------|------|------|
| `frontend/src/firebase/authService.js` | 修改 | 新增 redirect 降級邏輯和 handleRedirectResult |
| `frontend/src/firebase/AuthContext.js` | 修改 | 初始化時處理 redirect 結果 |
| `frontend/src/firebase/index.js` | 修改 | 導出 handleRedirectResult |
| `frontend/src/firebase/authService.test.js` | 修改 | 新增 redirect 降級和 handleRedirectResult 測試 |
| `frontend/src/firebase/AuthContext.test.js` | 修改 | 新增 handleRedirectResult mock |

---

## 五、驗收標準達成狀況

| 標準 | 達成 |
|------|------|
| 正常瀏覽器 popup 仍正常運作 | Y |
| popup 失敗時自動嘗試 redirect | Y |
| 頁面載入時處理 redirect 結果 | Y |
| 既有測試通過 | Y |
| 新增測試覆蓋降級邏輯 | Y |

---

## 六、下一步計劃

- 部署後在 Safari 和嚴格隱私模式下手動測試降級行為
- 三張 BUG 修復工單（0168-0170）全部完成

---

*報告完成時間: 2026-01-27*
