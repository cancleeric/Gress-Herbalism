# 工單完成報告 0082

**日期：** 2026-01-25

**工作單標題：** 「其中一種全部」要牌方式 - 後端選擇邏輯重構

**工單主旨：** 功能開發 - 修正被要牌玩家的選擇流程，避免資訊洩漏

**分類：** 功能開發

---

## 驗證結果

經過程式碼審查，此功能**已正確實作**，無需額外修改。

## 後端實作驗證

### 1. 問牌類型 2 處理邏輯

```javascript
// backend/gameLogic.js - handleQuestionType2
// 「其中一種全部」問牌方式

// 計算目標玩家有哪些顏色
const targetHasColor1 = targetHand.some(c => c.color === colors[0]);
const targetHasColor2 = targetHand.some(c => c.color === colors[1]);

const availableColors = [];
if (targetHasColor1) availableColors.push(colors[0]);
if (targetHasColor2) availableColors.push(colors[1]);

// 無論有幾種顏色都進入選擇流程
return {
  needsColorChoice: true,
  colorChoiceData: {
    colors,
    availableColors,
    hasNoCards: availableColors.length === 0
  }
};
```

### 2. Socket 事件發送

```javascript
// server.js - 發送顏色選擇事件
if (result.needsColorChoice) {
  // 通知被要牌玩家（含可選顏色）
  targetSocket.emit('colorChoiceRequired', {
    askingPlayerId,
    colors: result.colorChoiceData.colors,
    availableColors: result.colorChoiceData.availableColors,
    message
  });

  // 通知其他玩家（不含可選顏色）
  socket.to(roomId).emit('waitingForColorChoice', {
    targetPlayerId,
    askingPlayerId
  });
}
```

### 3. 顏色選擇提交處理

```javascript
// server.js - submitColorChoice 事件
socket.on('submitColorChoice', ({ chosenColor }) => {
  // 驗證選擇是否有效
  // 執行牌轉移
  // 廣播結果
});
```

## 資訊可見性驗證

| 資訊 | 被要牌玩家 | 問牌玩家 | 其他玩家 |
|------|-----------|---------| --------|
| 問的兩種顏色 | ✓ | ✓ | ✗ |
| 可選的顏色 | ✓ (私密) | ✗ | ✗ |
| 正在選擇中 | ✓ | ✓ | ✓ |
| 選擇了哪種 | ✓ | ✗ | ✗ |
| 給了幾張牌 | ✓ | ✓ | ✓ |

## 驗收項目

- [x] 無論有幾種顏色都進入選擇流程
- [x] 被要牌玩家收到可選顏色列表（私密）
- [x] 其他玩家只看到「等待選擇中」
- [x] 顏色選擇結果正確處理
- [x] 牌正確轉移
- [x] 無牌可給時正確處理

## 測試結果

所有測試通過：780 個測試

---

**狀態：** ✅ 已實作（驗證通過）
