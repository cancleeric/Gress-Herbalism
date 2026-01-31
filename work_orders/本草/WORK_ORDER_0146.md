# 工作單 0146

**日期：** 2026-01-27

**工作單標題：** 修復問牌類型2當被問玩家無牌時卡住的問題

**工單主旨：** BUG 修復 - 問牌方式「其中一種顏色全部」當被問玩家兩種顏色都沒有時卡住

**優先級：** 高

**依賴工單：** 無

---

## 一、問題描述

### 現象
當使用問牌方式 2（其中一種顏色全部）時，如果被問牌玩家兩種顏色都沒有，遊戲會卡在被問牌玩家的選顏色階段，無法繼續。

### 重現步驟
1. 玩家 A 對玩家 B 使用「其中一種顏色全部」問牌
2. 選擇兩種顏色（例如紅、黃）
3. 玩家 B 剛好沒有紅色也沒有黃色
4. 玩家 B 看到「你沒有這兩種顏色的牌」訊息
5. 玩家 B 點擊「確認（無牌可給）」按鈕
6. **BUG：** 遊戲卡住，無法繼續

### 期望行為
1. 玩家 B 點擊「確認（無牌可給）」後
2. 遊戲應該正常進入下一階段（問牌後階段）
3. 紀錄顯示「獲得 0 張」

---

## 二、問題分析

### 根本原因

**後端 `server.js` 第 774-778 行**的顏色驗證邏輯有缺陷：

```javascript
// 驗證選擇的顏色是否有效
if (!pendingChoice.colors.includes(chosenColor)) {
  socket.emit('error', { message: '無效的顏色選擇' });
  return;
}
```

**問題：**
- 前端在無牌可給時發送 `chosenColor: 'none'`
- 後端驗證 `'none'` 是否在 `pendingChoice.colors` 中（例如 `['red', 'yellow']`）
- 驗證失敗，返回錯誤，遊戲卡住

### 資料流

```
前端發送: { gameId, chosenColor: 'none' }
          ↓
後端驗證: pendingChoice.colors.includes('none')  // → false
          ↓
後端返回: error { message: '無效的顏色選擇' }
          ↓
遊戲卡住
```

---

## 三、修復方案

### 3.1 修改驗證邏輯

在 `colorChoiceSubmit` 事件處理中，特殊處理 `'none'` 的情況：

**修改位置：** `backend/server.js` 第 774-778 行

**修改前：**
```javascript
// 驗證選擇的顏色是否有效
if (!pendingChoice.colors.includes(chosenColor)) {
  socket.emit('error', { message: '無效的顏色選擇' });
  return;
}
```

**修改後：**
```javascript
// 驗證選擇的顏色是否有效
// 'none' 是有效選擇當 availableColors 為空時
const isNoneChoice = chosenColor === 'none' && pendingChoice.availableColors.length === 0;
if (!isNoneChoice && !pendingChoice.colors.includes(chosenColor)) {
  socket.emit('error', { message: '無效的顏色選擇' });
  return;
}
```

### 3.2 修改 processColorChoice 函數

確保 `processColorChoice` 函數能處理 `'none'` 的情況：

**修改位置：** `backend/server.js` 的 `processColorChoice` 函數

需要在函數開頭加入對 `'none'` 的處理，直接返回 0 張牌轉移的結果。

---

## 四、修改檔案

| 檔案 | 行號 | 修改內容 |
|------|------|----------|
| `backend/server.js` | 774-778 | 修改驗證邏輯，允許 'none' |
| `backend/server.js` | processColorChoice | 處理 'none' 選擇 |

---

## 五、驗收標準

- [ ] 問牌類型2，被問玩家無牌時，點擊「確認」後遊戲繼續
- [ ] 遊戲紀錄顯示「獲得 0 張」
- [ ] 問牌類型2，被問玩家有牌時，功能正常不受影響
- [ ] 問牌類型1、3 功能正常不受影響

---

## 六、測試步驟

1. 開始一場 3 人遊戲
2. 透過多次問牌，讓某玩家手牌只剩特定顏色
3. 對該玩家使用「其中一種顏色全部」問牌，選擇他沒有的兩種顏色
4. 該玩家應看到「你沒有這兩種顏色的牌」
5. 點擊「確認（無牌可給）」
6. 確認遊戲正常繼續，進入問牌後階段
7. 確認遊戲紀錄顯示正確

