# 工作單 0002

**日期：** 2026-01-23

**工作單標題：** 建立遊戲常數定義檔案

**工單主旨：** 共享代碼 - 建立遊戲常數集中管理檔案

**內容：**

## 工作內容

1. **建立 `shared/constants.js` 檔案**
   - 定義牌組配置：
     - 顏色定義：`RED`, `YELLOW`, `GREEN`, `BLUE`
     - 各顏色牌數：紅色2張、黃色3張、綠色4張、藍色5張
     - 總牌數：14張
   - 定義遊戲規則常數：
     - 最小玩家數：3人
     - 最大玩家數：4人
     - 蓋牌數量：2張
   - 定義遊戲階段常數：
     - `GAME_PHASE_WAITING`: 'waiting'
     - `GAME_PHASE_PLAYING`: 'playing'
     - `GAME_PHASE_FINISHED`: 'finished'
   - 定義問牌類型常數：
     - `QUESTION_TYPE_ONE_EACH`: 1 (兩個顏色各一張)
     - `QUESTION_TYPE_ALL_ONE_COLOR`: 2 (其中一種顏色全部)
     - `QUESTION_TYPE_GIVE_ONE_GET_ALL`: 3 (給其中一種顏色一張，要另一種顏色全部)
   - 定義動作類型常數：
     - `ACTION_TYPE_QUESTION`: 'question'
     - `ACTION_TYPE_GUESS`: 'guess'

2. **使用 JSDoc 註解**
   - 為所有常數添加 JSDoc 註解
   - 說明每個常數的用途和值

3. **匯出常數**
   - 使用 ES6 module 匯出所有常數
   - 確保常數可以被前端和後端（如需要）共用

## 驗收標準

- [ ] `shared/constants.js` 檔案已建立
- [ ] 所有遊戲相關常數已定義
- [ ] 常數有完整的 JSDoc 註解
- [ ] 常數可以正確匯出和匯入
