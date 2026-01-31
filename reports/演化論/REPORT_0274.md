# 報告書 0274

## 工作單編號
0274

## 完成日期
2026-01-31

## 完成內容摘要

修改 `EvolutionRoom.js` 連接 Socket.io，使遊戲能夠正常進行。

### 主要修改

#### 1. 導入 Socket 服務函數
- `evoJoinRoom` - 加入房間
- `evoCreateCreature` - 創造生物
- `evoAddTrait` - 賦予性狀
- `evoPassEvolution` - 跳過演化
- `evoFeedCreature` - 進食
- `evoAttack` - 攻擊
- `evoRespondAttack` - 回應攻擊
- `evoUseTrait` - 使用性狀能力
- 所有 `onEvo*` 監聽函數

#### 2. 新增本地狀態
- `room` - 房間資訊
- `isJoined` - 是否已加入房間
- `error` - 錯誤訊息

#### 3. 實現自動加入房間
當用戶進入頁面時自動發送 `evoJoinRoom` 事件

#### 4. 實現 Socket 事件監聽
- `onEvoJoinedRoom` - 加入房間成功
- `onEvoGameStarted` - 遊戲開始
- `onEvoGameState` - 遊戲狀態更新
- `onEvoCreatureCreated` - 生物創建
- `onEvoTraitAdded` - 性狀添加
- `onEvoPlayerPassed` - 玩家跳過
- `onEvoCreatureFed` - 生物進食
- `onEvoChainTriggered` - 連鎖效應
- `onEvoAttackPending` - 攻擊待處理
- `onEvoAttackResolved` - 攻擊結果
- `onEvoTraitUsed` - 性狀使用
- `onEvoError` - 錯誤訊息

#### 5. 實現遊戲操作函數
- `handlePlayAsCreature` - 發送創造生物事件
- `handlePlayAsTrait` - 發送賦予性狀事件
- `handleFeed` - 發送進食事件
- `handleAttack` - 發送攻擊事件
- `handlePass` - 發送跳過事件
- `handleDefenseResponse` - 發送防禦回應事件
- `handleUseTrait` - 發送使用性狀能力事件

#### 6. 整合房間等待介面
在 `phase === 'waiting'` 時顯示 `EvolutionLobby` 組件

#### 7. 更新 CSS 樣式
- 新增錯誤訊息 `.error-toast` 樣式
- 新增攻擊按鈕 `.attack-btn` 樣式
- 新增接受攻擊按鈕 `.accept-btn` 樣式

## 遇到的問題與解決方案
無，順利完成。

## 測試結果
- 組件正確導入 Socket 服務
- 事件監聽正確設置
- 遊戲操作函數正確發送 Socket 事件
- 等待介面整合成功

## 下一步計劃
處理工單 0275 - 演化論遊戲整合測試
