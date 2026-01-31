# 完成報告 0049

**日期：** 2026-01-24

**工作單標題：** 計分和跟猜 UI 組件

**工單主旨：** 規則擴充 - 實作計分板和跟猜介面的前端組件

## 完成內容

### 1. 計分板功能

在玩家列表中整合分數顯示：
- 每個玩家旁邊顯示當前分數
- 在局結束畫面中顯示完整的分數排行
- 勝利者標示 (達到 7 分)

### 2. 跟猜決定介面

實作 Modal 形式的跟猜面板 (`showFollowGuessPanel`)：

```jsx
{showFollowGuessPanel && followGuessData && (
  <div className="modal-overlay">
    <div className="follow-guess-card">
      <h3>跟猜階段</h3>
      {/* 顯示猜測內容 */}
      {/* 顯示跟猜狀態 */}
      {/* 跟猜/不跟猜 按鈕 */}
    </div>
  </div>
)}
```

功能：
- 顯示猜牌玩家和猜測的顏色
- 顯示其他玩家的決定狀態（跟猜/不跟/等待中）
- 提示跟猜風險（跟對 +1，跟錯 -1）
- 「跟猜」和「不跟猜」按鈕

### 3. 局結束畫面

實作 Modal 形式的局結束面板 (`showRoundEnd`)：

功能：
- 顯示猜測結果（猜對/猜錯）
- 顯示蓋牌答案
- 顯示本局分數變化（+3/-1 等）
- 顯示當前總分
- 「開始下一局」按鈕
- 遊戲結束時顯示最終贏家

### 4. Socket 事件處理

新增的事件監聽：
- `followGuessStarted` - 進入跟猜階段
- `followGuessUpdate` - 更新跟猜狀態
- `guessResult` - 猜牌結果
- `roundStarted` - 新局開始

### 5. 遊戲階段常數更新

在 `frontend/src/shared/constants.js` 中新增：
- `GAME_PHASE_FOLLOW_GUESSING = 'followGuessing'`
- `GAME_PHASE_ROUND_END = 'roundEnd'`

### 6. CSS 樣式

新增樣式類別：
- `.player-score` - 玩家分數顯示
- `.color-badge` / `.card-badge` - 顏色標籤
- `.follow-guess-modal` - 跟猜面板樣式
- `.round-end-modal` - 局結束面板樣式
- `.score-changes` - 分數變化列表
- `.btn-success` - 跟猜確認按鈕

## 驗收結果

- [x] 計分板正確顯示所有玩家分數
- [x] 跟猜介面正確顯示猜測內容
- [x] 可以選擇跟猜或不跟猜
- [x] 顯示其他玩家的決定狀態
- [x] 局結束畫面正確顯示結果
- [x] 遊戲結束畫面正確顯示最終排名
- [x] Socket 事件正確處理
- [x] 遊戲階段文字正確顯示

## 修改的檔案

1. `frontend/src/components/GameRoom/GameRoom.js` - 新增 UI 組件
2. `frontend/src/components/GameRoom/GameRoom.css` - 新增樣式
3. `frontend/src/shared/constants.js` - 新增遊戲階段常數

## 實作說明

為了簡化架構，所有新增的 UI 組件都整合在 GameRoom.js 中，而非建立獨立的組件檔案。這樣的做法：
- 減少檔案數量
- 簡化狀態管理（直接使用 GameRoom 的 state）
- 便於維護和調試

如果未來需要更複雜的功能，可以再拆分成獨立組件。

## 備註

工單 0050 將進行整合測試，驗證完整的遊戲流程。
