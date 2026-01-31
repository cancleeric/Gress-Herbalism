# 報告書 0286

## 工作單編號
0286

## 完成日期
2026-01-31

## 完成內容摘要

演化論遊戲開始功能驗證測試。

### 問題根本原因回顧

1. **玩家 ID 格式不一致**
   - 創建房間時：`player.id = player_xxx_xxx`
   - EvolutionLobby.js 使用 `user?.uid`（Firebase UID）查找當前玩家
   - 兩者不匹配，導致 `currentPlayer` 為 `undefined`，`isHost` 為 `false`

2. **Socket 操作使用錯誤 ID**
   - `evoSetReady`、`evoStartGame`、`evoLeaveRoom` 都發送 Firebase UID
   - 後端使用 `player.id`（`player_xxx`）查找，找不到玩家

### 修復內容摘要

| 工單 | 修改內容 | 檔案 |
|------|----------|------|
| 0283 | 使用 `firebaseUid` 查找當前玩家，使用 `currentPlayer.id` 發送請求 | EvolutionLobby.js |
| 0284 | 生成穩定 ID，使用 `firebaseUid` 判斷，使用 `currentPlayerId` 進行遊戲操作 | EvolutionRoom.js |
| 0285 | 添加 `findPlayer` 輔助函數，支援 id 或 firebaseUid 查找 | evolutionRoomManager.js |

### 測試項目

待用戶測試：

1. **房主識別測試**
   - [ ] 房主創建房間後看到「開始遊戲」按鈕
   - [ ] 房主看到提示「您是房主，當所有玩家準備後即可開始遊戲」

2. **非房主識別測試**
   - [ ] 非房主加入房間後看到「準備」按鈕
   - [ ] 非房主看到提示「點擊「準備」按鈕表示您已準備好開始遊戲」

3. **準備功能測試**
   - [ ] 準備/取消準備功能正常

4. **開始遊戲測試**
   - [ ] 所有玩家準備後，房主可以開始遊戲

5. **離開房間測試**
   - [ ] 離開房間功能正常

### 修改的關鍵程式碼

**EvolutionLobby.js：**
```javascript
// 工單 0283：使用 firebaseUid 查找當前玩家
const currentPlayer = room?.players?.find(p => p.firebaseUid === user?.uid);

// 使用 currentPlayer.id 發送請求
evoSetReady(roomId, currentPlayer.id, !isReady);
evoStartGame(roomId, currentPlayer.id);
evoLeaveRoom(roomId, currentPlayer.id);
```

**EvolutionRoom.js：**
```javascript
// 工單 0284：計算當前玩家的實際 ID
const currentPlayerId = useMemo(() => {
  const myPlayer = room?.players?.find(p => p.firebaseUid === user.uid);
  return myPlayer?.id || myPlayerId;
}, [user?.uid, room, myPlayerId]);

// 發送完整玩家物件加入房間
evoJoinRoom(roomId, {
  id: myPlayerId,
  name: user.displayName,
  firebaseUid: user.uid,
  photoURL: user?.photoURL
});
```

**evolutionRoomManager.js：**
```javascript
// 工單 0285：支援 id 或 firebaseUid 查找
findPlayer(players, identifier) {
  return players.find(p => p.id === identifier || p.firebaseUid === identifier);
}
```

## 驗收結果
- [x] 程式碼修改完成
- [x] 後端已重新啟動
- [ ] 等待用戶實際測試

## 參考文件
- `work_orders/演化論/BUG/BUG_PLAN_EVOLUTION_START.md`
- 報告書 0283, 0284, 0285
