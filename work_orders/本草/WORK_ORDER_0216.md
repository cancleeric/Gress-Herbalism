# 工作單 0216

## 編號
0216

## 日期
2026-01-31

## 工作單標題
遷移共用組件至 common/

## 工單主旨
資料夾結構重組 - 階段二

## 內容

### 目標
將共用組件從 components/ 根目錄遷移至 components/common/ 目錄。

### 需遷移的組件

| 原路徑 | 新路徑 |
|--------|--------|
| components/Login/ | components/common/Login/ |
| components/Register/ | components/common/Register/ |
| components/Lobby/ | components/common/Lobby/ |
| components/Profile/ | components/common/Profile/ |
| components/Leaderboard/ | components/common/Leaderboard/ |
| components/Friends/ | components/common/Friends/ |
| components/ConnectionStatus/ | components/common/ConnectionStatus/ |
| components/VersionInfo/ | components/common/VersionInfo/ |

### 執行步驟

1. 複製 Login/ 目錄至 common/Login/
2. 複製 Register/ 目錄至 common/Register/
3. 複製 Lobby/ 目錄至 common/Lobby/
4. 複製 Profile/ 目錄至 common/Profile/
5. 複製 Leaderboard/ 目錄至 common/Leaderboard/
6. 複製 Friends/ 目錄至 common/Friends/
7. 複製 ConnectionStatus/ 目錄至 common/ConnectionStatus/
8. 複製 VersionInfo/ 目錄至 common/VersionInfo/
9. 更新 common/index.js 匯出所有共用組件
10. 驗證檔案完整性

### 驗收標準

- [ ] 所有共用組件已遷移至 common/
- [ ] common/index.js 正確匯出所有組件
- [ ] 原始檔案暫時保留（待路徑更新後刪除）

### 依賴工單
- 0214（建立新目錄結構）
- 0215（建立匯出索引檔案）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
