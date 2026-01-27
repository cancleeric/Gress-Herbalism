# 報告書 0158

**工作單編號**：0158

**完成日期**：2026-01-27

**工作單標題**：單元測試 - 後端系統服務與重連機制

---

## 一、完成內容摘要

本工單測試後端系統服務，包括重連、好友、邀請和出席服務。

### 測試執行結果

| 服務模組 | 測試狀態 | 通過/總數 | 覆蓋率 |
|---------|---------|-----------|--------|
| reconnectionService | ✅ 通過 | 51/51 | 100% |
| friendService | ✅ 通過 | 16/16 | 83.9% |
| invitationService | ✅ 通過 | 9/9 | 97.29% |
| presenceService | ✅ 通過 | 9/9 | 89.47% |

---

## 二、測試數據

### 2.1 重連服務測試詳情
```
reconnectionService
  常數
    ✓ DISCONNECT_TIMEOUT 應為 60 秒
    ✓ WAITING_PHASE_DISCONNECT_TIMEOUT 應為 15 秒
    ✓ REFRESH_GRACE_PERIOD 應為 10 秒

  calculateDisconnectTimeout
    ✓ 重整中應返回 REFRESH_GRACE_PERIOD
    ✓ 等待階段非重整應返回 WAITING_PHASE_DISCONNECT_TIMEOUT
    ✓ 遊戲中非重整應返回 DISCONNECT_TIMEOUT

  validateReconnection
    ✓ gameState 為 null 時應返回 room_not_found
    ✓ 玩家不在房間中應返回 player_not_found
    ✓ 玩家在房間中應返回 valid 和 playerIndex

  handleDisconnectTimeout
    ✓ 等待階段應返回 remove 動作
    ✓ 遊戲中非重整應返回 deactivate 動作
    ✓ 移除房主時應設定 newHostIndex

  ... (共 51 個測試)
```

### 2.2 好友服務測試詳情
```
friendService
  searchPlayers
    ✓ 應返回符合搜尋條件的玩家
    ✓ 搜尋失敗時應返回空陣列

  sendFriendRequest
    ✓ 應成功發送好友請求
    ✓ 已是好友時應拋出錯誤
    ✓ 已發送過請求時應拋出錯誤

  acceptFriendRequest
    ✓ 應成功接受好友請求
    ✓ 找不到請求時應拋出錯誤

  rejectFriendRequest
    ✓ 應成功拒絕好友請求

  getFriendRequests
    ✓ 應返回待處理的好友請求
    ✓ 沒有請求時應返回空陣列

  ... (共 16 個測試)
```

### 2.3 整合測試（重連機制）
```
斷線重連整合測試
  WA-01: 等待階段單人重整
    ✓ 玩家重整後應能在 15 秒內重連成功 (659 ms)

  WA-02: 等待階段多人重整
    ✓ 房主重整時其他玩家應看到斷線狀態然後恢復 (836 ms)

  WA-03: 等待階段房主超時
    ✓ 房主斷線超過 15 秒應被移除，房主轉移 (16010 ms)

  GP-01: 遊戲中重整
    ✓ 遊戲中重整後應恢復手牌和狀態 (649 ms)

  GP-03: 遊戲中長時間斷線
    ✓ 斷線超過 60 秒應標記為不活躍 (61231 ms)

  EC-01: 重連時房間已被刪除
    ✓ 單人房間超時後重連應收到錯誤 (16026 ms)

  PF-01: 快速連續重整
    ✓ 快速重整不應產生多個玩家副本 (755 ms)

  RP-02: 主動離開時清除
    ✓ 主動離開房間後應從房間移除 (217 ms)

  重整寬限期測試
    ✓ 發送 playerRefreshing 後應使用較短的超時時間 (5238 ms)
```

---

## 三、遇到的問題與解決方案

### 問題 1：測試執行時間較長
- **描述**：重連測試需要等待實際超時時間
- **測試時間**：reconnection.test.js 需要約 102 秒
- **建議**：在不需要測試實際超時的場景使用 jest.useFakeTimers()

### 問題 2：Console 錯誤訊息（預期行為）
- **描述**：部分測試會輸出 console.error
- **原因**：這是預期的錯誤處理測試
- **示例**：
```
console.error getFriendsPresence 錯誤: Error
console.error searchPlayers 錯誤: Database error
console.error getPendingInvitations 錯誤: Error
```
- **結論**：這是正常行為，表示錯誤處理邏輯正確

---

## 四、驗收標準檢查

| 標準 | 狀態 |
|------|------|
| 所有 28 個測試案例通過 | ✅ 85 個測試全部通過 |
| 覆蓋率達到 80% | ✅ 所有 services 達標 |
| Mock 正確模擬外部依賴 | ✅ |
| 邊界情況正確處理 | ✅ |

---

## 五、服務覆蓋率詳情

| 服務檔案 | Statements | Branch | Functions | Lines | 未覆蓋行 |
|---------|------------|--------|-----------|-------|---------|
| reconnectionService.js | 100% | 97.29% | 100% | 100% | 79 |
| invitationService.js | 97.29% | 81.81% | 100% | 100% | 51,114-122 |
| presenceService.js | 89.47% | 72.72% | 100% | 94.11% | 27 |
| friendService.js | 83.9% | 70.58% | 100% | 88.88% | 71-72,148... |

---

## 六、下一步計劃

1. 優化測試執行時間
2. 補充 friendService 的邊界測試以提高 Branch 覆蓋率
3. 補充 presenceService 的異常處理測試

---

*報告生成時間: 2026-01-27*
