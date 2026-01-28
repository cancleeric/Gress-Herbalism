# 工作單 0212

## 編號：0212
## 日期：2026-01-28
## 標題：在 Supabase 執行好友系統遷移腳本

## 工單主旨
建立好友系統所需的資料庫表

## 內容

### 問題
按「加好友」時報錯 `Could not find the table 'public.friend_requests' in the schema cache`，因為 `migration_0061.sql` 未在 Supabase 上執行。

### 操作步驟

**這是一個需要手動在 Supabase Dashboard 執行的操作：**

1. 登入 https://supabase.com/dashboard
2. 選擇對應的專案
3. 左側選 **SQL Editor**
4. 新增查詢，貼上 `backend/db/migration_0061.sql` 的完整內容
5. 按 **Run** 執行
6. 驗證：執行以下 SQL 確認表已建立
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('friendships', 'friend_requests', 'game_invitations', 'user_presence');
   ```
   應回傳 4 筆結果

### 驗收標準
- `friendships`、`friend_requests`、`game_invitations`、`user_presence` 四張表存在
- RLS 政策已設定
- 索引已建立
- 按「加好友」不再報 table not found 錯誤
