# BUG 修復計畫書：猜錯後遊戲無法繼續

**建立日期**：2026-01-27

**問題描述**：猜牌玩家猜錯後，猜牌者和跟猜者應暫時退出遊戲，剩餘玩家應能繼續遊戲並跳過已退出玩家的回合。但目前遊戲在猜錯後無法正常繼續。

---

## 一、問題分析

### 現狀（有 BUG）

| 場景 | 目前行為 | 正確行為 |
|------|---------|---------|
| 猜錯 + 遊戲繼續 | 遊戲卡住，無法繼續 | 輪到下一個活躍玩家，跳過已退出玩家 |

### 根本原因

`backend/server.js` 的 `validateGuessResult` 函數（line 1689-1691）：

```javascript
} else {
  // 還有活躍玩家，繼續遊戲
  moveToNextPlayer(gameState);  // ← 只移動了玩家，沒改 gamePhase
}
```

進入跟猜階段時，`gamePhase` 被設為 `'followGuessing'`（line 668）。猜錯後遊戲應繼續，但 **`gamePhase` 沒有改回 `'playing'`**，導致：

1. 後端 `gamePhase` 卡在 `'followGuessing'`
2. 前端收到的遊戲狀態 `gamePhase` 不是 `'playing'`，UI 不顯示正常遊戲介面
3. 下一個活躍玩家無法操作，遊戲卡住

### 涉及的規則

- **規則 3.4**：跳過已退出玩家，輪到下一個仍在遊戲中的玩家
- **規則 5.5**：猜錯後如果還有其他玩家，繼續當局遊戲，輪到下一個玩家

---

## 二、實施計畫

### 工單 0173：後端 — 猜錯後正確恢復 gamePhase 為 playing

**修改檔案**：`backend/server.js`

1. **修改 `validateGuessResult`**：猜錯但遊戲繼續時，將 `gamePhase` 設回 `'playing'`

```javascript
} else {
  // 還有活躍玩家，繼續遊戲
  gameState.gamePhase = 'playing';  // ← 新增：恢復正常遊戲階段
  moveToNextPlayer(gameState);
}
```

---

## 三、預期成效

| 場景 | 修復後行為 |
|------|---------|
| 猜錯 + 有活躍玩家 | `gamePhase` 恢復為 `'playing'`，`moveToNextPlayer` 跳過已退出玩家，輪到下一個活躍玩家正常操作 |
| 猜錯 + 全員退出 | `gamePhase` 設為 `'roundEnd'`，進入下一局（行為不變） |

---

*計畫書建立時間: 2026-01-27*
