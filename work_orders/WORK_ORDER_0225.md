# 工作單 0225

## 編號
0225

## 日期
2026-01-31

## 工作單標題
遷移 Hooks 和 Controllers

## 工單主旨
資料夾結構重組 - 階段五

## 內容

### 目標
將 Hooks 和 Controllers 遷移至對應的遊戲子目錄。

### 現有檔案

```
frontend/src/hooks/
└── useAIPlayers.js       # 本草專屬

frontend/src/controllers/
└── LocalGameController.js # 本草專屬
```

### 目標結構

```
frontend/src/hooks/
├── herbalism/
│   ├── useAIPlayers.js
│   └── index.js
│
└── index.js              # 統一匯出

frontend/src/controllers/
├── herbalism/
│   ├── LocalGameController.js
│   └── index.js
│
└── index.js              # 統一匯出
```

### 執行步驟

1. 將 useAIPlayers.js 移至 hooks/herbalism/
2. 將 LocalGameController.js 移至 controllers/herbalism/
3. 建立各目錄的 index.js 匯出
4. 建立統一的匯出入口
5. 更新所有引用這些檔案的地方

### 驗收標準

- [ ] Hooks 已遷移至 hooks/herbalism/
- [ ] Controllers 已遷移至 controllers/herbalism/
- [ ] 統一匯出入口已建立
- [ ] 所有引用已更新
- [ ] 功能正常運作

### 依賴工單
- 0214（建立新目錄結構）
- 0218（更新前端組件引用路徑）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
