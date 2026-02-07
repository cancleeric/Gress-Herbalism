# 工作單 0377

## 基本資訊

| 項目 | 內容 |
|------|------|
| 編號 | 0377 |
| 日期 | 2026-02-07 |
| 標題 | 添加演化論重連事件處理 |
| 主旨 | Socket 連線問題修復 |
| 優先級 | P1 - 臨界 |
| 所屬計畫 | Socket 連線問題修復計畫書 |

---

## 問題描述

前端 `reconnectionHandler.js` 發送 `evo:reconnect` 事件，但後端 `server.js` 未註冊對應的事件處理器，導致演化論遊戲斷線後無法正確重連。

---

## 工作內容

### 1. 在後端添加 evo:reconnect 事件處理

修改 `backend/server.js`，添加事件處理：

```javascript
socket.on('evo:reconnect', async ({ roomId, playerId }) => {
  try {
    console.log(`[Evolution] 玩家 ${playerId} 嘗試重連房間 ${roomId}`);

    // 調用演化論處理器的重連邏輯
    await evolutionHandler.handleReconnect(socket, io, { roomId, playerId });
  } catch (error) {
    console.error('[Evolution] 重連失敗:', error);
    socket.emit('evo:error', { message: '重連失敗' });
  }
});
```

### 2. 確認 evolutionGameHandler 有 handleReconnect 方法

檢查 `backend/evolutionGameHandler.js` 是否已實作 `handleReconnect` 方法，若無則添加。

### 3. 更新重連服務

確認 `backend/services/evolution/reconnectionService.js` 可正確處理重連邏輯。

---

## 驗收標準

- [ ] 後端註冊 `evo:reconnect` 事件處理
- [ ] 演化論遊戲斷線後可正常重連
- [ ] 重連後遊戲狀態正確恢復
- [ ] 單元測試通過（覆蓋率 ≥ 75%）

---

## 相關檔案

```
backend/server.js
backend/evolutionGameHandler.js
backend/services/evolution/reconnectionService.js
frontend/src/services/reconnectionHandler.js
```
