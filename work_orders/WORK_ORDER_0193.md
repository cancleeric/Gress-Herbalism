# 工作單 0193

## 編號
0193

## 日期
2026-01-28

## 工作單標題
整合測試：後端斷線與重連事件鏈

## 工單主旨
測試後端從玩家斷線到重連的完整事件處理鏈

## 內容

### 測試範圍
跨函數整合：
- `playerRefreshing` 事件 → `refreshingPlayers` Set 管理
- `disconnect` 事件 → `handlePlayerDisconnect` 函數
- `reconnect` 事件 → `handlePlayerReconnect` 函數
- `broadcastGameState` 廣播
- `disconnectTimeouts` 計時器管理

### 測試項目

#### TC-0193-01：正常重整流程（快速重連）
模擬流程：
1. 玩家發送 `playerRefreshing` → 加入 `refreshingPlayers`
2. Socket 斷線 → `handlePlayerDisconnect` 偵測到是重整玩家
3. 設置 10 秒寬限計時器
4. 新 Socket 連線 → 發送 `reconnect` 事件
5. `handlePlayerReconnect` 清除計時器、恢復狀態

驗證：
- `refreshingPlayers` 的 key 格式一致性
- 寬限期計時器是否正確設置
- 重連時是否正確清除所有相關狀態

#### TC-0193-02：重整超時流程
模擬流程：
1. 玩家發送 `playerRefreshing`
2. Socket 斷線
3. 超過 10 秒未重連
4. 計時器到期 → 移除玩家

驗證：
- 超時後玩家是否被正確處理
- 房間狀態是否正確更新
- 遊戲是否在必要時結束

#### TC-0193-03：非重整斷線流程
模擬流程：
1. 玩家直接斷線（無 `playerRefreshing`）
2. `handlePlayerDisconnect` 判斷非重整玩家
3. 設置對應的寬限計時器（waiting: 15s, playing: 60s）

驗證：
- 不同遊戲階段的超時時間是否正確
- 斷線後遊戲狀態的廣播

#### TC-0193-04：broadcastGameState 與重連的配合
- 驗證重連成功後 `broadcastGameState` 是否被呼叫
- 驗證廣播的 gameState 是否包含更新後的 socketId
- 驗證 `getClientGameState` BUG 是否影響後續廣播

#### TC-0193-05：playerSockets Map 一致性
- 驗證斷線時是否清除舊的 socket 映射
- 驗證重連時是否正確建立新的映射
- 驗證是否存在孤立的映射記錄

### 測試方式
程式碼審查 + 流程追蹤（不修改程式碼）

### 驗收標準
- 完成所有事件鏈的完整追蹤
- 記錄事件鏈中斷點
- 記錄時序相關的問題
