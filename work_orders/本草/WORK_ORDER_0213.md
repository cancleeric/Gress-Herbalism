# 工作單 0213

## 編號：0213
## 日期：2026-01-28
## 標題：改善好友請求錯誤訊息

## 工單主旨
將 Supabase 原始錯誤轉換為使用者友善的中文訊息

## 內容

### 依賴
工單 0212（資料表建立後此工單才有意義測試）

### 具體修改

**修改檔案**：`backend/server.js`

在 `POST /api/friends/requests` 的 catch 中，根據錯誤類型回傳友善訊息：
- `Could not find the table` → `系統維護中，請稍後再試`
- `duplicate key` / `unique violation` → `已經發送過好友請求了`
- `foreign key violation` → `找不到該玩家`
- 其他 → 保留原有的 err.message

### 驗收標準
- 即使 Supabase 報出技術性錯誤，使用者也只看到中文友善訊息
- 後端測試全部通過
