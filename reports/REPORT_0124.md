# 完成報告 0124：遊戲進行中階段 UI 重新設計

## 工單
WORK_ORDER_0124.md

## 完成狀態
已完成

## 實作內容

### 1. 三欄式佈局（左-中-右）+ 底部手牌區

#### 左欄（`playing-left-column`）
- 自己的玩家卡片：大頭像 + ME 標籤 + 分數/手牌統計
- 遊戲紀錄面板：可滾動的歷史記錄列表，自己的記錄用綠色邊框標示

#### 中央區域（`playing-center-column`）
- 蓋牌區（The Hidden Cure）：兩張蓋牌（綠色背景 + 問號圖示）
- 顏色組合牌（Inquiry Cards）：6 張牌排成 2 排 x 3 列
  - 紅+黃、紅+綠、紅+藍
  - 黃+綠、黃+藍、綠+藍
  - 點擊可開始問牌流程

#### 右欄（`playing-right-column`）
- 玩家列表：顯示頭像、名稱、分數、手牌數
- 當前回合玩家：金色邊框 + 「回合」標籤
- 已退出玩家：「已退出」標籤 + 淡化顯示
- 底部：回合資訊提示「輪到 XX 行動」

#### 底部手牌區（`playing-footer`）
- 左側：「我的手牌」標籤 + 手牌數量
- 中間：手牌卡片（紅、黃、綠、藍）+ hover 浮起效果
- 右側：猜牌按鈕

### 2. Header
- 左側：品牌標誌「Herbalism 本草」+ 綠色脈動點 + 「遊戲進行中」狀態
- 右側：「離開」按鈕

### 3. 樣式更新
- 新增 `playing-stage` 相關 CSS 類別
- 支援三欄式響應式設計（桌面、平板、手機）
- 顏色組合牌 hover 效果
- 手牌 hover 浮起動畫
- 已退出玩家標籤樣式（`playing-eliminated-badge`）

## 變更的檔案

1. **frontend/src/components/GameRoom/GameRoom.js**
   - 新增遊戲進行中專用三欄式 UI（約 500 行）
   - 新增 `colorCombinations` 定義
   - 刪除底部問牌按鈕（保留猜牌按鈕）
   - 新增已退出玩家標籤

2. **frontend/src/components/GameRoom/GameRoom.css**
   - 新增 `playing-stage` 容器樣式
   - 新增 `playing-header` 樣式
   - 新增 `playing-left-column`、`playing-center-column`、`playing-right-column` 樣式
   - 新增 `playing-footer` 手牌區樣式
   - 新增 `playing-inquiry-card` 顏色組合牌樣式
   - 新增 `playing-eliminated-badge` 已退出標籤樣式
   - 新增響應式設計斷點

3. **frontend/src/components/GameRoom/GameRoom.test.js**
   - 更新測試以匹配新的 playing stage UI
   - 更新 class 檢查（`playing-stage`、`playing-header` 等）
   - 更新文字模式檢查（「分數: X | 手牌: Y」格式）
   - 更新操作按鈕測試（「問牌選擇」、「輪到 XX 行動」）
   - 更新跟猜和局結束階段測試

## 測試結果

```
GameRoom.test.js
Test Suites: 1 passed, 1 total
Tests:       55 passed, 55 total
```

## 備註

1. 底部問牌按鈕已刪除（根據用戶要求），玩家通過點擊中央的顏色組合牌開始問牌流程
2. App.test.js 有 6 個失敗的測試，但這是之前 Lobby 重新設計（工單 0122）時遺留的問題，與本工單無關
3. 遊戲進行中、問牌後、跟猜、局結束等階段都使用相同的 playing stage UI，模態框根據狀態顯示

## 完成日期
2026-01-26
