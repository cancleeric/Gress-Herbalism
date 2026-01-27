# 工作單 0175

**編號**：0175

**日期**：2026-01-27

**工作單標題**：前端 — Profile 頁面修正

**工單主旨**：修正 Profile 頁面的存取控制和錯誤處理

---

## 內容

### 背景

Profile 頁面目前有兩個問題：
1. 匿名玩家（訪客）可以進入 Profile 頁面，但看到的是空白統計
2. API 失敗時顯示的錯誤訊息不夠明確，無法區分「無資料」和「載入失敗」

### 工作內容

#### 1. 阻止匿名玩家進入 Profile

在 `Profile.js` 中檢查 `user.isAnonymous`，若為匿名玩家則顯示提示並導航回首頁：

```javascript
if (user?.isAnonymous) {
  // 顯示「請先使用 Google 帳號登入以查看個人資料」
  // 提供登入按鈕或自動導航回首頁
}
```

#### 2. 改善錯誤處理

- API 返回 `success: false` 時顯示具體錯誤
- 區分「載入中」、「載入失敗」、「無資料」三種狀態
- 提供「重新載入」按鈕

### 驗收標準

| 標準 | 說明 |
|------|------|
| 匿名玩家被阻止 | 訪客進入 Profile 看到提示訊息，不顯示空統計 |
| 錯誤訊息明確 | API 失敗時顯示「載入失敗」而非空白 |
| Google 登入正常 | Google 登入玩家正常查看 Profile |
| 既有前端測試通過 | Profile 相關測試通過 |

---

**相關計畫書**：`docs/TEST_PLAN_PROFILE_FRIENDS.md`

**相關檔案**：
- `frontend/src/components/Profile/Profile.js`
- `frontend/src/components/Profile/Profile.test.js`
