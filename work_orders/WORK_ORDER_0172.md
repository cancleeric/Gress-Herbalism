# 工作單 0172

**編號**：0172

**日期**：2026-01-27

**工作單標題**：前端 — 猜牌結果面板重構

**工單主旨**：修正猜牌結果面板的顯示邏輯，按鈕只顯示給猜牌者，跟猜者等待

---

## 內容

### 背景

目前的猜牌結果面板有三個問題：
1. 猜錯時仍顯示蓋牌答案
2. 所有玩家都看到操作按鈕（應只有猜牌者看到）
3. 猜錯但遊戲繼續時只顯示 3 秒 toast，沒有完整結果面板

### 工作內容

#### 1. 修改 `GameRoom.js` — guessResult 事件處理

移除 `showBriefGuessResult` toast 邏輯，統一使用完整結果面板：

```javascript
// 不管猜對猜錯，都顯示完整結果面板
setShowRoundEnd(true);
```

#### 2. 修改結果面板 — 蓋牌區塊條件顯示

只在猜對且有蓋牌資料時顯示：

```javascript
{guessResultData.isCorrect && guessResultData.hiddenCards && (
  <div className="gr-hidden-cards">...</div>
)}
```

#### 3. 修改結果面板 — 按鈕只顯示給猜牌者

比對 `guessingPlayerId` 與當前玩家 ID：

```javascript
{guessResultData.guessingPlayerId === currentPlayerId && (
  // 顯示按鈕
)}
```

跟猜者和其他玩家看到結果面板但沒有按鈕，等待猜牌者操作。

#### 4. 修改按鈕文字和行為

| 條件 | 按鈕文字 | 行為 | 誰看到 |
|------|---------|------|-------|
| 猜對 + 未結束 | 下一局 | `startNextRound` | 猜牌者 |
| 猜錯 + 遊戲繼續 | 繼續觀戰遊戲 | `dismissGuessResult` | 猜牌者 |
| 猜錯 + 全員退出 | 下一局 | `startNextRound` | 猜牌者 |
| 遊戲結束（finished） | 離開房間 | `handleLeaveRoom` | 所有人 |

#### 5. 修改 `socketService.js` — 新增事件函數

```javascript
// 發送關閉結果面板
export function dismissGuessResult(gameId) {
  const s = getSocket();
  s.emit('dismissGuessResult', { gameId });
}

// 監聽結果面板關閉
export function onGuessResultDismissed(callback) {
  return safeOn('guessResultDismissed', callback);
}
```

#### 6. 修改 `GameRoom.js` — 監聽 `guessResultDismissed`

```javascript
const unsubDismiss = onGuessResultDismissed(() => {
  setShowRoundEnd(false);
  setGuessResultData(null);
});
```

#### 7. 清理 `showBriefGuessResult` 相關程式碼

移除不再需要的 toast 相關狀態和 UI 元件。

### 驗收標準

| 標準 | 說明 |
|------|------|
| 猜對顯示蓋牌 | 結果面板顯示蓋牌答案 |
| 猜錯不顯示蓋牌 | 結果面板不顯示蓋牌區塊 |
| 按鈕只給猜牌者 | 跟猜者和其他玩家看不到按鈕 |
| 猜對按鈕 | 猜牌者看到「下一局」 |
| 猜錯+繼續按鈕 | 猜牌者看到「繼續觀戰遊戲」 |
| 猜錯+全退按鈕 | 猜牌者看到「下一局」 |
| 關閉面板廣播 | 猜牌者按按鈕後所有人面板關閉 |
| 既有測試通過 | 前端相關測試通過 |

---

**相關計畫書**：`docs/BUG_FIX_PLAN_GUESS_WRONG.md`

**相關檔案**：
- `frontend/src/components/GameRoom/GameRoom.js`
- `frontend/src/services/socketService.js`
