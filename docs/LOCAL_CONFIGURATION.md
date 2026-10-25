# 本草 Herbalism：啟動設定

## 後端
在 backend 執行 `npm ci`，再執行 `npm start`。dotenv 是正式 runtime dependency。
啟動時固定讀取 backend/.env，不受呼叫端工作目錄影響；Vault／CI 已注入的環境變數優先，檔案不會覆寫它們。

- SUPABASE_URL、SUPABASE_ANON_KEY 為必填；缺少仍會立即退出，不以假資料、舊 committed key 或 hardcoded fallback 啟動。
- FIREBASE_PROJECT_ID 供既有驗簽流程使用；缺值的登入功能不視為驗收通過。
- 使用現有合法 Vault／CI 供應入口；不要把實值 commit 到 repo、工單、Wiki 或日誌。
- 已完全由環境提供設定時，backend/.env 可不存在；其他檔案讀取錯誤不會被吞掉。

## 本案驗證邊界
來源：GitHub issue #8、Eric Telegram 11170，2026-10-25。
本次只修設定檔載入，不新增 secret，不調整 DB/schema，也不更換身分驗證方案。
設定測試通過不代表 Supabase 連線、登入、多房多人可玩或生產發布通過。
三分支與發布 gate、備份／還原驗證仍必須由正式後段發布線完成。
