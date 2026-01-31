# 工作單 0214

## 編號
0214

## 日期
2026-01-31

## 工作單標題
建立新目錄結構

## 工單主旨
資料夾結構重組 - 階段一

## 內容

### 目標
建立模組化多遊戲架構所需的新目錄結構。

### 需建立的目錄

#### 前端目錄 (frontend/src/)
```
components/
├── common/
└── games/
    ├── herbalism/
    └── evolution/

ai/
└── herbalism/

store/
├── herbalism/
└── evolution/

controllers/
└── herbalism/

hooks/
└── herbalism/

utils/
├── common/
└── herbalism/
```

#### 後端目錄 (backend/)
```
logic/
├── common/
└── herbalism/
```

#### 共用目錄 (shared/)
```
constants/
utils/
```

### 執行步驟

1. 建立前端 components/common/ 目錄
2. 建立前端 components/games/herbalism/ 目錄
3. 建立前端 components/games/evolution/ 目錄
4. 建立前端 ai/herbalism/ 目錄
5. 建立前端 store/herbalism/ 目錄
6. 建立前端 store/evolution/ 目錄
7. 建立前端 controllers/herbalism/ 目錄
8. 建立前端 hooks/herbalism/ 目錄
9. 建立前端 utils/common/ 目錄
10. 建立前端 utils/herbalism/ 目錄
11. 建立後端 logic/common/ 目錄
12. 建立後端 logic/herbalism/ 目錄
13. 建立共用 shared/constants/ 目錄
14. 建立共用 shared/utils/ 目錄（如不存在）

### 驗收標準

- [ ] 所有目錄已建立
- [ ] 目錄結構符合計畫書規範
- [ ] 不影響現有程式運行

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
