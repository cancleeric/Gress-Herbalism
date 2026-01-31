# 工作單 0220

## 編號
0220

## 日期
2026-01-31

## 工作單標題
更新後端引用路徑

## 工單主旨
資料夾結構重組 - 階段三

## 內容

### 目標
更新所有後端檔案中對已遷移邏輯模組的 require 路徑，並刪除舊的邏輯檔案。

### 需更新的檔案

1. **server.js** - 更新邏輯模組 require 路徑
2. **services/*.js** - 更新服務中的邏輯引用
3. **測試檔案** - 更新測試中的 require 路徑

### 路徑對照表

```javascript
// 舊路徑
const { dealCards, shuffleDeck } = require('./logic/cardLogic');
const { processAction } = require('./logic/gameLogic');
const { calculateScore } = require('./logic/scoreLogic');

// 新路徑
const { herbalism } = require('./logic');
const { cardLogic, gameLogic, scoreLogic } = herbalism;
// 或直接引用
const cardLogic = require('./logic/herbalism/cardLogic');
```

### 執行步驟

1. 搜尋所有引用 logic/ 的檔案
2. 更新 server.js 的 require 路徑
3. 更新 services/ 下相關檔案的 require 路徑
4. 更新測試檔案的 require 路徑
5. 執行 `npm start` 確認伺服器正常啟動
6. 刪除 logic/ 根目錄下的舊檔案（保留 index.js 和子目錄）

### 驗收標準

- [ ] 所有 require 路徑已更新
- [ ] `npm start` 伺服器正常啟動
- [ ] 舊邏輯檔案已刪除
- [ ] 後端 API 正常運作

### 依賴工單
- 0219（遷移本草後端邏輯）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
