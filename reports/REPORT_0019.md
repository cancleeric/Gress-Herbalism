# 報告書 0019

**工作單編號：** 0019

**完成日期：** 2026-01-23

## 完成內容摘要

建立問牌介面（QuestionCard）組件，實作問牌操作的完整 UI。

### 實作內容

1. **`frontend/src/components/QuestionCard/QuestionCard.js`**
   - 函數式組件，使用 React Hooks
   - 三個子組件：ColorSelector、PlayerSelector、QuestionTypeSelector
   - PropTypes 類型檢查

2. **顏色選擇器 (ColorSelector)**
   - 顯示四種顏色選項（red, yellow, green, blue）
   - 最多可選擇兩個顏色
   - 點擊切換選擇狀態
   - 顯示已選擇顏色提示

3. **目標玩家選擇器 (PlayerSelector)**
   - 排除當前玩家（不能問自己）
   - 顯示其他玩家列表
   - 單選模式

4. **要牌方式選擇器 (QuestionTypeSelector)**
   - 三種問牌方式：
     - 方式 1：兩個顏色各一張
     - 方式 2：其中一種顏色全部
     - 方式 3：給其中一種顏色一張，要另一種顏色全部
   - 顯示方式編號和描述

5. **表單驗證**
   - 必須選擇兩個不同顏色
   - 必須選擇目標玩家
   - 必須選擇要牌方式
   - 未完成時確認按鈕禁用

6. **提交與取消**
   - 確認問牌：調用 onSubmit 並傳遞選擇資料
   - 取消：調用 onCancel
   - 提交後自動重置表單

7. **無障礙功能**
   - `aria-pressed` 屬性
   - `aria-label` 屬性
   - `role="alert"` 錯誤訊息

## 單元測試

**Tests: 284 passed** (新增 26 個測試)

- 渲染測試（標題、各區域、按鈕）
- 顏色選擇器測試（選擇、取消、上限）
- 目標玩家選擇器測試（排除自己、選擇）
- 要牌方式選擇器測試
- 表單驗證測試
- 提交和取消測試
- 樣式類別測試

## 驗收標準完成狀態

- [x] `QuestionCard.js` 組件已建立
- [x] 可以選擇兩個不同顏色
- [x] 可以選擇目標玩家（排除自己）
- [x] 可以選擇三種要牌方式之一
- [x] 有確認和取消按鈕
- [x] 表單驗證完整
- [x] 組件有完整的 JSDoc 註解
