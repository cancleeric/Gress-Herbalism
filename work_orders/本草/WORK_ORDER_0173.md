# 工作單 0173

**編號**：0173

**日期**：2026-01-27

**工作單標題**：後端 — 猜錯後正確恢復 gamePhase 為 playing

**工單主旨**：修正猜錯後遊戲無法繼續的 BUG，在有活躍玩家時將 gamePhase 改回 playing

---

## 內容

### 背景

`validateGuessResult` 函數中，猜錯但還有活躍玩家時，只呼叫了 `moveToNextPlayer(gameState)` 但沒有將 `gamePhase` 從 `'followGuessing'` 改回 `'playing'`，導致遊戲卡住。

### 工作內容

#### 修改 `backend/server.js` — `validateGuessResult` 函數

在 `moveToNextPlayer` 之前加上 `gameState.gamePhase = 'playing'`：

```javascript
} else {
  // 還有活躍玩家，繼續遊戲
  gameState.gamePhase = 'playing';  // 新增
  moveToNextPlayer(gameState);
}
```

### 驗收標準

| 標準 | 說明 |
|------|------|
| 猜錯後遊戲繼續 | gamePhase 正確恢復為 playing |
| 跳過退出玩家 | moveToNextPlayer 跳過 isActive: false 的玩家 |
| 全員退出時局結束 | gamePhase 設為 roundEnd（行為不變） |
| 既有後端測試通過 | 190/190 |

---

**相關計畫書**：`docs/BUG_FIX_PLAN_GAME_CONTINUE.md`

**相關檔案**：
- `backend/server.js`
