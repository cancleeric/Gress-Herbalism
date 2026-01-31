# 工作單 0001

**日期：** 2026-01-23

**工作單標題：** 建立專案基礎結構與配置檔案

**工單主旨：** 專案初始化 - 建立專案目錄結構和基礎配置檔案

**內容：**

## 工作內容

1. **建立專案目錄結構**
   - 建立 `frontend/` 目錄及其子目錄：
     - `frontend/src/components/`
     - `frontend/src/services/`
     - `frontend/src/store/`
     - `frontend/src/utils/`
     - `frontend/src/styles/`
     - `frontend/public/`
   - 建立 `backend/` 目錄及其子目錄（如需要）：
     - `backend/routes/`
     - `backend/models/`
     - `backend/services/`
   - 建立 `shared/` 目錄
   - 建立 `docs/` 目錄

2. **建立前端 package.json**
   - 在 `frontend/` 目錄下建立 `package.json`
   - 定義專案基本資訊（名稱、版本、描述）
   - 設定必要的依賴套件（根據技術棧選擇）
   - 設定開發腳本（start, build, test）

3. **建立後端 package.json**（如需要）
   - 在 `backend/` 目錄下建立 `package.json`
   - 定義專案基本資訊
   - 設定必要的依賴套件

4. **建立 README.md**
   - 專案說明
   - 安裝步驟
   - 執行方式
   - 專案結構說明

5. **建立 .gitignore**
   - 忽略 node_modules
   - 忽略建置產物
   - 忽略環境變數檔案
   - 忽略 IDE 設定檔案

## 驗收標準

- [ ] 所有目錄結構已建立完成
- [ ] package.json 檔案已建立並包含基本配置
- [ ] README.md 已建立並包含專案說明
- [ ] .gitignore 已建立並包含必要的忽略規則
