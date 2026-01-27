# 完成報告 0173

**工作單編號**：0173

**完成日期**：2026-01-27

**完成內容摘要**：

修正猜錯後遊戲無法繼續的 BUG，在有活躍玩家時將 `gamePhase` 從 `'followGuessing'` 改回 `'playing'`。

### 修改內容

#### `backend/server.js` — `validateGuessResult` 函數（line 1690）

```javascript
// 修改前：
} else {
  moveToNextPlayer(gameState);
}

// 修改後：
} else {
  gameState.gamePhase = 'playing';  // 恢復正常遊戲階段
  moveToNextPlayer(gameState);
}
```

### 問題根因

進入跟猜階段時 `gamePhase` 被設為 `'followGuessing'`，但猜錯後遊戲繼續時沒有改回 `'playing'`，導致前端收到的狀態仍是 `'followGuessing'`，UI 不顯示正常遊戲介面，下一個活躍玩家無法操作。

### 遇到的問題與解決方案

無特殊問題，一行修改即解決。

### 測試結果

- 後端測試：**190/190 通過**

### 下一步計劃

- 重啟本地後端服務進行實測
