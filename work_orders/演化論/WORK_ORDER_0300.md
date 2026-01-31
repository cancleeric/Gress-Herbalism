# 工作單 0300

## 編號
0300

## 日期
2026-01-31

## 工作單標題
修復 initGame

## 工單主旨
修正遊戲邏輯中的初始化功能

## 內容

### 工作說明
修復 `gameLogic.js` 中的 `initGame` 函數，解決 BUG-0291-001。

### 問題描述

**BUG-0291-001**：initGame 返回不完整狀態（phase undefined, deck 報錯）

### 修復內容

1. **增加常數驗證**
   - 確認 GAME_PHASES 正確載入
   - 確認 INITIAL_HAND_SIZE 正確載入

2. **增加狀態驗證**
   - 返回前驗證 gameState 完整性
   - 確保所有必要屬性都已設定

3. **改善錯誤處理**
   - 提供詳細的錯誤訊息
   - 區分不同類型的錯誤

4. **增加 getGameState 的防禦性檢查**
   - 處理 gameState.players 為 undefined 的情況

### 驗收標準
- [ ] initGame 返回完整的 gameState
- [ ] phase 正確設為 GAME_PHASES.WAITING
- [ ] deck 正確初始化 84 張牌
- [ ] players 狀態正確初始化
- [ ] getGameState 不會拋出錯誤

### 依賴
- 工單 0297

### 相關文件
- `backend/logic/evolution/gameLogic.js`
