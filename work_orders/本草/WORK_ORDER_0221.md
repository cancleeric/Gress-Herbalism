# 工作單 0221

## 編號
0221

## 日期
2026-01-31

## 工作單標題
重組共用常數目錄結構

## 工單主旨
資料夾結構重組 - 階段四

## 內容

### 目標
將現有的 shared/constants.js 重組為模組化結構，支援多遊戲常數管理。

### 現有檔案

- shared/constants.js（本草遊戲常數）
- shared/constants.test.js（常數測試）
- shared/version.js（版本資訊）

### 目標結構

```
shared/
├── constants/
│   ├── common.js          # 共用常數（遊戲類型等）
│   ├── herbalism.js       # 本草常數（從 constants.js 遷移）
│   ├── evolution.js       # 演化論常數（空檔案，待開發）
│   └── index.js           # 統一匯出
│
├── utils/
│   └── scoreUtils.js      # 計分工具（如存在）
│
├── version.js             # 版本資訊（保持不變）
└── constants.js           # 相容層（重新導出，待移除）
```

### 執行步驟

1. 建立 shared/constants/common.js
   ```javascript
   // 共用常數
   const GAME_TYPES = {
     HERBALISM: 'herbalism',
     EVOLUTION: 'evolution'
   };

   module.exports = { GAME_TYPES };
   ```

2. 複製 shared/constants.js 內容至 shared/constants/herbalism.js

3. 建立 shared/constants/evolution.js（空模板）
   ```javascript
   // 演化論遊戲常數 - 待開發
   module.exports = {};
   ```

4. 建立 shared/constants/index.js
   ```javascript
   const common = require('./common');
   const herbalism = require('./herbalism');
   const evolution = require('./evolution');

   module.exports = {
     ...common,
     herbalism,
     evolution,
     // 向後相容：直接匯出本草常數
     ...herbalism
   };
   ```

5. 更新 shared/constants.js 為相容層
   ```javascript
   // 相容層 - 重新導出，將在未來版本移除
   module.exports = require('./constants/index');
   ```

### 驗收標準

- [ ] shared/constants/ 目錄結構已建立
- [ ] 所有常數檔案已建立
- [ ] 相容層正常運作
- [ ] 現有程式碼不受影響

### 依賴工單
- 0214（建立新目錄結構）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
