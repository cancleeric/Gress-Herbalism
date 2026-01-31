# 完成報告 0172

**工作單編號**：0172

**完成日期**：2026-01-27

**完成內容摘要**：

前端猜牌結果面板重構：修正顯示邏輯，按鈕只顯示給猜牌者，跟猜者等待。

### 修改內容

#### 1. `socketService.js` — 新增兩個函數

- `dismissGuessResult(gameId)`：發送關閉結果面板事件
- `onGuessResultDismissed(callback)`：監聽結果面板關閉事件

#### 2. `GameRoom.js` — 移除 showBriefGuessResult toast 邏輯

- 移除 `showBriefGuessResult` 狀態
- 移除 3 秒自動關閉的 useEffect
- 移除 brief toast UI 元件
- 統一使用完整結果面板（`showRoundEnd`），不論猜對猜錯

#### 3. `GameRoom.js` — 蓋牌區塊條件顯示

```javascript
{guessResultData.isCorrect && guessResultData.hiddenCards && (
  <div className="gr-hidden-cards">...</div>
)}
```

猜錯時不顯示蓋牌答案。

#### 4. `GameRoom.js` — 按鈕只顯示給猜牌者

| 條件 | 按鈕文字 | 行為 | 誰看到 |
|------|---------|------|-------|
| 猜對 + 未結束 | 下一局 | `startNextRound` | 猜牌者 |
| 猜錯 + 遊戲繼續 | 繼續觀戰遊戲 | `dismissGuessResult` | 猜牌者 |
| 猜錯 + 全員退出 | 下一局 | `startNextRound` | 猜牌者 |
| 遊戲結束（finished） | 離開房間 | `handleLeaveRoom` | 所有人 |

跟猜者和其他玩家看到「等待猜牌者操作...」文字。

#### 5. `GameRoom.js` — 新增 handleDismissGuessResult 函數

本地模式直接關閉面板，多人模式發送 `dismissGuessResult` 事件通知所有玩家。

#### 6. `GameRoom.js` — 監聽 guessResultDismissed 事件

收到事件後關閉結果面板、清除資料。

#### 7. 更新測試 mock

5 個測試檔案新增 `onGuessResultDismissed` 和 `dismissGuessResult` 的 mock：
- `GameRoom.test.js`
- `GameRoom.local.test.js`
- `GameRoom.ai-visual.test.js`
- `SinglePlayerMode.test.js`
- `SinglePlayerURLParsing.test.js`

### 遇到的問題與解決方案

| 問題 | 解決方案 |
|------|---------|
| `unsubDismiss is not a function` 測試錯誤 | 5 個測試檔案缺少新增 socket 事件的 mock，補充後解決 |

### 測試結果

- 後端測試：**190/190 通過**
- 前端 GameRoom 測試：**61/61 通過**
- 前端 auth/socket 測試：**67/67 通過**
- 其餘失敗為既有問題（AI 常數、ParamTuning、App.test.js）

### 下一步計劃

- 提交 git commit
- 部署到 Cloud Run 進行實際測試
