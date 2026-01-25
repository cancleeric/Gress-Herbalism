# 工單完成報告 0074

**日期：** 2026-01-25

**工作單標題：** 問牌流程重構 - 先選顏色牌

**工單主旨：** 功能開發 - 改為先從桌面選顏色牌，再選目標與方式

**依賴工單：** 0073（桌面顏色牌介面設計）

---

## 完成摘要

成功重構問牌流程，將原本「手動選擇兩種顏色」改為「從桌面點擊顏色組合牌」的方式，簡化操作流程並提供更直覺的使用體驗。

## 實作內容

### 1. 新增檔案

#### QuestionFlow 組件
- `frontend/src/components/QuestionFlow/QuestionFlow.js` - 問牌流程主組件
- `frontend/src/components/QuestionFlow/QuestionFlow.css` - 樣式檔案
- `frontend/src/components/QuestionFlow/index.js` - 匯出檔案
- `frontend/src/components/QuestionFlow/QuestionFlow.test.js` - 測試檔案（15 個測試）

### 2. 修改檔案

#### GameBoard.js
- 新增 props：`canSelectColorCard`、`disabledColorCardId`、`onColorCardSelect`
- 根據狀態切換 ColorCombinationCards 的互動模式
- 顯示「點擊顏色牌開始問牌」提示

#### GameBoard.css
- 新增 `.select-card-hint` 樣式

#### GameRoom.js
- 引入 QuestionFlow 組件
- 新增狀態：`selectedColorCard`、`showQuestionFlow`、`lastUsedColorCardId`
- 新增處理函數：`handleColorCardSelect`、`handleQuestionFlowSubmit`、`handleQuestionFlowCancel`
- 更新 GameBoard 傳遞互動相關 props
- 移除「問牌」按鈕，改為提示文字
- 新增 QuestionFlow Modal 渲染

#### GameRoom.css
- 新增 `.action-hint` 樣式

#### GameRoom.test.js
- 更新測試以反映新的問牌流程

## 新問牌流程

### 原本流程
```
1. 點擊「問牌」按鈕
2. 手動選擇第一種顏色
3. 手動選擇第二種顏色
4. 選擇目標玩家
5. 選擇要牌方式
6. 確認
```

### 新流程
```
1. 直接點擊桌面中央的顏色組合牌（如：紅綠）
2. 選擇目標玩家
3. 選擇要牌方式
4. 確認問牌
```

## 介面設計

### 顏色組合牌互動
- **可選擇狀態**：正常顯示，可點擊
- **已選擇狀態**：高亮邊框
- **禁用狀態**：灰色半透明（上回合選過的牌）
- **Hover 效果**：放大陰影

### QuestionFlow Modal
```
┌─────────────────────────────────────────┐
│  問牌                                    │
│  🔴 紅色 + 🟢 綠色                       │
├─────────────────────────────────────────┤
│                                         │
│  [步驟內容區域]                          │
│  - 選擇目標玩家                          │
│  - 選擇要牌方式                          │
│  - 確認問牌                              │
│                                         │
├─────────────────────────────────────────┤
│  [取消/上一步]         [確認問牌]        │
└─────────────────────────────────────────┘
```

## 驗收項目

- [x] 點擊顏色牌開始問牌流程
- [x] 選擇顏色牌後進入選擇目標玩家步驟
- [x] 選擇目標玩家後進入選擇要牌方式步驟
- [x] 確認後執行問牌
- [x] 移除原本的「問牌」按鈕（保留舊組件作為備用）
- [x] 流程可以取消/返回上一步

## 測試結果

- 新增測試：15 個 QuestionFlow 測試案例
- 所有測試通過：775 個測試
- 測試覆蓋：
  - 空值不渲染
  - 步驟流程導航
  - 返回上一步功能
  - 類型3特殊流程（給牌顏色選擇）
  - 排除非活躍玩家
  - 載入狀態處理

## 技術說明

### 顏色牌選擇追蹤
使用 `lastUsedColorCardId` 狀態追蹤上回合使用的顏色牌，用於在下回合禁用該牌（此功能準備給工單 0075 使用）。

### 流程步驟管理
QuestionFlow 組件使用內部狀態管理步驟流程：
- `SELECT_PLAYER`：選擇目標玩家
- `SELECT_TYPE`：選擇問牌方式
- `SELECT_GIVE_COLOR`：選擇給牌顏色（類型3）
- `CONFIRM`：確認問牌

### 類型3特殊處理
當選擇「給一張要全部」方式時：
- 若玩家兩種顏色都有：進入顏色選擇步驟
- 若玩家只有一種顏色：自動使用該顏色，直接進入確認
- 若玩家兩種顏色都沒有：顯示錯誤訊息

---

**狀態：** ✅ 完成
