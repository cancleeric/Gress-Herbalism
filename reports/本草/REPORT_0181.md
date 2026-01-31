# 報告書 0181

## 工作單編號
0181

## 完成日期
2026-01-27

## 完成內容摘要

修復訪客（匿名）登入後玩家資料頁面幾乎空白的 BUG。

### 修改檔案

#### 1. `frontend/src/components/Profile/Profile.js`
- 重構匿名用戶分支（原第 79-87 行），從簡陋的一行文字 + 無樣式按鈕，改為完整佈局：
  - 背景裝飾元素（`bg-decoration-top`、`bg-decoration-bottom`）
  - `profile-layout` → `profile-nav` 導航欄（返回按鈕 + Herbalism logo）
  - `profile-main` → `profile-card` 卡片：訪客頭像 placeholder（「訪」字）、名稱、引導內容
  - `profile-anonymous-content` 區塊：提示文字、Google 登入好處清單、登入按鈕、返回按鈕
  - `profile-footer` 頁尾

#### 2. `frontend/src/components/Profile/Profile.css`
- 新增 `.profile-anonymous-content` 區塊樣式（居中、圓角、淡綠底色）
- 新增 `.anonymous-hint` 標題樣式
- 新增 `.anonymous-benefits` 清單樣式（打勾圖示、左對齊、居中排列）
- 新增 `.google-login-btn` 按鈕樣式（綠色主色調、hover 效果）
- 新增 `.anonymous-back-btn` 按鈕樣式（邊框樣式、hover 效果）

## 遇到的問題與解決方案

### 問題：匿名分支佈局結構缺失
- **原因**：工單 0175 新增匿名阻擋功能時，僅加入最簡陋的提示文字，未考慮 UX 與設計一致性
- **解決**：複用 Google 用戶 Profile 頁面的完整佈局結構（導航欄、背景裝飾、卡片、頁尾），並在卡片內加入訪客專屬的引導內容

### 問題：`.back-btn` 樣式未生效
- **原因**：CSS 中定義為 `.profile-nav .back-btn`，需在 `.profile-nav` 內才套用
- **解決**：匿名分支現已包含 `.profile-nav` 結構，按鈕樣式自動生效

## 測試結果
- 前端編譯成功（`webpack compiled successfully`）
- 僅有一個既有的 eslint warning（`useEffect` 依賴項），非本次修改造成
- Google 用戶的 Profile 頁面不受影響

## 下一步計劃
- 無額外工作需求
