# 工單 0367 完成報告

## 基本資訊

| 項目 | 內容 |
|------|------|
| 工單編號 | 0367 |
| 工單標題 | E2E 測試框架設置 |
| 完成日期 | 2026-02-07 |
| 所屬計畫 | P2-D 品質保證 |

---

## 完成內容摘要

### 1. Cypress 配置

`cypress.config.js` 主要設定：

| 項目 | 設定值 |
|------|--------|
| baseUrl | http://localhost:3000 |
| specPattern | tests/e2e/**/*.spec.js |
| 預設視窗 | 1280 x 720 |
| 命令超時 | 10 秒 |
| 頁面載入超時 | 30 秒 |
| 失敗重試 | 2 次（CI）/ 0 次（本地） |
| 影片錄製 | 啟用 |
| 截圖 | 失敗時自動截圖 |

### 2. 自訂命令

| 類別 | 命令 | 說明 |
|------|------|------|
| 登入 | `login` | 測試用戶登入 |
| 登入 | `logout` | 登出 |
| 遊戲 | `createRoom` | 創建房間 |
| 遊戲 | `joinRoom` | 加入房間 |
| 遊戲 | `startGame` | 開始遊戲 |
| 遊戲 | `setReady` | 設定準備狀態 |
| 動作 | `selectCard` | 選擇手牌 |
| 動作 | `playAsCreature` | 作為生物打出 |
| 動作 | `playAsTrait` | 作為性狀打出 |
| 動作 | `feedCreature` | 進食 |
| 動作 | `pass` | 跳過回合 |
| 觸控 | `longPress` | 模擬長按 |
| 觸控 | `swipe` | 模擬滑動 |
| 觸控 | `pinch` | 模擬縮放 |
| 斷言 | `assertPhase` | 驗證遊戲階段 |
| 斷言 | `assertRound` | 驗證回合數 |
| 網路 | `goOffline` | 模擬離線 |
| 網路 | `goOnline` | 模擬上線 |

### 3. npm 腳本

| 腳本 | 說明 |
|------|------|
| `cypress:open` | 開啟 Cypress UI |
| `cypress:run` | 無頭模式執行 |
| `cypress:run:mobile` | 執行手機測試 |
| `e2e` | 啟動服務器 + 執行測試 |
| `e2e:open` | 啟動服務器 + 開啟 UI |

---

## 新增檔案

```
cypress.config.js                    # Cypress 配置

tests/e2e/
├── support/
│   ├── e2e.js                       # 支援檔案
│   └── commands.js                  # 自訂命令
├── fixtures/
│   ├── testPlayers.json             # 測試玩家資料
│   └── gameState.json               # 遊戲狀態資料
└── smoke/
    └── framework.spec.js            # 框架驗證測試
```

---

## 測試結構

```
tests/e2e/
├── smoke/          # 煙霧測試
├── mobile/         # 移動端測試（已存在）
├── core/           # 核心流程測試（待建立）
└── edge/           # 邊界條件測試（待建立）
```

---

## 驗收標準達成

| 項目 | 狀態 |
|------|------|
| Cypress 配置 | ✅ 完成 |
| 自訂命令可用 | ✅ 18+ 命令 |
| 測試資料夾結構 | ✅ 完成 |
| Mock 支援 | ✅ 網路模擬命令 |
| CI 整合 | ✅ npm 腳本 |

---

## 使用方式

### 本地開發

```bash
# 開啟 Cypress UI
cd frontend
npm run cypress:open

# 無頭模式執行
npm run cypress:run

# 自動啟動服務器並測試
npm run e2e
```

### CI 環境

```yaml
# GitHub Actions 範例
- name: E2E Tests
  run: |
    cd frontend
    npm run e2e
```

---

## 下一步計劃

- **工單 0368**：E2E 核心流程測試
- **工單 0369**：E2E 邊界條件測試

---

**報告完成**

*撰寫者：Claude Code*
*日期：2026-02-07*
