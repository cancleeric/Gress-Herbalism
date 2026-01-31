# 工作單 0223

## 編號
0223

## 日期
2026-01-31

## 工作單標題
遷移 AI 模組至 ai/herbalism/

## 工單主旨
資料夾結構重組 - 階段五

## 內容

### 目標
將 AI 玩家系統從 ai/ 根目錄遷移至 ai/herbalism/ 目錄。

### 現有 AI 檔案

```
frontend/src/ai/
├── AIPlayer.js
├── DecisionMaker.js
├── InformationTracker.js
├── ProbabilityCalculator.js
└── index.js
```

### 目標結構

```
frontend/src/ai/
├── herbalism/
│   ├── AIPlayer.js
│   ├── DecisionMaker.js
│   ├── InformationTracker.js
│   ├── ProbabilityCalculator.js
│   └── index.js
│
├── evolution/              # 未來
│   └── index.js
│
└── index.js                # 統一匯出
```

### 執行步驟

1. 將所有 AI 檔案移至 ai/herbalism/
2. 更新 ai/herbalism/index.js 匯出
3. 建立新的 ai/index.js 統一匯出
4. 建立 ai/evolution/index.js（空模板）
5. 更新所有引用 AI 模組的檔案

### 新的 ai/index.js 內容

```javascript
/**
 * AI 模組統一匯出
 *
 * 工單 0223 - 遷移 AI 模組
 */

export * as herbalism from './herbalism';
// 未來: export * as evolution from './evolution';

// 向後相容
export * from './herbalism';
```

### 驗收標準

- [ ] AI 檔案已遷移至 ai/herbalism/
- [ ] 統一匯出入口已建立
- [ ] AI 功能正常運作
- [ ] 舊檔案已清理

### 依賴工單
- 0214（建立新目錄結構）
- 0218（更新前端組件引用路徑）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
