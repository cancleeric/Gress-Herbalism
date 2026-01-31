# BUG 修復計畫書 — 訪客玩家資料頁面空白

## 日期
2026-01-27

## 問題描述
訪客（匿名）登入後進入「玩家資料」頁面，畫面幾乎完全空白，僅顯示一行小字「請先使用 Google 帳號登入以查看個人資料」和一個無樣式的「返回大廳」按鈕。整體 UX 極差，與其他頁面的中國風草藥主題設計完全脫節。

## 問題根因分析

### 1. 佈局結構缺失（Profile.js 第 79-87 行）
匿名用戶的分支 return 僅包含：
```jsx
<div className="profile-page">
  <div className="profile-anonymous">
    <p>請先使用 Google 帳號登入以查看個人資料</p>
    <button className="back-btn" onClick={handleBack}>返回大廳</button>
  </div>
</div>
```
- 缺少 `profile-layout` 佈局容器
- 缺少 `profile-nav` 導航欄（含返回按鈕和品牌 logo）
- 缺少 `bg-decoration` 背景裝飾元素
- 缺少 `profile-footer` 頁尾

### 2. CSS 樣式缺失（Profile.css）
- `.profile-anonymous` class 在 CSS 中**完全未定義**
- `.back-btn` 的樣式定義為 `.profile-nav .back-btn`（需要在 `.profile-nav` 內才生效），匿名分支的按鈕不在此結構內，因此無樣式

### 3. 與其他頁面設計不一致
- 登入頁面（Login.js）有完整的佈局結構：header、main、footer、背景裝飾
- Google 用戶的 Profile 頁面也有完整佈局
- 只有匿名用戶的 Profile 頁面是「裸」的

## 修復方案

### 工單 0181：修復訪客玩家資料頁面空白問題

**修復內容：**

#### A. 重構 Profile.js 匿名用戶分支
將匿名分支改為使用與 Google 用戶相同的佈局結構：
- 加入 `bg-decoration` 背景裝飾
- 加入 `profile-layout` 佈局容器
- 加入 `profile-nav` 導航欄（含返回按鈕和品牌 logo）
- 加入 `profile-main` 主內容區
- 在主內容區中加入 `profile-card` 卡片，內含：
  - 訪客頭像 placeholder
  - 「訪客」名稱
  - 提示訊息：引導用戶使用 Google 登入以解鎖完整功能
  - 說明 Google 登入的好處（保存遊戲記錄、統計數據、好友功能等）
  - 「使用 Google 登入」按鈕（導向登入頁面）
  - 「返回大廳」按鈕
- 加入 `profile-footer` 頁尾

#### B. 補充 Profile.css 匿名狀態樣式
- 新增 `.profile-anonymous` 相關 CSS
- 新增引導卡片的樣式
- 新增 Google 登入引導按鈕樣式
- 確保與現有中國風草藥主題一致

## 涉及檔案
| 檔案 | 修改類型 |
|------|---------|
| `frontend/src/components/Profile/Profile.js` | 修改匿名分支 JSX |
| `frontend/src/components/Profile/Profile.css` | 新增匿名狀態樣式 |

## 驗收標準
1. 訪客登入後進入玩家資料頁面，看到完整的中國風佈局（導航欄、背景裝飾、頁尾）
2. 顯示訪客頭像 placeholder 和「訪客」名稱
3. 顯示清楚的提示訊息，引導用戶使用 Google 登入
4. 「使用 Google 登入」按鈕可導向登入頁面
5. 「返回大廳」按鈕正常運作
6. 整體設計與其他頁面風格一致
