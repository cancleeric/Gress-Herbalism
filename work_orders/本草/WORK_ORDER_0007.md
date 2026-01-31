# 工作單 0007

**日期：** 2026-01-23

**工作單標題：** 建立遊戲規則驗證函數 - 基礎驗證

**工單主旨：** 工具函數 - 建立遊戲規則驗證功能

**內容：**

## 工作內容

1. **建立 `frontend/src/utils/gameRules.js` 檔案**

2. **實作 `validatePlayerCount(count)` 函數**
   - 驗證玩家數量是否在3-4人之間
   - 接收玩家數量作為參數
   - 返回布林值

3. **實作 `validateColorSelection(colors)` 函數**
   - 驗證顏色選擇是否有效
   - 接收顏色陣列作為參數
   - 驗證：
     - 必須選擇2個顏色
     - 兩個顏色必須不同
     - 顏色必須是有效的顏色值（red, yellow, green, blue）
   - 返回布林值

4. **實作 `validateQuestionType(questionType, colors, playerHand, targetPlayerHand)` 函數**
   - 驗證問牌類型是否有效
   - 接收問牌類型、選定顏色、玩家手牌、目標玩家手牌作為參數
   - 根據問牌類型驗證：
     - 類型1：玩家是否有選定兩個顏色的牌各至少一張
     - 類型2：玩家是否有選定其中一個顏色的牌至少一張
     - 類型3：玩家是否有選定其中一個顏色的牌至少一張，且目標玩家有另一個顏色的牌至少一張
   - 返回驗證結果物件：
     ```javascript
     {
       isValid: boolean,
       message: string  // 錯誤訊息（如無效）
     }
     ```

5. **使用 JSDoc 註解**
   - 為所有函數添加完整的 JSDoc 註解

## 驗收標準

- [ ] `gameRules.js` 檔案已建立
- [ ] 所有驗證函數已實作
- [ ] 驗證邏輯正確
- [ ] 函數有完整的 JSDoc 註解
- [ ] 錯誤訊息清晰明確
