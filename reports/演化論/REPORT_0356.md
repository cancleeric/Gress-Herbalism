# 工單報告 0356：遊戲回放系統

## 基本資訊

- **工單編號**：0356
- **完成日期**：2026-02-02
- **所屬計畫**：P2-C 資料庫統計

---

## 完成內容摘要

### 1. 回放服務（後端）

建立 `backend/services/evolution/replayService.js`：

**事件類型**：
| 事件 | 說明 |
|------|------|
| game_start | 遊戲開始 |
| phase_change | 階段變更 |
| card_play | 出牌 |
| create_creature | 創造生物 |
| add_trait | 添加性狀 |
| food_reveal | 食物揭示 |
| feeding | 進食 |
| attack | 攻擊 |
| defense | 防禦 |
| extinction | 滅絕 |
| game_end | 遊戲結束 |

**核心功能**：
- `startRecording(gameId, initialState)` - 開始記錄
- `recordEvent(gameId, type, data)` - 記錄事件
- `endRecording(gameId, finalState)` - 結束記錄並儲存
- `getReplay(gameId)` - 取得回放資料
- 事件壓縮/解壓縮（使用相對時間戳）

### 2. 回放播放器（前端）

建立 `frontend/src/components/games/evolution/replay/ReplayPlayer.jsx`：

**播放控制**：
- 播放/暫停
- 停止
- 進度條跳轉
- 速度控制（0.5x, 1x, 1.5x, 2x, 4x）

**狀態**：
- IDLE - 閒置
- PLAYING - 播放中
- PAUSED - 暫停
- FINISHED - 完成

**回調**：
- `onEventPlay(event, index)` - 事件播放時
- `onComplete()` - 播放完成時

---

## 測試結果

### 後端

```
Test Suites: 1 passed, 1 total
Tests:       36 passed, 36 total
Time:        1.977 s

覆蓋率：
- replayService.js: 93.58%
```

### 前端

```
Test Suites: 1 passed, 1 total
Tests:       15 passed, 15 total
Time:        5.212 s
```

---

## 驗收標準完成狀態

| 驗收項目 | 狀態 |
|---------|------|
| 事件記錄完整 | ✅ |
| 回放播放正確 | ✅ |
| 播放控制正常 | ✅ |
| 儲存效率良好 | ✅ |

---

## 新增的檔案

### 後端服務
- `backend/services/evolution/replayService.js`

### 後端測試
- `backend/services/evolution/__tests__/replayService.test.js`

### 前端組件
- `frontend/src/components/games/evolution/replay/ReplayPlayer.jsx`
- `frontend/src/components/games/evolution/replay/ReplayPlayer.css`
- `frontend/src/components/games/evolution/replay/index.js`

### 前端測試
- `frontend/src/components/games/evolution/replay/__tests__/ReplayPlayer.test.jsx`

### 報告
- `reports/演化論/REPORT_0356.md`

---

## 技術決策

### 事件壓縮

使用相對時間戳減少儲存空間：

```javascript
// 壓縮前
{ type: 'phase_change', timestamp: 1234567890000, data: { phase: 'evolution' } }

// 壓縮後
{ t: 'phase_change', d: 1000, phase: 'evolution' }
```

- `t` = type（縮短欄位名）
- `d` = delta time（相對於第一個事件的毫秒差）
- 其餘資料直接展開

### 記憶體緩衝區

使用 Map 儲存進行中遊戲的事件：
- 遊戲結束時批次寫入資料庫
- 減少資料庫寫入頻率
- 避免遊戲中的延遲

### 敏感資料清理

自動移除事件中的敏感欄位：
- socketId
- ip
- token

---

## 使用範例

### 後端記錄

```javascript
const { replayService } = require('./services/evolution/replayService');

// 遊戲開始
replayService.startRecording(gameId, { turnOrder, config });

// 記錄事件
replayService.recordPhaseChange(gameId, 'feeding', 1);
replayService.recordCreateCreature(gameId, playerId, creatureId, cardId);
replayService.recordAttack(gameId, attackerId, attackerCreatureId, targetId, targetCreatureId, true);

// 遊戲結束
await replayService.endRecording(gameId, { winner, scores, round });
```

### 前端播放

```jsx
import { ReplayPlayer } from './components/games/evolution/replay';

<ReplayPlayer
  events={replayEvents}
  onEventPlay={(event, index) => {
    // 更新遊戲視覺狀態
    applyGameEvent(event);
  }}
  onComplete={() => {
    console.log('回放結束');
  }}
/>
```

---

## 下一步計劃

工單 0356 完成，繼續執行：
- 工單 0357：資料庫路由整合

---

**報告撰寫者**：Claude Code
**報告日期**：2026-02-02
