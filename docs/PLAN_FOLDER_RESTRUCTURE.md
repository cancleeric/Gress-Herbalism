# 資料夾結構重組計畫書

## 一、目標

將現有的單一遊戲架構重組為模組化多遊戲架構，使「本草 Herbalism」與未來的「演化論 Evolution」等遊戲能夠獨立管理，同時共用基礎設施。

## 二、現有結構分析

### 2.1 前端組件 (frontend/src/components/)

**現有組件清單：**
| 組件名稱 | 類型 | 說明 |
|---------|------|------|
| Login | 共用 | 登入頁面 |
| Register | 共用 | 註冊頁面 |
| Lobby | 共用 | 遊戲大廳（需修改加入遊戲選擇） |
| Profile | 共用 | 個人資料 |
| Leaderboard | 共用 | 排行榜 |
| Friends | 共用 | 好友系統 |
| ConnectionStatus | 共用 | 連線狀態 |
| VersionInfo | 共用 | 版本資訊 |
| GameRoom | 本草專屬 | 遊戲房間主組件 |
| GameBoard | 本草專屬 | 遊戲桌面（蓋牌顯示） |
| GameSetup | 本草專屬 | 遊戲設置 |
| GameStatus | 本草專屬 | 遊戲狀態顯示 |
| PlayerHand | 本草專屬 | 玩家手牌 |
| QuestionCard | 本草專屬 | 問牌卡片 |
| QuestionFlow | 本草專屬 | 問牌流程 |
| GuessCard | 本草專屬 | 猜牌卡片 |
| CardGiveNotification | 本草專屬 | 給牌通知 |
| ColorCombinationCards | 本草專屬 | 顏色選擇卡片 |
| Prediction | 本草專屬 | 預測功能 |
| AIThinkingIndicator | 本草專屬 | AI 思考指示器 |

### 2.2 後端邏輯 (backend/logic/)

**現有檔案：**
| 檔案 | 說明 |
|------|------|
| cardLogic.js | 牌組邏輯 |
| gameLogic.js | 遊戲邏輯 |
| scoreLogic.js | 計分邏輯 |
| index.js | 匯出入口 |

### 2.3 共用常數 (shared/)

**現有檔案：**
| 檔案 | 說明 |
|------|------|
| constants.js | 遊戲常數（本草專屬） |
| constants.test.js | 常數測試 |
| version.js | 版本資訊 |

### 2.4 其他相關目錄

| 目錄 | 說明 |
|------|------|
| frontend/src/ai/ | AI 玩家系統（本草專屬） |
| frontend/src/store/ | Redux 狀態管理 |
| frontend/src/services/ | API 服務 |
| frontend/src/utils/ | 工具函數 |
| frontend/src/hooks/ | React Hooks |
| frontend/src/controllers/ | 遊戲控制器 |

## 三、目標結構

### 3.1 前端結構

```
frontend/src/
├── components/
│   ├── common/                    # 共用組件
│   │   ├── Login/
│   │   ├── Register/
│   │   ├── Lobby/
│   │   ├── Profile/
│   │   ├── Leaderboard/
│   │   ├── Friends/
│   │   ├── ConnectionStatus/
│   │   ├── VersionInfo/
│   │   └── index.js               # 共用組件匯出
│   │
│   └── games/                     # 遊戲專屬組件
│       ├── herbalism/             # 本草遊戲
│       │   ├── GameRoom/
│       │   ├── GameBoard/
│       │   ├── GameSetup/
│       │   ├── GameStatus/
│       │   ├── PlayerHand/
│       │   ├── QuestionCard/
│       │   ├── QuestionFlow/
│       │   ├── GuessCard/
│       │   ├── CardGiveNotification/
│       │   ├── ColorCombinationCards/
│       │   ├── Prediction/
│       │   ├── AIThinkingIndicator/
│       │   └── index.js           # 本草組件匯出
│       │
│       └── evolution/             # 演化論遊戲（未來）
│           └── index.js
│
├── ai/
│   └── herbalism/                 # 本草 AI（移動現有內容）
│
├── store/
│   ├── index.js                   # Store 設定
│   ├── herbalism/                 # 本草狀態
│   │   ├── gameStore.js
│   │   └── selectors.js
│   └── evolution/                 # 演化論狀態（未來）
│
├── controllers/
│   └── herbalism/                 # 本草控制器
│       └── LocalGameController.js
│
├── hooks/
│   └── herbalism/                 # 本草 Hooks
│       └── useAIPlayers.js
│
├── utils/
│   ├── common/                    # 共用工具
│   │   ├── localStorage.js
│   │   ├── performance.js
│   │   └── validation.js
│   └── herbalism/                 # 本草工具
│       ├── cardUtils.js
│       └── gameRules.js
│
└── services/                      # 保持不變（共用）
    ├── apiService.js
    ├── friendService.js
    ├── gameService.js
    └── socketService.js
```

### 3.2 後端結構

```
backend/
├── logic/
│   ├── common/                    # 共用邏輯（未來）
│   │   └── index.js
│   │
│   └── herbalism/                 # 本草邏輯
│       ├── cardLogic.js
│       ├── gameLogic.js
│       ├── scoreLogic.js
│       └── index.js
│
├── services/                      # 保持不變（共用）
│   ├── friendService.js
│   ├── invitationService.js
│   ├── presenceService.js
│   └── reconnectionService.js
│
└── db/                            # 保持不變
    └── supabase.js
```

### 3.3 共用常數結構

```
shared/
├── constants/
│   ├── common.js                  # 共用常數
│   ├── herbalism.js               # 本草常數
│   ├── evolution.js               # 演化論常數（未來）
│   └── index.js                   # 統一匯出
│
├── utils/
│   └── scoreUtils.js              # 共用計分工具
│
└── version.js                     # 版本資訊
```

## 四、實施計畫

### 階段一：準備工作（工單 0214-0215）

| 工單 | 標題 | 內容 |
|------|------|------|
| 0214 | 建立新目錄結構 | 建立 common/、games/herbalism/、games/evolution/ 等目錄 |
| 0215 | 建立匯出索引檔案 | 建立各目錄的 index.js 匯出檔案 |

### 階段二：前端組件遷移（工單 0216-0218）

| 工單 | 標題 | 內容 |
|------|------|------|
| 0216 | 遷移共用組件 | 將 Login、Lobby、Profile 等移至 common/ |
| 0217 | 遷移本草遊戲組件 | 將 GameRoom、GuessCard 等移至 games/herbalism/ |
| 0218 | 更新組件引用路徑 | 更新 App.js 和其他檔案的 import 路徑 |

### 階段三：後端邏輯遷移（工單 0219-0220）

| 工單 | 標題 | 內容 |
|------|------|------|
| 0219 | 遷移本草後端邏輯 | 將 logic/ 內容移至 logic/herbalism/ |
| 0220 | 更新後端引用路徑 | 更新 server.js 和其他檔案的 require 路徑 |

### 階段四：共用常數重組（工單 0221-0222）

| 工單 | 標題 | 內容 |
|------|------|------|
| 0221 | 重組共用常數 | 建立 shared/constants/ 目錄結構 |
| 0222 | 更新常數引用路徑 | 更新前後端的常數 import 路徑 |

### 階段五：輔助模組遷移（工單 0223-0225）

| 工單 | 標題 | 內容 |
|------|------|------|
| 0223 | 遷移 AI 模組 | 將 ai/ 移至 ai/herbalism/ |
| 0224 | 遷移工具函數 | 將 utils/ 分類至 common/ 和 herbalism/ |
| 0225 | 遷移 Hooks 和 Controllers | 將相關檔案移至對應子目錄 |

### 階段六：驗證與測試（工單 0226-0227）

| 工單 | 標題 | 內容 |
|------|------|------|
| 0226 | 執行測試驗證 | 執行前後端測試確保遷移正確 |
| 0227 | 更新文檔 | 更新 CLAUDE.md 和相關文檔 |

## 五、風險評估

| 風險 | 影響 | 緩解措施 |
|------|------|---------|
| 路徑引用錯誤 | 編譯失敗 | 每階段完成後立即測試 |
| 循環依賴 | 運行錯誤 | 謹慎規劃模組依賴關係 |
| 測試失敗 | 功能異常 | 保留原始檔案直到驗證通過 |

## 六、回滾計畫

如遇嚴重問題，可透過 Git 回滾：
```bash
git checkout HEAD~1 -- frontend/ backend/ shared/
```

## 七、預計工單清單

| 編號 | 標題 | 階段 |
|------|------|------|
| 0214 | 建立新目錄結構 | 階段一 |
| 0215 | 建立匯出索引檔案 | 階段一 |
| 0216 | 遷移共用組件至 common/ | 階段二 |
| 0217 | 遷移本草組件至 games/herbalism/ | 階段二 |
| 0218 | 更新前端組件引用路徑 | 階段二 |
| 0219 | 遷移本草後端邏輯至 logic/herbalism/ | 階段三 |
| 0220 | 更新後端引用路徑 | 階段三 |
| 0221 | 重組共用常數目錄結構 | 階段四 |
| 0222 | 更新常數引用路徑 | 階段四 |
| 0223 | 遷移 AI 模組至 ai/herbalism/ | 階段五 |
| 0224 | 遷移工具函數分類 | 階段五 |
| 0225 | 遷移 Hooks 和 Controllers | 階段五 |
| 0226 | 執行測試驗證 | 階段六 |
| 0227 | 更新專案文檔 | 階段六 |

**總計：14 張工單**

---

**建立日期**：2026-01-31
**完成日期**：2026-01-31
**狀態**：全部完成（工單 0214-0227）
**負責人**：Claude Code

## 八、執行結果摘要

| 工單 | 狀態 | 說明 |
|------|------|------|
| 0214 | ✅ 完成 | 目錄結構建立 |
| 0215 | ✅ 完成 | 索引檔案建立 |
| 0216 | ✅ 完成 | 共用組件遷移 |
| 0217 | ✅ 完成 | 本草組件遷移 |
| 0218 | ✅ 完成 | 前端路徑更新 |
| 0219 | ✅ 完成 | 後端邏輯遷移 |
| 0220 | ✅ 完成 | 後端路徑更新 |
| 0221 | ✅ 完成 | 常數重組 |
| 0222 | ✅ 完成 | 常數路徑更新（相容層） |
| 0223 | ✅ 完成 | AI 模組遷移 |
| 0224 | ✅ 完成 | 工具函數遷移 |
| 0225 | ✅ 完成 | Hooks/Controllers 遷移 |
| 0226 | ✅ 完成 | 測試驗證 |
| 0227 | ✅ 完成 | 文檔更新 |
