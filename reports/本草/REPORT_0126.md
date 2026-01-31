# 完成報告 0126：BUG 修復 - 遊戲紀錄顯示格式不匹配

## 工單
WORK_ORDER_0126.md

## 完成狀態
已完成

## 問題描述
前端預期的 gameHistory 數據格式（`playerName`, `action/message`）與後端發送的格式（`type`, `playerId`, `colors` 等）不匹配，導致遊戲紀錄無法正確顯示。

## 修復內容

### 1. GameRoom.js
新增 `formatHistoryRecord` 函數：

```javascript
const formatHistoryRecord = useCallback((record) => {
  // 如果已經有 action 或 message 欄位，直接使用
  if (record.action || record.message) {
    return { playerName, action: record.action || record.message };
  }

  // 根據 type 欄位生成顯示文字
  switch (record.type) {
    case 'question':
      return { playerName, action: `向 ${targetPlayer?.name} 問了 ${colors} 牌（${typeText}）` };
    case 'prediction':
      return { playerName, action: `預測蓋牌有 ${colorName} 色` };
    case 'guess':
      return { playerName, action: record.isCorrect ? '猜牌成功！' : '猜牌失敗' };
    default:
      return { playerName, action: '進行了操作' };
  }
}, [gameState.players]);
```

更新遊戲紀錄渲染，使用 `formatHistoryRecord` 函數轉換數據格式。

### 2. GameRoom.test.js
新增測試：
- 應正確顯示帶有 action 欄位的紀錄
- 應正確格式化後端的 question 類型紀錄
- 應正確格式化後端的 prediction 類型紀錄

## 測試結果

```
Test Suites: 1 passed, 1 total
Tests:       61 passed, 61 total
```

## 支援的紀錄類型

| type | 顯示格式 |
|------|---------|
| question | `向 [玩家名] 問了 [顏色] 牌（[類型]）` |
| prediction | `預測蓋牌有 [顏色] 色` |
| guess | `猜牌成功！` 或 `猜牌失敗` |
| 其他/舊格式 | 使用原有的 `action` 或 `message` 欄位 |

## 完成日期
2026-01-26
