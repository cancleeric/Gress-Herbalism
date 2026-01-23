# 工作單 0046

**日期：** 2026-01-24

**工作單標題：** 計分系統基礎建設

**工單主旨：** 規則擴充 - 建立計分制的數據結構和基礎邏輯

**內容：**

## 背景說明

遊戲從單局制擴展為計分制，需要建立完整的計分系統基礎架構。

## 需要實作的功能

### 1. 數據結構擴展

#### 玩家數據結構
```javascript
player: {
  id: string,
  name: string,
  hand: Card[],
  isActive: boolean,      // 當局是否仍在遊戲中
  score: number,          // 新增：累計分數
}
```

#### 遊戲狀態擴展
```javascript
gameState: {
  // 現有欄位...
  currentRound: number,   // 新增：當前局數
  scores: {               // 新增：所有玩家分數
    [playerId]: number
  },
  gamePhase: string,      // 擴展：新增 'followGuessing', 'roundEnd' 階段
  winningScore: number,   // 新增：勝利所需分數（預設 7）
}
```

### 2. 常數定義更新

更新 `shared/constants.js`：
```javascript
// 計分相關常數
const WINNING_SCORE = 7;           // 勝利分數
const GUESS_CORRECT_POINTS = 3;    // 猜對得分
const FOLLOW_CORRECT_POINTS = 1;   // 跟猜正確得分
const FOLLOW_WRONG_POINTS = -1;    // 跟猜錯誤扣分
const MIN_SCORE = 0;               // 最低分數

// 遊戲階段擴展
const GAME_PHASES = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  FOLLOW_GUESSING: 'followGuessing',  // 新增
  ROUND_END: 'roundEnd',               // 新增
  FINISHED: 'finished'
};
```

### 3. 計分邏輯函數

建立 `shared/utils/scoreUtils.js`：
- `addScore(currentScore, points)` - 加分（考慮最低分數限制）
- `checkWinCondition(scores, winningScore)` - 檢查是否有人達到勝利條件
- `getLeaderboard(scores)` - 取得排名

### 4. 後端服務更新

更新 `backend/services/gameService.js`：
- 初始化時設置玩家分數為 0
- 新增分數更新函數
- 新增局數管理函數

## 驗收標準

- [ ] 玩家數據結構包含 `score` 欄位
- [ ] 遊戲狀態包含 `currentRound` 和 `scores` 欄位
- [ ] 常數檔案包含所有計分相關常數
- [ ] 計分工具函數正確實作
- [ ] 遊戲開始時所有玩家分數初始化為 0
- [ ] 單元測試覆蓋計分邏輯
