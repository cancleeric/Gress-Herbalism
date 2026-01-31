# 工單 0145 完成報告

**完成日期：** 2026-01-27

**工單標題：** 修復問牌無法選擇已退出玩家的問題

---

## 一、完成摘要

已修復問牌時無法選擇已退出玩家的 BUG。現在活躍玩家可以向任何玩家（包括已退出當局的玩家）問牌，符合遊戲規則設計。

---

## 二、修改內容

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/components/GameRoom/GameRoom.js` | 3 處移除 isActive 過濾 |
| `frontend/src/components/QuestionFlow/QuestionFlow.js` | 1 處移除 isActive 過濾 |
| `docs/GAME_RULES.md` | 新增規則說明，版本更新至 3.2 |

### 具體變更

#### GameRoom.js (3 處)

**修改前：**
```javascript
players={gameState.players.filter(p => p.isActive !== false)}
```

**修改後：**
```javascript
players={gameState.players}
```

#### QuestionFlow.js

**修改前：**
```javascript
// 排除自己的其他玩家（且只顯示活躍玩家）
const otherPlayers = players.filter(
  p => p.id !== currentPlayerId && p.isActive !== false
);
```

**修改後：**
```javascript
// 排除自己的其他玩家（已退出的玩家仍可被問牌）
const otherPlayers = players.filter(
  p => p.id !== currentPlayerId
);
```

#### GAME_RULES.md

- 新增 3.5 節「向已退出玩家問牌」
- 更新 5.5 節「猜錯處理」，新增說明
- 版本更新：3.1 → 3.2

---

## 三、驗收結果

- [x] 有玩家猜錯退出後，仍可向該玩家問牌
- [x] 有玩家跟猜錯退出後，仍可向該玩家問牌
- [x] 問牌時仍然無法選擇自己
- [x] 遊戲規則文檔已更新

---

## 四、備註

此修復符合遊戲設計：已退出當局的玩家雖然不再輪到他們行動，但其手牌仍是可用資源，其他玩家可以透過問牌獲取這些牌。這增加了遊戲的策略深度。

