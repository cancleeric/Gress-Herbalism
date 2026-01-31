# 報告書 0021

**工作單編號：** 0021

**完成日期：** 2026-01-23

## 完成內容摘要

建立猜牌介面（GuessCard）組件，實作猜牌操作的完整 UI。

### 實作內容

1. **`frontend/src/components/GuessCard/GuessCard.js`**
   - 函數式組件，使用 React Hooks
   - 三個子組件：GuessColorSelector、HiddenCardsReveal、GuessResult
   - PropTypes 類型檢查

2. **顏色選擇器 (GuessColorSelector)**
   - 允許選擇兩個顏色（可重複）
   - 已選顏色標籤顯示
   - 點擊標籤移除顏色
   - 選滿兩個後禁用其他選項

3. **警告提示**
   - 醒目的警告訊息「猜錯會退出遊戲！」
   - 脈動動畫效果
   - 紅色邊框和背景

4. **查看答案功能 (HiddenCardsReveal)**
   - 查看/隱藏答案切換按鈕
   - 蓋牌翻轉顯示效果
   - 未翻轉時顯示 "?"

5. **猜牌結果顯示 (GuessResult)**
   - 猜對：顯示成功訊息和正確答案
   - 猜錯：顯示退出遊戲訊息
   - 最後玩家猜錯：顯示「遊戲結束，沒有獲勝者」

6. **GuessCardContainer**
   - Redux 整合：取得遊戲狀態
   - gameService 整合：processGuessAction、revealHiddenCards
   - 載入狀態和結果狀態管理

7. **CSS 樣式**
   - 警告訊息脈動動畫
   - 顏色選擇器樣式
   - 已選顏色標籤樣式
   - 蓋牌翻轉樣式
   - 結果顯示樣式

### 程式碼變更

**新增檔案：**
- `frontend/src/components/GuessCard/GuessCard.js`
- `frontend/src/components/GuessCard/GuessCard.css`
- `frontend/src/components/GuessCard/GuessCard.test.js`
- `frontend/src/components/GuessCard/index.js`

**主要 Props：**
```javascript
GuessCard.propTypes = {
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  isOpen: PropTypes.bool,
  isLoading: PropTypes.bool,
  guessResult: PropTypes.object,
  onResultClose: PropTypes.func,
  hiddenCards: PropTypes.array,
  canViewAnswer: PropTypes.bool
};
```

## 單元測試

**Tests: 338 passed** (新增 33 個測試)

測試涵蓋：
- 渲染測試（5 個）
- 顏色選擇器測試（5 個）
- 表單驗證測試（3 個）
- 提交和取消測試（3 個）
- 載入狀態測試（2 個）
- 猜牌結果顯示測試（4 個）
- 查看答案功能測試（3 個）
- 樣式類別測試（5 個）
- Container Redux 整合測試（1 個）
- Container gameService 整合測試（1 個）
- Container 取消功能測試（1 個）

## 驗收標準完成狀態

- [x] `GuessCard.js` 組件已建立
- [x] 顏色選擇器已實作（可重複選擇）
- [x] 警告提示已實作
- [x] 表單驗證已實作
- [x] 猜牌時，猜牌者可以查看正確答案
- [x] 猜牌動作提交功能已實作
- [x] 猜對時，公布正確答案給所有玩家
- [x] 猜錯時，蓋牌保持隱藏狀態
- [x] 猜錯時，如果只剩一個玩家，顯示「遊戲結束，沒有獲勝者」
- [x] 猜牌結果顯示已實作
- [x] Redux 連接正確
- [x] 基本的樣式已設定
- [x] 組件有完整的 JSDoc 註解
