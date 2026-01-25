# 工作單 0080

**日期：** 2026-01-25

**工作單標題：** 預測功能 - 後端遊戲階段與 Socket 事件實作

**工單主旨：** 功能開發 - 實作問牌後預測階段的後端邏輯

**計畫書：** [預測功能計畫書](../docs/PREDICTION_FEATURE_PLAN.md)

**相關工單：** 0071, 0076

---

## 一、問題分析

目前問牌完成後，後端直接將遊戲階段切換到下一位玩家，沒有進入「預測階段」讓當前玩家選擇是否預測。

### 目前流程（錯誤）

```
後端處理問牌事件
    │
    ▼
牌轉移完成
    │
    ▼
直接切換到下一位玩家 ← 問題：跳過預測階段
    │
    ▼
廣播 gameStateUpdate
```

### 正確流程

```
後端處理問牌事件
    │
    ▼
牌轉移完成
    │
    ▼
進入 POST_QUESTION 階段 ← 新增
    │
    ▼
廣播 enterPredictionPhase 給當前玩家
    │
    ▼
等待玩家提交預測或跳過
    │
    ▼
收到 submitPrediction 或 skipPrediction
    │
    ▼
記錄預測（如有）
    │
    ▼
切換到下一位玩家
    │
    ▼
廣播 gameStateUpdate
```

---

## 二、修改範圍

### 2.1 檔案：`backend/server.js`

#### 2.1.1 新增遊戲狀態欄位

在 `gameRooms` 的房間狀態中新增：

```javascript
// 房間狀態結構
{
  // ... 現有欄位

  // 預測相關
  phase: 'playing', // 新增 'postQuestion' 階段
  predictions: [],  // 該局所有預測記錄
  currentPrediction: {
    waitingForPlayer: null,  // 等待哪位玩家的預測
    startTime: null,         // 開始等待時間（用於超時處理）
  },
}
```

#### 2.1.2 修改問牌處理事件 `handleQuestion`

**目前程式碼位置：** 搜尋 `socket.on('question'` 或類似的問牌事件處理

**修改內容：**

```javascript
// 問牌完成後，不要直接切換玩家
// 改為進入預測階段

socket.on('question', (data) => {
  // ... 現有的問牌處理邏輯 ...

  // 牌轉移完成後

  // 【修改】不要直接切換玩家，進入預測階段
  room.phase = 'postQuestion';
  room.currentPrediction = {
    waitingForPlayer: currentPlayerId,
    startTime: Date.now(),
  };

  // 廣播遊戲狀態更新（不含換人）
  io.to(roomId).emit('gameStateUpdate', {
    // ... 遊戲狀態
    phase: 'postQuestion',
  });

  // 通知當前玩家進入預測選擇
  socket.emit('enterPredictionPhase', {
    colors: ['red', 'yellow', 'green', 'blue'],
    message: '問牌完成！是否要預測蓋牌中有哪個顏色？',
  });
});
```

#### 2.1.3 新增預測提交事件 `submitPrediction`

```javascript
/**
 * 處理玩家提交預測
 * @event submitPrediction
 * @param {Object} data
 * @param {string} data.color - 預測的顏色 ('red'|'yellow'|'green'|'blue')
 */
socket.on('submitPrediction', (data) => {
  const { roomId, playerId } = getPlayerInfo(socket.id);
  const room = gameRooms.get(roomId);

  // 驗證
  if (!room) {
    socket.emit('error', { message: '房間不存在' });
    return;
  }

  if (room.phase !== 'postQuestion') {
    socket.emit('error', { message: '目前不在預測階段' });
    return;
  }

  if (room.currentPrediction.waitingForPlayer !== playerId) {
    socket.emit('error', { message: '不是你的預測回合' });
    return;
  }

  const { color } = data;

  // 驗證顏色
  const validColors = ['red', 'yellow', 'green', 'blue'];
  if (!validColors.includes(color)) {
    socket.emit('error', { message: '無效的顏色' });
    return;
  }

  // 記錄預測
  const prediction = {
    playerId,
    playerName: getPlayerName(room, playerId),
    color,
    round: room.currentRound,
    timestamp: Date.now(),
    isCorrect: null,  // 答案揭曉時填入
  };

  room.predictions.push(prediction);

  // 廣播預測資訊給所有玩家（公開）
  io.to(roomId).emit('predictionMade', {
    playerId,
    playerName: prediction.playerName,
    color,
  });

  // 記錄到遊戲歷史
  room.gameHistory.push({
    type: 'prediction',
    playerId,
    playerName: prediction.playerName,
    color,
    timestamp: Date.now(),
  });

  // 結束預測階段，切換到下一位玩家
  finishPredictionPhase(room, roomId);
});
```

#### 2.1.4 新增跳過預測事件 `skipPrediction`

```javascript
/**
 * 處理玩家跳過預測
 * @event skipPrediction
 */
socket.on('skipPrediction', () => {
  const { roomId, playerId } = getPlayerInfo(socket.id);
  const room = gameRooms.get(roomId);

  // 驗證
  if (!room) {
    socket.emit('error', { message: '房間不存在' });
    return;
  }

  if (room.phase !== 'postQuestion') {
    socket.emit('error', { message: '目前不在預測階段' });
    return;
  }

  if (room.currentPrediction.waitingForPlayer !== playerId) {
    socket.emit('error', { message: '不是你的預測回合' });
    return;
  }

  // 廣播跳過預測（公開）
  io.to(roomId).emit('predictionSkipped', {
    playerId,
    playerName: getPlayerName(room, playerId),
  });

  // 記錄到遊戲歷史
  room.gameHistory.push({
    type: 'predictionSkipped',
    playerId,
    playerName: getPlayerName(room, playerId),
    timestamp: Date.now(),
  });

  // 結束預測階段，切換到下一位玩家
  finishPredictionPhase(room, roomId);
});
```

#### 2.1.5 新增輔助函數 `finishPredictionPhase`

```javascript
/**
 * 結束預測階段，切換到下一位玩家
 * @param {Object} room - 房間物件
 * @param {string} roomId - 房間ID
 */
function finishPredictionPhase(room, roomId) {
  // 清除預測狀態
  room.currentPrediction = {
    waitingForPlayer: null,
    startTime: null,
  };

  // 切換到下一位玩家
  room.currentPlayerIndex = getNextPlayerIndex(room);
  room.phase = 'playing';

  // 廣播遊戲狀態更新
  io.to(roomId).emit('gameStateUpdate', {
    players: room.players,
    currentPlayerIndex: room.currentPlayerIndex,
    phase: room.phase,
    gameHistory: room.gameHistory,
  });

  // 通知下一位玩家輪到他
  const nextPlayer = room.players[room.currentPlayerIndex];
  const nextSocket = findSocketByPlayerId(nextPlayer.id);
  if (nextSocket) {
    nextSocket.emit('yourTurn', {
      message: '輪到你了！',
    });
  }
}
```

#### 2.1.6 修改猜牌成功處理 - 結算預測

在猜牌成功時，需要結算所有預測：

```javascript
/**
 * 結算所有預測
 * @param {Object} room - 房間物件
 * @param {string} roomId - 房間ID
 */
function settlePredictions(room, roomId) {
  const hiddenCardColors = room.hiddenCards.map(card => card.color);

  const results = room.predictions.map(prediction => {
    const isCorrect = hiddenCardColors.includes(prediction.color);

    // 更新預測結果
    prediction.isCorrect = isCorrect;

    // 計算分數
    const scoreChange = isCorrect ? 1 : -1;

    // 更新玩家分數
    const player = room.players.find(p => p.id === prediction.playerId);
    if (player) {
      player.score = Math.max(0, player.score + scoreChange);
    }

    return {
      playerId: prediction.playerId,
      playerName: prediction.playerName,
      color: prediction.color,
      isCorrect,
      scoreChange,
    };
  });

  // 廣播預測結算結果
  io.to(roomId).emit('predictionsSettled', {
    hiddenCards: hiddenCardColors,
    results,
  });

  // 清空預測記錄（為下一局準備）
  room.predictions = [];

  return results;
}
```

---

## 三、Socket 事件總覽

### 前端 → 後端

| 事件名稱 | 參數 | 說明 |
|---------|------|------|
| `submitPrediction` | `{ color: string }` | 提交預測 |
| `skipPrediction` | 無 | 跳過預測 |

### 後端 → 前端

| 事件名稱 | 參數 | 說明 | 接收對象 |
|---------|------|------|---------|
| `enterPredictionPhase` | `{ colors, message }` | 進入預測階段 | 當前玩家 |
| `predictionMade` | `{ playerId, playerName, color }` | 某玩家進行了預測 | 所有玩家 |
| `predictionSkipped` | `{ playerId, playerName }` | 某玩家跳過預測 | 所有玩家 |
| `predictionsSettled` | `{ hiddenCards, results }` | 預測結算結果 | 所有玩家 |

---

## 四、測試案例

### 4.1 單元測試

```javascript
describe('預測功能 - 後端', () => {
  describe('submitPrediction', () => {
    test('正確階段時可以提交預測', () => {});
    test('非預測階段時拒絕提交', () => {});
    test('非當前玩家時拒絕提交', () => {});
    test('無效顏色時拒絕提交', () => {});
    test('提交後廣播給所有玩家', () => {});
    test('提交後記錄到遊戲歷史', () => {});
    test('提交後切換到下一位玩家', () => {});
  });

  describe('skipPrediction', () => {
    test('正確階段時可以跳過預測', () => {});
    test('跳過後廣播給所有玩家', () => {});
    test('跳過後切換到下一位玩家', () => {});
  });

  describe('settlePredictions', () => {
    test('正確結算預測結果', () => {});
    test('預測正確加1分', () => {});
    test('預測錯誤扣1分', () => {});
    test('分數不會低於0', () => {});
  });
});
```

### 4.2 整合測試

```javascript
describe('預測功能 - 整合測試', () => {
  test('完整預測流程', async () => {
    // 1. 玩家問牌
    // 2. 收到 enterPredictionPhase
    // 3. 提交預測
    // 4. 所有玩家收到 predictionMade
    // 5. 切換到下一位玩家
  });

  test('跳過預測流程', async () => {
    // 1. 玩家問牌
    // 2. 收到 enterPredictionPhase
    // 3. 跳過預測
    // 4. 所有玩家收到 predictionSkipped
    // 5. 切換到下一位玩家
  });
});
```

---

## 五、驗收標準

- [ ] 問牌完成後進入 `postQuestion` 階段
- [ ] 當前玩家收到 `enterPredictionPhase` 事件
- [ ] 可以提交預測（`submitPrediction`）
- [ ] 可以跳過預測（`skipPrediction`）
- [ ] 預測/跳過後廣播給所有玩家
- [ ] 預測/跳過後切換到下一位玩家
- [ ] 遊戲歷史記錄預測動作
- [ ] 猜牌成功時結算所有預測
- [ ] 預測正確 +1 分，錯誤 -1 分
- [ ] 分數不會低於 0
