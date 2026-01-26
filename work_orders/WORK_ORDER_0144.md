# 工作單 0144

**日期：** 2026-01-26

**工作單標題：** 修復遊戲紀錄未顯示給牌數量的問題

**工單主旨：** BUG 修復 - 遊戲紀錄應顯示問牌時給出的牌數

**優先級：** 高

**依賴工單：** 無

---

## 一、問題描述

### 現象
遊戲紀錄只顯示「誰向誰問了什麼顏色的牌（方式）」，但沒有顯示實際給出了幾張牌。

### 現有顯示
```
玩家A 向 玩家B 問了 紅黃 牌（各一張）
```

### 期望顯示
```
玩家A 向 玩家B 問了 紅黃 牌（各一張），獲得 2 張
```

### 根本原因
1. 後端 `server.js` 在記錄遊戲歷史時，有正確傳送 `cardsTransferred` 欄位
2. 前端 `GameRoom.js` 的 `formatHistoryRecord` 函數在處理 `question` 類型時，沒有使用 `cardsTransferred` 欄位

---

## 二、問題分析

### 後端（正確）
```javascript
// server.js:1438
gameState.gameHistory.push({
  type: 'question',
  playerId,
  targetPlayerId,
  colors,
  questionType,
  cardsTransferred: cardsToGive.length || cardsToReceive.length,  // ✓ 已傳送
  timestamp: Date.now()
});
```

### 前端（需修復）
```javascript
// GameRoom.js:861-864
case 'question': {
  // ...
  return {
    playerName,
    action: `向 ${targetPlayer?.name || '玩家'} 問了 ${colors} 牌（${typeText}）`
    // ✗ 缺少 cardsTransferred 顯示
  };
}
```

---

## 三、修復方案

修改 `frontend/src/components/GameRoom/GameRoom.js` 中的 `formatHistoryRecord` 函數，在 `question` case 中加入 `cardsTransferred` 的顯示。

### 修改內容

```javascript
case 'question': {
  const targetPlayer = gameState.players.find(p => p.id === record.targetPlayerId);
  const colors = record.colors?.map(c => colorNames[c] || c).join('') || '';
  const questionTypes = {
    1: '各一張',
    2: '其中一種全部',
    3: '給一張要全部'
  };
  const typeText = questionTypes[record.questionType] || '';
  const cardsCount = record.cardsTransferred || 0;
  return {
    playerName,
    action: `向 ${targetPlayer?.name || '玩家'} 問了 ${colors} 牌（${typeText}），獲得 ${cardsCount} 張`
  };
}
```

---

## 四、修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `frontend/src/components/GameRoom/GameRoom.js` | formatHistoryRecord 函數加入 cardsTransferred 顯示 |

---

## 五、驗收標準

- [ ] 問牌後，遊戲紀錄顯示獲得的牌數
- [ ] 獲得 0 張時顯示「獲得 0 張」
- [ ] 不影響其他類型的遊戲紀錄（prediction、guess、followGuess 等）
- [ ] 紀錄格式清晰易讀

---

## 六、測試步驟

1. 開始一場遊戲
2. 進行問牌動作
3. 確認遊戲紀錄顯示「向 XXX 問了 XX 牌（方式），獲得 N 張」
4. 測試不同問牌方式（各一張、其中一種全部、給一張要全部）
5. 確認所有情況都正確顯示牌數

