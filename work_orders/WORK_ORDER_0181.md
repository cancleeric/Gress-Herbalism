# 工作單 0181

## 編號
0181

## 日期
2026-01-27

## 工作單標題
Bug 修復 — 訪客玩家資料頁面空白問題

## 工單主旨
修復訪客（匿名）登入後的玩家資料頁面，補齊佈局結構和 CSS 樣式，使其與中國風草藥主題一致。

## 內容

### 問題描述
訪客登入後進入「玩家資料」頁面，畫面幾乎完全空白。原因是 Profile.js 匿名分支缺少佈局結構，且 Profile.css 中未定義 `.profile-anonymous` 樣式。

### 修改檔案

#### 1. `frontend/src/components/Profile/Profile.js`
修改匿名用戶的 return 分支（第 79-87 行），改為完整佈局：

- 加入背景裝飾元素 (`bg-decoration-top`, `bg-decoration-bottom`)
- 加入 `profile-layout` 容器
- 加入導航欄 `profile-nav`（返回按鈕 + Herbalism logo）
- 加入主內容區 `profile-main`，包含：
  - `profile-card` 卡片
  - 訪客頭像 placeholder（顯示「訪」字）
  - 「訪客」名稱 + 「訪客帳號」子標題
  - 提示區塊：說明需 Google 登入才能查看完整資料
  - Google 登入好處列表（遊戲記錄保存、統計數據、好友功能、排行榜）
  - 「前往 Google 登入」按鈕（導向 /login）
  - 「返回大廳」按鈕
- 加入頁尾 `profile-footer`

#### 2. `frontend/src/components/Profile/Profile.css`
新增匿名狀態相關樣式：

- `.profile-anonymous-content`：匿名提示區塊（居中、圓角、底色）
- `.anonymous-hint`：提示標題
- `.anonymous-benefits`：Google 登入好處列表
- `.google-login-btn`：Google 登入引導按鈕（綠色主色調）
- `.anonymous-back-btn`：返回大廳按鈕（邊框樣式）

### 驗收標準
1. 訪客進入玩家資料頁面時，看到完整中國風佈局（導航欄、背景裝飾、頁尾）
2. 顯示訪客頭像 placeholder（「訪」字）和「訪客」名稱
3. 清楚的提示訊息引導用戶使用 Google 登入
4. 列出 Google 登入的好處
5. 「前往 Google 登入」按鈕正確導向 /login
6. 「返回大廳」按鈕正確導向 /
7. 樣式與現有中國風草藥主題一致
8. 不影響 Google 用戶的 Profile 頁面正常運作
