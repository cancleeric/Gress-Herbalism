# 報告書 0129：猜牌選擇面板 UI 重新設計

## 工作單編號
0129

## 完成日期
2026-01-26

## 完成內容摘要

根據 Stitch 設計稿，重新設計猜牌選擇面板（GuessCard），延續中國風草藥主題設計風格。

### 主要變更

1. **移除「查看答案」功能**
   - 移除 `canViewAnswer` 和 `hiddenCards` props
   - 移除 `HiddenCardsReveal` 組件
   - 移除「查看答案」按鈕和相關邏輯
   - 符合遊戲規則：答案只有猜對後才揭示

2. **UI 重新設計**
   - 新增中國風草藥紋理背景（herbal-pattern）
   - 新增角落裝飾圖案（雲紋）
   - 更新標題區域：置中標題 + 紅色底線裝飾
   - 更新警告區塊：黃底 + 左側紅色邊條 + Material Symbols 圖示
   - 更新顏色選擇器：4 欄網格佈局 + 正方形按鈕 + 顏色名稱標籤
   - 更新已選顏色區域：虛線邊框 + 圓角標籤（pill 樣式）
   - 更新底部按鈕區：半透明背景 + 取消/確認按鈕樣式

3. **顏色名稱中文化**
   - 新增 `COLOR_NAMES` 對照表
   - 顯示中文顏色名稱：紅色、黃色、綠色、藍色
   - 更新 aria-label 為中文

4. **CSS 類名更新**
   - `.warning-message` → `.guess-warning`
   - `.loading-overlay` → `.guess-loading-overlay`
   - `.loading-spinner` → `.guess-loading-spinner`
   - 新增 `.guess-motif-tl`、`.guess-motif-br` 裝飾
   - 新增 `.guess-color-grid`、`.guess-color-btn`、`.guess-color-square`
   - 新增 `.guess-selected-area`、`.guess-color-chip`

### 檔案變更

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `GuessCard.js` | 修改 | 更新 UI 結構、移除查看答案功能 |
| `GuessCard.css` | 修改 | 套用新的中國風設計樣式 |
| `GuessCard.test.js` | 修改 | 更新測試以配合新 UI |
| `06-guess-card.html` | 新增 | Stitch 設計稿 |

## 遇到的問題與解決方案

1. **aria-label 變更**
   - 問題：顏色選擇按鈕的 aria-label 從英文改為中文
   - 解決：更新測試文件中的 aria-label 查詢

2. **CSS 類名變更**
   - 問題：為避免與其他組件衝突，添加 `guess-` 前綴
   - 解決：更新測試中的類名選擇器

3. **移除查看答案測試**
   - 問題：原有「查看答案功能」測試區塊已無效
   - 解決：完全移除該測試區塊

## 測試結果

```
PASS src/components/GuessCard/GuessCard.test.js
  GuessCard - 工作單 0021, 0129
    渲染 (5 tests)
    顏色選擇器 (5 tests)
    表單驗證 (3 tests)
    提交和取消 (3 tests)
    載入狀態 (2 tests)
    猜牌結果顯示 (4 tests)
    樣式 (5 tests)
  GuessCardContainer - 工作單 0021, 0129
    gameService 整合 (1 test)
    取消功能 (1 test)

Test Suites: 1 passed, 1 total
Tests:       29 passed, 29 total
```

## 設計風格

- 配色：
  - primary: #e83b3e（紅色，警告/危險）
  - deep-green: #2f7f34（主色）
  - gold: #C5A059（點綴）
  - background-light: #F5F1E6（米白背景）
- 字體：Noto Serif TC（標題）、Noto Sans TC（內文）
- Material Symbols 圖示
- 圓角、陰影效果
- 草藥裝飾元素

## 下一步計劃

- 可考慮為其他面板套用相同設計風格
- 持續優化響應式設計
