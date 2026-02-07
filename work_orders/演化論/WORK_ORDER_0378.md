# 工作單 0378

## 基本資訊

| 項目 | 內容 |
|------|------|
| 編號 | 0378 |
| 日期 | 2026-02-07 |
| 標題 | 統一心跳超時參數 |
| 主旨 | Socket 連線問題修復 |
| 優先級 | P2 - 高 |
| 所屬計畫 | Socket 連線問題修復計畫書 |

---

## 問題描述

前後端 Socket.io 心跳超時參數不一致：
- 後端 `pingTimeout: 30000`（30 秒）
- 前端 `pingTimeout: 20000`（20 秒）

當網路延遲介於 20-30 秒時，前端會誤判為斷線，但伺服器實際未斷開，造成重複連線/斷線的循環。

---

## 工作內容

### 1. 統一前端心跳超時參數

修改 `frontend/src/services/socketService.js`：

```javascript
// 將
pingTimeout: 20000,

// 改為
pingTimeout: 30000,  // 與後端一致
```

### 2. 確認參數一致性

驗證前後端參數：

| 參數 | 後端 | 前端 |
|------|------|------|
| pingTimeout | 30000 | 30000 |
| pingInterval | 25000 | 25000 |

---

## 驗收標準

- [ ] 前端 `pingTimeout` 設為 30000
- [ ] 前後端心跳參數完全一致
- [ ] 不再出現誤斷線問題

---

## 相關檔案

```
frontend/src/services/socketService.js
backend/server.js
```
