# 報告書 0018

**工作單編號：** 0018

**完成日期：** 2026-01-23

## 完成內容摘要

建立玩家手牌（PlayerHand）組件，實作手牌顯示和選擇功能。

### 實作內容

1. **`frontend/src/components/PlayerHand/PlayerHand.js`**
   - 函數式組件，使用 React Hooks
   - `Card` 子組件用於單張卡牌顯示
   - PropTypes 類型檢查

2. **手牌顯示**
   - 水平排列顯示所有手牌
   - 四種顏色漸層背景
   - 顏色標籤文字
   - 卡片出現動畫

3. **卡牌選擇功能**
   - 可選擇模式 (`selectable` prop)
   - 單選模式（預設）
   - 多選模式 (`multiSelect` prop)
   - 外部控制選擇狀態 (`selectedCardIds`)
   - 選擇回調 (`onCardSelect`)

4. **顏色統計**
   - 顯示各顏色卡牌數量
   - 顏色標籤樣式

5. **無障礙功能**
   - 鍵盤操作支援 (Enter, Space)
   - `role="button"` 屬性
   - `aria-label` 和 `aria-pressed`
   - 可聚焦 (tabIndex)

6. **互動效果**
   - hover 上浮效果
   - 選中狀態（上浮 + 邊框 + 勾選圖示）
   - focus 外框

## 單元測試

**Tests: 258 passed** (新增 27 個測試)

- 渲染測試
- 卡牌顏色測試
- 顏色統計測試
- 卡牌選擇測試
- 外部控制選擇測試
- 鍵盤操作測試
- 無障礙測試
- 樣式類別測試

## 驗收標準完成狀態

- [x] `PlayerHand.js` 組件已建立
- [x] 可以正確顯示玩家自己的手牌
- [x] 每張牌正確顯示其顏色
- [x] 手牌佈局美觀
- [x] 手牌可點選（為選擇功能預留）
- [x] 手牌有 hover 效果
- [x] 組件有完整的 JSDoc 註解
