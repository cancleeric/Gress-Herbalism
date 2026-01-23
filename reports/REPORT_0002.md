# 工作單完成報告 0002

**工作單編號：** 0002  
**工作單標題：** 建立遊戲常數定義檔案  
**完成日期：** 2026-01-23  
**工單主旨：** 共享代碼 - 建立遊戲常數集中管理檔案

## 完成內容摘要

### 1. 建立 `shared/constants.js` 檔案 ✅

已成功建立遊戲常數定義檔案，包含以下內容：

#### 1.1 牌組配置
- **顏色定義** (`COLORS`)：
  - `RED`: 'red'
  - `YELLOW`: 'yellow'
  - `GREEN`: 'green'
  - `BLUE`: 'blue'
- **各顏色牌數** (`CARD_COUNTS`)：
  - 紅色：2張
  - 黃色：3張
  - 綠色：4張
  - 藍色：5張
- **總牌數** (`TOTAL_CARDS`): 14張
- **所有顏色陣列** (`ALL_COLORS`): 包含所有顏色的陣列

#### 1.2 遊戲規則常數
- **最小玩家數** (`MIN_PLAYERS`): 3人
- **最大玩家數** (`MAX_PLAYERS`): 4人
- **蓋牌數量** (`HIDDEN_CARDS_COUNT`): 2張

#### 1.3 遊戲階段常數
- `GAME_PHASE_WAITING`: 'waiting' (等待中)
- `GAME_PHASE_PLAYING`: 'playing' (進行中)
- `GAME_PHASE_FINISHED`: 'finished' (已結束)
- `GAME_PHASES`: 所有遊戲階段的陣列

#### 1.4 問牌類型常數
- `QUESTION_TYPE_ONE_EACH`: 1 (兩個顏色各一張)
- `QUESTION_TYPE_ALL_ONE_COLOR`: 2 (其中一種顏色全部)
- `QUESTION_TYPE_GIVE_ONE_GET_ALL`: 3 (給其中一種顏色一張，要另一種顏色全部)
- `QUESTION_TYPES`: 所有問牌類型的陣列
- `QUESTION_TYPE_DESCRIPTIONS`: 問牌類型描述物件

#### 1.5 動作類型常數
- `ACTION_TYPE_QUESTION`: 'question' (問牌)
- `ACTION_TYPE_GUESS`: 'guess' (猜牌)
- `ACTION_TYPES`: 所有動作類型的陣列

#### 1.6 預設配置
- `DEFAULT_GAME_CONFIG`: 包含所有預設遊戲配置的物件

#### 1.7 工具函數
已實作以下驗證和工具函數：
- `isValidColor(color)`: 驗證顏色是否有效
- `isValidPlayerCount(count)`: 驗證玩家數量是否有效
- `isValidQuestionType(type)`: 驗證問牌類型是否有效
- `isValidGamePhase(phase)`: 驗證遊戲階段是否有效
- `getCardCount(color)`: 取得指定顏色的牌數
- `getQuestionTypeDescription(type)`: 取得問牌類型的描述

### 2. JSDoc 註解 ✅

所有常數和函數都已添加完整的 JSDoc 註解，包括：
- 模組說明
- 常數說明（使用 `@readonly`, `@type`, `@enum` 等標籤）
- 函數說明（參數、返回值）
- 檔案頂部的模組說明

### 3. ES6 Module 匯出 ✅

- 使用 `export const` 匯出所有常數
- 使用 `export function` 匯出所有工具函數
- 確保常數可以被前端和後端（如需要）共用

## 驗收標準檢查

- [x] `shared/constants.js` 檔案已建立
- [x] 所有遊戲相關常數已定義
  - [x] 牌組配置（顏色、牌數、總牌數）
  - [x] 遊戲規則常數（玩家數量、蓋牌數量）
  - [x] 遊戲階段常數
  - [x] 問牌類型常數
  - [x] 動作類型常數
- [x] 常數有完整的 JSDoc 註解
- [x] 常數可以正確匯出和匯入（使用 ES6 module）

## 遇到的問題與解決方案

### 問題 1：常數組織結構
**問題描述**：如何組織大量常數，使其易於維護和使用。

**解決方案**：
- 使用註解區塊將常數分類（牌組配置、遊戲規則、遊戲階段等）
- 為相關常數建立陣列（如 `ALL_COLORS`, `GAME_PHASES`）
- 建立描述物件（如 `QUESTION_TYPE_DESCRIPTIONS`）方便顯示

### 問題 2：工具函數的設計
**問題描述**：是否需要提供驗證函數。

**解決方案**：
- 提供基本的驗證函數，方便後續開發使用
- 這些函數可以在 `gameRules.js` 中進一步使用
- 提供便利函數（如 `getCardCount`, `getQuestionTypeDescription`）

## 測試結果

### 檔案驗證
- ✅ `shared/constants.js` 已建立
- ✅ 檔案格式正確（ES6 module）
- ✅ 所有常數定義完整

### JSDoc 驗證
- ✅ 所有常數都有 JSDoc 註解
- ✅ 所有函數都有完整的 JSDoc 註解（參數、返回值）
- ✅ 模組級別說明已添加

### 匯出驗證
- ✅ 所有常數和函數都正確匯出
- ✅ 可以使用 `import { CONSTANT_NAME } from './shared/constants.js'` 匯入

### 程式碼品質
- ✅ 使用 `readonly` 標籤標記常數
- ✅ 使用 `enum` 標籤標記枚舉類型
- ✅ 程式碼結構清晰，易於維護

## 下一步計劃

根據工作單順序，下一步將執行：

**工作單 0003：建立牌組工具函數 - 牌組初始化**
- 在 `frontend/src/utils/cardUtils.js` 中實作 `createDeck()` 函數
- 使用 `shared/constants.js` 中的常數來建立牌組
- 建立14張牌，每張牌包含 id、color、isHidden 屬性

## 備註

1. **常數設計**：所有常數都設計為不可變（使用 `@readonly`），確保遊戲規則的一致性。

2. **擴展性**：常數定義採用物件和陣列的形式，方便未來擴展（例如：新增顏色、新增問牌類型等）。

3. **工具函數**：提供基本的驗證和工具函數，這些函數可以在後續的 `gameRules.js` 中使用，避免重複代碼。

4. **模組化**：使用 ES6 module 匯出，確保前端和後端（如需要）都可以使用這些常數。

5. **文檔完整性**：完整的 JSDoc 註解有助於 IDE 自動完成和類型檢查，提高開發效率。

## 版本控制

### Git 分支
- ✅ 已從 `master` 分支創建 `work-order-0002` 分支
- ✅ 在工作單分支上完成開發

### 提交資訊
- **提交訊息**：`Work Order 0002: Create game constants file`
- **提交檔案**：
  - `shared/constants.js` - 遊戲常數定義檔案

### 版本控制狀態
- 工作單分支開發完成
- 待合併到 `master` 分支

---

**報告撰寫日期：** 2026-01-23  
**報告狀態：** 完成 ✅  
**版本控制：** 工作單分支已完成，待合併 ✅
