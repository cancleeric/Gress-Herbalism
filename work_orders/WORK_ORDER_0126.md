# 工單 0126：BUG 修復 - 遊戲紀錄顯示格式不匹配

## 問題描述

在工單 0124 重新設計遊戲進行中 UI 時，遊戲紀錄無法正確顯示，因為前端預期的數據格式與後端發送的格式不匹配。

## 問題根因

**後端發送的 gameHistory 格式**（server.js）：
```js
{
  type: 'question',
  playerId: 'xxx',
  targetPlayerId: 'yyy',
  colors: ['red', 'blue'],
  questionType: 1,
  cardsTransferred: 2,
  timestamp: Date.now()
}
```

**前端預期的格式**（GameRoom.js 第 869-873 行）：
```jsx
{record.playerName || '玩家'}
{record.action || record.message}
```

前端嘗試讀取 `playerName` 和 `action/message` 欄位，但後端沒有發送這些欄位。

## 修復方案

在前端渲染時，根據 `type` 和其他欄位動態生成顯示文字：

```jsx
const formatHistoryRecord = (record, players) => {
  const player = players.find(p => p.id === record.playerId);
  const playerName = player?.name || '玩家';

  switch (record.type) {
    case 'question':
      const targetPlayer = players.find(p => p.id === record.targetPlayerId);
      const colorNames = record.colors.map(c =>
        c === 'red' ? '紅' : c === 'yellow' ? '黃' : c === 'green' ? '綠' : '藍'
      ).join('');
      return {
        playerName,
        action: `向 ${targetPlayer?.name || '玩家'} 問了 ${colorNames} 牌`
      };
    case 'prediction':
      const colorName = record.color === 'red' ? '紅' :
                       record.color === 'yellow' ? '黃' :
                       record.color === 'green' ? '綠' : '藍';
      return {
        playerName,
        action: `預測蓋牌有 ${colorName} 色`
      };
    case 'guess':
      return {
        playerName,
        action: `猜牌 ${record.isCorrect ? '成功' : '失敗'}`
      };
    default:
      return {
        playerName,
        action: record.message || '未知操作'
      };
  }
};
```

## 技術實作

### 檔案變更
1. **GameRoom.js** - 新增 `formatHistoryRecord` 函數，轉換後端數據格式
2. **GameRoom.test.js** - 更新測試驗證新格式

## 驗收標準

1. 遊戲紀錄應正確顯示玩家名稱
2. 問牌紀錄應顯示「向 XX 問了 紅藍 牌」格式
3. 預測紀錄應顯示「預測蓋牌有 X 色」格式
4. 猜牌紀錄應顯示「猜牌成功/失敗」格式
5. 所有測試通過

## 優先級
高（功能缺失）

## 相關工單
- 工單 0124：遊戲進行中階段 UI 重新設計
