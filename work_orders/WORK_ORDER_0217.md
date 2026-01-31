# 工作單 0217

## 編號
0217

## 日期
2026-01-31

## 工作單標題
遷移本草組件至 games/herbalism/

## 工單主旨
資料夾結構重組 - 階段二

## 內容

### 目標
將本草遊戲專屬組件從 components/ 根目錄遷移至 components/games/herbalism/ 目錄。

### 需遷移的組件

| 原路徑 | 新路徑 |
|--------|--------|
| components/GameRoom/ | components/games/herbalism/GameRoom/ |
| components/GameBoard/ | components/games/herbalism/GameBoard/ |
| components/GameSetup/ | components/games/herbalism/GameSetup/ |
| components/GameStatus/ | components/games/herbalism/GameStatus/ |
| components/PlayerHand/ | components/games/herbalism/PlayerHand/ |
| components/QuestionCard/ | components/games/herbalism/QuestionCard/ |
| components/QuestionFlow/ | components/games/herbalism/QuestionFlow/ |
| components/GuessCard/ | components/games/herbalism/GuessCard/ |
| components/CardGiveNotification/ | components/games/herbalism/CardGiveNotification/ |
| components/ColorCombinationCards/ | components/games/herbalism/ColorCombinationCards/ |
| components/Prediction/ | components/games/herbalism/Prediction/ |
| components/AIThinkingIndicator/ | components/games/herbalism/AIThinkingIndicator/ |

### 執行步驟

1. 依序複製所有本草專屬組件至 games/herbalism/
2. 更新 games/herbalism/index.js 匯出所有組件
3. 更新 games/index.js 匯出 herbalism 模組
4. 驗證檔案完整性

### 驗收標準

- [ ] 所有本草組件已遷移至 games/herbalism/
- [ ] games/herbalism/index.js 正確匯出所有組件
- [ ] 原始檔案暫時保留（待路徑更新後刪除）

### 依賴工單
- 0214（建立新目錄結構）
- 0215（建立匯出索引檔案）

### 相關文件
- docs/PLAN_FOLDER_RESTRUCTURE.md
