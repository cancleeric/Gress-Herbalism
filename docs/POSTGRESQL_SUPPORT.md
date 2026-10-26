# 本草 Herbalism — PostgreSQL provider

工程單：Gitea HurricaneDigital/Gress-Herbalism #3，回鏈發布主單 #1。

## 支援範圍

後端可選 Supabase 或 PostgreSQL；預設仍是 Supabase。前端 API、登入與 Socket.IO 不變。
舊 `db/supabase`、`services/supabaseClient` 匯出名稱保留給既有呼叫端；PostgreSQL 模式兩者共用一個連線池，不初始化 Supabase SDK、不要求 Supabase key。

PostgreSQL adapter 僅支援本 repo 實際使用的資料查詢子集：篩選／排序／限制、精確計數、單筆基數、批次新增、具條件的更新／刪除、線上狀態與回放 upsert，以及兩種遊戲歷史巢狀關聯。
識別名稱受限，資料值交由 Knex 參數綁定；不接受任意 SQL、任意資料表或任意 PostgREST filter 語法。

## 設定（只由既有合法入口注入實值）

- `DB_PROVIDER=postgres`（亦接受 `postgresql`）；未設定仍用 Supabase，不因存在 DATABASE_URL 自動切換。
- `DATABASE_URL`：PostgreSQL 連線 URI，必填。不可放 repo、工單、Wiki、日誌或前端 build。
- `PG_SCHEMA`：既有 schema，預設 public；只接受小寫底線識別名稱。
- `PG_POOL_MAX`：1–30，預設 10；min=0，載入模組不連線。
- `PG_SSL_MODE`：verify-full 或 disable。production 預設驗證 TLS 憑證，其餘預設 disable；URL 不得攜帶 ssl* 參數以免覆寫此策略。

連線建立逾時 5 秒，取連線逾時 10 秒，statement timeout 15 秒。錯誤只向既有呼叫端回傳安全代碼與通用訊息，不轉發包含實值的 Knex 查詢錯誤。
本 client 將 pg 的 NUMERIC／安全範圍 BIGINT 解析為既有 API 使用的 JavaScript number，不改全域 pg parser；超出安全範圍的整數或非有限值回報錯誤，不靜默失真。UUID／文字欄位保留原型別，日期輸出 ISO 字串。

## DB 前置條件與明確邊界

這是程式支援，不是建庫或搬資料工具。啟動不建立／修改任何表、view、索引、trigger 或權限；沒有自動 migration。
需由正式 DB 流程核對玩家、戰績、好友／邀請／線上狀態等既有物件；演化論共用資料服務也使用同一 provider，不移除原有功能。
線上狀態 upsert 需要 user_presence.user_id 的唯一約束，回放 upsert 需要 evolution_game_replays.game_id 的唯一約束；玩家戰績與演化論戰績的外鍵也需核對。這些是 adapter 的相容性要求，不是本輪已驗證的 live schema。
現有計分／排行榜相關 view、generated 欄位、trigger 不能因移除 Supabase API 而漏掉；本輪未核准查驗或異動實際 DB 結構，不假設空庫或零舊資料。

程式支援只用既有應用層授權／擁有者篩選，不表示已驗證 Supabase RLS 與自有 DB 角色政策等價；正式切換須使用最小權限應用帳號並驗收跨使用者隔離。

## 驗證層級

隔離測試以真實 pg query compiler 編譯 Knex 查詢、fixture runner 回應結果，不開網路、不建立測試 DB、不執行 DDL。
這能驗證參數綁定、查詢形狀、舊服務契約與 provider 設定，但不能代替真 PostgreSQL 的型別、約束、view、trigger、TLS 連線與多人玩法驗收。
正式 DB 結構查驗／建置／搬移／切換依精確 scope 另取授權；完成備份壓縮與還原驗證後，再循 develop→main→release 與既有後段發布線交付。
本文件不得被解讀為已切到 PostgreSQL 或已上生產。

## 回退

未改動實際資料前，可回到原 Supabase provider 與其合法設定。開始搬移或在新庫產生資料後，不可只改開關回舊庫，以免分叉；先由正式 DB 流程確認資料一致性與回退計畫。
