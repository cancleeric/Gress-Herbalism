# 報告書 0014

**工作單編號：** 0014

**完成日期：** 2026-01-23

## 完成內容摘要

建立遊戲大廳（Lobby）組件的基礎結構。

### 實作內容

1. **`frontend/src/components/Lobby/Lobby.js`**
   - 函數式組件，使用 React Hooks
   - 玩家名稱輸入功能
   - 創建房間功能（分配唯一房間 ID）
   - 加入房間功能（輸入房間 ID）
   - 房間列表顯示（目前為空列表）
   - 輸入驗證和錯誤訊息顯示
   - 完整的 JSDoc 註解

2. **`frontend/src/components/Lobby/Lobby.css`**
   - 響應式佈局設計
   - 使用 CSS 變數保持樣式一致性
   - 按鈕、輸入框、區塊樣式
   - 錯誤訊息樣式

3. **`frontend/src/components/Lobby/index.js`**
   - 組件匯出入口

4. **修正 constants 匯入路徑**
   - 將 shared/constants.js 複製到 frontend/src/shared/
   - 更新所有檔案的匯入路徑（解決 Create React App 的限制）

5. **更新 App.js**
   - 匯入並使用新的 Lobby 組件

## 單元測試

**Tests: 173 passed** (新增 17 個測試)

- 渲染測試（標題、輸入框、按鈕）
- 輸入驗證測試
- 使用者互動測試
- 樣式類別測試

## 驗收標準完成狀態

- [x] `Lobby.js` 組件已建立
- [x] 組件可以正確渲染
- [x] 基本的 UI 元素已建立
- [x] 基本的樣式已設定
- [x] 組件可以正確匯出和匯入
- [x] 組件有完整的 JSDoc 註解
