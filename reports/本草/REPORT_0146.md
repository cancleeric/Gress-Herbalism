# 工單 0146 完成報告

**完成日期：** 2026-01-27

**工單標題：** 修復問牌類型2當被問玩家無牌時卡住的問題

---

## 一、完成摘要

已修復當使用問牌方式「其中一種顏色全部」時，被問玩家兩種顏色都沒有會導致遊戲卡住的 BUG。

---

## 二、修改內容

### 修改檔案

| 檔案 | 修改內容 |
|------|----------|
| `backend/server.js` | 修改 colorChoiceSubmit 的驗證邏輯 |

### 具體變更

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
// 'none' 是有效選擇當 availableColors 為空時（被問玩家兩種顏色都沒有）
const isNoneChoice = chosenColor === 'none' && pendingChoice.availableColors.length === 0;
if (!isNoneChoice && !pendingChoice.colors.includes(chosenColor)) {
  socket.emit('error', { message: '無效的顏色選擇' });
  return;
}
```

---

## 三、驗收結果

- [x] 問牌類型2，被問玩家無牌時，點擊「確認」後遊戲繼續
- [x] 遊戲紀錄顯示「獲得 0 張」
- [x] 問牌類型2，被問玩家有牌時，功能正常不受影響
- [x] 問牌類型1、3 功能正常不受影響

---

## 四、技術說明

### 問題根源
- 前端在被問玩家無牌可給時，發送 `chosenColor: 'none'`
- 後端 `processColorChoice` 函數已正確處理 `'none'` 的情況
- 但在驗證邏輯中，`'none'` 不在 `pendingChoice.colors` 陣列中，導致驗證失敗

### 修復邏輯
新增判斷：當 `chosenColor === 'none'` 且 `availableColors.length === 0` 時，視為有效選擇，允許通過驗證。

---

## 五、備註

`processColorChoice` 函數在第 1509 行已有處理 `'none'` 的邏輯，無需額外修改。

