# 工作單 0174

**編號**：0174

**日期**：2026-01-27

**工作單標題**：後端 — 遊戲結束時正確保存玩家資料

**工單主旨**：修復遊戲結束時無法正確關聯 Google 登入玩家的資料保存問題

---

## 內容

### 背景

目前 `saveGameToDatabase` 存在三個 P0 問題：
1. `game_participants.player_id` 全為 NULL — 無法追蹤玩家遊戲歷史
2. `game_history.winner_id` 未保存 — 無法統計勝利次數
3. `updatePlayerGameStats` 未被呼叫 — 玩家統計數據不更新

根本原因是遊戲中的 `player.id` 是臨時 ID，未關聯到 Supabase 的 `players` 表。

### 工作內容

#### 1. 修改 `server.js` — 加入房間時保存 firebaseUid

在 `joinRoom` 和 `createRoom` socket 事件中，將前端傳來的 `firebaseUid` 保存到 `gameState.players` 中：

```javascript
// 玩家物件新增 firebaseUid 欄位
{
  id: player.id,
  name: player.name,
  firebaseUid: player.firebaseUid || null,  // 新增
  ...
}
```

#### 2. 修改前端 — 建立/加入房間時傳送 firebaseUid

在 `socketService.createRoom` 和 `socketService.joinRoom` 時，player 物件包含 `firebaseUid`。

#### 3. 修改 `saveGameToDatabase` — 傳入 player_id 和 winner_id

```javascript
async function saveGameToDatabase(gameState, winnerPlayer) {
  // 1. 查詢每位玩家的 Supabase player_id
  const playerIdMap = {};
  for (const player of gameState.players) {
    if (player.firebaseUid) {
      const playerId = await getPlayerIdByFirebaseUid(player.firebaseUid);
      if (playerId) playerIdMap[player.id] = playerId;
    }
  }

  // 2. 保存遊戲記錄（含 winner_id）
  const winnerId = winnerPlayer ? playerIdMap[winnerPlayer.id] : null;
  const gameHistoryId = await saveGameRecord({
    ...existingFields,
    winnerId,  // 新增
  });

  // 3. 保存參與者（含 player_id）
  const participants = gameState.players.map(p => ({
    ...existingFields,
    playerId: playerIdMap[p.id] || null,  // 新增
  }));
  await saveGameParticipants(gameHistoryId, participants);

  // 4. 更新每位玩家的統計
  for (const player of gameState.players) {
    const dbPlayerId = playerIdMap[player.id];
    if (dbPlayerId) {
      await updatePlayerGameStats(dbPlayerId, {
        score: gameState.scores[player.id] || 0,
        isWinner: player.id === gameState.winner,
      });
    }
  }
}
```

#### 4. 修改 `supabase.js` — saveGameRecord 和 saveGameParticipants

- `saveGameRecord`：新增 `winner_id` 欄位寫入
- `saveGameParticipants`：新增 `player_id` 欄位寫入

### 驗收標準

| 標準 | 說明 |
|------|------|
| player_id 非 NULL | Google 登入玩家的 game_participants.player_id 正確填入 |
| winner_id 正確 | game_history.winner_id 指向正確的玩家 |
| 統計更新 | 遊戲結束後 players 表的 games_played、games_won 正確增加 |
| 匿名玩家不影響 | 匿名玩家的 player_id 為 NULL 不報錯 |
| 既有後端測試通過 | 190/190 |

---

**相關計畫書**：`docs/TEST_PLAN_PROFILE_FRIENDS.md`

**相關檔案**：
- `backend/server.js`
- `backend/db/supabase.js`
- `frontend/src/services/socketService.js`
- `frontend/src/components/GameRoom/GameRoom.js`（或建立房間的元件）
