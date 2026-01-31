# 工作單 0281

## 編號
0281

## 日期
2026-01-31

## 標題
優化房間資料傳遞流程

## 主旨
BUG 修復 - 幽靈玩家問題

## 關聯計畫書
`BUG/BUG_PLAN_GHOST_PLAYER.md`

## 內容

### 問題
目前 `EvolutionLobbyPage` 創建房間成功後，只傳遞 `room.id` 到 URL，沒有將房間資料傳遞給 `EvolutionRoom`。這導致 `EvolutionRoom` 需要重新加入房間來獲取資料。

### 修復方案

1. 修改 `EvolutionLobbyPage.js`，在導航時傳遞房間資料：

```javascript
// 監聽房間創建成功
const unsubCreated = onEvoRoomCreated((room) => {
  console.log('[EvoLobby] 房間創建成功:', room);
  setIsLoading(false);
  setShowCreateModal(false);
  // 傳遞房間資料和創建者標記
  navigate(`/game/evolution/${room.id}`, {
    state: { room, isCreator: true }
  });
});

// 監聽加入房間成功
const unsubJoined = onEvoJoinedRoom(({ roomId, room }) => {
  console.log('[EvoLobby] 加入房間成功:', roomId);
  setIsLoading(false);
  // 傳遞房間資料
  navigate(`/game/evolution/${roomId}`, {
    state: { room, isCreator: false }
  });
});
```

2. 在 `EvolutionRoom.js` 中接收並使用這些資料（工單 0280 已處理）

### 修改檔案
- `frontend/src/components/common/EvolutionLobbyPage/EvolutionLobbyPage.js`

### 驗收標準
1. 創建/加入房間後，房間資料正確傳遞到 `EvolutionRoom`
2. `EvolutionRoom` 可以直接使用傳遞的房間資料，不需要重新請求

### 依賴工單
- 0279, 0280

### 被依賴工單
- 0282
