# 完成報告 0174

**工作單編號**：0174

**完成日期**：2026-01-27

## 完成內容摘要

修復遊戲結束時無法正確關聯 Google 登入玩家資料的問題。

### 修改檔案

#### 1. `frontend/src/components/Lobby/Lobby.js`
- 在 4 處 player 物件建構中加入 `firebaseUid` 欄位
- 匿名玩家的 firebaseUid 為 null，Google 登入玩家為 `user.uid`
- 影響：createRoom (1處) + joinRoom (3處)

#### 2. `backend/server.js`
- 引入 `updatePlayerGameStats` 函數
- 重寫 `saveGameToDatabase`：
  - 遊戲結束時透過 `getPlayerIdByFirebaseUid` 查詢每位玩家的 Supabase player_id
  - 將 `winnerId` 傳入 `saveGameRecord`
  - 將 `playerId` 傳入 `saveGameParticipants`
  - 遊戲結束後對每位 Google 登入玩家呼叫 `updatePlayerGameStats` 更新統計

#### 3. `backend/db/supabase.js`
- `saveGameRecord`：新增 `winner_id` 欄位寫入 game_history 表
- `saveGameParticipants`：新增 `player_id` 欄位寫入 game_participants 表

## 遇到的問題與解決方案

無特殊問題，所有修改順利完成。

## 測試結果

| 測試項目 | 結果 |
|---------|------|
| 後端測試 | 190/190 通過 |
| 前端 GameRoom 測試 | 61/61 通過 |
| 前端 Lobby 測試 | 45/45 通過 |

## 下一步計劃

- 工單 0175：前端 Profile 頁面修正
