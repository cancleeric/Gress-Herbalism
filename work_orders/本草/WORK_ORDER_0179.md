# 工作單 0179

**編號**：0179

**日期**：2026-01-27

**工作單標題**：後端 — 新增雙向互加自動接受測試

**工單主旨**：補充好友服務缺失的測試覆蓋，特別是雙向互加自動接受場景

---

## 內容

### 背景

`friendService.sendFriendRequest` 有一個重要的邏輯分支：當 A 對 B 發送好友請求，但 B 已經對 A 有一個 pending 的請求時，系統會自動接受雙方的請求並建立好友關係。此分支目前沒有測試覆蓋。

### 工作內容

#### 1. 新增雙向互加自動接受測試

在 `friendService.test.js` 中新增：

```javascript
describe('雙向互加自動接受', () => {
  test('B 已對 A 發送 pending 請求時，A 對 B 發送應自動接受', async () => {
    // Mock: 查詢反向請求時找到一筆 pending 記錄
    // 預期: 呼叫 acceptFriendRequest 並返回 { autoAccepted: true }
  });
});
```

#### 2. 驗證 autoAccepted 返回值

確認前端收到 `autoAccepted: true` 後能正確顯示提示並重新載入好友列表。

### 驗收標準

| 標準 | 說明 |
|------|------|
| 新增測試通過 | 雙向互加自動接受測試通過 |
| 既有測試通過 | 190/190 後端測試通過 |

---

**相關計畫書**：`docs/TEST_PLAN_FRIENDS_FEATURE.md`

**相關檔案**：
- `backend/__tests__/services/friendService.test.js`
- `backend/services/friendService.js`
