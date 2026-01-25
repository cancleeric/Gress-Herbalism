# 工單完成報告 0078

**日期：** 2026-01-25

**工作單標題：** 「其中一種全部」要牌方式選擇邏輯修正

**工單主旨：** BUG 修復 - 避免暴露被要牌玩家的手牌資訊

**分類：** BUG

**相關工單：** 0069

---

## 驗證結果

經過程式碼審查，此功能**已正確實作**，無需修改。

## 現有實作分析

### 後端 (server.js)

```javascript
// 問牌類型 2：其中一種顏色全部
} else if (questionType === 2) {
  const hasColor0 = target.hand.some(c => c.color === colors[0]);
  const hasColor1 = target.hand.some(c => c.color === colors[1]);

  const availableColors = [];
  if (hasColor0) availableColors.push(colors[0]);
  if (hasColor1) availableColors.push(colors[1]);

  // 無論有幾種顏色，都觸發選擇流程（避免洩漏手牌資訊）
  return {
    success: true,
    requireColorChoice: true,
    ...
  };
}
```

事件發送邏輯：
- `colorChoiceRequired` → 只發送給被要牌玩家（包含 `availableColors`）
- `waitingForColorChoice` → 廣播給所有玩家（**不包含** `availableColors`）

### 前端 (GameRoom.js)

#### 被要牌玩家看到的介面

| 情境 | 顯示內容 |
|------|---------|
| 兩種顏色都有 | 兩個可選按鈕 |
| 只有一種顏色 | 一個可選按鈕，另一個顯示 "(無)" 並禁用 |
| 兩種都沒有 | 顯示 "你沒有這兩種顏色的牌" 和 "確認（無牌可給）" |

#### 其他玩家看到的介面

```
等待 [玩家名] 選擇要給哪種顏色...
```

**無法得知**被要牌玩家有哪些顏色可選。

## 驗收項目

- [x] 「其中一種全部」時，被要牌玩家**一定**進入選擇流程
- [x] 選項中只有自己有的顏色可選
- [x] 沒有的顏色顯示為不可選（灰色 + "(無)"）
- [x] 其他玩家無法看到哪些選項可選
- [x] 其他玩家只看到「正在選擇中」的提示
- [x] 兩種都沒有時顯示「無牌可給」

## 測試結果

現有測試已覆蓋：
- `應處理顏色選擇請求事件` - 驗證被要牌玩家收到選擇介面
- `應處理等待顏色選擇事件` - 驗證其他玩家看到等待訊息

所有測試通過：776 個測試

---

**狀態：** ✅ 已實作（驗證通過）
