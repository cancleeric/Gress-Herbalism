# 工作單 0219

## 編號
0219

## 日期
2026-01-31

## 工作單標題
遷移本草後端邏輯至 logic/herbalism/

## 工單主旨
資料夾結構重組 - 階段三

## 內容

### 目標
將本草遊戲的後端邏輯從 logic/ 根目錄遷移至 logic/herbalism/ 目錄。

### 需遷移的檔案

| 原路徑 | 新路徑 |
|--------|--------|
| backend/logic/cardLogic.js | backend/logic/herbalism/cardLogic.js |
| backend/logic/gameLogic.js | backend/logic/herbalism/gameLogic.js |
| backend/logic/scoreLogic.js | backend/logic/herbalism/scoreLogic.js |
| backend/logic/index.js | backend/logic/herbalism/index.js |

### 執行步驟

1. 複製 cardLogic.js 至 logic/herbalism/
2. 複製 gameLogic.js 至 logic/herbalism/
3. 複製 scoreLogic.js 至 logic/herbalism/
4. 更新 logic/herbalism/index.js 匯出所有邏輯模組
5. 建立新的 logic/index.js 統一匯出入口
6. 驗證檔案完整性

### 新的 logic/index.js 內容

```javascript
/**
 * 遊戲邏輯統一匯出
 *
 * 工單 0219 - 遷移本草後端邏輯
 */

const herbalism = require('./herbalism');

module.exports = {
  herbalism,
  // 未來: evolution
};
```

### 驗收標準

- [ ] 所有邏輯檔案已遷移至 logic/herbalism/
- [ ] logic/herbalism/index.js 正確匯出
- [ ] logic/index.js 統一匯出入口已建立
- [ ] 原始檔案暫時保留（待路徑更新後刪除）

### 依賴工單
- 0214（建立新目錄結構）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
