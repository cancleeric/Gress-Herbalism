# 完成報告 0048

**日期：** 2026-01-24

**工作單標題：** 多局遊戲邏輯實作

**工單主旨：** 規則擴充 - 實作多局遊戲的局結束和下一局開始邏輯

## 完成內容

### 1. 局結束條件

在工單 0047 中已處理的結束條件：
- **有人猜對**：猜牌者和跟猜者獲得相應分數，進入 roundEnd
- **所有玩家都退出**：進入 roundEnd
- **達到勝利分數**：進入 finished

### 2. 新增 startNextRound 事件處理

```javascript
socket.on('startNextRound', ({ gameId }) => {
  // 驗證遊戲狀態
  if (gameState.gamePhase !== 'roundEnd') return;

  // 計算下一局起始玩家
  const nextStartPlayer = (lastActionPlayer + 1) % players.length;

  // 增加局數
  gameState.currentRound += 1;

  // 重新洗牌和發牌
  const deck = createDeck();
  const shuffledDeck = shuffleDeck(deck);
  const { hiddenCards, playerHands } = dealCards(...);

  // 重置玩家狀態
  gameState.players = players.map((player, index) => ({
    ...player,
    hand: playerHands[index],
    isActive: true,
    isCurrentTurn: index === nextStartPlayer
  }));

  // 更新遊戲狀態
  gameState.gamePhase = 'playing';
  gameState.gameHistory = [];
  gameState.winner = null;

  // 廣播事件
  io.to(gameId).emit('roundStarted', { round, startPlayerIndex });
});
```

### 3. Socket.io 事件

**roundStarted** - 下一局開始
```javascript
{
  round: number,          // 局數
  startPlayerIndex: number // 起始玩家索引
}
```

### 4. 起始玩家計算

下一局的起始玩家是上一局最後行動玩家的下一位：
```javascript
const nextStartPlayer = (lastActionPlayer + 1) % players.length;
```

### 5. 遊戲狀態過渡

```
playing → followGuessing → (驗證結果) → roundEnd → playing (新局)
                                      ↓
                                 finished (有人達 7 分)
```

## 驗收結果

- [x] 有人猜對時正確結束當局（進入 roundEnd）
- [x] 所有人退出時正確結束當局
- [x] 正確檢查勝利條件（7 分）
- [x] 達到 7 分時正確結束整場遊戲（進入 finished）
- [x] 下一局正確重置玩家狀態（isActive = true）
- [x] 下一局正確重新發牌
- [x] 起始玩家計算正確
- [x] 分數在各局間正確保留

## 修改的檔案

1. `backend/server.js` - 新增 startNextRound 事件處理

## 備註

前端需要實作 UI 來呼叫 startNextRound 事件，這將在工單 0049 中處理。
