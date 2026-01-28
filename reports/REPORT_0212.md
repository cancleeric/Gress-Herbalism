# 完成報告 0212

## 工作單編號：0212
## 完成日期：2026-01-28

## 完成內容摘要
在 Supabase Dashboard SQL Editor 執行 `backend/db/migration_0061.sql` 遷移腳本，建立好友系統所需的四張資料表。

### 建立的資料表
1. `friendships` — 好友關係表（雙向）
2. `friend_requests` — 好友請求表
3. `game_invitations` — 遊戲邀請表
4. `user_presence` — 線上狀態表

### 同時建立
- 6 個索引（加速查詢）
- 12 個 RLS 政策（允許公開讀寫）
- 1 個清理過期邀請的 function

## 遇到的問題與解決方案
- 問題：按「加好友」時報 `Could not find the table 'public.friend_requests' in the schema cache`
- 原因：遷移腳本從未在 Supabase 上執行
- 解決：手動在 Supabase SQL Editor 執行完整遷移腳本

## 測試結果
- Supabase 執行結果：`Success. No rows returned`（綠色勾勾）
- 好友搜尋功能正常
- 加好友功能待驗證（表已建立）
