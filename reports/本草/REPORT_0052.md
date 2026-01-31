# 完成報告 0052

**日期：** 2026-01-24

**工作單標題：** 修復跟猜機制 - 按順位決定並公開顯示決定狀態

**工單主旨：** Bug 修復 - 跟猜應按順位輪流決定，且所有人可見決定狀態

## 完成內容

### 1. 問題描述

之前的跟猜機制存在問題：
1. 所有玩家可以同時決定是否跟猜，沒有順序限制
2. 其他玩家看不清楚決定進度和每個人的狀態

### 2. 解決方案

#### 後端修改 (`backend/server.js`)

**新增決定順序計算**：
```javascript
// 計算決定順序：從猜牌者的下一位開始，按順位排列
const guesserIndex = gameState.players.findIndex(p => p.id === result.guessingPlayerId);
const playerCount = gameState.players.length;
const decisionOrder = [];

for (let i = 1; i < playerCount; i++) {
  const idx = (guesserIndex + i) % playerCount;
  const player = gameState.players[idx];
  if (player.isActive && player.id !== result.guessingPlayerId) {
    decisionOrder.push(player.id);
  }
}
```

**新增跟猜狀態結構**：
```javascript
followGuessStates.set(gameId, {
  guessingPlayerId: result.guessingPlayerId,
  guessedColors: result.guessedColors,
  decisionOrder: decisionOrder,       // 決定順序陣列
  currentDeciderIndex: 0,             // 目前決定者索引
  currentDeciderId: decisionOrder[0], // 目前輪到誰決定
  decisions: {},                       // { playerId: 'follow' | 'pass' }
  followingPlayers: [],
  declinedPlayers: []
});
```

**決定驗證與順序推進**：
```javascript
// 驗證是否是當前應該決定的玩家
if (followState.currentDeciderId !== playerId) {
  socket.emit('error', { message: '還沒輪到你決定' });
  return;
}

// 記錄決定後，移到下一個決定者
followState.currentDeciderIndex++;
followState.currentDeciderId = hasMoreDeciders
  ? followState.decisionOrder[followState.currentDeciderIndex]
  : null;
```

#### 前端修改 (`frontend/src/components/GameRoom/GameRoom.js`)

**更新事件處理**：
```javascript
onFollowGuessStarted(({ guessingPlayerId, guessedColors, decisionOrder, currentDeciderId, decisions }) => {
  setFollowGuessData({
    guessingPlayerId,
    guessedColors,
    decisionOrder: decisionOrder || [],
    currentDeciderId,
    decisions: decisions || {},
    followingPlayers: [],
    declinedPlayers: []
  });
});
```

**新增決定順序顯示 UI**：
- 顯示決定順序清單
- 標示猜牌者
- 標示當前決定者（高亮動畫）
- 顯示每個人的決定狀態（跟猜/不跟/等待中/決定中）
- 只有輪到的玩家才能點擊決定按鈕

### 3. CSS 樣式

新增樣式：
- `.decision-order-list` - 決定順序清單
- `.decision-item.current-decider` - 當前決定者高亮
- `.decision-badge` - 決定狀態標籤（不同顏色）
- `@keyframes pulse-border` - 當前決定者動畫
- `@keyframes blink` - 決定中閃爍動畫

## 範例流程

```
玩家順序：A → B → C → D

1. 玩家 B 宣布猜牌
2. 進入跟猜階段，順序為：C → D → A

   狀態顯示：
   - B: 猜牌者
   - C: ⏳ 決定中...
   - D: ⏸️ 等待中
   - A: ⏸️ 等待中

3. 玩家 C 決定「跟猜」

   狀態顯示：
   - B: 猜牌者
   - C: ✅ 跟猜
   - D: ⏳ 決定中...
   - A: ⏸️ 等待中

4. 玩家 D 決定「不跟猜」

   狀態顯示：
   - B: 猜牌者
   - C: ✅ 跟猜
   - D: ❌ 不跟猜
   - A: ⏳ 決定中...

5. 玩家 A 決定「跟猜」

   狀態顯示：
   - B: 猜牌者
   - C: ✅ 跟猜
   - D: ❌ 不跟猜
   - A: ✅ 跟猜

6. 所有人決定完畢，揭曉結果
```

## 驗收結果

- [x] 跟猜按照猜牌者的下一位開始，依順位進行
- [x] 每位玩家必須等前一位決定後才能決定
- [x] 所有玩家即時看到每個人的決定狀態
- [x] UI 清楚顯示目前輪到誰決定
- [x] 非輪到的玩家無法提交決定（後端驗證）
- [x] 所有人決定完畢後才揭曉結果
- [x] 已退出的玩家（isActive: false）不在決定順序中

## 修改的檔案

1. `backend/server.js` - 跟猜順序邏輯和驗證
2. `frontend/src/components/GameRoom/GameRoom.js` - 跟猜 UI 和事件處理
3. `frontend/src/components/GameRoom/GameRoom.css` - 決定順序樣式
