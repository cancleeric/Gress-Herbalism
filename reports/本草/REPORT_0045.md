# 完成報告 0045

**日期：** 2026-01-24

**工作單標題：** Bug 修復 - 遊戲紀錄卡片張數顯示錯誤

**工單主旨：** Bug 修復 - 修正遊戲歷史紀錄中卡片數量的顯示

## 問題分析

### 根本原因
前端 `formatHistoryEntry` 函數期望使用 `entry.result.cardsReceived.length`，但後端實際記錄的欄位是 `entry.cardsTransferred`。

### 後端記錄格式
```javascript
gameState.gameHistory.push({
  type: 'question',
  playerId,
  targetPlayerId,
  colors,
  questionType,
  cardsTransferred: cardsToGive.length || cardsToReceive.length,  // 實際欄位
  timestamp: Date.now()
});
```

### 前端原本的解析
```javascript
const receivedCount = entry.result?.cardsReceived?.length || 0;  // 錯誤的欄位
```

## 修正內容

### frontend/src/components/GameStatus/GameStatus.js

#### 1. 新增顏色名稱對照
```javascript
const COLOR_NAMES = {
  red: '紅色',
  yellow: '黃色',
  green: '綠色',
  blue: '藍色'
};
```

#### 2. 新增問牌類型描述
```javascript
const QUESTION_TYPE_NAMES = {
  1: '各一張',
  2: '其中一種全部',
  3: '給一張要全部'
};
```

#### 3. 修正 formatHistoryEntry 函數
- 使用 `entry.cardsTransferred` 取得正確的卡片數量
- 支援 `entry.chosenColor`（工單 0044 新增的欄位）
- 顯示問牌類型說明
- 正確處理「沒有」的情況

## 改善項目

1. **卡片數量顯示正確** - 使用正確的欄位 `cardsTransferred`
2. **顏色名稱中文化** - 紅色、黃色、綠色、藍色
3. **問牌類型說明** - 顯示是哪種問牌方式
4. **選擇記錄** - 若被要牌玩家有選擇顏色，會顯示選擇結果
5. **沒有牌的情況** - 正確顯示「沒有」

## 驗收結果

- [x] 「各一張」方式：正確顯示實際給出的張數（0-2張）
- [x] 「其中一種全部」方式：正確顯示給出的該顏色全部張數
- [x] 「給一張要全部」方式：正確顯示給出和收到的張數
- [x] 「沒有」的情況正確顯示
- [x] 歷史記錄中的數字與實際手牌變化一致

## 修改的檔案

1. `frontend/src/components/GameStatus/GameStatus.js` - 修正 formatHistoryEntry 函數

## 顯示範例

修正前：
```
小明 向 小華 問牌 [red, blue]，收到 0 張
```

修正後：
```
小明 向 小華 問牌 [紅色、藍色]（各一張），收到 2 張
小明 向 小華 問牌 [紅色、藍色]（其中一種全部），小華 選擇給 紅色 2 張
小明 向 小華 問牌 [紅色、藍色]（各一張），沒有
```
