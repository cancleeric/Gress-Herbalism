# 工作單 0215

## 編號
0215

## 日期
2026-01-31

## 工作單標題
建立匯出索引檔案

## 工單主旨
資料夾結構重組 - 階段一

## 內容

### 目標
為新建立的目錄建立 index.js 匯出檔案，方便後續模組引用。

### 需建立的索引檔案

1. `frontend/src/components/common/index.js`
2. `frontend/src/components/games/herbalism/index.js`
3. `frontend/src/components/games/evolution/index.js`
4. `frontend/src/components/games/index.js`
5. `frontend/src/ai/herbalism/index.js`
6. `frontend/src/store/herbalism/index.js`
7. `frontend/src/store/evolution/index.js`
8. `frontend/src/controllers/herbalism/index.js`
9. `frontend/src/hooks/herbalism/index.js`
10. `frontend/src/utils/common/index.js`
11. `frontend/src/utils/herbalism/index.js`
12. `backend/logic/common/index.js`
13. `backend/logic/herbalism/index.js`
14. `shared/constants/index.js`

### 索引檔案模板

```javascript
/**
 * [目錄名稱] 模組匯出
 *
 * 工單 0215 - 建立匯出索引檔案
 */

// 待遷移後補充具體匯出內容
export {};
```

### 驗收標準

- [ ] 所有索引檔案已建立
- [ ] 檔案格式正確
- [ ] 不產生語法錯誤

### 依賴工單
- 0214（建立新目錄結構）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
