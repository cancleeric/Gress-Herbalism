# 報告書 0284

## 工作單編號
0284

## 完成日期
2026-01-31

## 完成內容摘要

修復 EvolutionRoom.js 中的玩家識別與加入邏輯。

### 已完成項目

1. **添加 useMemo import**
   ```javascript
   import React, { useEffect, useCallback, useState, useMemo } from 'react';
   ```

2. **生成穩定的玩家 ID（第 78 行）**
   ```javascript
   const [myPlayerId] = useState(() => `player_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
   ```

3. **計算當前玩家的實際 ID（第 91-95 行）**
   ```javascript
   const currentPlayerId = useMemo(() => {
     if (!user?.uid) return null;
     const myPlayer = room?.players?.find(p => p.firebaseUid === user.uid);
     return myPlayer?.id || myPlayerId;
   }, [user?.uid, room, myPlayerId]);
   ```

4. **修改 Redux myPlayerId 設定（第 97-104 行）**
   ```javascript
   useEffect(() => {
     if (!user?.uid) return;
     const myPlayer = room?.players?.find(p => p.firebaseUid === user.uid);
     const playerId = myPlayer?.id || myPlayerId;
     dispatch(evolutionActions.setMyPlayerId(playerId));
   }, [user, room, myPlayerId, dispatch]);
   ```

5. **修改加入房間判斷（第 105 行）**
   ```javascript
   if (isCreator || (room && room.players?.some(p => p.firebaseUid === user.uid))) {
   ```

6. **修改加入房間玩家物件（第 113-118 行）**
   ```javascript
   evoJoinRoom(roomId, {
     id: myPlayerId,
     name: user.displayName || user.email?.split('@')[0] || '玩家',
     firebaseUid: user.uid,
     photoURL: user?.photoURL || null
   });
   ```

7. **修改所有遊戲動作處理函數**
   - `handlePlayAsCreature`
   - `handlePlayAsTrait`
   - `handleFeed`
   - `handleAttack`
   - `handlePass`
   - `handleDefenseResponse`
   - `handleUseTrait`

   全部改用 `currentPlayerId` 而非 `user?.uid`

### 修改檔案
- `frontend/src/components/games/evolution/EvolutionRoom/EvolutionRoom.js`

## 驗收結果
- [x] 加入房間時使用 `firebaseUid` 判斷
- [x] 發送完整的玩家物件（包含 `id`、`firebaseUid`、`photoURL`）
- [x] 所有遊戲動作使用正確的 `currentPlayerId`

## 下一步
- 工單 0285：後端支援 firebaseUid 玩家查找
