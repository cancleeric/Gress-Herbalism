# BUG 修復計畫書：加好友失敗 — friend_requests 表不存在

## 建立日期：2026-01-28

---

## 問題描述

**現象**：在好友管理頁面搜尋到玩家後，按下「加好友」按鈕彈出錯誤：
> Could not find the table 'public.friend_requests' in the schema cache

**嚴重程度**：高（好友系統完全無法使用）

---

## 根因分析

### 錯誤來源
Supabase 回傳的錯誤，表示 `friend_requests` 資料表在 Supabase 資料庫中**不存在**。

### 為什麼搜尋可以正常運作
搜尋功能查詢的是 `players` 表（已存在），排除邏輯查詢 `friendships` 和 `friend_requests` 表時，如果表不存在，Supabase 會回傳空結果但不中斷（因為搜尋函數用 try-catch 包裹且回傳空陣列）。但 `sendFriendRequest` 嘗試對 `friend_requests` 表執行 INSERT 時，因表不存在而直接報錯。

### 遷移腳本未執行
`backend/db/migration_0061.sql` 包含以下四張表的建立語句：
1. `friendships` — 好友關係表
2. `friend_requests` — 好友請求表
3. `game_invitations` — 遊戲邀請表
4. `user_presence` — 線上狀態表

這些表需要手動在 Supabase Dashboard → SQL Editor 中執行。

---

## 修復方案

### 工單 0212：在 Supabase 執行好友系統遷移腳本

**操作步驟**：
1. 登入 Supabase Dashboard (https://supabase.com/dashboard)
2. 選擇專案 `gress-6270d`（或對應的專案）
3. 進入 SQL Editor
4. 複製 `backend/db/migration_0061.sql` 的完整內容
5. 執行 SQL 腳本
6. 驗證：執行 `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';` 確認四張表都存在

**同時檢查**：後端程式碼中的錯誤處理是否足夠友善，如果 Supabase 報錯不應直接將原始錯誤訊息顯示給使用者。

### 工單 0213：改善好友請求錯誤訊息的使用者體驗

**修改檔案**：`backend/server.js`

**修改內容**：
在 `POST /api/friends/requests` 路由的 catch 中，將 Supabase 原始錯誤訊息轉換為使用者友善的中文訊息，避免直接顯示 "Could not find the table..." 這類技術訊息。

---

## 驗證方式

1. 執行遷移腳本後，在 Supabase 確認表存在
2. 在好友頁面搜尋玩家 → 按「加好友」→ 應看到「好友請求已發送！」
3. 對方在「請求」頁籤看到好友請求 → 接受 → 雙方成為好友
