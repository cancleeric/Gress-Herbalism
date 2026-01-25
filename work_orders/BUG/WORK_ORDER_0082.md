# 工作單 0082

**日期：** 2026-01-25

**工作單標題：** 「其中一種全部」要牌方式 - 後端選擇邏輯重構

**工單主旨：** 功能開發 - 修正被要牌玩家的選擇流程，避免資訊洩漏

**相關工單：** 0069, 0078

---

## 一、問題分析

### 1.1 目前問題

當問牌方式為「其中一種全部」（`QUESTION_TYPE_ALL_ONE_COLOR`）時：

| 情境 | 目前行為 | 問題 |
|------|---------|------|
| 被要牌玩家兩種顏色都有 | 顯示選擇介面 | 無 |
| 被要牌玩家只有一種顏色 | 自動給出，不顯示選擇 | **洩漏資訊** |
| 被要牌玩家兩種都沒有 | 自動跳過 | **洩漏資訊** |

**洩漏的資訊：** 其他玩家可以從「是否顯示選擇介面」推斷被要牌玩家有幾種顏色。

### 1.2 解決方案

**無論被要牌玩家有幾種顏色，都必須進入選擇流程。**

| 情境 | 正確行為 |
|------|---------|
| 兩種顏色都有 | 顯示選擇介面，兩個選項都可選 |
| 只有一種顏色 | 顯示選擇介面，只有該顏色可選 |
| 兩種都沒有 | 顯示選擇介面，顯示「無牌可給」 |

---

## 二、後端修改

### 2.1 修改檔案：`backend/server.js`

#### 2.1.1 問牌事件處理 - 「其中一種全部」

找到處理問牌的 Socket 事件（搜尋 `QUESTION_TYPE_ALL_ONE_COLOR` 或問牌處理邏輯）。

**修改前（錯誤邏輯）：**
```javascript
// 錯誤：只有兩種顏色都有時才讓玩家選擇
if (questionType === QUESTION_TYPE_ALL_ONE_COLOR) {
  const targetHasColor1 = targetHand.some(c => c.color === colors[0]);
  const targetHasColor2 = targetHand.some(c => c.color === colors[1]);

  if (targetHasColor1 && targetHasColor2) {
    // 讓被要牌玩家選擇
    targetSocket.emit('chooseColorToGive', { colors });
  } else if (targetHasColor1) {
    // 自動給第一種顏色 ← 問題：洩漏資訊
    giveCards(colors[0]);
  } else if (targetHasColor2) {
    // 自動給第二種顏色 ← 問題：洩漏資訊
    giveCards(colors[1]);
  } else {
    // 沒有牌可給 ← 問題：洩漏資訊
    skipGiving();
  }
}
```

**修改後（正確邏輯）：**
```javascript
if (questionType === QUESTION_TYPE_ALL_ONE_COLOR) {
  const targetHasColor1 = targetHand.some(c => c.color === colors[0]);
  const targetHasColor2 = targetHand.some(c => c.color === colors[1]);

  // 計算可選的顏色
  const availableColors = [];
  if (targetHasColor1) availableColors.push(colors[0]);
  if (targetHasColor2) availableColors.push(colors[1]);

  // 進入選擇階段
  room.phase = 'choosingColorToGive';
  room.currentChoice = {
    waitingForPlayer: targetPlayerId,
    colors: colors,
    availableColors: availableColors,
    questionData: {
      askingPlayer: currentPlayerId,
      questionType,
    },
    startTime: Date.now(),
  };

  // 【重要】只通知被要牌玩家可選的顏色（私密）
  targetSocket.emit('chooseColorToGive', {
    askingPlayerName: getPlayerName(room, currentPlayerId),
    colors: colors,                    // 問的兩種顏色
    availableColors: availableColors,  // 可選的顏色（只有自己看得到）
    hasNoCards: availableColors.length === 0,
  });

  // 通知其他玩家「被要牌玩家正在選擇」（不洩漏可選顏色）
  socket.to(roomId).emit('playerChoosingColor', {
    playerId: targetPlayerId,
    playerName: getPlayerName(room, targetPlayerId),
    message: `${getPlayerName(room, targetPlayerId)} 正在選擇要給的顏色...`,
  });
}
```

#### 2.1.2 新增事件：處理顏色選擇 `submitColorChoice`

```javascript
/**
 * 處理被要牌玩家的顏色選擇
 * @event submitColorChoice
 * @param {Object} data
 * @param {string} data.chosenColor - 選擇的顏色（或 null 表示無牌可給）
 */
socket.on('submitColorChoice', (data) => {
  const { roomId, playerId } = getPlayerInfo(socket.id);
  const room = gameRooms.get(roomId);

  // 驗證
  if (!room) {
    socket.emit('error', { message: '房間不存在' });
    return;
  }

  if (room.phase !== 'choosingColorToGive') {
    socket.emit('error', { message: '目前不在選擇階段' });
    return;
  }

  if (room.currentChoice.waitingForPlayer !== playerId) {
    socket.emit('error', { message: '不是你的選擇回合' });
    return;
  }

  const { chosenColor } = data;
  const { availableColors, questionData, colors } = room.currentChoice;

  // 驗證選擇
  if (chosenColor !== null) {
    if (!availableColors.includes(chosenColor)) {
      socket.emit('error', { message: '你沒有這個顏色的牌' });
      return;
    }
  }

  // 執行給牌邏輯
  let cardsGiven = [];

  if (chosenColor) {
    // 給出選擇的顏色的所有牌
    const targetPlayer = room.players.find(p => p.id === playerId);
    const askingPlayer = room.players.find(p => p.id === questionData.askingPlayer);

    cardsGiven = targetPlayer.hand.filter(c => c.color === chosenColor);

    // 從被要牌玩家手中移除
    targetPlayer.hand = targetPlayer.hand.filter(c => c.color !== chosenColor);

    // 加到問牌玩家手中
    askingPlayer.hand.push(...cardsGiven);
  }

  // 【私密】通知被要牌玩家給了什麼牌
  socket.emit('cardsGivenNotification', {
    askingPlayerName: getPlayerName(room, questionData.askingPlayer),
    questionType: questionData.questionType,
    colors: colors,
    chosenColor: chosenColor,
    cardsGiven: cardsGiven.map(c => ({ color: c.color })),
    totalCount: cardsGiven.length,
  });

  // 【公開】通知所有玩家選擇完成（不洩漏具體牌）
  io.to(roomId).emit('colorChoiceComplete', {
    playerId: playerId,
    playerName: getPlayerName(room, playerId),
    cardsCount: cardsGiven.length,
    // 不廣播 chosenColor，避免洩漏
  });

  // 記錄到遊戲歷史（不含顏色）
  room.gameHistory.push({
    type: 'question',
    askingPlayer: questionData.askingPlayer,
    askingPlayerName: getPlayerName(room, questionData.askingPlayer),
    targetPlayer: playerId,
    targetPlayerName: getPlayerName(room, playerId),
    questionType: questionData.questionType,
    cardsCount: cardsGiven.length,
    timestamp: Date.now(),
  });

  // 清除選擇狀態
  room.currentChoice = null;

  // 進入預測階段（如果有實作）
  enterPredictionPhase(room, roomId, questionData.askingPlayer);
});
```

---

## 三、資訊可見性矩陣

| 資訊 | 被要牌玩家 | 問牌玩家 | 其他玩家 |
|------|-----------|---------|---------|
| 問的兩種顏色 | ✓ | ✓ | ✗ |
| 可選的顏色（有哪些） | ✓ (私密) | ✗ | ✗ |
| 正在選擇中 | ✓ | ✓ | ✓ |
| 選擇了哪種顏色 | ✓ | ✗ | ✗ |
| 給了幾張牌 | ✓ | ✓ | ✓ |
| 給了什麼牌 | ✓ (私密) | ✗ | ✗ |

---

## 四、Socket 事件總覽

### 後端 → 前端

| 事件名稱 | 接收對象 | 參數 | 說明 |
|---------|---------|------|------|
| `chooseColorToGive` | 被要牌玩家 | `{ askingPlayerName, colors, availableColors, hasNoCards }` | 通知進入選擇階段（含可選顏色） |
| `playerChoosingColor` | 其他玩家 | `{ playerId, playerName, message }` | 通知有玩家正在選擇 |
| `cardsGivenNotification` | 被要牌玩家 | `{ askingPlayerName, questionType, colors, chosenColor, cardsGiven, totalCount }` | 私密通知給了什麼牌 |
| `colorChoiceComplete` | 所有玩家 | `{ playerId, playerName, cardsCount }` | 選擇完成（不含顏色） |

### 前端 → 後端

| 事件名稱 | 參數 | 說明 |
|---------|------|------|
| `submitColorChoice` | `{ chosenColor }` | 提交顏色選擇（`null` 表示無牌可給） |

---

## 五、測試案例

### 5.1 單元測試

```javascript
describe('「其中一種全部」要牌方式', () => {
  describe('選擇流程', () => {
    test('兩種顏色都有時，兩個選項都可選', () => {
      // 被要牌玩家有紅色和藍色
      // 問紅色和藍色
      // 應該收到 availableColors: ['red', 'blue']
    });

    test('只有一種顏色時，只有該顏色可選', () => {
      // 被要牌玩家只有紅色
      // 問紅色和藍色
      // 應該收到 availableColors: ['red']
    });

    test('兩種都沒有時，顯示無牌可給', () => {
      // 被要牌玩家沒有紅色和藍色
      // 問紅色和藍色
      // 應該收到 availableColors: [], hasNoCards: true
    });

    test('無論有幾種顏色，都進入選擇流程', () => {
      // 驗證所有情況都會進入 choosingColorToGive 階段
    });
  });

  describe('資訊隱藏', () => {
    test('其他玩家看不到可選顏色', () => {
      // 驗證 playerChoosingColor 事件不包含 availableColors
    });

    test('其他玩家看不到選擇的顏色', () => {
      // 驗證 colorChoiceComplete 事件不包含 chosenColor
    });

    test('只有被要牌玩家收到給牌詳情', () => {
      // 驗證 cardsGivenNotification 只發給被要牌玩家
    });
  });

  describe('給牌邏輯', () => {
    test('選擇顏色後正確給出該顏色的所有牌', () => {});
    test('無牌可給時正確處理', () => {});
    test('牌正確從被要牌玩家移到問牌玩家', () => {});
  });
});
```

### 5.2 整合測試

```javascript
describe('「其中一種全部」整合測試', () => {
  test('完整流程 - 兩種都有', async () => {
    // 1. 玩家A 向 玩家B 問牌（紅+藍，其中一種全部）
    // 2. 玩家B 收到 chooseColorToGive，availableColors 為 ['red', 'blue']
    // 3. 其他玩家 收到 playerChoosingColor
    // 4. 玩家B 選擇紅色
    // 5. 玩家B 收到 cardsGivenNotification（含給牌詳情）
    // 6. 所有玩家 收到 colorChoiceComplete（只含張數）
    // 7. 驗證牌正確轉移
  });

  test('完整流程 - 只有一種', async () => {
    // 1. 玩家A 向 玩家B 問牌（紅+藍，其中一種全部）
    // 2. 玩家B 只有紅色，收到 availableColors 為 ['red']
    // 3. 其他玩家 收到 playerChoosingColor（不知道只能選紅色）
    // 4. 玩家B 只能選擇紅色
    // 5. 後續流程同上
  });

  test('完整流程 - 都沒有', async () => {
    // 1. 玩家A 向 玩家B 問牌（紅+藍，其中一種全部）
    // 2. 玩家B 都沒有，收到 hasNoCards: true
    // 3. 其他玩家 收到 playerChoosingColor
    // 4. 玩家B 確認「無牌可給」
    // 5. 所有玩家 收到 colorChoiceComplete，cardsCount: 0
  });
});
```

---

## 六、驗收標準

### 流程驗證
- [ ] 無論被要牌玩家有幾種顏色，都進入選擇流程
- [ ] 被要牌玩家收到正確的可選顏色列表
- [ ] 兩種都沒有時顯示「無牌可給」

### 資訊隱藏
- [ ] 其他玩家只看到「正在選擇中」
- [ ] 其他玩家看不到可選顏色
- [ ] 其他玩家看不到選擇了哪種顏色
- [ ] 只有被要牌玩家收到給牌詳情

### 給牌邏輯
- [ ] 選擇的顏色的所有牌正確轉移
- [ ] 牌從被要牌玩家移到問牌玩家
- [ ] 無牌可給時正確處理

### 遊戲紀錄
- [ ] 遊戲紀錄不顯示選擇的顏色
- [ ] 遊戲紀錄顯示給了幾張牌
