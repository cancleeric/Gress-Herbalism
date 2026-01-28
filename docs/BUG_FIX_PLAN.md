# 測試後 BUG 修改計畫書

## 依據
- 測試報告：`reports/REPORT_0204.md`（工單 0199-0204）
- 測試計畫：`docs/TEST_PLAN_RECONNECTION_V2.md`
- 建立日期：2026-01-28

## 問題總覽

| 編號 | 嚴重度 | 類型 | 描述 | 狀態 |
|------|--------|------|------|------|
| BUG-006 | Medium | 部署配置 | Cloud Run session affinity 未配置 | 待修復 |
| BUG-007 | Low | 程式缺陷 | localStorage 無資料完整性驗證 | 待修復 |
| BUG-008 | Low | 測試失敗 | App.test.js 2 個測試：Firebase AuthContext ErrorBoundary | 待修復 |
| BUG-009 | Low | 測試失敗 | SinglePlayerMode.test.js 4 個測試：LocalGameController mock 不完整 | 待修復 |
| BUG-010 | Low | 測試失敗 | AIPlayerSelector.test.js 1 個測試：AI 難度描述文字不一致 | 待修復 |
| BUG-011 | Low | 測試失敗 | Profile.test.js 4 個測試：匿名用戶 UI 文字已更新 | 待修復 |
| BUG-012 | Low | 測試失敗 | QuestionFlow.test.js 4 個測試：QUESTION_TYPE 描述不一致 | 待修復 |
| BUG-013 | Low | 測試基建 | socket 整合測試跨測試干擾 | ✓ 已修復（0203） |
| COV-001 | — | 覆蓋率 | GameRoom.js 59.13%（目標 70%） | 待提升 |
| COV-002 | — | 覆蓋率 | localStorage.js 74.5%（目標 93%） | 待提升 |
| COV-003 | — | 覆蓋率 | Backend server.js 0%（需模組化） | 待規劃 |

---

## 實施計畫

### 第一階段：修復 15 個既有失敗測試（工單 0205）

**目標**：將前端測試從 15 failed → 0 failed

#### BUG-008：App.test.js（2 個測試）

**根因分析**：
- `ErrorBoundary 應該捕獲子組件錯誤` 等 2 個測試失敗
- App.js 中 ErrorBoundary 包在 AuthProvider 外層（第 155-160 行）
- 測試環境中 Firebase AuthContext 初始化時拋出錯誤，觸發 ErrorBoundary
- 測試的 Firebase mock 不完整，未正確模擬 AuthProvider 行為

**修改目標**：測試檔案 `frontend/src/App.test.js`

**修改方案**：
1. 完善 Firebase AuthProvider mock，確保測試環境不會拋出初始化錯誤
2. ErrorBoundary 測試改用獨立的子元件模擬錯誤（不依賴 AuthProvider）

#### BUG-009：SinglePlayerMode.test.js（4 個測試）

**根因分析**：
- `應顯示預設的 AI 設定（2 個中等難度）` 等 4 個測試失敗
- 測試中的 LocalGameController mock（第 110-139 行）缺少方法
- 實際 LocalGameController 有 `startNextRound()`、`handleFollowGuessResponse()`、`endTurn()` 等方法，mock 未提供

**修改目標**：測試檔案 `frontend/src/__tests__/e2e/SinglePlayerMode.test.js`

**修改方案**：
補充 mock 缺少的方法：
```javascript
mockLocalController = {
  handleAction: jest.fn(),
  getState: jest.fn(() => store.getState()),
  destroy: jest.fn(),
  startGame: jest.fn(),
  processPlayerAction: jest.fn().mockResolvedValue({ success: true }),
  getCurrentGameState: jest.fn(() => store.getState()),
  // 以下為需補充的方法
  startNextRound: jest.fn(),
  handleFollowGuessResponse: jest.fn(),
  endTurn: jest.fn(),
  nextTurn: jest.fn(),
  handleQuestion: jest.fn(),
  handleGuess: jest.fn(),
  broadcastEvent: jest.fn(),
  emitStateChange: jest.fn(),
};
```

#### BUG-010：AIPlayerSelector.test.js（1 個測試）

**根因分析**：
- `應該顯示難度描述` 測試失敗（第 217-230 行）
- 測試期望詳細描述（如 `簡單 - 隨機決策，適合新手練習`）
- 實際 `getAIDifficultyDescription()` 回傳簡潔描述（如 `簡單 - 適合新手`）

**對照表**：

| 難度 | 測試期望 | 程式實際值 |
|------|---------|-----------|
| EASY | `簡單 - 隨機決策，適合新手練習` | `簡單 - 適合新手` |
| MEDIUM | `中等 - 基礎推理，會追蹤明顯資訊` | `中等 - 平衡挑戰` |
| HARD | `困難 - 完整推理引擎，最佳化策略` | `困難 - 高級玩家` |

**修改目標**：測試檔案 `frontend/src/components/GameSetup/AIPlayerSelector.test.js`

**修改方案**：
更新測試期望值以匹配 `shared/constants.js` 第 380-387 行的實際描述文字。

#### BUG-011：Profile.test.js（4 個測試）

**根因分析**：
- `工單 0175：匿名玩家應看到登入提示` 等 4 個測試失敗
- 測試期望文字：`請先使用 Google 帳號登入以查看個人資料`
- 程式實際文字：`登入 Google 帳號以解鎖完整功能`（Profile.js 第 113 行）
- UI 已改版為顯示功能列表，但測試未同步更新

**修改目標**：測試檔案 `frontend/src/components/Profile/Profile.test.js`

**修改方案**：
更新測試期望值以匹配 Profile.js 第 113-120 行的實際 UI 文字與結構。

#### BUG-012：QuestionFlow.test.js（4 個測試）

**根因分析**：
- `shows question types in the new format` 等 4 個測試失敗
- 測試使用中英雙語 regex（如 `/各一張.*Each Color/`）
- 實際 `QUESTION_TYPE_DESCRIPTIONS` 只有中文（如 `兩個顏色各一張`）

**對照表**：

| 類型 | 測試 regex | 程式實際值 |
|------|----------|-----------|
| Type 1 | `/各一張.*Each Color/` | `兩個顏色各一張` |
| Type 2 | `/其中一種全部.*All of One/` | `其中一種顏色全部` |
| Type 3 | `/給一張要全部.*Give.*Take/` | `給其中一種顏色一張，要另一種顏色全部` |

**修改目標**：測試檔案 `frontend/src/components/QuestionFlow/QuestionFlow.test.js`

**修改方案**：
更新 regex 為純中文匹配：
```javascript
expect(screen.getByText(/兩個顏色各一張/)).toBeInTheDocument();
expect(screen.getByText(/其中一種顏色全部/)).toBeInTheDocument();
expect(screen.getByText(/給其中一種顏色一張，要另一種顏色全部/)).toBeInTheDocument();
```

#### 驗收標準

- [ ] 前端測試 0 failed（原 15 個全部修復）
- [ ] 無新增回歸（後端維持 215 passed）
- [ ] 前端覆蓋率 ≥ 84%（不低於修改前）

---

### 第二階段：localStorage 強化與覆蓋率（工單 0206）

**目標**：修復 BUG-007 + 將 localStorage.js 覆蓋率從 74.5% 提升至 93%

#### Part A：BUG-007 — 資料完整性驗證

**根因分析**：
- `getCurrentRoom()` 函數（localStorage.js 第 148-168 行）缺乏欄位驗證
- 現有驗證：JSON 解析 ✓、過期檢查 ✓
- 缺少驗證：必要欄位存在性 ✗、欄位型別 ✗、空字串 ✗

**受影響的呼叫端**：

| 檔案 | 行號 | 現有檢查 | 風險 |
|------|------|---------|------|
| Lobby.js | 215-219 | `savedRoom.roomId && savedRoom.playerId` | `playerName` 未驗證 |
| GameRoom.js | 608-611 | `savedRoom.roomId === gameId && savedRoom.playerId` | `playerName` 未驗證 |
| socketService.js | 56-78 | `roomId && playerId && playerName` | Legacy key 未驗證型別 |

**修改目標**：程式檔案 `frontend/src/utils/localStorage.js`

**修改方案**：
在 `getCurrentRoom()` 加入欄位驗證：
```javascript
export function getCurrentRoom() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ROOM);
    if (!data) return null;

    const roomInfo = JSON.parse(data);

    // 過期檢查（既有）
    const EXPIRY_TIME = 2 * 60 * 60 * 1000;
    if (Date.now() - roomInfo.timestamp > EXPIRY_TIME) {
      clearCurrentRoom();
      return null;
    }

    // 【新增】必要欄位驗證
    if (!roomInfo.roomId || typeof roomInfo.roomId !== 'string' ||
        !roomInfo.playerId || typeof roomInfo.playerId !== 'string' ||
        !roomInfo.playerName || typeof roomInfo.playerName !== 'string') {
      console.warn('房間資訊不完整，已清除:', roomInfo);
      clearCurrentRoom();
      return null;
    }

    return roomInfo;
  } catch (e) {
    console.warn('無法從 localStorage 讀取房間資訊:', e);
    return null;
  }
}
```

#### Part B：COV-002 — 暱稱函數測試補充

**根因分析**：
- `saveNickname()`、`getNickname()`、`clearNickname()` 三個函數（localStorage.js 第 59-95 行）完全未測試
- 這些函數佔 localStorage.js 約 18.5% 的程式碼

**函數特性**：
- `saveNickname()` 同時儲存到 NICKNAME 和 PLAYER_NAME 兩個 key（向後相容）
- `getNickname()` 先讀 NICKNAME，fallback 到 PLAYER_NAME
- `clearNickname()` 只清除 NICKNAME key（不清 PLAYER_NAME）

**修改目標**：測試檔案 `frontend/src/utils/localStorage.test.js`

**新增測試案例**（約 18 個）：

```
saveNickname：
  - 應儲存暱稱到 NICKNAME key
  - 應同時儲存到 PLAYER_NAME key（向後相容）
  - 應自動去除前後空白
  - 空字串不應被儲存
  - 只有空白的字串不應被儲存
  - null 不應被儲存
  - localStorage 錯誤時不應拋出異常

getNickname：
  - 應從 NICKNAME key 讀取
  - NICKNAME 不存在時應 fallback 到 PLAYER_NAME
  - 兩個 key 都存在時應優先使用 NICKNAME
  - 沒有任何資料時應返回空字串
  - localStorage 錯誤時應返回空字串

clearNickname：
  - 應清除 NICKNAME key
  - 不應清除 PLAYER_NAME key
  - localStorage 錯誤時不應拋出異常

getCurrentRoom 完整性驗證（BUG-007）：
  - 缺少 roomId 應返回 null
  - 缺少 playerId 應返回 null
  - 缺少 playerName 應返回 null
  - 非字串型別應返回 null
  - 不完整資料應被自動清除
```

#### 驗收標準

- [ ] `getCurrentRoom()` 包含欄位完整性驗證
- [ ] localStorage.js 覆蓋率 ≥ 93%
- [ ] 新增測試全部通過
- [ ] 既有測試無回歸

---

### 第三階段：Cloud Run Session Affinity（工單 0207）

**目標**：修復 BUG-006，確保 Socket.io polling 降級時不會路由到不同容器

#### 問題分析

**現況**：
- Socket.io 設定 `transports: ['websocket', 'polling']`（server.js 第 313-324 行）
- 遊戲狀態存在記憶體 Map（`gameRooms`、`playerSockets`）中
- 無 session affinity 配置
- 無 Cloud Run 部署配置檔

**風險場景**：
1. WebSocket 連線降級為 HTTP polling
2. Polling 請求被 Cloud Run 負載均衡路由到不同容器
3. 該容器無遊戲狀態 → 操作失敗 / 玩家被踢出

**修改方案**（三選一，依環境決定）：

##### 方案 A：Cloud Run 設定 session affinity（推薦）

新增或修改部署配置：
```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: gress-backend
  annotations:
    run.googleapis.com/sessionAffinity: "true"
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/sessionAffinity: "true"
```

或使用 gcloud CLI：
```bash
gcloud run services update gress-backend --session-affinity
```

##### 方案 B：強制 WebSocket Only

修改 server.js 與 socketService.js：
```javascript
// server.js
transports: ['websocket'],  // 移除 polling
allowUpgrades: false,

// socketService.js
transports: ['websocket'],  // 移除 polling
```

**注意**：此方案在某些企業防火牆環境下可能無法連線。

##### 方案 C：使用 Redis Adapter

安裝 `@socket.io/redis-adapter`，讓多容器共享 Socket.io 狀態：
```javascript
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();
io.adapter(createAdapter(pubClient, subClient));
```

**注意**：此方案成本較高，需額外 Redis 服務。

#### 驗收標準

- [ ] 選定並實施一種方案
- [ ] 本地測試 Socket.io 連線穩定性
- [ ] 部署後驗證 polling 降級場景不會斷線

---

### 第四階段：GameRoom.js 覆蓋率提升（工單 0208）

**目標**：將 GameRoom.js 覆蓋率從 59.13% 提升至 ≥ 70%

#### 覆蓋率缺口分析

GameRoom.js 共 2,318 行，需額外覆蓋約 252 行（10.87%）。

**目前已覆蓋**：重連邏輯（第 560-667 行）、基本遊戲操作
**未覆蓋的主要區域**：

| 區域 | 行數範圍 | 估計行數 | 覆蓋難度 |
|------|---------|---------|---------|
| UI 工具函數 | 962-1075 | ~113 | 低（純函數） |
| 遊戲操作 handler | 656-944 | ~288 | 中 |
| AI / 本地模式 | 236-382 | ~146 | 中高 |
| Socket 事件處理 | 414-625 | ~211 | 中高 |
| JSX 渲染邏輯 | 1080-2318 | ~1238 | 高 |

**優先測試項目**（投入產出比最高）：

##### Priority 1（預計 +5%）
| 函數 | 說明 | 測試數 |
|------|------|--------|
| `getGamePhaseText()` | 回傳遊戲階段中文字 | 5 |
| `getPlayerInitial()` | 取玩家名字首字 | 3 |
| `formatHistoryRecord()` | 格式化歷史紀錄 | 6 |
| `handleCopyRoomLink()` | 複製房間連結（mock clipboard） | 3 |

##### Priority 2（預計 +4%）
| 函數 | 說明 | 測試數 |
|------|------|--------|
| `handleLeaveRoom()` | 離開房間 + 清理 localStorage | 3 |
| `handleStartGame()` | 開始遊戲 | 2 |
| `handleQuestionFlowSubmit()` | 問牌提交 | 3 |
| `handleGuessSubmit()` | 猜牌提交 | 3 |
| `handleFollowGuess()` | 跟猜回應 | 2 |

##### Priority 3（預計 +3%）
| 函數 | 說明 | 測試數 |
|------|------|--------|
| UI 狀態切換 | `showQuestionFlow` / `showPrediction` | 4 |
| 遊戲階段轉換 | playing → roundEnd → nextRound | 3 |
| 停用卡牌邏輯 | `handleDisabledCardClick` | 2 |

**預計新增**：約 39 個測試案例，覆蓋率 59.13% → ~71%

#### 驗收標準

- [ ] GameRoom.js 覆蓋率 ≥ 70%
- [ ] 新增測試全部通過
- [ ] 既有測試無回歸

---

### 第五階段：Backend server.js 模組化（工單 0209-0211）

**目標**：將 server.js（1,934 行）拆分為可測試的模組，將後端覆蓋率從 21.63% 提升至 ≥ 40%

#### 現況問題

- server.js 包含所有 Socket handler + 遊戲邏輯 + API 路由
- 遊戲狀態為模組內部 Map，外部無法存取
- 無法單獨匯入函數進行單元測試
- Jest coverage 只計算直接匯入的模組

#### 模組化架構

```
backend/
├── server.js              （瘦身至 ~300 行：Express + Socket.io 初始化）
├── handlers/              （新建）
│   ├── roomHandlers.js    （~150 行：createRoom, joinRoom, leaveRoom）
│   ├── gameHandlers.js    （~200 行：gameAction, colorChoiceSubmit, endTurn）
│   ├── roundHandlers.js   （~100 行：revealHiddenCards, startNextRound）
│   └── reconnectionHandlers.js （~150 行：disconnect, reconnect）
├── gameLogic/             （新建）
│   ├── gameProcessor.js   （~300 行：processGameAction, processQuestionAction 等）
│   ├── gameValidator.js   （~200 行：validateGuessResult, settlePredictions）
│   ├── cardUtils.js       （~100 行：createDeck, shuffleDeck, dealCards）
│   └── stateManager.js    （~200 行：gameRooms, playerSockets 等 Map 管理）
└── __tests__/
    ├── gameLogic/
    │   ├── gameProcessor.test.js
    │   ├── gameValidator.test.js
    │   └── cardUtils.test.js
    └── handlers/
        ├── roomHandlers.test.js
        └── gameHandlers.test.js
```

#### 分三張工單執行

##### 工單 0209：抽取純邏輯函數

**範圍**：
- 建立 `gameLogic/cardUtils.js`：抽取 `createDeck()`、`shuffleDeck()`、`dealCards()`
- 建立 `gameLogic/gameValidator.js`：抽取 `validateGuessResult()`、`settlePredictions()`、`checkWinCondition()`
- 撰寫對應測試（約 50 個案例）

**預計效果**：後端覆蓋率 21.63% → ~30%

##### 工單 0210：抽取遊戲流程處理

**範圍**：
- 建立 `gameLogic/gameProcessor.js`：抽取 `processGameAction()`、`processQuestionAction()`、`processColorChoice()`、`processGuessAction()`
- 建立 `gameLogic/stateManager.js`：封裝 `gameRooms`、`playerSockets` 等 Map
- 撰寫對應測試（約 80 個案例）

**前置條件**：工單 0209 完成

**預計效果**：後端覆蓋率 ~30% → ~40%

##### 工單 0211：抽取 Socket Handler

**範圍**：
- 建立 `handlers/` 目錄下各 handler 模組
- server.js 瘦身為初始化 + handler 註冊
- 撰寫 handler 測試（mock socket，約 50 個案例）

**前置條件**：工單 0210 完成

**預計效果**：後端覆蓋率 ~40% → ~50%

#### 驗收標準

- [ ] server.js 瘦身至 ≤ 400 行
- [ ] 後端覆蓋率 ≥ 40%
- [ ] 所有既有測試通過（215 個 + 新增）
- [ ] 既有功能無回歸

---

## 實施總覽

| 階段 | 工單 | 內容 | 影響範圍 | 優先度 |
|------|------|------|---------|--------|
| 一 | 0205 | 修復 15 個失敗測試（BUG-008~012） | 僅測試檔案 | 最高 |
| 二 | 0206 | localStorage 強化 + 暱稱測試（BUG-007, COV-002） | 1 程式 + 1 測試 | 高 |
| 三 | 0207 | Cloud Run session affinity（BUG-006） | 部署配置 | 高 |
| 四 | 0208 | GameRoom.js 覆蓋率提升（COV-001） | 僅測試檔案 | 中 |
| 五 | 0209 | Backend 純邏輯抽取 + 測試（COV-003-a） | 後端重構 | 中 |
| 五 | 0210 | Backend 遊戲流程抽取 + 測試（COV-003-b） | 後端重構 | 中 |
| 五 | 0211 | Backend Socket Handler 抽取（COV-003-c） | 後端重構 | 低 |

## 預期成果

| 指標 | 修改前 | 修改後（目標） |
|------|--------|---------------|
| 前端失敗測試 | 15 | 0 |
| 前端覆蓋率 | 84.03% | ≥ 86% |
| GameRoom.js 覆蓋率 | 59.13% | ≥ 70% |
| localStorage.js 覆蓋率 | 74.5% | ≥ 93% |
| 後端覆蓋率 | 21.63% | ≥ 40% |
| 殘留 BUG | 7 個 | 0 個 |
