# 演化論遊戲測試計畫書 V2

**文件編號**：TEST-PLAN-EVO-V2
**版本**：2.0
**建立日期**：2026-01-31
**測試負責人**：Claude Code

---

## 1. 測試概述

### 1.1 測試目的

驗證演化論遊戲的所有功能正確運作，包括：
- 核心遊戲邏輯
- 房間管理系統
- 遊戲流程控制
- 卡牌與性狀系統
- 前後端整合

### 1.2 測試範圍

| 範圍 | 說明 |
|------|------|
| 後端邏輯 | cardLogic, creatureLogic, feedingLogic, phaseLogic, gameLogic |
| 房間管理 | evolutionRoomManager |
| 常數定義 | shared/constants/evolution.js |
| 前後端整合 | Socket.io 事件處理 |

### 1.3 測試環境

- Node.js v18+
- 測試框架：自製診斷腳本
- 測試執行位置：`backend/tests/evolution/`

---

## 2. 測試策略

### 2.1 測試層級

```
┌─────────────────────────────────────────────────┐
│                 E2E 測試 (Level 3)              │
│         完整遊戲流程、多玩家互動                │
├─────────────────────────────────────────────────┤
│              整合測試 (Level 2)                 │
│      模組間協作、房間管理、Socket 整合          │
├─────────────────────────────────────────────────┤
│              單元測試 (Level 1)                 │
│   cardLogic, creatureLogic, feedingLogic, etc.  │
└─────────────────────────────────────────────────┘
```

### 2.2 測試優先級

| 優先級 | 說明 | 測試項目 |
|--------|------|----------|
| P0 | 核心功能 | 遊戲初始化、階段流程、勝負判定 |
| P1 | 重要功能 | 性狀系統、進食系統、攻擊系統 |
| P2 | 輔助功能 | 房間管理、連線處理、錯誤處理 |

---

## 3. 單元測試計畫

### 3.1 cardLogic.js 測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-CARD-001 | createDeck | 建立完整牌庫 | 84 張牌，性狀分布正確 |
| UT-CARD-002 | shuffleDeck | 洗牌功能 | 長度不變，順序改變 |
| UT-CARD-003 | drawCards | 抽牌功能 | 正確抽取並更新牌庫 |
| UT-CARD-004 | getTraitInfo | 性狀資訊查詢 | 返回完整性狀資訊 |
| UT-CARD-005 | validateTraitPlacement-一般 | 一般性狀放置 | 只能放自己的生物 |
| UT-CARD-006 | validateTraitPlacement-寄生蟲 | 寄生蟲放置 | 只能放對手的生物 |
| UT-CARD-007 | validateTraitPlacement-互動 | 互動性狀放置 | 需要兩隻自己的生物 |
| UT-CARD-008 | validateTraitPlacement-重複 | 重複性狀檢查 | 拒絕重複（脂肪除外） |
| UT-CARD-009 | validateTraitPlacement-互斥 | 互斥性狀檢查 | 肉食與腐食互斥 |

### 3.2 creatureLogic.js 測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-CREA-001 | createCreature | 創建生物 | 正確初始化所有屬性 |
| UT-CREA-002 | addTrait-一般 | 添加一般性狀 | traits 長度增加 |
| UT-CREA-003 | addTrait-肉食 | 添加肉食性狀 | 食量 +1 |
| UT-CREA-004 | addTrait-互動 | 添加互動性狀 | 兩隻生物都有連結 |
| UT-CREA-005 | removeTrait | 移除性狀 | traits 長度減少 |
| UT-CREA-006 | calculateFoodNeed | 計算食量 | 基礎1 + 性狀加成 |
| UT-CREA-007 | checkIsFed | 吃飽判定 | 食物 >= 食量需求 |
| UT-CREA-008 | isCarnivore | 肉食判定 | 有肉食性狀返回 true |
| UT-CREA-009 | canBeAttacked-偽裝 | 偽裝防禦 | 需要銳目才能攻擊 |
| UT-CREA-010 | canBeAttacked-穴居 | 穴居防禦 | 吃飽時無法被攻擊 |
| UT-CREA-011 | canBeAttacked-水生 | 水生限制 | 水生對水生 |
| UT-CREA-012 | canBeAttacked-巨化 | 巨化限制 | 巨化對巨化 |
| UT-CREA-013 | rollAgileEscape | 敏捷逃脫 | 4-6 逃脫成功 |
| UT-CREA-014 | canUseTailLoss | 斷尾可用 | 有斷尾且有其他性狀 |
| UT-CREA-015 | checkExtinction | 滅絕判定 | 未吃飽且非冬眠 |

### 3.3 feedingLogic.js 測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-FEED-001 | feedCreature-紅 | 一般進食 | 紅色食物 +1 |
| UT-FEED-002 | feedCreature-脂肪 | 脂肪儲存 | 黃色食物增加 |
| UT-FEED-003 | attackCreature | 肉食攻擊 | 攻擊者獲得 2 藍食物 |
| UT-FEED-004 | resolveAttack-斷尾 | 斷尾防禦 | 攻擊取消，獲 1 藍食物 |
| UT-FEED-005 | resolveAttack-擬態 | 擬態轉移 | 攻擊轉移 |
| UT-FEED-006 | resolveAttack-敏捷 | 敏捷逃脫 | 骰子判定 |
| UT-FEED-007 | processCommunication | 溝通觸發 | 連結生物也拿紅食物 |
| UT-FEED-008 | processCooperation | 合作觸發 | 連結生物拿藍食物 |
| UT-FEED-009 | triggerScavenger | 腐食觸發 | 有腐食的生物拿藍食物 |
| UT-FEED-010 | useRobbery | 掠奪使用 | 偷取食物成功 |
| UT-FEED-011 | useTrampling | 踐踏使用 | 移除食物池食物 |
| UT-FEED-012 | useHibernation | 冬眠使用 | 視為吃飽 |

### 3.4 phaseLogic.js 測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-PHAS-001 | startEvolutionPhase | 演化階段開始 | phase = evolution |
| UT-PHAS-002 | handleEvolutionPass | 演化跳過 | 標記 hasPassed |
| UT-PHAS-003 | startFoodPhase | 食物階段開始 | 擲骰決定食物 |
| UT-PHAS-004 | rollDice-2人 | 2人食物公式 | 1d6 + 2 |
| UT-PHAS-005 | rollDice-3人 | 3人食物公式 | 2d6 |
| UT-PHAS-006 | rollDice-4人 | 4人食物公式 | 2d6 + 2 |
| UT-PHAS-007 | startFeedingPhase | 進食階段開始 | 重置進食狀態 |
| UT-PHAS-008 | startExtinctionPhase | 滅絕階段 | 處理滅絕與抽牌 |
| UT-PHAS-009 | advancePhase | 階段推進 | 正確循環 |
| UT-PHAS-010 | calculateScores | 計分 | 生物+2，性狀+1+加成 |
| UT-PHAS-011 | determineWinner | 勝者判定 | 最高分者獲勝 |
| UT-PHAS-012 | checkGameEnd | 結束判定 | 最後回合滅絕後結束 |

### 3.5 gameLogic.js 測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| UT-GAME-001 | initGame | 遊戲初始化 | 完整 gameState |
| UT-GAME-002 | startGame | 開始遊戲 | phase = evolution |
| UT-GAME-003 | validateAction-輪次 | 輪次檢查 | 非當前玩家拒絕 |
| UT-GAME-004 | processAction-創建 | 創建生物 | 生物加入 creatures |
| UT-GAME-005 | processAction-性狀 | 添加性狀 | 性狀加入生物 |
| UT-GAME-006 | processAction-進食 | 進食動作 | 食物更新 |
| UT-GAME-007 | processAction-攻擊 | 攻擊動作 | 攻擊流程執行 |
| UT-GAME-008 | processAction-跳過 | 跳過動作 | 標記並移動回合 |
| UT-GAME-009 | getGameState | 狀態查詢 | 隱藏其他玩家手牌 |
| UT-GAME-010 | getGameResult | 結果查詢 | 返回分數和勝者 |

---

## 4. 整合測試計畫

### 4.1 房間管理整合測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| IT-ROOM-001 | 完整房間流程 | 創建→加入→準備→開始 | 遊戲正常開始 |
| IT-ROOM-002 | 房主離開 | 房主離開房間 | 權限正確轉移 |
| IT-ROOM-003 | 玩家重連 | 玩家斷線重連 | 狀態正確恢復 |
| IT-ROOM-004 | 人數限制 | 超過最大人數加入 | 正確拒絕 |
| IT-ROOM-005 | 遊戲中加入 | 遊戲開始後加入 | 正確拒絕 |

### 4.2 遊戲流程整合測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| IT-FLOW-001 | 完整回合 | 演化→食物→進食→滅絕 | 階段正確循環 |
| IT-FLOW-002 | 多回合遊戲 | 執行 3 回合 | 狀態持續正確 |
| IT-FLOW-003 | 遊戲結束 | 牌庫空後結束 | 正確計分 |
| IT-FLOW-004 | 性狀互動 | 溝通+合作連鎖 | 連鎖效果正確 |
| IT-FLOW-005 | 攻擊流程 | 完整攻擊→防禦 | 流程正確處理 |

### 4.3 Socket.io 整合測試

| 編號 | 測試項目 | 測試內容 | 預期結果 |
|------|----------|----------|----------|
| IT-SOCK-001 | evo:createRoom | 創建房間事件 | 返回房間資訊 |
| IT-SOCK-002 | evo:joinRoom | 加入房間事件 | 廣播玩家加入 |
| IT-SOCK-003 | evo:setReady | 準備狀態事件 | 狀態同步 |
| IT-SOCK-004 | evo:startGame | 開始遊戲事件 | 廣播遊戲狀態 |
| IT-SOCK-005 | evo:gameAction | 遊戲動作事件 | 更新並廣播 |
| IT-SOCK-006 | evo:leaveRoom | 離開房間事件 | 廣播玩家離開 |

---

## 5. E2E 測試計畫

### 5.1 完整遊戲流程測試

| 編號 | 測試場景 | 步驟 | 預期結果 |
|------|----------|------|----------|
| E2E-001 | 2人基礎遊戲 | 創建房間→加入→開始→出牌→進食→結束 | 遊戲正常進行 |
| E2E-002 | 肉食攻擊流程 | 創建肉食生物→攻擊→防禦回應 | 攻擊流程完整 |
| E2E-003 | 性狀連鎖效果 | 溝通+合作→進食觸發連鎖 | 連鎖正確觸發 |
| E2E-004 | 滅絕與抽牌 | 回合結束→未吃飽滅絕→抽牌 | 正確處理 |
| E2E-005 | 遊戲結束計分 | 牌庫空→最後回合→計分 | 分數正確 |

### 5.2 異常情況測試

| 編號 | 測試場景 | 步驟 | 預期結果 |
|------|----------|------|----------|
| E2E-ERR-001 | 非法動作 | 非當前玩家嘗試動作 | 正確拒絕 |
| E2E-ERR-002 | 無效目標 | 攻擊不存在的生物 | 正確拒絕 |
| E2E-ERR-003 | 重複性狀 | 放置已有的性狀 | 正確拒絕 |
| E2E-ERR-004 | 階段限制 | 進食階段嘗試出牌 | 正確拒絕 |

---

## 6. 測試數據準備

### 6.1 基礎測試數據

```javascript
// 測試玩家
const testPlayers = [
  { id: 'p1', name: '玩家1', firebaseUid: 'uid1' },
  { id: 'p2', name: '玩家2', firebaseUid: 'uid2' }
];

// 測試生物
const testCreature = {
  id: 'c1',
  ownerId: 'p1',
  traits: [],
  food: { red: 0, blue: 0, yellow: 0 },
  foodNeeded: 1,
  isFed: false
};
```

### 6.2 性狀測試場景

| 場景 | 性狀組合 | 測試目的 |
|------|----------|----------|
| 防禦組合 | 偽裝 + 穴居 | 多重防禦測試 |
| 進食組合 | 脂肪 + 掠奪 | 進食策略測試 |
| 互動組合 | 溝通 + 合作 | 連鎖效果測試 |
| 肉食組合 | 肉食 + 銳目 + 巨化 | 攻擊能力測試 |

---

## 7. 測試執行計畫

### 7.1 工單分配

| 工單編號 | 標題 | 內容 |
|----------|------|------|
| 0303 | cardLogic 單元測試 | UT-CARD-001 ~ 009 |
| 0304 | creatureLogic 單元測試 | UT-CREA-001 ~ 015 |
| 0305 | feedingLogic 單元測試 | UT-FEED-001 ~ 012 |
| 0306 | phaseLogic 單元測試 | UT-PHAS-001 ~ 012 |
| 0307 | gameLogic 單元測試 | UT-GAME-001 ~ 010 |
| 0308 | 房間管理整合測試 | IT-ROOM-001 ~ 005 |
| 0309 | 遊戲流程整合測試 | IT-FLOW-001 ~ 005 |
| 0310 | Socket.io 整合測試 | IT-SOCK-001 ~ 006 |
| 0311 | E2E 測試 | E2E-001 ~ 005, E2E-ERR-001 ~ 004 |
| 0312 | 測試報告彙整 | 彙整所有測試結果 |

### 7.2 執行順序

```
第一批（單元測試）：
├── 工單 0303：cardLogic
├── 工單 0304：creatureLogic
├── 工單 0305：feedingLogic
├── 工單 0306：phaseLogic
└── 工單 0307：gameLogic

第二批（整合測試）：
├── 工單 0308：房間管理
├── 工單 0309：遊戲流程
└── 工單 0310：Socket.io

第三批（E2E 測試）：
└── 工單 0311：完整流程

第四批（報告）：
└── 工單 0312：測試報告
```

---

## 8. 驗收標準

### 8.1 測試通過標準

| 測試層級 | 通過率要求 |
|----------|------------|
| 單元測試 | ≥ 95% |
| 整合測試 | ≥ 90% |
| E2E 測試 | ≥ 85% |

### 8.2 發布標準

- 無 P0 級別失敗
- P1 級別失敗 ≤ 2 個
- 所有失敗項目有對應的修復計畫

---

## 9. 測試報告格式

每個工單完成後需撰寫報告，包含：
1. 測試項目數量
2. 通過/失敗/跳過數量
3. 失敗項目詳情
4. 發現的問題
5. 下一步建議

---

**計畫書結束**

*建立者：Claude Code*
*建立日期：2026-01-31*
