# 完成報告 0047

**日期：** 2026-01-24

**工作單標題：** 跟猜機制實作（後端）

**工單主旨：** 規則擴充 - 實作跟猜機制的後端邏輯

## 完成內容

### 1. 跟猜狀態管理

新增全域狀態：
```javascript
const followGuessStates = new Map();
```

跟猜狀態結構：
```javascript
{
  guessingPlayerId: string,     // 猜牌玩家 ID
  guessedColors: string[],      // 猜測的顏色
  pendingPlayers: string[],     // 尚未決定的玩家
  followingPlayers: string[],   // 選擇跟猜的玩家
  declinedPlayers: string[]     // 選擇不跟猜的玩家
}
```

### 2. 修改 processGuessAction 函數

當猜牌時，檢查是否有其他活躍玩家：
- 如果有 → 返回 `requireFollowGuess: true`，進入跟猜階段
- 如果沒有 → 直接驗證結果

### 3. 新增 validateGuessResult 函數

處理猜測驗證和分數計算：
- 猜對：猜牌者 +3 分，跟猜者各 +1 分
- 猜錯：猜牌者不扣分但退出，跟猜者 -1 分並退出
- 分數不會低於 0
- 檢查勝利條件

### 4. Socket.io 事件

#### 新增事件

**followGuessStarted** - 進入跟猜階段
```javascript
{
  guessingPlayerId: string,
  guessedColors: string[],
  pendingPlayers: string[]
}
```

**followGuessResponse** - 玩家提交跟猜決定
```javascript
{
  gameId: string,
  playerId: string,
  isFollowing: boolean
}
```

**followGuessUpdate** - 更新跟猜狀態
```javascript
{
  playerId: string,
  isFollowing: boolean,
  pendingPlayers: string[],
  followingPlayers: string[],
  declinedPlayers: string[]
}
```

**guessResult** - 猜牌結果
```javascript
{
  isCorrect: boolean,
  scoreChanges: Object,
  hiddenCards: Array,
  guessingPlayerId: string,
  followingPlayers: string[]
}
```

### 5. 結果處理邏輯

#### 猜對時
- 猜牌者 +3 分
- 跟猜者各 +1 分
- 檢查是否達到勝利分數（7分）
- 如果達到 → 遊戲結束
- 如果未達到 → 進入局結束階段

#### 猜錯時
- 猜牌者不扣分，但退出當局
- 跟猜者各 -1 分（最低 0 分），並退出當局
- 如果還有活躍玩家 → 繼續遊戲
- 如果沒有活躍玩家 → 局結束

## 驗收結果

- [x] 猜牌提交後正確進入跟猜階段
- [x] 正確計算需要決定的玩家列表
- [x] 正確記錄每位玩家的跟猜決定
- [x] 所有玩家決定後正確驗證猜測
- [x] 猜對時正確加分（猜牌者 +3，跟猜者 +1）
- [x] 猜錯時正確處理（猜牌者不扣分，跟猜者 -1）
- [x] 分數不會低於 0
- [x] 猜錯時正確將相關玩家設為退出
- [x] Socket 事件正確廣播給所有玩家

## 修改的檔案

1. `backend/server.js` - 跟猜狀態管理和事件處理

## 跟猜流程

```
1. 玩家 A 提交猜測
2. 後端檢查是否有其他活躍玩家
3. 如果有 → 進入 followGuessing 階段
   - 廣播 followGuessStarted 事件
   - 等待所有玩家決定
4. 玩家提交 followGuessResponse
   - 記錄決定
   - 廣播 followGuessUpdate 事件
5. 所有玩家決定完畢
   - 呼叫 validateGuessResult
   - 計算分數變化
   - 廣播 guessResult 事件
   - 更新遊戲狀態
```
