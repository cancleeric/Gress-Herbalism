# 工作單 0048

**日期：** 2026-01-24

**工作單標題：** 多局遊戲邏輯實作

**工單主旨：** 規則擴充 - 實作多局遊戲的局結束和下一局開始邏輯

**內容：**

## 背景說明

計分制下，遊戲由多局組成。需要處理當局結束和下一局開始的邏輯。

## 當局結束條件

1. **有人猜對**：猜牌者和跟猜者獲得相應分數
2. **所有玩家都退出**：所有人都因猜錯/跟猜錯而退出
3. **最後一人猜錯**：只剩一個玩家且猜錯

## 需要實作的功能

### 1. 局結束處理

```javascript
// backend/services/roundService.js

// 處理當局結束
endRound(gameState, reason) {
  // reason: 'correct_guess' | 'all_eliminated' | 'last_player_wrong'

  // 1. 記錄當局結果
  // 2. 檢查是否有人達到勝利分數
  // 3. 如果有 → 結束整場遊戲
  // 4. 如果沒有 → 準備下一局
}

// 準備下一局
prepareNextRound(gameState) {
  // 1. 增加局數
  // 2. 重置所有玩家 isActive 為 true
  // 3. 重新洗牌
  // 4. 重新抽蓋牌
  // 5. 重新發牌
  // 6. 設定起始玩家（上一局最後行動者的下一位）
  // 7. 清空遊戲歷史（或保留作為局歷史）
  // 8. 將遊戲階段設回 'playing'
}
```

### 2. 勝利檢查

```javascript
// 檢查是否有玩家達到勝利條件
checkGameWin(scores, winningScore) {
  for (const [playerId, score] of Object.entries(scores)) {
    if (score >= winningScore) {
      return playerId;
    }
  }
  return null;
}
```

### 3. Socket.io 事件

- `round:end` - 當局結束，包含當局結果
- `round:starting` - 下一局即將開始
- `round:started` - 下一局開始，包含新的遊戲狀態
- `game:won` - 有玩家達到勝利分數，整場遊戲結束

### 4. 起始玩家計算

```javascript
// 計算下一局的起始玩家
getNextRoundStartPlayer(lastActionPlayer, players) {
  // 找到上一局最後行動玩家的下一位
  // 如果該玩家不存在（離開遊戲），則繼續往下找
}
```

### 5. 局歷史記錄

```javascript
roundHistory: {
  roundNumber: number,
  winner: string | null,      // 當局猜對的玩家（如有）
  hiddenCards: string[],      // 當局的蓋牌
  actions: [...],             // 當局的所有行動
  scoreChanges: {             // 當局的分數變化
    [playerId]: number
  }
}
```

### 6. 遊戲狀態過渡

```
playing → followGuessing → (驗證結果) → roundEnd → playing (新局)
                                      ↓
                                 finished (有人達 7 分)
```

## 驗收標準

- [ ] 有人猜對時正確結束當局
- [ ] 所有人退出時正確結束當局
- [ ] 最後一人猜錯時正確結束當局
- [ ] 正確檢查勝利條件（7 分）
- [ ] 達到 7 分時正確結束整場遊戲
- [ ] 下一局正確重置玩家狀態
- [ ] 下一局正確重新發牌
- [ ] 起始玩家計算正確
- [ ] 分數在各局間正確保留
- [ ] 局歷史正確記錄
