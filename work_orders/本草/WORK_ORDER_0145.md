# 工作單 0145

**日期：** 2026-01-27

**工作單標題：** 修復問牌無法選擇已退出玩家的問題

**工單主旨：** BUG 修復 - 允許向已退出當局的玩家問牌

**優先級：** 高

**依賴工單：** 無

---

## 一、問題描述

### 現象
當有玩家因猜錯或跟猜錯而退出當局遊戲後，其他活躍玩家在執行問牌動作時，無法選擇已退出的玩家作為目標。

### 期望行為
根據遊戲規則，已退出當局的玩家（`isActive: false`）**仍可被問牌**。活躍玩家應該可以向任何玩家問牌，無論該玩家是否仍在當局遊戲中。

### 根本原因
前端在渲染問牌目標選擇時，錯誤地過濾掉了已退出的玩家。

**問題程式碼位置：** `frontend/src/components/GameRoom/GameRoom.js`

```javascript
// 第 1384 行
players={gameState.players.filter(p => p.isActive !== false)}

// 第 1970 行
players={gameState.players.filter(p => p.isActive !== false)}

// 第 1988 行
players={gameState.players.filter(p => p.isActive !== false)}
```

---

## 二、BUG 修改計畫

### 2.1 分析

| 項目 | 說明 |
|------|------|
| 影響範圍 | 問牌目標選擇 UI |
| 影響組件 | QuestionFlow, QuestionCard |
| 修改檔案 | 1 個 (GameRoom.js) |
| 修改行數 | 3 處 |
| 風險評估 | 低（僅影響 UI 過濾邏輯） |

### 2.2 實施步驟

1. **移除 isActive 過濾條件**
   - 將 `players.filter(p => p.isActive !== false)` 改為 `players.filter(p => p.id !== currentPlayerId)`
   - 保留「排除自己」的邏輯，但移除「排除已退出玩家」的邏輯

2. **確保一致性**
   - 三處修改需要一致

3. **驗證邏輯正確**
   - 確認問牌仍然排除自己
   - 確認問牌可以選擇所有其他玩家（無論 isActive 狀態）

### 2.3 修改詳情

**修改前：**
```javascript
players={gameState.players.filter(p => p.isActive !== false)}
```

**修改後：**
```javascript
players={gameState.players}
```

**備註：** QuestionFlow 和 QuestionCard 組件內部已有邏輯排除當前玩家，因此不需要在傳入時過濾。

---

## 三、修改檔案

| 檔案 | 行號 | 修改內容 |
|------|------|----------|
| `frontend/src/components/GameRoom/GameRoom.js` | 1384 | 移除 isActive 過濾 |
| `frontend/src/components/GameRoom/GameRoom.js` | 1970 | 移除 isActive 過濾 |
| `frontend/src/components/GameRoom/GameRoom.js` | 1988 | 移除 isActive 過濾 |
| `frontend/src/components/QuestionFlow/QuestionFlow.js` | 58-59 | 移除 isActive 過濾 |
| `docs/GAME_RULES.md` | 多處 | 新增「可向已退出玩家問牌」規則說明 |

---

## 四、驗收標準

- [ ] 有玩家猜錯退出後，仍可向該玩家問牌
- [ ] 有玩家跟猜錯退出後，仍可向該玩家問牌
- [ ] 問牌時仍然無法選擇自己
- [ ] 遊戲規則文檔已更新

---

## 五、測試步驟

1. 開始一場 3 人或 4 人遊戲
2. 讓一位玩家執行猜牌，故意猜錯
3. 確認猜錯的玩家退出（顯示為灰色或標記）
4. 輪到下一位活躍玩家時，執行問牌動作
5. 確認可以在目標選擇中看到已退出的玩家
6. 成功向已退出的玩家問牌
7. 確認牌正確轉移

---

## 六、相關文檔更新

已更新 `docs/GAME_RULES.md`：
- 新增 3.5 節「向已退出玩家問牌」
- 更新 5.5 節，新增「退出當局的玩家仍可被問牌」說明
- 版本更新至 3.2

