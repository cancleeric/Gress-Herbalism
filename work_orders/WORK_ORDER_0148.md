# 工作單 0148

**日期：** 2026-01-27

**工作單標題：** 修復房間有人退出時所有人斷線的問題

**工單主旨：** BUG 修復 - 玩家離開房間導致其他玩家斷線

**優先級：** 高

**依賴工單：** 無

**計畫書：** `docs/BUG_FIX_PLAN_0147_0148.md`

---

## 一、問題描述

### 現象
房間中有玩家退出時，其他所有玩家也會斷線。

### 重現步驟
1. 創建房間，3-4 人加入
2. 在等待階段或遊戲中，任一玩家退出
3. 其他玩家全部斷線

### 期望行為
玩家退出時：
- 等待階段：其他玩家維持連線，房間繼續等待
- 遊戲中：其他玩家維持連線，退出玩家標記為不活躍

---

## 二、問題分析

### 根本原因

1. **廣播順序問題**
   - `handlePlayerLeave()` 在 `socket.leave()` 前呼叫 `broadcastGameState()`
   - 可能導致狀態不一致

2. **房間刪除後仍嘗試廣播**
   - 房間空了被刪除後，仍呼叫 `broadcastGameState()`
   - 可能導致錯誤

3. **缺少玩家離開通知**
   - 其他玩家不知道有人離開
   - 可能因狀態不一致導致問題

---

## 三、修復方案

### 3.1 修改 handlePlayerLeave 邏輯

**修改 `backend/server.js`:**
- 先執行 `socket.leave()` 和 `playerSockets.delete()`
- 房間刪除後不呼叫 `broadcastGameState()`
- 新增 `playerLeft` 事件通知

### 3.2 加強 broadcastGameState 防護

確保房間存在且有玩家時才廣播。

### 3.3 前端處理玩家離開

新增 `onPlayerLeft` 事件監聽。

---

## 四、修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/server.js` | 修改 `handlePlayerLeave()`、`broadcastGameState()` |
| `frontend/src/services/socketService.js` | 新增 `onPlayerLeft()` |
| `frontend/src/components/GameRoom/GameRoom.js` | 處理玩家離開事件 |

---

## 五、驗收標準

- [ ] 等待階段退出不影響其他玩家
- [ ] 遊戲中退出不影響其他玩家
- [ ] 退出玩家正確標記為不活躍
- [ ] 房間列表正確更新
- [ ] 其他玩家收到離開通知

---

## 六、測試步驟

1. 創建房間，3 人加入
2. 在等待階段，讓玩家 B 退出
3. 確認玩家 A、C 維持連線
4. 確認房間人數更新為 2 人
5. 玩家 D 加入，開始遊戲
6. 遊戲中讓玩家 C 退出
7. 確認玩家 A、D 維持連線
8. 確認遊戲繼續進行

