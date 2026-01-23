# 報告書 0020

**工作單編號：** 0020

**完成日期：** 2026-01-23

## 完成內容摘要

為問牌介面組件新增表單驗證、Redux 整合、gameService 整合和載入狀態功能。

### 實作內容

1. **表單驗證**
   - 整合 `gameRules.validateQuestionType()` 進行完整驗證
   - 類型 3（給一張要全部）驗證玩家是否有牌可給
   - 顯示驗證錯誤訊息

2. **問牌結果顯示組件 (QuestionResult)**
   - 顯示問牌成功/失敗狀態
   - 顯示收到的牌（顏色標籤）
   - 顯示無牌提示訊息
   - 確定按鈕關閉結果

3. **載入狀態**
   - 載入覆蓋層 (loading-overlay)
   - 旋轉動畫指示器 (loading-spinner)
   - 載入中按鈕禁用
   - 防止重複提交

4. **QuestionCardContainer 組件**
   - Redux 整合：`useSelector` 取得遊戲狀態
   - Redux 整合：`useDispatch` 更新狀態
   - gameService 整合：`processQuestionAction()` 處理問牌
   - 載入狀態管理
   - 結果狀態管理

5. **CSS 新增**
   - 載入覆蓋層樣式
   - 載入動畫 (spin keyframes)
   - 問牌結果樣式
   - 結果卡牌顏色樣式

### 程式碼變更

**新增組件：**
- `QuestionResult` - 問牌結果顯示
- `QuestionCardContainer` - Redux 容器組件

**新增 Props：**
- `isLoading` - 載入狀態
- `questionResult` - 問牌結果
- `onResultClose` - 結果關閉回調
- `currentPlayerHand` - 當前玩家手牌（驗證用）

**新增匯出：**
```javascript
export { QuestionCardContainer } from './QuestionCard';
```

## 單元測試

**Tests: 305 passed** (新增 14 個測試)

新增測試：
- 載入狀態測試（3 個）
  - 載入中顯示指示器
  - 載入中確認按鈕禁用
  - 載入中取消按鈕禁用
- 問牌結果顯示測試（5 個）
  - 成功時顯示成功訊息
  - 成功時顯示收到的牌
  - 失敗時顯示失敗訊息
  - 沒有收到牌時顯示提示
  - 點擊確定關閉結果
- 表單驗證測試（1 個）
  - 類型3 無牌時顯示錯誤
- Redux 整合測試（2 個）
  - 從 Redux store 取得玩家資料
  - 正確排除當前玩家
- gameService 整合測試（2 個）
  - 提交時調用 processQuestionAction
  - 成功後顯示結果
- 取消功能測試（1 個）
  - 點擊取消調用 onClose

## 驗收標準完成狀態

- [x] 表單驗證已實作
- [x] 問牌動作提交功能已實作
- [x] 問牌結果顯示已實作
- [x] Redux 連接正確
- [x] 取消功能正常
- [x] 載入狀態已實作
- [x] 錯誤處理正確
- [x] 函數有完整的 JSDoc 註解
