# 工作單 0047

**日期：** 2026-01-24

**工作單標題：** 跟猜機制實作（後端）

**工單主旨：** 規則擴充 - 實作跟猜機制的後端邏輯

**內容：**

## 背景說明

當有玩家決定猜牌時，其他玩家可以按順位決定是否「跟猜」。跟猜機制需要完整的後端支援。

## 跟猜流程

```
1. 玩家 A 提交猜測
2. 遊戲進入 'followGuessing' 階段
3. 儲存猜測內容，等待其他玩家決定
4. 其他玩家按順位決定是否跟猜
5. 所有玩家決定完畢後進行答案驗證
6. 根據結果計算分數和處理玩家狀態
```

## 需要實作的功能

### 1. 跟猜狀態管理

```javascript
followGuessState: {
  guessingPlayer: string,     // 猜牌玩家 ID
  guessedColors: string[],    // 猜測的顏色
  pendingPlayers: string[],   // 尚未決定的玩家
  followingPlayers: string[], // 選擇跟猜的玩家
  declinedPlayers: string[],  // 選擇不跟猜的玩家
}
```

### 2. Socket.io 事件

#### 新增事件
- `guess:submitted` - 猜牌提交，開始跟猜階段
- `followGuess:request` - 請求玩家決定是否跟猜
- `followGuess:respond` - 玩家提交跟猜決定
- `followGuess:completed` - 所有玩家決定完畢
- `guess:result` - 猜牌結果（含跟猜結果）

### 3. 後端處理器

建立 `backend/services/followGuessProcessor.js`：

```javascript
// 初始化跟猜階段
initFollowGuess(gameState, guessingPlayerId, guessedColors)

// 處理玩家跟猜決定
processFollowResponse(gameState, playerId, isFollowing)

// 檢查是否所有玩家都已決定
checkAllDecided(followGuessState)

// 驗證猜測並計算結果
validateAndCalculateResults(gameState, followGuessState, hiddenCards)
```

### 4. 結果處理邏輯

#### 猜對時
```javascript
{
  correct: true,
  guessingPlayerScore: +3,
  followingPlayersScore: +1 each,
  // 當局結束，可能進入下一局或遊戲結束
}
```

#### 猜錯時
```javascript
{
  correct: false,
  guessingPlayerScore: 0,        // 不扣分
  followingPlayersScore: -1 each, // 扣分（最低 0）
  eliminatedPlayers: [...],       // 猜牌者 + 跟猜者都退出當局
}
```

### 5. 順位處理

- 跟猜請求按照遊戲中的順序發送
- 只有仍在當局中的玩家（`isActive: true`）需要決定
- 猜牌玩家自己不需要決定

## 驗收標準

- [ ] 猜牌提交後正確進入跟猜階段
- [ ] 正確計算需要決定的玩家列表
- [ ] 按順位發送跟猜請求
- [ ] 正確記錄每位玩家的跟猜決定
- [ ] 所有玩家決定後正確驗證猜測
- [ ] 猜對時正確加分（猜牌者 +3，跟猜者 +1）
- [ ] 猜錯時正確處理（猜牌者不扣分，跟猜者 -1）
- [ ] 分數不會低於 0
- [ ] 猜錯時正確將相關玩家設為退出
- [ ] Socket 事件正確廣播給所有玩家
