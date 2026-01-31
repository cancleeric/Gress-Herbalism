# 工作單 0296

## 編號
0296

## 日期
2026-01-31

## 工作單標題
建立診斷測試腳本

## 工單主旨
建立 Node.js 診斷腳本，驗證核心模組功能

## 內容

### 工作說明
建立診斷測試腳本，直接在 Node.js 環境執行核心函數，確認問題根源。

### 具體任務

1. **建立診斷腳本 `backend/tests/evolution/diagnose.js`**
   - 測試 gameLogic.initGame
   - 測試 creatureLogic.addTrait
   - 測試 cardLogic.validateTraitPlacement
   - 輸出詳細的執行結果

2. **測試項目**
   - 常數是否正確載入 (GAME_PHASES, TRAIT_TYPES 等)
   - initGame 是否返回完整狀態
   - addTrait 是否能正確添加性狀
   - validateTraitPlacement 各種情況

3. **輸出格式**
   - 每個測試項目的結果
   - 失敗時的詳細錯誤訊息
   - 建議的修復方向

### 驗收標準
- [ ] 診斷腳本可執行
- [ ] 輸出清晰的診斷結果
- [ ] 識別出問題根源

### 依賴
無

### 輸出文件
- `backend/tests/evolution/diagnose.js`
