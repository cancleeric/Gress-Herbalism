# 工作單 0222

## 編號
0222

## 日期
2026-01-31

## 工作單標題
更新常數引用路徑

## 工單主旨
資料夾結構重組 - 階段四

## 內容

### 目標
更新前後端對常數的引用路徑，使用新的模組化結構。

### 需更新的檔案類型

1. **前端檔案** - import 常數的組件和服務
2. **後端檔案** - require 常數的邏輯和服務
3. **測試檔案** - 常數相關測試

### 路徑對照表

```javascript
// 舊路徑
const { COLORS, CARD_COUNTS } = require('../shared/constants');
import { GAME_PHASES } from '../shared/constants';

// 新路徑（推薦）
const { herbalism } = require('../shared/constants');
const { COLORS, CARD_COUNTS } = herbalism;

// 或直接引用（向後相容）
const { COLORS, CARD_COUNTS } = require('../shared/constants');
// 仍可運作，因為 index.js 有向後相容匯出
```

### 執行步驟

1. 確認相容層正常運作（舊路徑仍可使用）
2. 搜尋所有引用 shared/constants 的檔案
3. 逐步更新為新的模組化引用方式
4. 執行測試確認功能正常
5. 更新 constants.test.js 適應新結構

### 驗收標準

- [ ] 前端編譯成功
- [ ] 後端啟動成功
- [ ] 所有測試通過
- [ ] 常數引用使用新結構

### 依賴工單
- 0221（重組共用常數目錄結構）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
