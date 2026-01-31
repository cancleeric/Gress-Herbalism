# 報告書 0281

## 工作單編號
0281

## 完成日期
2026-01-31

## 完成內容摘要

優化房間資料傳遞流程。

### 已完成項目

修改 `EvolutionLobbyPage.js`，在導航時傳遞房間資料：

1. **創建房間成功時**
```javascript
const unsubCreated = onEvoRoomCreated((room) => {
  navigate(`/game/evolution/${room.id}`, {
    state: { room, isCreator: true }
  });
});
```

2. **加入房間成功時**
```javascript
const unsubJoined = onEvoJoinedRoom(({ roomId, room }) => {
  navigate(`/game/evolution/${roomId}`, {
    state: { room, isCreator: false }
  });
});
```

### 修改檔案
- `frontend/src/components/common/EvolutionLobbyPage/EvolutionLobbyPage.js`

## 驗收結果
- [x] 創建/加入房間後，房間資料正確傳遞到 `EvolutionRoom`

## 下一步
- 工單 0282：確保 playerLeft 事件正確處理
