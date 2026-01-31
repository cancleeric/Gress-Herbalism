# 報告書 0169

**工作單編號**：0169

**完成日期**：2026-01-27

**工作單標題**：完善 Google 登入錯誤處理

---

## 一、完成內容摘要

修改 `authService.js` 和 `Login.js`，新增 `auth/unauthorized-domain` 錯誤處理，改善使用者和管理員的錯誤提示。

### 修改內容

1. **`authService.js`**：在 `ERROR_MESSAGES` 新增 `auth/unauthorized-domain` 錯誤碼，對應中文訊息「此網域未被授權使用 Google 登入，請聯繫管理員在 Firebase Console 中新增授權網域」

2. **`Login.js`**：
   - `isConfigurationError` 函數加入 `auth/unauthorized-domain` 判定
   - 管理員設定步驟第 4 項改為「確認 Authorized domains 包含 localhost 和生產環境網域」

---

## 二、遇到的問題與解決方案

無問題，修改範圍明確。

---

## 三、測試結果

```
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total (全部通過)
Time:        2.069s
```

---

## 四、修改的檔案

| 檔案 | 類型 | 說明 |
|------|------|------|
| `frontend/src/firebase/authService.js` | 修改 | 新增 `auth/unauthorized-domain` 錯誤碼 |
| `frontend/src/components/Login/Login.js` | 修改 | 更新錯誤判定和管理員提示 |

---

## 五、下一步計劃

- 工單 0170：Google 登入 Redirect 降級備案

---

*報告完成時間: 2026-01-27*
