# 工作單 0224

## 編號
0224

## 日期
2026-01-31

## 工作單標題
遷移工具函數分類

## 工單主旨
資料夾結構重組 - 階段五

## 內容

### 目標
將工具函數分類至 common/ 和 herbalism/ 子目錄。

### 現有工具函數

```
frontend/src/utils/
├── cardUtils.js        # 本草專屬
├── gameRules.js        # 本草專屬
├── localStorage.js     # 共用
├── performance.js      # 共用
└── validation.js       # 共用
```

### 目標結構

```
frontend/src/utils/
├── common/
│   ├── localStorage.js
│   ├── performance.js
│   ├── validation.js
│   └── index.js
│
├── herbalism/
│   ├── cardUtils.js
│   ├── gameRules.js
│   └── index.js
│
└── index.js            # 統一匯出
```

### 執行步驟

1. 將共用工具函數移至 utils/common/
2. 將本草工具函數移至 utils/herbalism/
3. 建立各目錄的 index.js 匯出
4. 建立統一的 utils/index.js
5. 更新所有引用工具函數的檔案

### 新的 utils/index.js 內容

```javascript
/**
 * 工具函數統一匯出
 *
 * 工單 0224 - 遷移工具函數分類
 */

export * from './common';
export * as herbalism from './herbalism';

// 向後相容
export * from './herbalism';
```

### 驗收標準

- [ ] 工具函數已分類至對應目錄
- [ ] 各目錄 index.js 已建立
- [ ] 統一匯出入口已建立
- [ ] 所有引用已更新
- [ ] 功能正常運作

### 依賴工單
- 0214（建立新目錄結構）
- 0218（更新前端組件引用路徑）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
