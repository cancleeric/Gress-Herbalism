# 工單 0278

## 日期
2026-01-31

## 工作單標題
修復 EvolutionLobbyPage Socket 監聽

## 工單主旨
修復前端演化論大廳的 Socket 事件監聽邏輯

## 內容

### 問題分析
Socket 事件監聽器可能在連線建立前設置，或在組件重新渲染時丟失。

### 要執行的任務

1. **修復監聽器設置時機**
   - 確保在 Socket 連線成功後才設置監聽器
   - 使用 `isConnected` 狀態作為依賴

2. **修復回調函數穩定性**
   - 使用 `useCallback` 包裹回調函數
   - 確保回調函數不會在每次渲染時重新創建

3. **修復房間創建流程**
   - 確保 `evoCreateRoom` 正確發送事件
   - 確保 `onEvoRoomCreated` 正確接收並處理響應

### 涉及檔案
- `frontend/src/components/common/EvolutionLobbyPage/EvolutionLobbyPage.js`

### 驗收標準
- 點擊「創建房間」後可以成功創建
- 創建成功後自動導航到房間頁面
- 控制台顯示正確的創建日誌
